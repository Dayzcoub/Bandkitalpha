import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';

// Resolves the engagement, asserts it belongs to the given event, and asserts the
// actor manages the event's owning entity. Returns { actor, event, engagement }
// on success, or null after sending an error. Reliability records live in the
// engagement's working context, so they follow the same entity-scoped authz as
// engagements themselves (Security Standard §2 — IDOR is the primary risk).
async function requireEngagementManager(client, req, res, eventId, engagementId) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return null;
  }
  const result = await client.query(
    `select e.id as engagement_id, e.counterparty_party_id, e.status_key,
            ev.id as event_id, ev.entity_id
       from engagements e
       join events ev on ev.id = e.event_id
      where e.id = $1 and e.event_id = $2
      limit 1`,
    [engagementId, eventId]
  );
  const row = result.rows[0];
  if (!row) {
    sendError(res, 404, 'ENGAGEMENT_NOT_FOUND', 'Engagement not found for this event');
    return null;
  }
  if (!row.entity_id) {
    sendError(res, 409, 'EVENT_NOT_SCOPED', 'Event is not attached to an entity');
    return null;
  }
  const membershipResult = await client.query(
    'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
    [row.entity_id, actor.id]
  );
  const membership = membershipResult.rows[0] || null;
  if (!permissionService.canRecordReliabilityEvent(actor, membership)) {
    sendError(res, 403, 'RELIABILITY_FORBIDDEN', 'You do not have permission to manage this engagement');
    return null;
  }
  return {
    actor,
    event: { id: row.event_id, entity_id: row.entity_id },
    engagement: { id: row.engagement_id, counterparty_party_id: row.counterparty_party_id, status_key: row.status_key }
  };
}

// GET /reliability/event-types — public reference catalogue (types + valid
// reasons) so the UI can render structured pickers instead of free text.
export async function handleListReliabilityCatalogue(req, res) {
  try {
    const pool = getPool();
    const [types, reasons] = await Promise.all([
      pool.query('select key, label, polarity, sort_order from reliability_event_types order by sort_order, key'),
      pool.query('select key, label, sort_order from reliability_reasons order by sort_order, key')
    ]);
    sendJson(res, 200, { ok: true, types: types.rows, reasons: reasons.rows });
  } catch (error) {
    sendError(res, 500, 'RELIABILITY_CATALOGUE_FAILED', 'Failed to load reliability catalogue', { message: error?.message || String(error) });
  }
}

// POST /events/:eventId/engagements/:engagementId/reliability — record a
// structured reliability event about the engagement's counterparty. The subject
// party and event are derived from the engagement, never taken from the body, so
// a record can only ever be attached to a verified collaboration context.
export async function handleRecordReliabilityEvent(req, res, eventId, engagementId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEngagementManager(client, req, res, eventId, engagementId);
    if (!guard) return;

    const body = await readJsonBody(req);
    const typeKey = String(body.type_key || '').trim();
    const reasonKey = body.reason_key ? String(body.reason_key).trim() : null;
    const note = body.note ? String(body.note).trim().slice(0, 2000) : null;
    const disputed = body.disputed === true;
    const allowedVisibility = ['organizers', 'collaborators', 'moderation', 'hidden'];
    const visibility = allowedVisibility.includes(body.visibility) ? body.visibility : 'organizers';
    const metadata = body.metadata && typeof body.metadata === 'object' ? JSON.stringify(body.metadata) : null;

    if (!typeKey) {
      sendError(res, 400, 'RELIABILITY_TYPE_REQUIRED', 'type_key is required');
      return;
    }

    const result = await client.query(
      `insert into reliability_events
         (engagement_id, subject_party_id, event_id, type_key, reason_key, visibility, disputed, note, metadata, created_by_user_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
       returning id, engagement_id, subject_party_id, event_id, type_key, reason_key, visibility, disputed, note, metadata, created_at`,
      [guard.engagement.id, guard.engagement.counterparty_party_id, guard.event.id, typeKey, reasonKey,
        visibility, disputed, note, metadata, guard.actor.id]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, event_id, metadata)
       values ($1, 'reliability.event.recorded', $2, $3,
               jsonb_build_object('reliability_id', $4::text, 'engagement_id', $5::text, 'type', $6::text))`,
      [guard.actor.id, guard.event.entity_id, guard.event.id, result.rows[0].id, guard.engagement.id, typeKey]
    );
    sendJson(res, 201, { ok: true, reliability_event: result.rows[0] });
  } catch (error) {
    if (error?.code === '23503') {
      sendError(res, 400, 'REFERENCE_UNKNOWN', 'Referenced reliability type or reason does not exist');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'RELIABILITY_RECORD_FAILED', 'Failed to record reliability event', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// GET /events/:eventId/engagements/:engagementId/reliability — manager-scoped
// list of reliability records for one engagement (the working roster view, not a
// public reputation summary).
export async function handleListReliabilityEvents(req, res, eventId, engagementId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEngagementManager(client, req, res, eventId, engagementId);
    if (!guard) return;
    const result = await client.query(
      `select r.id, r.type_key, t.label as type_label, t.polarity,
              r.reason_key, rs.label as reason_label,
              r.subject_party_id, r.visibility, r.disputed, r.note, r.created_at
         from reliability_events r
         join reliability_event_types t on t.key = r.type_key
         left join reliability_reasons rs on rs.key = r.reason_key
        where r.engagement_id = $1
        order by r.created_at`,
      [guard.engagement.id]
    );
    sendJson(res, 200, { ok: true, reliability_events: result.rows });
  } catch (error) {
    sendError(res, 500, 'RELIABILITY_LIST_FAILED', 'Failed to list reliability events', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
