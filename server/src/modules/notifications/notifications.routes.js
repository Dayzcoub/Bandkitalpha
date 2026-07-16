import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';
import { resolveSessionUser } from '../auth/session.js';

// Notifications hold references, never text (migration 0025). The subject is resolved at
// read time, and the query below is where Conversation Lifecycle §10 is enforced:
//
//   - "не раскрывать название закрытой сущности при отсутствии доступа" — the entity name
//     is selected only when the recipient still has a live membership or the entity is
//     visible to them anyway. Otherwise the notification renders without it.
//   - "проверяют актуальный доступ непосредственно перед отправкой" — with no delivery
//     channel in MVP, reading *is* the delivery, so this join is that check.
//
// If a channel ever appears, this check moves to send time. It cannot be skipped there
// on the grounds that it happens here.
const INBOX_QUERY = `
  select n.id, n.type_key, n.created_at, n.read_at,
         a.display_name as actor_name,
         case
           when n.entity_id is null then null
           when e.visibility in ('public', 'registered') then e.name
           when m.status in ('invited', 'active') then e.name
           else null
         end as entity_name,
         case
           when n.entity_id is null then null
           when e.visibility in ('public', 'registered') then e.slug
           when m.status in ('invited', 'active') then e.slug
           else null
         end as entity_slug,
         n.entity_id, n.room_id
    from notifications n
    left join users a on a.id = n.actor_user_id and a.status <> 'anonymized'
    left join entities e on e.id = n.entity_id and e.status not in ('deleted', 'anonymized')
    left join entity_memberships m on m.entity_id = n.entity_id and m.user_id = n.recipient_user_id
   where n.recipient_user_id = $1
   order by n.created_at desc
   limit 100`;

// Raises a notification, or refreshes the existing one for the same subject. The partial
// unique indexes in 0025 make "one invitation, one notification" structural: a
// re-invitation after a decline updates the row instead of stacking a second.
//
// Takes a client so the caller can raise it inside their transaction: a notification
// about an invitation that rolled back would be a lie.
export async function raiseNotification(client, { recipient, type, actor = null, entityId = null, roomId = null }) {
  if (recipient === actor) return; // never notify someone about their own action
  const conflictTarget = type === 'entity_invitation'
    ? '(recipient_user_id, entity_id) where type_key = \'entity_invitation\''
    : type === 'conversation_request'
      ? '(recipient_user_id, room_id) where type_key = \'conversation_request\''
      : null;

  if (!conflictTarget) {
    await client.query(
      `insert into notifications (recipient_user_id, type_key, actor_user_id, entity_id, room_id)
       values ($1, $2, $3, $4, $5)`,
      [recipient, type, actor, entityId, roomId]
    );
    return;
  }

  await client.query(
    `insert into notifications (recipient_user_id, type_key, actor_user_id, entity_id, room_id)
     values ($1, $2, $3, $4, $5)
     on conflict ${conflictTarget}
     do update set actor_user_id = excluded.actor_user_id, created_at = now(), read_at = null`,
    [recipient, type, actor, entityId, roomId]
  );
}

// GET /me/notifications — own inbox only. Never anyone else's: there is no id to pass.
export async function handleListNotifications(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const [list, unread] = await Promise.all([
      getPool().query(INBOX_QUERY, [actor.id]),
      getPool().query(
        'select count(*)::int as count from notifications where recipient_user_id = $1 and read_at is null',
        [actor.id]
      )
    ]);
    sendJson(res, 200, {
      ok: true,
      unread: unread.rows[0]?.count || 0,
      notifications: list.rows
    });
  } catch (error) {
    sendError(res, 500, 'NOTIFICATIONS_LIST_FAILED', 'Failed to list notifications');
  }
}

// POST /me/notifications/read — mark everything read, or one by id.
export async function handleReadNotifications(req, res, notificationId = null) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    // The recipient filter is the authorization: another user's id simply matches
    // nothing, so there is no way to read — or to probe — someone else's inbox.
    const result = notificationId
      ? await getPool().query(
          `update notifications set read_at = now()
            where id = $1 and recipient_user_id = $2 and read_at is null
            returning id`,
          [notificationId, actor.id]
        )
      : await getPool().query(
          `update notifications set read_at = now()
            where recipient_user_id = $1 and read_at is null
            returning id`,
          [actor.id]
        );
    sendJson(res, 200, { ok: true, marked: result.rowCount });
  } catch (error) {
    sendError(res, 500, 'NOTIFICATIONS_READ_FAILED', 'Failed to mark notifications read');
  }
}
