import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { canViewEvent } from './events.routes.js';

// Resolves the event and asserts the actor is a manager of the event's owning
// entity. Returns { actor, event } on success, or null after sending an error.
// Slots and engagements are the event's working context, so they follow the
// same entity-scoped authz as event creation (Security Standard §2).
async function requireEventManager(client, req, res, eventId) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return null;
  }
  const eventResult = await client.query('select id, entity_id from events where id = $1 limit 1', [eventId]);
  const event = eventResult.rows[0];
  if (!event) {
    sendError(res, 404, 'EVENT_NOT_FOUND', 'Event not found');
    return null;
  }
  if (!event.entity_id) {
    sendError(res, 409, 'EVENT_NOT_SCOPED', 'Event is not attached to an entity');
    return null;
  }
  const membershipResult = await client.query(
    'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
    [event.entity_id, actor.id]
  );
  if (!permissionService.canManageEntity(actor, membershipResult.rows[0] || null)) {
    sendError(res, 403, 'EVENT_MANAGE_FORBIDDEN', 'You do not have permission to manage this event');
    return null;
  }
  return { actor, event };
}

function mapConstraintError(res, error) {
  if (error?.constraint === 'event_slots_spec_matches_profession') {
    sendError(res, 400, 'SPECIALIZATION_MISMATCH', 'Specialization does not belong to the given profession');
    return true;
  }
  if (error?.constraint === 'event_slots_requirement_shape') {
    sendError(res, 400, 'SLOT_SHAPE_INVALID', 'A party slot needs a profession; a resource slot needs a resource type');
    return true;
  }
  if (error?.code === '23503') {
    sendError(res, 400, 'REFERENCE_UNKNOWN', 'Referenced profession, specialization, party or status does not exist');
    return true;
  }
  if (error?.code === 'BODY_TOO_LARGE') {
    sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
    return true;
  }
  return false;
}

