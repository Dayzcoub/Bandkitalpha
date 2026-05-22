import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

export async function handleListEntities(req, res) {
  try {
    const result = await getPool().query(
      `select
         e.id,
         e.name,
         e.slug,
         e.type,
         e.status,
         e.visibility,
         e.created_at,
         coalesce(count(em.user_id), 0)::int as member_count
       from entities e
       left join entity_memberships em on em.entity_id = e.id and em.status = 'active'
       group by e.id
       order by e.created_at desc
       limit 50`
    );

    sendJson(res, 200, {
      ok: true,
      entities: result.rows
    });
  } catch (error) {
    sendError(res, 500, 'ENTITIES_LIST_FAILED', 'Failed to list entities', {
      message: error?.message || String(error)
    });
  }
}
