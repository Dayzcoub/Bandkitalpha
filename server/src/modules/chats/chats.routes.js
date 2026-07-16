import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { checkLinkPolicy } from '../../shared/linkPolicy.js';

const MAX_MESSAGE_LENGTH = 4000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PERSONAL_ROOM_COLUMNS = 'id, type, conversation_scope, title, status, created_at';

function findPersonalRoom(client, low, high) {
  return client.query(
    `select ${PERSONAL_ROOM_COLUMNS}
       from chat_rooms
      where conversation_scope = 'personal' and user_low_id = $1 and user_high_id = $2
      limit 1`,
    [low, high]
  ).then((result) => result.rows[0] || null);
}

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
    : capability === 'moderate'
      ? permissionService.canModerateRoom(actor, membership, room)
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

// POST /conversations/personal — open the canonical dialogue with another user, or
// create it if it does not exist yet. "Написать" from a profile, a group, an event,
// a catalogue or a comment must all land on this same room (Chat and Messaging
// Security §2, §10), so this is the only way a personal room is ever made.
//
// Opening is deliberately NOT the right to post. Conversation Lifecycle §2 puts the
// first message from a stranger into a message request; that is a later slice. This
// endpoint returns a room and sends nothing — keep the two apart, or that slice will
// have to undo this one.
export async function handleOpenPersonalConversation(req, res) {
  // Everything that does not need the transaction runs on pooled queries first, and
  // the dedicated connection is taken last. Holding a connection while calling
  // resolveSessionUser — which takes one of its own — makes every request want two at
  // once, and the pool (max 5) deadlocks under as few as five concurrent callers.
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return;
  }

  const body = await readJsonBody(req);
  const targetId = String(body.user_id || '').trim();
  if (!UUID_PATTERN.test(targetId)) {
    sendError(res, 400, 'USER_ID_INVALID', 'user_id must be a user uuid');
    return;
  }
  if (targetId === actor.id) {
    // The actor knows their own id, so saying this plainly leaks nothing. A future
    // "Saved messages" is a separate system object, not a self-dialogue (§1).
    sendError(res, 400, 'CONVERSATION_SELF', 'A personal dialogue with yourself is not possible');
    return;
  }

  const targetResult = await getPool().query(
    'select id, status from users where id = $1 limit 1',
    [targetId]
  );
  const target = targetResult.rows[0] || null;

  if (!permissionService.canOpenPersonalConversation(actor, target)) {
    // One answer for "no such user" and "not available", so the endpoint cannot be
    // used to probe the user table by id.
    sendError(res, 404, 'CONVERSATION_TARGET_NOT_FOUND', 'User not found');
    return;
  }

  // The pair is canonicalised here, exactly as the unique index expects it: the
  // dialogue is a property of the unordered pair, not of who pressed the button.
  const [low, high] = actor.id < target.id ? [actor.id, target.id] : [target.id, actor.id];

  const client = await getPool().connect();
  try {
    await client.query('begin');

    let room = await findPersonalRoom(client, low, high);
    let created = false;

    if (!room) {
      // Atomic per §1: concurrent opens cannot produce two dialogues. DO NOTHING
      // rather than DO UPDATE — an update would fire the updated_at trigger, and
      // merely opening a chat must not reorder anyone's chat list.
      const inserted = await client.query(
        `insert into chat_rooms (type, conversation_scope, user_low_id, user_high_id, created_by_user_id)
         values ('direct', 'personal', $1, $2, $3)
         on conflict (user_low_id, user_high_id) where conversation_scope = 'personal'
         do nothing
         returning ${PERSONAL_ROOM_COLUMNS}`,
        [low, high, actor.id]
      );

      if (inserted.rows[0]) {
        room = inserted.rows[0];
        created = true;
        await client.query(
          `insert into chat_room_members (room_id, user_id, role, status)
           values ($1, $2, 'member', 'active'), ($1, $3, 'member', 'active')
           on conflict (room_id, user_id) do nothing`,
          [room.id, low, high]
        );
      } else {
        // Another request won the race and committed. Read Committed gives this
        // statement a fresh snapshot, so it sees their row.
        room = await findPersonalRoom(client, low, high);
      }
    }

    await client.query('commit');

    if (!room) {
      sendError(res, 500, 'CONVERSATION_OPEN_FAILED', 'Failed to open the conversation');
      return;
    }

    sendJson(res, created ? 201 : 200, { ok: true, created, room });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    sendError(res, 500, 'CONVERSATION_OPEN_FAILED', 'Failed to open the conversation');
  } finally {
    client.release();
  }
}

