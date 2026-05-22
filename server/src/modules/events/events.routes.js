import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

export async function handleListEvents(req, res) {
  try {
    const result = await getPool().query(
      `select
         ev.id,
         ev.title,
         ev.status,
         ev.location,
         ev.starts_at,
         ev.ends_at,
         ev.created_at,
         e.id as entity_id,
         e.name as entity_name,
         coalesce(count(ep.user_id), 0)::int as participant_count
       from events ev
       left join entities e on e.id = ev.entity_id
       left join event_participants ep on ep.event_id = ev.id and ep.status = 'confirmed'
       group by ev.id, e.id
       order by ev.created_at desc
       limit 50`
    );

    sendJson(res, 200, {
      ok: true,
      events: result.rows
    });
  } catch (error) {
    sendError(res, 500, 'EVENTS_LIST_FAILED', 'Failed to list events', {
      message: error?.message || String(error)
    });
  }
}
