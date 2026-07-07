import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { logInfo } from '../../shared/logger.js';
import { verifyTotp } from '../../shared/totp.js';
import { decryptSecret } from '../../shared/secretbox.js';
import { consumeRecoveryCode } from './twofactor.routes.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  clientIp
} from '../../shared/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MIN_PASSWORD_LEN = 8;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

// Secure cookies need HTTPS; driven by env.cookieSecure (COOKIE_SECURE=true once
// the VPS serves over TLS). Preview VPS is HTTP for now (Security §12).
function cookieSecure(env) {
  return Boolean(env.cookieSecure);
}

// POST /auth/register — email + password. Creates user + credentials + a one-time
// email verification token. In non-production the token is returned/logged so the
// flow is testable without a mail provider (spec §9 step 3).
export async function handleRegister(req, res, env) {
  const client = await getPool().connect();
  try {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const displayName = String(body.display_name || '').trim();

    if (!EMAIL_RE.test(email)) {
      sendError(res, 400, 'AUTH_EMAIL_INVALID', 'A valid email is required');
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      sendError(res, 400, 'AUTH_PASSWORD_WEAK', `Password must be at least ${MIN_PASSWORD_LEN} characters`);
      return;
    }
    if (displayName.length < 2) {
      sendError(res, 400, 'AUTH_NAME_INVALID', 'Display name must contain at least 2 characters');
      return;
    }

    const passwordHash = await hashPassword(password);
    const rawToken = generateToken();
    const verifyExpires = new Date(Date.now() + VERIFY_TTL_MS);

    await client.query('begin');

    const userResult = await client.query(
      `insert into users (display_name, email, status, email_verified)
       values ($1, $2, 'registered', false)
       returning id, display_name, email, status, email_verified`,
      [displayName, email]
    );
    const user = userResult.rows[0];

    await client.query(
      `insert into auth_credentials (user_id, password_hash, algo)
       values ($1, $2, 'scrypt')`,
      [user.id, passwordHash]
    );

    await client.query(
      `insert into email_verifications (user_id, token_hash, purpose, expires_at)
       values ($1, $2, 'email_verify', $3)`,
      [user.id, hashToken(rawToken), verifyExpires]
    );

    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'user.registered', $2::jsonb)`,
      [user.id, JSON.stringify({ source: 'auth-api' })]
    );

    await client.query('commit');

    logInfo('User registered', { userId: user.id });

    const payload = {
      ok: true,
      user: { id: user.id, email: user.email, display_name: user.display_name, status: user.status }
    };
    // Never expose verification tokens in production responses (Security §8).
    if (env.nodeEnv !== 'production') {
      payload.dev_verify_token = rawToken;
    }
    sendJson(res, 201, payload);
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (error?.code === '23505') {
      sendError(res, 409, 'AUTH_EMAIL_TAKEN', 'This email is already registered');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'AUTH_REGISTER_FAILED', 'Registration failed', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /auth/verify-email — { token }. Consumes a one-time token, marks the email
// verified and promotes the account to free_basic (status 'active').
export async function handleVerifyEmail(req, res) {
  const client = await getPool().connect();
  try {
    const body = await readJsonBody(req);
    const token = String(body.token || '');
    if (!token) {
      sendError(res, 400, 'AUTH_TOKEN_MISSING', 'A verification token is required');
      return;
    }

    await client.query('begin');

    const found = await client.query(
      `select id, user_id from email_verifications
       where token_hash = $1 and used_at is null and expires_at > now()
       limit 1
       for update`,
      [hashToken(token)]
    );
    const record = found.rows[0];
    if (!record) {
      await client.query('rollback');
      sendError(res, 400, 'AUTH_TOKEN_INVALID', 'Verification token is invalid or expired');
      return;
    }

    await client.query('update email_verifications set used_at = now() where id = $1', [record.id]);
    await client.query(
      `update users set email_verified = true, status = 'active', updated_at = now() where id = $1`,
      [record.user_id]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'user.email_verified', '{}'::jsonb)`,
      [record.user_id]
    );

    await client.query('commit');
    sendJson(res, 200, { ok: true, verified: true });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    sendError(res, 500, 'AUTH_VERIFY_FAILED', 'Verification failed', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /auth/login — { email, password }. Sets an HttpOnly session cookie.
export async function handleLogin(req, res, env) {
  const client = await getPool().connect();
  try {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');

    const found = await client.query(
      `select u.id, u.display_name, u.email, u.status, u.email_verified, u.platform_role,
              u.two_factor_enabled, c.password_hash, tf.secret as totp_secret
       from users u
       join auth_credentials c on c.user_id = u.id
       left join two_factor_secrets tf on tf.user_id = u.id and tf.confirmed_at is not null
       where u.email = $1
       limit 1`,
      [email]
    );
    const row = found.rows[0];

    // Same generic error whether the user is missing or the password is wrong (Security §1).
    const ok = row ? await verifyPassword(password, row.password_hash) : false;
    if (!ok) {
      sendError(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
      return;
    }
    if (row.status === 'blocked' || row.status === 'deleted') {
      sendError(res, 403, 'AUTH_ACCOUNT_UNAVAILABLE', 'This account is not available');
      return;
    }

    // Second factor gate: enabled users must present a valid TOTP or recovery code.
    if (row.two_factor_enabled) {
      const code = String(body.code || '');
      if (!code) {
        sendError(res, 401, 'AUTH_2FA_REQUIRED', 'Two-factor code required');
        return;
      }
      const ok2fa = (row.totp_secret && verifyTotp(decryptSecret(row.totp_secret), code)) || (await consumeRecoveryCode(client, row.id, code));
      if (!ok2fa) {
        sendError(res, 401, 'AUTH_2FA_INVALID', 'Invalid two-factor code');
        return;
      }
    }

    const rawToken = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await client.query('begin');
    await client.query(
      `insert into sessions (user_id, token_hash, expires_at, ip, user_agent)
       values ($1, $2, $3, $4, $5)`,
      [row.id, hashToken(rawToken), expiresAt, clientIp(req), String(req.headers['user-agent'] || '').slice(0, 512)]
    );
    await client.query('update users set last_login_at = now() where id = $1', [row.id]);
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'user.login', '{}'::jsonb)`,
      [row.id]
    );
    await client.query('commit');

    setSessionCookie(res, rawToken, expiresAt, cookieSecure(env));
    logInfo('User login', { userId: row.id });

    sendJson(res, 200, {
      ok: true,
      user: {
        id: row.id,
        email: row.email,
        display_name: row.display_name,
        status: row.status,
        email_verified: row.email_verified,
        platform_role: row.platform_role
      }
    });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    sendError(res, 500, 'AUTH_LOGIN_FAILED', 'Login failed', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /auth/logout — revokes the current session and clears the cookie.
export async function handleLogout(req, res, env) {
  try {
    const token = getSessionToken(req);
    if (token) {
      await getPool().query(
        `update sessions set revoked_at = now() where token_hash = $1 and revoked_at is null`,
        [hashToken(token)]
      );
    }
    clearSessionCookie(res, cookieSecure(env));
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendError(res, 500, 'AUTH_LOGOUT_FAILED', 'Logout failed', { message: error?.message || String(error) });
  }
}

// GET /auth/me — returns the current session user, or 401 if unauthenticated.
export async function handleMe(req, res) {
  try {
    const token = getSessionToken(req);
    if (!token) {
      sendError(res, 401, 'AUTH_UNAUTHENTICATED', 'Not authenticated');
      return;
    }
    const found = await getPool().query(
      `select u.id, u.display_name, u.email, u.status, u.email_verified, u.platform_role, u.two_factor_enabled
       from sessions s
       join users u on u.id = s.user_id
       where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()
       limit 1`,
      [hashToken(token)]
    );
    const user = found.rows[0];
    if (!user) {
      sendError(res, 401, 'AUTH_UNAUTHENTICATED', 'Not authenticated');
      return;
    }
    await getPool().query('update sessions set last_seen_at = now() where token_hash = $1', [hashToken(token)]);
    sendJson(res, 200, { ok: true, user });
  } catch (error) {
    sendError(res, 500, 'AUTH_ME_FAILED', 'Failed to load session', { message: error?.message || String(error) });
  }
}
