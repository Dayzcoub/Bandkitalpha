import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { raiseNotification } from '../notifications/notifications.routes.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCES = new Set(['profile', 'search', 'event', 'project', 'chat', 'recommendation']);

// The pair is canonical (0026), exactly as for personal dialogues: friendship belongs to
// the pair, not to whoever pressed the button.
function pair(a, b) {
  return a < b ? [a, b] : [b, a];
}

// Resolves the actor and the target for any friendship action. Returns null after
// sending an error.
async function requireTarget(req, res, targetId) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return null;
  }
  if (!UUID_PATTERN.test(targetId)) {
    sendError(res, 400, 'USER_ID_INVALID', 'user_id must be a user uuid');
    return null;
  }
  if (targetId === actor.id) {
    sendError(res, 400, 'FRIENDSHIP_SELF', 'You cannot befriend yourself');
    return null;
  }
  const found = await getPool().query('select id, status, sanction from users where id = $1 limit 1', [targetId]);
  const target = found.rows[0] || null;
  // One answer for "no such user" and "not available", so this cannot be used to probe
  // the user table by id.
  if (!target || !permissionService.canOpenPersonalConversation(actor, target)) {
    sendError(res, 404, 'FRIEND_TARGET_NOT_FOUND', 'User not found');
    return null;
  }
  return { actor, target };
}

// POST /me/friends/:userId — ask, or accept what was already asked.
//
// One endpoint, because the two are the same intent — "I want us to be friends" — and
// the state decides which it is. A reciprocal request while one is pending is therefore
// an acceptance rather than a second row, which the canonical pair makes free.
export async function handleRequestFriendship(req, res, targetId) {
  const client = await getPool().connect();
  try {
    const resolved = await requireTarget(req, res, targetId);
    if (!resolved) return;
    const { actor } = resolved;

    const body = await readJsonBody(req).catch(() => ({}));
    const source = SOURCES.has(String(body.source || '')) ? String(body.source) : 'profile';
    const [low, high] = pair(actor.id, targetId);

    await client.query('begin');
    const existing = await client.query(
      'select status, requested_by_user_id from user_friendships where user_low_id = $1 and user_high_id = $2 for update',
      [low, high]
    );
    const row = existing.rows[0] || null;

    if (row?.status === 'accepted') {
      await client.query('rollback');
      sendError(res, 409, 'FRIENDSHIP_EXISTS', 'You are already friends');
      return;
    }

    // They asked first: this is an acceptance.
    if (row?.status === 'pending' && row.requested_by_user_id !== actor.id) {
      await client.query(
        `update user_friendships set status = 'accepted', accepted_at = now(), ended_reason = null, ended_at = null
          where user_low_id = $1 and user_high_id = $2`,
        [low, high]
      );
      await raiseNotification(client, {
        recipient: row.requested_by_user_id, type: 'friend_accepted', actor: actor.id
      });
      await client.query(
        `insert into audit_events (actor_user_id, action, metadata)
         values ($1, 'friendship.accepted', $2::jsonb)`,
        [actor.id, JSON.stringify({ target_user_id: targetId })]
      );
      await client.query('commit');
      sendJson(res, 200, { ok: true, status: 'accepted' });
      return;
    }

    if (row?.status === 'pending') {
      await client.query('rollback');
      sendError(res, 409, 'FRIENDSHIP_PENDING', 'Your request is awaiting a reply');
      return;
    }

    // No row, or it ended. A declined request may be sent again — the friends spec says
    // so ("repeated requests may be rate-limited", not forbidden), unlike a rejected
    // message request, which is sticky by §2 of the chat lifecycle. Two deliberate
    // rules, not an inconsistency. Rate limiting is the anti-spam slice.
    await client.query(
      `insert into user_friendships (user_low_id, user_high_id, status, requested_by_user_id, source)
       values ($1, $2, 'pending', $3, $4)
       on conflict (user_low_id, user_high_id) do update
         set status = 'pending', requested_by_user_id = excluded.requested_by_user_id,
             source = excluded.source, ended_reason = null, ended_at = null,
             accepted_at = null, created_at = now(), updated_at = now()`,
      [low, high, actor.id, source]
    );
    await raiseNotification(client, { recipient: targetId, type: 'friend_request', actor: actor.id });
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'friendship.requested', $2::jsonb)`,
      [actor.id, JSON.stringify({ target_user_id: targetId, source })]
    );
    await client.query('commit');
    sendJson(res, 201, { ok: true, status: 'pending' });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    sendError(res, 500, 'FRIENDSHIP_REQUEST_FAILED', 'Failed to send the friend request');
  } finally {
    client.release();
  }
}

// DELETE /me/friends/:userId — decline, cancel or unfriend.
//
// One endpoint again: the reason follows from who you are and what state it is in, so the
// client cannot claim a reason that did not happen. Declining is not announced — the
// friends spec wants the sender to "see neutral state, not necessarily explicit
// rejection", so no notification goes out.
export async function handleEndFriendship(req, res, targetId) {
  try {
    const resolved = await requireTarget(req, res, targetId);
    if (!resolved) return;
    const { actor } = resolved;
    const [low, high] = pair(actor.id, targetId);

    const result = await getPool().query(
      `update user_friendships
          set status = 'ended',
              ended_at = now(),
              accepted_at = null,
              ended_reason = case
                when status = 'accepted' then 'removed'
                when requested_by_user_id = $3 then 'cancelled'
                else 'declined'
              end
        where user_low_id = $1 and user_high_id = $2 and status in ('pending', 'accepted')
        returning ended_reason`,
      [low, high, actor.id]
    );
    if (!result.rows[0]) {
      sendError(res, 404, 'FRIENDSHIP_NOT_FOUND', 'No friendship or request with this user');
      return;
    }
    await getPool().query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'friendship.ended', $2::jsonb)`,
      [actor.id, JSON.stringify({ target_user_id: targetId, reason: result.rows[0].ended_reason })]
    );
    sendJson(res, 200, { ok: true, status: 'ended' });
  } catch (error) {
    sendError(res, 500, 'FRIENDSHIP_END_FAILED', 'Failed to end the friendship');
  }
}