// POST /events/:eventId/slots — add a requirement slot to an event.
export async function handleCreateSlot(req, res, eventId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEventManager(client, req, res, eventId);
    if (!guard) return;

    const body = await readJsonBody(req);
    const requirement = body.requirement === 'resource' ? 'resource' : 'party';
    const professionKey = body.profession_key ? String(body.profession_key).trim() : null;
    const specializationKey = body.specialization_key ? String(body.specialization_key).trim() : null;
    const resourceType = body.resource_type ? String(body.resource_type).trim() : null;
    const count = Number.isInteger(body.count) && body.count > 0 ? body.count : 1;
    const terms = body.terms && typeof body.terms === 'object' ? JSON.stringify(body.terms) : null;

    if (requirement === 'party' && !professionKey) {
      sendError(res, 400, 'SLOT_PROFESSION_REQUIRED', 'A party slot requires a profession_key');
      return;
    }
    if (requirement === 'resource' && !resourceType) {
      sendError(res, 400, 'SLOT_RESOURCE_REQUIRED', 'A resource slot requires a resource_type');
      return;
    }

    const result = await client.query(
      `insert into event_slots (event_id, requirement, profession_key, specialization_key, resource_type, count, terms)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb)
       returning id, event_id, requirement, profession_key, specialization_key, resource_type, count, terms, sort_order, created_at`,
      [eventId, requirement, requirement === 'party' ? professionKey : null, requirement === 'party' ? specializationKey : null,
        requirement === 'resource' ? resourceType : null, count, terms]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, event_id, metadata)
       values ($1, 'event.slot.created', $2, $3, jsonb_build_object('slot_id', $4::text))`,
      [guard.actor.id, guard.event.entity_id, eventId, result.rows[0].id]
    );
    sendJson(res, 201, { ok: true, slot: result.rows[0] });
  } catch (error) {
    if (mapConstraintError(res, error)) return;
    sendError(res, 500, 'SLOT_CREATE_FAILED', 'Failed to create slot', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// GET /events/:eventId/slots — an event's requirement slots. Not public: slots
// describe what an event needs, so they follow the event's own visibility —
// otherwise they'd let anyone enumerate a private event's plans by id.
export async function handleListSlots(req, res, eventId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!(await canViewEvent(client, actor.id, eventId))) {
      sendError(res, 404, 'EVENT_NOT_FOUND', 'Event not found');
      return;
    }
    const result = await client.query(
      `select s.id, s.requirement, s.profession_key, pr.label as profession_label,
              s.specialization_key, sp.label as specialization_label,
              s.resource_type, s.count, s.terms, s.sort_order
         from event_slots s
         left join professions pr on pr.key = s.profession_key
         left join specializations sp on sp.key = s.specialization_key
        where s.event_id = $1
        order by s.sort_order, s.created_at`,
      [eventId]
    );
    sendJson(res, 200, { ok: true, slots: result.rows });
  } catch (error) {
    sendError(res, 500, 'SLOTS_LIST_FAILED', 'Failed to list slots', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /events/:eventId/engagements — engage a party (optionally against a slot).
export async function handleCreateEngagement(req, res, eventId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEventManager(client, req, res, eventId);
    if (!guard) return;

    const body = await readJsonBody(req);
    const counterpartyPartyId = String(body.counterparty_party_id || '').trim();
    const slotId = body.slot_id ? String(body.slot_id).trim() : null;
    const statusKey = body.status_key ? String(body.status_key).trim() : 'draft';
    const terms = body.terms && typeof body.terms === 'object' ? JSON.stringify(body.terms) : null;

    if (!counterpartyPartyId) {
      sendError(res, 400, 'ENGAGEMENT_COUNTERPARTY_REQUIRED', 'counterparty_party_id is required');
      return;
    }
    // A referenced slot must belong to this event (no cross-event slot binding).
    if (slotId) {
      const slotCheck = await client.query('select id from event_slots where id = $1 and event_id = $2 limit 1', [slotId, eventId]);
      if (!slotCheck.rows[0]) {
        sendError(res, 400, 'ENGAGEMENT_SLOT_INVALID', 'slot_id does not belong to this event');
        return;
      }
    }

    const result = await client.query(
      `insert into engagements (event_id, slot_id, counterparty_party_id, status_key, terms, created_by_user_id)
       values ($1, $2, $3, $4, $5::jsonb, $6)
       returning id, event_id, slot_id, counterparty_party_id, status_key, terms, completed_at, created_at`,
      [eventId, slotId, counterpartyPartyId, statusKey, terms, guard.actor.id]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, event_id, metadata)
       values ($1, 'event.engagement.created', $2, $3, jsonb_build_object('engagement_id', $4::text))`,
      [guard.actor.id, guard.event.entity_id, eventId, result.rows[0].id]
    );
    sendJson(res, 201, { ok: true, engagement: result.rows[0] });
  } catch (error) {
    if (mapConstraintError(res, error)) return;
    sendError(res, 500, 'ENGAGEMENT_CREATE_FAILED', 'Failed to create engagement', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// GET /events/:eventId/engagements — engagements for an event (manager-scoped:
// this is the working roster, not public).
export async function handleListEngagements(req, res, eventId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEventManager(client, req, res, eventId);
    if (!guard) return;
    const result = await client.query(
      `select e.id, e.slot_id, e.counterparty_party_id, e.status_key, st.label as status_label,
              st.is_terminal, e.terms, e.completed_at, e.created_at,
              p.kind as counterparty_kind, u.display_name as counterparty_user, ent.name as counterparty_entity
         from engagements e
         join engagement_statuses st on st.key = e.status_key
         join parties p on p.id = e.counterparty_party_id
         left join users u on u.id = p.user_id
         left join entities ent on ent.id = p.entity_id
        where e.event_id = $1
        order by e.created_at`,
      [eventId]
    );
    sendJson(res, 200, { ok: true, engagements: result.rows });
  } catch (error) {
    sendError(res, 500, 'ENGAGEMENTS_LIST_FAILED', 'Failed to list engagements', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// PATCH /events/:eventId/engagements/:engagementId — advance the lifecycle.
export async function handleUpdateEngagementStatus(req, res, eventId, engagementId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEventManager(client, req, res, eventId);
    if (!guard) return;

    const body = await readJsonBody(req);
    const statusKey = String(body.status_key || '').trim();
    if (!statusKey) {
      sendError(res, 400, 'ENGAGEMENT_STATUS_REQUIRED', 'status_key is required');
      return;
    }

    // completed_at tracks the terminal 'completed' state; other states clear it.
    const result = await client.query(
      `update engagements
          set status_key = $1,
              completed_at = case when $1 = 'completed' then now() else null end
        where id = $2 and event_id = $3
        returning id, event_id, slot_id, counterparty_party_id, status_key, terms, completed_at, updated_at`,
      [statusKey, engagementId, eventId]
    );
    if (!result.rows[0]) {
      sendError(res, 404, 'ENGAGEMENT_NOT_FOUND', 'Engagement not found for this event');
      return;
    }
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, event_id, metadata)
       values ($1, 'event.engagement.status_changed', $2, $3, jsonb_build_object('engagement_id', $4::text, 'status', $5::text))`,
      [guard.actor.id, guard.event.entity_id, eventId, engagementId, statusKey]
    );
    sendJson(res, 200, { ok: true, engagement: result.rows[0] });
  } catch (error) {
    if (mapConstraintError(res, error)) return;
    sendError(res, 500, 'ENGAGEMENT_UPDATE_FAILED', 'Failed to update engagement', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
