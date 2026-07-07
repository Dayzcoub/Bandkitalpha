import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

// GET /taxonomy — public reference data for pickers (entity types, professions,
// specializations). Read-only, no auth required.
export async function handleGetTaxonomy(req, res) {
  try {
    const pool = getPool();
    const [types, professions, specializations, resourceTypes, engagementStatuses] = await Promise.all([
      pool.query('select key, label from entity_types order by sort_order, label'),
      pool.query('select key, label from professions order by sort_order, label'),
      pool.query('select key, profession_key, label from specializations order by sort_order, label'),
      pool.query('select key, label from resource_types order by sort_order, label'),
      pool.query('select key, label, is_terminal from engagement_statuses order by sort_order, label')
    ]);
    sendJson(res, 200, {
      ok: true,
      entity_types: types.rows,
      professions: professions.rows,
      specializations: specializations.rows,
      resource_types: resourceTypes.rows,
      engagement_statuses: engagementStatuses.rows
    });
  } catch (error) {
    sendError(res, 500, 'TAXONOMY_FAILED', 'Failed to load taxonomy', { message: error?.message || String(error) });
  }
}
