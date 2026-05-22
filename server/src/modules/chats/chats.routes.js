import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

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
