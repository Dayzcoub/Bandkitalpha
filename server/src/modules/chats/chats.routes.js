import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';

const MAX_MESSAGE_LENGTH = 4000;

// Resolves actor + room + the actor's membership, then checks the given
// capability. Returns { actor, room, membership } or null after sending an error.
async function requireRoomAccess(client, req, res, roomId, capability) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return null;
  }
  const roomResult = await client.query('select id, status from chat_rooms where id = $1 limit 1', [roomId]);
  const room = roomResult.rows[0];
  if (!room) {
    sendError(res, 404, 'ROOM_NOT_FOUND', 'Chat room not found');
    return null;
  }
  const membershipResult = await client.query(
    'select role, status from chat_room_members where room_id = $1 and user_id = $2 limit 1',
    [roomId, actor.id]
  );
  const membership = membershipResult.rows[0] || null;
  const allowed = capability === 'write'
    ? permissionService.canWriteMessage(actor, membership, room)
    : permissionService.canViewRoom(actor, membership, room);
  if (!allowed) {
    // 404 (not 403) when the actor is not a member: don't reveal the room exists.
    if (!membership) {
      sendError(res, 404, 'ROOM_NOT_FOUND', 'Chat room not found');
    } else {
      sendError(res, 403, 'ROOM_ACCESS_FORBIDDEN', 'You cannot perform this action in this room');
    }
    return null;
  }
  return { actor, room, membership };
}

export async function handleListChatRooms(req, res) {
  try {
    const result = await getPool().query(
      `select
         r.id,
         r.type,
         r.title,
         r.status,
         r.created_at,
         e.name as entity_name,
         ev.title as event_title,
         coalesce(count(m.id), 0)::int as message_count
       from chat_rooms r
       left join entities e on e.id = r.entity_id
       left join events ev on ev.id = r.event_id
       left join chat_messages m on m.room_id = r.id
       group by r.id, e.name, ev.title
       order by r.created_at desc
       limit 50`
    );

    sendJson(res, 200, {
      ok: true,
      rooms: result.rows
    });
  } catch (error) {
    sendError(res, 500, 'CHAT_ROOMS_LIST_FAILED', 'Failed to list chat rooms', {
      message: error?.message || String(error)
    });
  }
}

// GET /chat-rooms/:id/messages — messages for a room, restricted to its members.
export async function handleListMessages(req, res, roomId) {
  const client = await getPool().connect();
  try {
    const access = await requireRoomAccess(client, req, res, roomId, 'view');
    if (!access) return;
    const result = await client.query(
      `select m.id, m.author_user_id, u.display_name as author_name, m.kind, m.body,
              m.reply_to_message_id, m.is_pinned, m.created_at
         from chat_messages m
         left join users u on u.id = m.author_user_id
        where m.room_id = $1 and m.status not in ('deleted', 'hidden')
        order by m.created_at
        limit 200`,
      [roomId]
    );
    sendJson(res, 200, { ok: true, messages: result.rows });
  } catch (error) {
    sendError(res, 500, 'MESSAGES_LIST_FAILED', 'Failed to list messages', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /chat-rooms/:id/messages — post a message. Active members, active room.
export async function handleSendMessage(req, res, roomId) {
  const client = await getPool().connect();
  try {
    const access = await requireRoomAccess(client, req, res, roomId, 'write');
    if (!access) return;

    const body = await readJsonBody(req);
    const text = String(body.body || '').trim();
    const replyTo = body.reply_to_message_id ? String(body.reply_to_message_id).trim() : null;

    if (!text) {
      sendError(res, 400, 'MESSAGE_EMPTY', 'Message body is required');
      return;
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      sendError(res, 400, 'MESSAGE_TOO_LONG', `Message must be at most ${MAX_MESSAGE_LENGTH} characters`);
      return;
    }
    // A reply target must be a live message in the same room (no cross-room reply).
    if (replyTo) {
      const parent = await client.query(
        `select id from chat_messages where id = $1 and room_id = $2 and status not in ('deleted', 'hidden') limit 1`,
        [replyTo, roomId]
      );
      if (!parent.rows[0]) {
        sendError(res, 400, 'REPLY_TARGET_INVALID', 'reply_to_message_id is not a message in this room');
        return;
      }
    }

    await client.query('begin');
    const inserted = await client.query(
      `insert into chat_messages (room_id, author_user_id, kind, body, reply_to_message_id)
       values ($1, $2, 'user', $3, $4)
       returning id, room_id, author_user_id, kind, body, reply_to_message_id, is_pinned, created_at`,
      [roomId, access.actor.id, text, replyTo]
    );
    const message = inserted.rows[0];
    await client.query(
      `insert into audit_events (actor_user_id, action, room_id, message_id, metadata)
       values ($1, 'chat.message_sent', $2, $3, '{}'::jsonb)`,
      [access.actor.id, roomId, message.id]
    );
    await client.query('commit');

    sendJson(res, 201, { ok: true, message: { ...message, author_name: access.actor.display_name } });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'MESSAGE_SEND_FAILED', 'Failed to send message', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
