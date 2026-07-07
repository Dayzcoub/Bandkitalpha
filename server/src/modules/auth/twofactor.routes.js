import crypto from 'node:crypto';
import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { resolveSessionUser } from './session.js';
import { hashToken } from '../../shared/auth.js';
import { generateSecret, verifyTotp, otpauthUri } from '../../shared/totp.js';
import { logInfo } from '../../shared/logger.js';

const RECOVERY_CODE_COUNT = 8;

function newRecoveryCode() {
  return crypto.randomBytes(5).toString('hex'); // 10 hex chars
}

// Consume a one-time recovery code: true if it existed and was unused. Exported
// so login can accept a recovery code in place of a TOTP.
export async function consumeRecoveryCode(client, userId, code) {
  const clean = String(code || '').trim().toLowerCase();
  if (!clean) return false;
  // Atomic: the `used_at is null` filter lives in the UPDATE itself, so two
  // concurrent requests with the same code cannot both consume it.
  const result = await client.query(
    `update recovery_codes set used_at = now()
     where user_id = $1 and code_hash = $2 and used_at is null
     returning id`,
    [userId, hashToken(clean)]
  );
  return result.rowCount > 0;
}

// POST /auth/2fa/enroll — start enrollment: create (unconfirmed) secret and return
// it + the otpauth URI so the user can add it to an authenticator app.
export async function handleEnroll2fa(req, res) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return;
  }
  const client = await getPool().connect();
  try {
    const existing = await client.query('select confirmed_at from two_factor_secrets where user_id = $1', [actor.id]);
    if (existing.rows[0]?.confirmed_at) {
      sendError(res, 409, 'AUTH_2FA_ALREADY_ENABLED', 'Two-factor is already enabled');
      return;
    }
    const secret = generateSecret();
    await client.query(
      `insert into two_factor_secrets (user_id, secret, confirmed_at, disabled_at)
       values ($1, $2, null, null)
       on conflict (user_id) do update set secret = excluded.secret, confirmed_at = null, disabled_at = null, updated_at = now()`,
      [actor.id, secret]
    );
    sendJson(res, 200, { ok: true, secret, otpauth_uri: otpauthUri(secret, actor.email || actor.id) });
  } catch (error) {
    sendError(res, 500, 'AUTH_2FA_ENROLL_FAILED', 'Enrollment failed', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /auth/2fa/confirm — { code }. Verify a code against the pending secret,
// enable 2FA and return one-time recovery codes (shown once).
export async function handleConfirm2fa(req, res) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return;
  }
  const client = await getPool().connect();
  try {
    const body = await readJsonBody(req);
    const row = (await client.query('select secret, confirmed_at from two_factor_secrets where user_id = $1', [actor.id])).rows[0];
    if (!row) {
      sendError(res, 400, 'AUTH_2FA_NOT_STARTED', 'Start enrollment first');
      return;
    }
    if (row.confirmed_at) {
      sendError(res, 409, 'AUTH_2FA_ALREADY_ENABLED', 'Two-factor is already enabled');
      return;
    }
    if (!verifyTotp(row.secret, String(body.code || ''))) {
      sendError(res, 400, 'AUTH_2FA_CODE_INVALID', 'Invalid verification code');
      return;
    }

    const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, newRecoveryCode);
    await client.query('begin');
    await client.query('update two_factor_secrets set confirmed_at = now(), disabled_at = null where user_id = $1', [actor.id]);
    await client.query('update users set two_factor_enabled = true, updated_at = now() where id = $1', [actor.id]);
    await client.query('delete from recovery_codes where user_id = $1', [actor.id]);
    for (const rc of recoveryCodes) {
      await client.query('insert into recovery_codes (user_id, code_hash) values ($1, $2)', [actor.id, hashToken(rc)]);
    }
    await client.query(`insert into audit_events (actor_user_id, action, metadata) values ($1, 'user.2fa_enabled', '{}'::jsonb)`, [actor.id]);
    await client.query('commit');
    logInfo('2FA enabled', { userId: actor.id });
    sendJson(res, 200, { ok: true, recovery_codes: recoveryCodes });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    sendError(res, 500, 'AUTH_2FA_CONFIRM_FAILED', 'Confirmation failed', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /auth/2fa/disable — { code }. Step-up: requires a valid TOTP or recovery
// code before turning 2FA off.
export async function handleDisable2fa(req, res) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return;
  }
  const client = await getPool().connect();
  try {
    const body = await readJsonBody(req);
    const row = (await client.query('select secret, confirmed_at from two_factor_secrets where user_id = $1', [actor.id])).rows[0];
    if (!row || !row.confirmed_at) {
      sendError(res, 400, 'AUTH_2FA_NOT_ENABLED', 'Two-factor is not enabled');
      return;
    }
    const code = String(body.code || '');
    const ok = verifyTotp(row.secret, code) || (await consumeRecoveryCode(client, actor.id, code));
    if (!ok) {
      sendError(res, 400, 'AUTH_2FA_CODE_INVALID', 'Invalid verification code');
      return;
    }
    await client.query('begin');
    await client.query('delete from two_factor_secrets where user_id = $1', [actor.id]);
    await client.query('delete from recovery_codes where user_id = $1', [actor.id]);
    await client.query('update users set two_factor_enabled = false, updated_at = now() where id = $1', [actor.id]);
    await client.query(`insert into audit_events (actor_user_id, action, metadata) values ($1, 'user.2fa_disabled', '{}'::jsonb)`, [actor.id]);
    await client.query('commit');
    sendJson(res, 200, { ok: true, disabled: true });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    sendError(res, 500, 'AUTH_2FA_DISABLE_FAILED', 'Disable failed', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