// GET /me/chat-rooms — rooms the authenticated user belongs to (member-scoped;
// not the full room list). Privacy: only your own rooms.
//
// There is deliberately no "list every room" endpoint. `GET /chat-rooms` used to
// exist, unauthenticated and unscoped, and nothing but the smoke ever called it —
// the UI has always used this one. Under the canonical conversation model a
// personal dialogue is a room too, so a global room list could only ever leak
// (chat spec §11). Do not reintroduce it.
export async function handleListMyRooms(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await getPool().query(
      `select r.id, r.type, r.title, r.status, m.status as member_status,
              e.name as entity_name, ev.title as event_title
         from chat_room_members m
         join chat_rooms r on r.id = m.room_id
         left join entities e on e.id = r.entity_id
         left join events ev on ev.id = r.event_id
        where m.user_id = $1 and m.status in ('active', 'read_only') and r.status <> 'hidden'
        order by r.updated_at desc
        limit 100`,
      [actor.id]
    );
    sendJson(res, 200, { ok: true, rooms: result.rows });
  } catch (error) {
    sendError(res, 500, 'MY_ROOMS_FAILED', 'Failed to list rooms', { message: error?.message || String(error) });
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
              m.reply_to_message_id, m.is_pinned, m.status, m.created_at, m.edited_at,
              ru.display_name as reply_author, rp.body as reply_body
         from chat_messages m
         left join users u on u.id = m.author_user_id
         left join chat_messages rp on rp.id = m.reply_to_message_id and rp.status not in ('deleted', 'hidden')
         left join users ru on ru.id = rp.author_user_id
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
    // Link guard (AntiFraud §4): block external links / shorteners / lookalike
    // domains server-side, and record the attempt as an anti-fraud signal.
    const link = checkLinkPolicy(text);
    if (link.blocked) {
      await client.query(
        `insert into audit_events (actor_user_id, action, room_id, metadata)
         values ($1, 'chat.message_link_blocked', $2, jsonb_build_object('reason', $3::text))`,
        [access.actor.id, roomId, link.reason]
      );
      sendError(res, 422, 'MESSAGE_LINK_BLOCKED', 'External links are not allowed in messages', { reason: link.reason });
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

// GET /chat-rooms/:id — room header info for members: type, title, members (for
// direct chats the "other" party names the room) and the caller's own role
// (drives which moderation actions the UI offers).
export async function handleGetRoom(req, res, roomId) {
  const client = await getPool().connect();
  try {
    const access = await requireRoomAccess(client, req, res, roomId, 'view');
    if (!access) return;
    const detail = await client.query(
      `select r.id, r.type, r.title, e.name as entity_name, ev.title as event_title
         from chat_rooms r
         left join entities e on e.id = r.entity_id
         left join events ev on ev.id = r.event_id
        where r.id = $1 limit 1`,
      [roomId]
    );
    const members = await client.query(
      `select m.user_id, m.role, m.status, u.display_name
         from chat_room_members m
         join users u on u.id = m.user_id
        where m.room_id = $1 and m.status in ('active', 'read_only')
        order by u.display_name`,
      [roomId]
    );
    const rows = members.rows.map((m) => ({ ...m, is_self: m.user_id === access.actor.id }));
    sendJson(res, 200, {
      ok: true,
      room: { ...detail.rows[0], member_count: rows.length },
      members: rows,
      my_role: access.membership?.role || null
    });
  } catch (error) {
    sendError(res, 500, 'ROOM_GET_FAILED', 'Failed to load room', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// PATCH /chat-rooms/:id/messages/:messageId — pin/unpin a message. Only room
// moderators (owner/admin/manager); editing the body is author-only.
export async function handleUpdateMessage(req, res, roomId, messageId) {
  const client = await getPool().connect();
  try {
    const access = await requireRoomAccess(client, req, res, roomId, 'view');
    if (!access) return;
    const body = await readJsonBody(req);

    const msgRes = await client.query(
      `select id, author_user_id from chat_messages
        where id = $1 and room_id = $2 and status not in ('deleted', 'hidden') limit 1`,
      [messageId, roomId]
    );
    const message = msgRes.rows[0];
    if (!message) {
      sendError(res, 404, 'MESSAGE_NOT_FOUND', 'Message not found in this room');
      return;
    }

    // Pin/unpin — room moderators only.
    if (typeof body.pinned === 'boolean') {
      if (!permissionService.canModerateRoom(access.actor, access.membership, access.room)) {
        sendError(res, 403, 'ROOM_ACCESS_FORBIDDEN', 'You cannot moderate this room');
        return;
      }
      const result = await client.query(
        'update chat_messages set is_pinned = $1 where id = $2 returning id, is_pinned',
        [body.pinned, messageId]
      );
      await client.query(
        `insert into audit_events (actor_user_id, action, room_id, message_id, metadata)
         values ($1, $2, $3, $4, '{}'::jsonb)`,
        [access.actor.id, body.pinned ? 'chat.message_pinned' : 'chat.message_unpinned', roomId, messageId]
      );
      sendJson(res, 200, { ok: true, message: result.rows[0] });
      return;
    }

    // Edit body — author only, active membership and room.
    if (body.body !== undefined) {
      if (message.author_user_id !== access.actor.id) {
        sendError(res, 403, 'MESSAGE_EDIT_FORBIDDEN', 'You can only edit your own messages');
        return;
      }
      if (access.room.status !== 'active' || access.membership?.status !== 'active') {
        sendError(res, 403, 'ROOM_ACCESS_FORBIDDEN', 'This room is read-only for you');
        return;
      }
      const text = String(body.body || '').trim();
      if (!text) {
        sendError(res, 400, 'MESSAGE_EMPTY', 'Message body is required');
        return;
      }
      if (text.length > MAX_MESSAGE_LENGTH) {
        sendError(res, 400, 'MESSAGE_TOO_LONG', `Message must be at most ${MAX_MESSAGE_LENGTH} characters`);
        return;
      }
      // Link guard also applies to edits — a message can't smuggle a link in later.
      const editLink = checkLinkPolicy(text);
      if (editLink.blocked) {
        await client.query(
          `insert into audit_events (actor_user_id, action, room_id, message_id, metadata)
           values ($1, 'chat.message_link_blocked', $2, $3, jsonb_build_object('reason', $4::text))`,
          [access.actor.id, roomId, messageId, editLink.reason]
        );
        sendError(res, 422, 'MESSAGE_LINK_BLOCKED', 'External links are not allowed in messages', { reason: editLink.reason });
        return;
      }
      const result = await client.query(
        `update chat_messages set body = $1, status = 'edited', edited_at = now()
          where id = $2 returning id, body, edited_at`,
        [text, messageId]
      );
      await client.query(
        `insert into audit_events (actor_user_id, action, room_id, message_id, metadata)
         values ($1, 'chat.message_edited', $2, $3, '{}'::jsonb)`,
        [access.actor.id, roomId, messageId]
      );
      sendJson(res, 200, { ok: true, message: result.rows[0] });
      return;
    }

    sendError(res, 400, 'MESSAGE_UPDATE_INVALID', 'Nothing to update');
  } catch (error) {
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'MESSAGE_UPDATE_FAILED', 'Failed to update message', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// DELETE /chat-rooms/:id/messages/:msgId — soft-delete. Author or moderator.
export async function handleDeleteMessage(req, res, roomId, messageId) {
  const client = await getPool().connect();
  try {
    const access = await requireRoomAccess(client, req, res, roomId, 'view');
    if (!access) return;
    const msgRes = await client.query(
      `select id, author_user_id from chat_messages
        where id = $1 and room_id = $2 and status not in ('deleted', 'hidden') limit 1`,
      [messageId, roomId]
    );
    const message = msgRes.rows[0];
    if (!message) {
      sendError(res, 404, 'MESSAGE_NOT_FOUND', 'Message not found in this room');
      return;
    }
    const isAuthor = message.author_user_id === access.actor.id;
    const isModerator = permissionService.canModerateRoom(access.actor, access.membership, access.room);
    if (!isAuthor && !isModerator) {
      sendError(res, 403, 'MESSAGE_DELETE_FORBIDDEN', 'You cannot delete this message');
      return;
    }
    await client.query(
      `update chat_messages set status = 'deleted', deleted_at = now(), is_pinned = false where id = $1`,
      [messageId]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, room_id, message_id, metadata)
       values ($1, 'chat.message_deleted', $2, $3, jsonb_build_object('by', $4::text))`,
      [access.actor.id, roomId, messageId, isAuthor ? 'author' : 'moderator']
    );
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendError(res, 500, 'MESSAGE_DELETE_FAILED', 'Failed to delete message', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
