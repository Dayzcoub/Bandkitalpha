import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { getEntityPlanUsage } from './plans.js';

// GET /plans — the plan catalogue. Public: what a plan includes is marketing
// information, and the UI shows it next to an entity's current usage.
export async function handleListPlans(req, res) {
  try {
    const result = await getPool().query(
      `select key, label, max_members, max_storage_bytes, max_file_versions, max_upload_bytes
         from plans order by sort_order, key`
    );
    sendJson(res, 200, { ok: true, plans: result.rows });
  } catch (error) {
    sendError(res, 500, 'PLANS_LIST_FAILED', 'Failed to load plans');
  }
}

// GET /entities/:id/plan — the entity's plan and live usage. Members only:
// usage is workspace data (Security DoD §16.2).
export async function handleGetEntityPlan(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const membership = await client.query(
      'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
      [entityId, actor.id]
    );
    const isStaff = permissionService.canModeratePlatform(actor);
    if (!isStaff && !permissionService.canViewEntityDocuments(actor, membership.rows[0] || null)) {
      sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
      return;
    }
    const data = await getEntityPlanUsage(client, entityId);
    if (!data) {
      sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
      return;
    }
    sendJson(res, 200, { ok: true, ...data });
  } catch (error) {
    sendError(res, 500, 'ENTITY_PLAN_FAILED', 'Failed to load the plan');
  } finally {
    client.release();
  }
}

// PUT /entities/:id/plan — assign a plan. There is no payment flow at this
// stage, so this is the policy's "admin override for testing/support": platform
// staff only, reason recorded, audited.
export async function handleSetEntityPlan(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!permissionService.canModeratePlatform(actor)) {
      sendError(res, 403, 'PLAN_ASSIGN_FORBIDDEN', 'Platform staff can assign plans');
      return;
    }
    const entity = await client.query('select id from entities where id = $1 limit 1', [entityId]);
    if (!entity.rows[0]) {
      sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
      return;
    }
    const body = await readJsonBody(req);
    const planKey = String(body.plan_key || '').trim();
    const note = body.note ? String(body.note).trim().slice(0, 500) : null;
    if (!planKey) {
      sendError(res, 400, 'PLAN_REQUIRED', 'plan_key is required');
      return;
    }
    const plan = await client.query('select key from plans where key = $1 limit 1', [planKey]);
    if (!plan.rows[0]) {
      sendError(res, 400, 'PLAN_UNKNOWN', 'Unknown plan_key');
      return;
    }

    await client.query(
      `insert into entity_plans (entity_id, plan_key, assigned_by_user_id, note)
       values ($1, $2, $3, $4)
       on conflict (entity_id) do update
         set plan_key = excluded.plan_key,
             assigned_by_user_id = excluded.assigned_by_user_id,
             note = excluded.note,
             updated_at = now()`,
      [entityId, planKey, actor.id, note]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'billing.plan_assigned', $2, jsonb_build_object('plan', $3::text))`,
      [actor.id, entityId, planKey]
    );
    const data = await getEntityPlanUsage(client, entityId);
    sendJson(res, 200, { ok: true, ...data });
  } catch (error) {
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'PLAN_ASSIGN_FAILED', 'Failed to assign the plan');
  } finally {
    client.release();
  }
}
