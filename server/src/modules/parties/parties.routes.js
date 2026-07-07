import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';

const MAX_PROFESSIONS = 20;

// Every user maps to exactly one individual party. Older users were backfilled
// by migration 0007; users created since then get their party lazily here.
async function ensureIndividualParty(client, userId) {
  const inserted = await client.query(
    `insert into parties (kind, user_id) values ('individual', $1)
     on conflict (user_id) do update set user_id = excluded.user_id
     returning id`,
    [userId]
  );
  return inserted.rows[0].id;
}

async function loadProfessions(client, partyId) {
  const result = await client.query(
    `select pp.profession_key,
            pr.label as profession_label,
            pp.specialization_key,
            sp.label as specialization_label,
            pp.is_primary,
            pp.sort_order
       from party_professions pp
       join professions pr on pr.key = pp.profession_key
       left join specializations sp on sp.key = pp.specialization_key
      where pp.party_id = $1
      order by pp.is_primary desc, pp.sort_order, pr.label`,
    [partyId]
  );
  return result.rows;
}

// GET /parties/candidates — parties the actor may engage as a counterparty.
// Privacy-scoped (Security §2): NOT the full user directory. Returns only the
// actor's own individual party plus organization parties for entities the actor
// can already see (public/registered, or entities they are a member of). Missing
// org parties are provisioned lazily so entities created before the party layer
// (or between backfills) still appear.
export async function handleListPartyCandidates(req, res) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    await ensureIndividualParty(client, actor.id);
    await client.query(
      `insert into parties (kind, entity_id)
       select 'organization', e.id
         from entities e
        where e.status = 'active'
          and (e.visibility in ('public', 'registered')
               or e.id in (select entity_id from entity_memberships where user_id = $1 and status = 'active'))
          and not exists (select 1 from parties p where p.entity_id = e.id)
       on conflict (entity_id) do nothing`,
      [actor.id]
    );
    const result = await client.query(
      `select p.id as party_id, p.kind,
              coalesce(u.display_name, ent.name) as label,
              case when p.kind = 'individual' then 'personal' else ent.type end as subtitle
         from parties p
         left join users u on u.id = p.user_id
         left join entities ent on ent.id = p.entity_id
        where p.user_id = $1
           or (p.entity_id is not null and ent.status = 'active'
               and (ent.visibility in ('public', 'registered')
                    or ent.id in (select entity_id from entity_memberships where user_id = $1 and status = 'active')))
        order by p.kind, label
        limit 100`,
      [actor.id]
    );
    sendJson(res, 200, { ok: true, candidates: result.rows });
  } catch (error) {
    sendError(res, 500, 'PARTY_CANDIDATES_FAILED', 'Failed to load party candidates', {
      message: error?.message || String(error)
    });
  } finally {
    client.release();
  }
}

// GET /me/professions — the professions on the authenticated user's own party.
export async function handleGetMyProfessions(req, res) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const partyId = await ensureIndividualParty(client, actor.id);
    sendJson(res, 200, { ok: true, professions: await loadProfessions(client, partyId) });
  } catch (error) {
    sendError(res, 500, 'PROFESSIONS_LOAD_FAILED', 'Failed to load professions', {
      message: error?.message || String(error)
    });
  } finally {
    client.release();
  }
}

// PUT /me/professions — replace the professions on the authenticated user's own
// party. Self-scoped: the party is derived from the session, never from input,
// so there is no cross-party (IDOR) surface (Security Standard §2).
export async function handleReplaceMyProfessions(req, res) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!permissionService.canManageOwnParty(actor)) {
      sendError(res, 403, 'PROFESSIONS_FORBIDDEN', 'Your account cannot manage professions');
      return;
    }

    const body = await readJsonBody(req);
    if (!Array.isArray(body.professions)) {
      sendError(res, 400, 'PROFESSIONS_INVALID', 'professions must be an array');
      return;
    }
    if (body.professions.length > MAX_PROFESSIONS) {
      sendError(res, 400, 'PROFESSIONS_TOO_MANY', `At most ${MAX_PROFESSIONS} professions are allowed`);
      return;
    }

    const rows = [];
    const seen = new Set();
    let primaryCount = 0;
    for (const item of body.professions) {
      const professionKey = String(item?.profession_key || '').trim();
      if (!professionKey) {
        sendError(res, 400, 'PROFESSION_KEY_REQUIRED', 'Each profession requires a profession_key');
        return;
      }
      if (seen.has(professionKey)) {
        sendError(res, 400, 'PROFESSION_DUPLICATE', `Duplicate profession: ${professionKey}`);
        return;
      }
      seen.add(professionKey);

      const specializationKey = item?.specialization_key ? String(item.specialization_key).trim() : null;
      const isPrimary = Boolean(item?.is_primary);
      if (isPrimary) primaryCount += 1;
      rows.push({ professionKey, specializationKey, isPrimary });
    }
    if (primaryCount > 1) {
      sendError(res, 400, 'PROFESSION_MULTIPLE_PRIMARY', 'At most one profession can be primary');
      return;
    }

    await client.query('begin');
    const partyId = await ensureIndividualParty(client, actor.id);
    await client.query('delete from party_professions where party_id = $1', [partyId]);
    for (let i = 0; i < rows.length; i += 1) {
      const { professionKey, specializationKey, isPrimary } = rows[i];
      await client.query(
        `insert into party_professions (party_id, profession_key, specialization_key, is_primary, sort_order)
         values ($1, $2, $3, $4, $5)`,
        [partyId, professionKey, specializationKey, isPrimary, (i + 1) * 10]
      );
    }
    const professions = await loadProfessions(client, partyId);
    await client.query('commit');

    sendJson(res, 200, { ok: true, professions });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (error?.constraint === 'party_professions_spec_matches_profession') {
      sendError(res, 400, 'SPECIALIZATION_MISMATCH', 'Specialization does not belong to the given profession');
      return;
    }
    if (error?.code === '23503') {
      sendError(res, 400, 'PROFESSION_UNKNOWN', 'Unknown profession or specialization');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'PROFESSIONS_SAVE_FAILED', 'Failed to save professions', {
      message: error?.message || String(error)
    });
  } finally {
    client.release();
  }
}
