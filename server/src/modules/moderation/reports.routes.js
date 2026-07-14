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

// Snapshots a reported entity post as evidence. Posts are a public-ish surface;
// snapshot only what the reporter could see anyway (a post whose visibility layer
// includes them) — for MVP that is the public layer plus subscriber/member layers
// checked in one query. No row → no snapshot, same response (no probing).
async function snapshotEntityPost(client, reporterId, postId) {
  const result = await client.query(
    `select p.id, p.entity_id, p.author_user_id, p.body, p.visibility,
            p.moderation_state, p.published_at
       from entity_posts p
      where p.id = $1
        and (p.visibility = 'public'
          or (p.visibility = 'subscribers' and (
                exists (select 1 from entity_subscriptions s
                         where s.entity_id = p.entity_id and s.user_id = $2 and s.status in ('active','muted'))
             or exists (select 1 from entity_memberships m
                         where m.entity_id = p.entity_id and m.user_id = $2 and m.status = 'active')))
          or (p.visibility = 'members' and exists (
                select 1 from entity_memberships m
                 where m.entity_id = p.entity_id and m.user_id = $2 and m.status = 'active')))
      limit 1`,
    [postId, reporterId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    kind: 'entity_post',
    post_id: row.id,
    entity_id: row.entity_id,
    author_user_id: row.author_user_id,
    body: row.body,
    visibility: row.visibility,
    moderation_state: row.moderation_state,
    published_at: row.published_at,
    snapshotted_at: new Date().toISOString()
  };
}

// Snapshots a reported comment as evidence — allowed when the reporter can see
// the parent post (comments follow post visibility).
async function snapshotComment(client, reporterId, commentId) {
  const result = await client.query(
    `select i.id, i.post_id, i.user_id as author_user_id, i.body, i.moderation_state, i.created_at,
            p.entity_id, p.visibility as post_visibility
       from entity_post_interactions i
       join entity_posts p on p.id = i.post_id
      where i.id = $1 and i.type = 'comment'
        and (p.visibility = 'public'
          or (p.visibility = 'subscribers' and (
                exists (select 1 from entity_subscriptions s
                         where s.entity_id = p.entity_id and s.user_id = $2 and s.status in ('active','muted'))
             or exists (select 1 from entity_memberships m
                         where m.entity_id = p.entity_id and m.user_id = $2 and m.status = 'active')))
          or (p.visibility = 'members' and exists (
                select 1 from entity_memberships m
                 where m.entity_id = p.entity_id and m.user_id = $2 and m.status = 'active')))
      limit 1`,
    [commentId, reporterId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    kind: 'comment',
    comment_id: row.id,
    post_id: row.post_id,
    entity_id: row.entity_id,
    author_user_id: row.author_user_id,
    body: row.body,
    moderation_state: row.moderation_state,
    created_at: row.created_at,
    snapshotted_at: new Date().toISOString()
  };
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
    } else if (objectType === 'post' && objectId) {
      context = await snapshotEntityPost(client, actor.id, objectId);
    } else if (objectType === 'comment' && objectId) {
      context = await snapshotComment(client, actor.id, objectId);
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
    // Include the case's action history — part of the preserved evidence trail.
    const actions = await getPool().query(
      `select a.id, a.action_key, at.label as action_label, a.target_user_id,
              tu.display_name as target_name, a.reason, a.created_at,
              au.display_name as actor_name
         from moderation_actions a
         join moderation_action_types at on at.key = a.action_key
         left join users tu on tu.id = a.target_user_id
         left join users au on au.id = a.actor_user_id
        where a.report_id = $1
        order by a.created_at`,
      [reportId]
    );
    // Live state of the case's target user and reported object, so the UI can
    // offer only the applicable sanction/restore actions.
    const report = result.rows[0];
    let targetStatus = null;
    const targetUserId = report.accused_user_id || report.context?.author_user_id || null;
    if (targetUserId) {
      const tu = await getPool().query('select status from users where id = $1 limit 1', [targetUserId]);
      targetStatus = tu.rows[0]?.status ?? null;
    }
    let objectStatus = null;
    if (report.object_type === 'chat_message' && report.object_id) {
      const om = await getPool().query('select status from chat_messages where id = $1 limit 1', [report.object_id]);
      objectStatus = om.rows[0]?.status ?? null;
    } else if (report.object_type === 'post' && report.object_id) {
      const op = await getPool().query('select moderation_state from entity_posts where id = $1 limit 1', [report.object_id]);
      objectStatus = op.rows[0]?.moderation_state ?? null;
    } else if (report.object_type === 'comment' && report.object_id) {
      const oc = await getPool().query(`select moderation_state from entity_post_interactions where id = $1 and type = 'comment' limit 1`, [report.object_id]);
      objectStatus = oc.rows[0]?.moderation_state ?? null;
    }
    sendJson(res, 200, { ok: true, report, actions: actions.rows, target_status: targetStatus, object_status: objectStatus });
  } catch (error) {
    sendError(res, 500, 'REPORT_GET_FAILED', 'Failed to load report', { message: error?.message || String(error) });
  }
}

// POST /reports/:id/actions — a moderator takes a concrete action on the case.
// Spec: every sensitive action requires a reason and an audit event. Effects are
// real: hide_content hides the reported chat message; restrict_user / suspend_user
// change the target's account status (enforced by PermissionService / login).
export async function handleReportAction(req, res, reportId) {
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
    const found = await client.query(
      'select id, object_type, object_id, accused_user_id, context from reports where id = $1 limit 1',
      [reportId]
    );
    const report = found.rows[0];
    if (!report) {
      sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      return;
    }

    const body = await readJsonBody(req);
    const actionKey = String(body.action_key || '').trim();
    const reason = body.reason ? String(body.reason).trim().slice(0, 2000) : '';
    if (!actionKey) {
      sendError(res, 400, 'ACTION_REQUIRED', 'action_key is required');
      return;
    }
    if (!reason) {
      sendError(res, 400, 'ACTION_REASON_REQUIRED', 'A reason is required for moderation actions');
      return;
    }

    const USER_ACTIONS = new Set(['restrict_user', 'suspend_user', 'unrestrict_user', 'unsuspend_user']);
    const CONTENT_ACTIONS = new Set(['hide_content', 'unhide_content']);

    // Target for user-level actions: explicit override, else the accused, else
    // the author preserved in the evidence snapshot.
    const targetUserId = (body.target_user_id ? String(body.target_user_id).trim() : null)
      || report.accused_user_id
      || report.context?.author_user_id
      || null;

    let target = null;
    if (USER_ACTIONS.has(actionKey)) {
      if (!targetUserId) {
        sendError(res, 400, 'ACTION_TARGET_REQUIRED', 'This action needs a target user');
        return;
      }
      const targetRow = await client.query('select id, status, platform_role from users where id = $1 limit 1', [targetUserId]);
      target = targetRow.rows[0];
      if (!target) {
        sendError(res, 400, 'ACTION_TARGET_UNKNOWN', 'Target user does not exist');
        return;
      }
      // Staff cannot be sanctioned through the case flow, and nobody sanctions
      // themselves — staff management is a separate, dual-approval concern.
      if (target.id === actor.id || permissionService.canModeratePlatform(target)) {
        sendError(res, 403, 'ACTION_TARGET_FORBIDDEN', 'This target cannot be sanctioned from a moderation case');
        return;
      }
      // Restores only make sense from the matching sanctioned state.
      if (actionKey === 'unrestrict_user' && target.status !== 'restricted') {
        sendError(res, 409, 'ACTION_STATE_MISMATCH', 'Target user is not restricted');
        return;
      }
      if (actionKey === 'unsuspend_user' && target.status !== 'blocked') {
        sendError(res, 409, 'ACTION_STATE_MISMATCH', 'Target user is not suspended');
        return;
      }
    }

    // Content actions cover the object kinds whose backends exist: chat messages
    // (status column) and entity posts (moderation_state column).
    let contentState = null;
    if (CONTENT_ACTIONS.has(actionKey)) {
      if (!report.object_id || !['chat_message', 'post', 'comment'].includes(report.object_type)) {
        sendError(res, 400, 'ACTION_OBJECT_UNSUPPORTED', 'Content actions support reported chat messages, posts and comments only');
        return;
      }
      const row = report.object_type === 'chat_message'
        ? await client.query('select status as state from chat_messages where id = $1 limit 1', [report.object_id])
        : report.object_type === 'post'
          ? await client.query('select moderation_state as state from entity_posts where id = $1 limit 1', [report.object_id])
          : await client.query(`select moderation_state as state from entity_post_interactions where id = $1 and type = 'comment' limit 1`, [report.object_id]);
      contentState = row.rows[0]?.state ?? null;
      if (contentState === null) {
        sendError(res, 400, 'ACTION_OBJECT_UNKNOWN', 'Reported content no longer exists');
        return;
      }
      if (actionKey === 'hide_content' && contentState === 'hidden') {
        sendError(res, 409, 'ACTION_STATE_MISMATCH', 'Content is already hidden');
        return;
      }
      if (actionKey === 'unhide_content' && contentState !== 'hidden') {
        sendError(res, 409, 'ACTION_STATE_MISMATCH', 'Content is not hidden');
        return;
      }
    }

    // Looks up the prior status snapshotted by the matching sanction on this
    // case, so a restore puts back what was there (not blindly 'active').
    async function priorStatus(sanctionKey, fallback) {
      const prev = await client.query(
        `select metadata->>'prior_status' as prior from moderation_actions
          where report_id = $1 and action_key = $2 and metadata ? 'prior_status'
          order by created_at desc limit 1`,
        [reportId, sanctionKey]
      );
      return prev.rows[0]?.prior || fallback;
    }

    await client.query('begin');
    // Apply the real effect first, then record the action row. Sanctions
    // snapshot the prior status into metadata; restores read it back.
    let metadata = null;
    if (actionKey === 'hide_content') {
      metadata = { prior_status: contentState };
      if (report.object_type === 'chat_message') {
        await client.query(`update chat_messages set is_pinned = false, status = 'hidden' where id = $1`, [report.object_id]);
      } else if (report.object_type === 'post') {
        await client.query(`update entity_posts set is_pinned = false, moderation_state = 'hidden' where id = $1`, [report.object_id]);
      } else {
        await client.query(`update entity_post_interactions set moderation_state = 'hidden' where id = $1`, [report.object_id]);
      }
    } else if (actionKey === 'unhide_content') {
      const restored = await priorStatus('hide_content', report.object_type === 'chat_message' ? 'active' : 'clean');
      metadata = { restored_status: restored };
      if (report.object_type === 'chat_message') {
        await client.query(`update chat_messages set status = $2 where id = $1`, [report.object_id, restored]);
      } else if (report.object_type === 'post') {
        await client.query(`update entity_posts set moderation_state = $2 where id = $1`, [report.object_id, restored]);
      } else {
        await client.query(`update entity_post_interactions set moderation_state = $2 where id = $1`, [report.object_id, restored]);
      }
    } else if (actionKey === 'restrict_user') {
      metadata = { prior_status: target.status };
      await client.query(`update users set status = 'restricted', updated_at = now() where id = $1`, [targetUserId]);
    } else if (actionKey === 'suspend_user') {
      metadata = { prior_status: target.status };
      await client.query(`update users set status = 'blocked', updated_at = now() where id = $1`, [targetUserId]);
    } else if (actionKey === 'unrestrict_user') {
      const restored = await priorStatus('restrict_user', 'active');
      metadata = { restored_status: restored };
      await client.query(`update users set status = $2, updated_at = now() where id = $1`, [targetUserId, restored]);
    } else if (actionKey === 'unsuspend_user') {
      const restored = await priorStatus('suspend_user', 'active');
      metadata = { restored_status: restored };
      await client.query(`update users set status = $2, updated_at = now() where id = $1`, [targetUserId, restored]);
    }
    const inserted = await client.query(
      `insert into moderation_actions (report_id, action_key, target_user_id, reason, actor_user_id, metadata)
       values ($1, $2, $3, $4, $5, $6::jsonb)
       returning id, action_key, target_user_id, reason, created_at`,
      [reportId, actionKey, USER_ACTIONS.has(actionKey) ? targetUserId : null, reason, actor.id, metadata ? JSON.stringify(metadata) : null]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'moderation.action.taken',
               jsonb_build_object('report_id', $2::text, 'action', $3::text, 'target', $4::text))`,
      [actor.id, reportId, actionKey, targetUserId]
    );
    await client.query('commit');
    sendJson(res, 200, { ok: true, action: inserted.rows[0] });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (error?.code === '23503') {
      sendError(res, 400, 'REFERENCE_UNKNOWN', 'Referenced action type or target does not exist');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'ACTION_FAILED', 'Failed to apply moderation action', { message: error?.message || String(error) });
  } finally {
    client.release();
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
