import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';

// GET /moderation/report-catalogue — reference lists so a report form can render
// structured pickers (object types, reasons, and — for staff — case states).
export async function handleReportCatalogue(req, res) {
  try {
    const pool = getPool();
    const [objectTypes, reasons, states] = await Promise.all([
      pool.query('select key, label, sort_order from report_object_types order by sort_order, key'),
      pool.query('select key, label, sort_order from report_reasons order by sort_order, key'),
      pool.query('select key, label, sort_order, is_terminal from moderation_case_states order by sort_order, key')
    ]);
    sendJson(res, 200, { ok: true, object_types: objectTypes.rows, reasons: reasons.rows, states: states.rows });
  } catch (error) {
    sendError(res, 500, 'REPORT_CATALOGUE_FAILED', 'Failed to load report catalogue', { message: error?.message || String(error) });
  }
}

// Snapshots a reported chat message as evidence, but only if the reporter can
// actually see it (is a member of the room). Returns the snapshot object or null.
// Non-members simply get no snapshot — the same response either way, so reporting
// can't be used to probe whether a message exists (IDOR, Security Standard §2).
async function snapshotChatMessage(client, reporterId, messageId) {
  const result = await client.query(
    `select m.id, m.room_id, m.author_user_id, m.body, m.status, m.created_at, m.edited_at
       from chat_messages m
       join chat_room_members mem on mem.room_id = m.room_id and mem.user_id = $2
      where m.id = $1 limit 1`,
    [messageId, reporterId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    kind: 'chat_message',
    message_id: row.id,
    room_id: row.room_id,
    author_user_id: row.author_user_id,
    body: row.body,
    status: row.status,
    created_at: row.created_at,
    edited_at: row.edited_at,
    snapshotted_at: new Date().toISOString()
  };
}

// POST /reports — any active user files a report. Evidence is snapshotted at
// report time so it survives later edit/delete of the reported object.
export async function handleCreateReport(req, res) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!permissionService.canFileReport(actor)) {
      sendError(res, 403, 'REPORT_FORBIDDEN', 'Your account cannot file reports');
      return;
    }

    const body = await readJsonBody(req);
    const objectType = String(body.object_type || '').trim();
    const objectId = body.object_id ? String(body.object_id).trim() : null;
    const reasonKey = String(body.reason_key || '').trim();
    const details = body.details ? String(body.details).trim().slice(0, 4000) : null;
    const accusedUserId = body.accused_user_id ? String(body.accused_user_id).trim() : null;
    const accusedEntityId = body.accused_entity_id ? String(body.accused_entity_id).trim() : null;

    if (!objectType) {
      sendError(res, 400, 'REPORT_OBJECT_TYPE_REQUIRED', 'object_type is required');
      return;
    }
    if (!reasonKey) {
      sendError(res, 400, 'REPORT_REASON_REQUIRED', 'reason_key is required');
      return;
    }

    // Evidence snapshot for object kinds the backend can preserve today.
    let context = null;
    if (objectType === 'chat_message' && objectId) {
      context = await snapshotChatMessage(client, actor.id, objectId);
    }

    const result = await client.query(
      `insert into reports
         (reporter_user_id, object_type, object_id, reason_key, details, context, accused_user_id, accused_entity_id)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       returning id, object_type, object_id, reason_key, state_key, created_at`,
      [actor.id, objectType, objectId, reasonKey, details, context ? JSON.stringify(context) : null, accusedUserId, accusedEntityId]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'moderation.report.created',
               jsonb_build_object('report_id', $2::text, 'object_type', $3::text, 'reason', $4::text))`,
      [actor.id, result.rows[0].id, objectType, reasonKey]
    );
    // User-facing behavior (spec): confirm receipt, promise no specific outcome.
    sendJson(res, 201, { ok: true, report: result.rows[0] });
  } catch (error) {
    if (error?.code === '23503') {
      sendError(res, 400, 'REFERENCE_UNKNOWN', 'Referenced object type, reason, or accused party does not exist');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'REPORT_CREATE_FAILED', 'Failed to file report', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// GET /reports — platform moderation staff triage queue. Open (non-terminal)
// cases first; `?state=` narrows to one state.
export async function handleListReports(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!permissionService.canModeratePlatform(actor)) {
      sendError(res, 403, 'MODERATION_FORBIDDEN', 'Platform moderation access is required');
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    const stateFilter = url.searchParams.get('state');
    const params = [];
    let where = '';
    if (stateFilter) {
      params.push(stateFilter);
      where = 'where r.state_key = $1';
    }
    const result = await getPool().query(
      `select r.id, r.object_type, ot.label as object_type_label, r.object_id,
              r.reason_key, rr.label as reason_label,
              r.state_key, st.label as state_label, st.is_terminal,
              r.details, r.reporter_user_id, ru.display_name as reporter_name,
              r.accused_user_id, r.assigned_to_user_id, r.created_at
         from reports r
         join report_object_types ot on ot.key = r.object_type
         join report_reasons rr on rr.key = r.reason_key
         join moderation_case_states st on st.key = r.state_key
         left join users ru on ru.id = r.reporter_user_id
         ${where}
        order by st.is_terminal, r.created_at desc
        limit 200`,
      params
    );
    sendJson(res, 200, { ok: true, reports: result.rows });
  } catch (error) {
    sendError(res, 500, 'REPORTS_LIST_FAILED', 'Failed to list reports', { message: error?.message || String(error) });
  }
}

// GET /reports/:id — full case detail incl. preserved evidence. Staff only.
export async function handleGetReport(req, res, reportId) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!permissionService.canModeratePlatform(actor)) {
      sendError(res, 403, 'MODERATION_FORBIDDEN', 'Platform moderation access is required');
      return;
    }
    const result = await getPool().query(
      `select r.*, ot.label as object_type_label, rr.label as reason_label,
              st.label as state_label, ru.display_name as reporter_name
         from reports r
         join report_object_types ot on ot.key = r.object_type
         join report_reasons rr on rr.key = r.reason_key
         join moderation_case_states st on st.key = r.state_key
         left join users ru on ru.id = r.reporter_user_id
        where r.id = $1 limit 1`,
      [reportId]
    );
    if (!result.rows[0]) {
      sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      return;
    }
    sendJson(res, 200, { ok: true, report: result.rows[0] });
  } catch (error) {
    sendError(res, 500, 'REPORT_GET_FAILED', 'Failed to load report', { message: error?.message || String(error) });
  }
}

// PATCH /reports/:id — staff advances the case state (spec: sensitive actions
// require a reason and an audit event). Terminal states stamp resolution.
export async function handleUpdateReport(req, res, reportId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!permissionService.canModeratePlatform(actor)) {
      sendError(res, 403, 'MODERATION_FORBIDDEN', 'Platform moderation access is required');
      return;
    }
    const body = await readJsonBody(req);
    const stateKey = String(body.state_key || '').trim();
    const resolution = body.resolution ? String(body.resolution).trim().slice(0, 4000) : null;
    if (!stateKey) {
      sendError(res, 400, 'REPORT_STATE_REQUIRED', 'state_key is required');
      return;
    }
    const stateRow = await client.query('select key, is_terminal from moderation_case_states where key = $1 limit 1', [stateKey]);
    if (!stateRow.rows[0]) {
      sendError(res, 400, 'REPORT_STATE_INVALID', 'Unknown state_key');
      return;
    }
    const isTerminal = stateRow.rows[0].is_terminal;

    const result = await client.query(
      `update reports
          set state_key = $2,
              resolution = coalesce($3, resolution),
              resolved_by_user_id = case when $4 then $5 else resolved_by_user_id end,
              resolved_at = case when $4 then now() else resolved_at end
        where id = $1
        returning id, state_key, resolution, resolved_at, updated_at`,
      [reportId, stateKey, resolution, isTerminal, actor.id]
    );
    if (!result.rows[0]) {
      sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      return;
    }
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'moderation.report.updated', jsonb_build_object('report_id', $2::text, 'state', $3::text))`,
      [actor.id, reportId, stateKey]
    );
    sendJson(res, 200, { ok: true, report: result.rows[0] });
  } catch (error) {
    sendError(res, 500, 'REPORT_UPDATE_FAILED', 'Failed to update report', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