// GET /me/friends — accepted friendships.
export async function handleListFriends(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await getPool().query(
      `select u.id, u.display_name, u.handle, f.accepted_at
         from user_friendships f
         join users u on u.id = case when f.user_low_id = $1 then f.user_high_id else f.user_low_id end
        where (f.user_low_id = $1 or f.user_high_id = $1)
          and f.status = 'accepted'
          and u.status <> 'anonymized'
        order by f.accepted_at desc
        limit 500`,
      [actor.id]
    );
    sendJson(res, 200, { ok: true, friends: result.rows });
  } catch (error) {
    sendError(res, 500, 'FRIENDS_LIST_FAILED', 'Failed to list friends');
  }
}

// GET /me/friend-requests — incoming only. An outgoing request is visible on the target's
// profile card; a separate "who I asked" list is not needed to decide anything.
export async function handleListFriendRequests(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await getPool().query(
      `select u.id, u.display_name, u.handle, f.source, f.created_at
         from user_friendships f
         join users u on u.id = f.requested_by_user_id
        where (f.user_low_id = $1 or f.user_high_id = $1)
          and f.status = 'pending'
          and f.requested_by_user_id <> $1
          and u.status <> 'anonymized'
        order by f.created_at desc
        limit 100`,
      [actor.id]
    );
    sendJson(res, 200, { ok: true, requests: result.rows });
  } catch (error) {
    sendError(res, 500, 'FRIEND_REQUESTS_FAILED', 'Failed to list friend requests');
  }
}

// Are these two users friends? The question `circle` asks.
export async function areFriends(client, a, b) {
  const [low, high] = pair(a, b);
  const result = await client.query(
    `select 1 from user_friendships
      where user_low_id = $1 and user_high_id = $2 and status = 'accepted' limit 1`,
    [low, high]
  );
  return result.rowCount > 0;
}
