import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

export async function handleListDocuments(req, res) {
  try {
    const result = await getPool().query(
      `select
         d.id,
         d.title,
         d.document_type,
         d.status,
         d.version_number,
         d.created_at,
         e.name as entity_name,
         ev.title as event_title
       from documents d
       left join entities e on e.id = d.entity_id
       left join events ev on ev.id = d.event_id
       order by d.created_at desc
       limit 50`
    );

    sendJson(res, 200, {
      ok: true,
      documents: result.rows
    });
  } catch (error) {
    sendError(res, 500, 'DOCUMENTS_LIST_FAILED', 'Failed to list documents', {
      message: error?.message || String(error)
    });
  }
}
