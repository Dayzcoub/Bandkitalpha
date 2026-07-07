import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';

// POST /events — an entity manager (owner/admin/manager) creates an event for
// their entity. Session-authenticated and entity-scoped (Security §2).
export async function handleCreateEvent(req, res) {
  const client = await getPool().connect();
  try {
    const body = await readJsonBody(req);
    const entityId = String(body.entity_id || '').trim();
    const title = String(body.title || '').trim();
    const description = body.description ? String(body.description) : null;
    const location = body.location ? String(body.location) : null;
    const startsAt = body.starts_at ? String(body.starts_at) : null;
    const endsAt = body.ends_at ? String(body.ends_at) : null;

    if (!entityId) {
      sendError(res, 400, 'EVENT_ENTITY_REQUIRED', 'entity_id is required');
      return;
    }
    if (title.length < 2) {
      sendError(res, 400, 'EVENT_TITLE_INVALID', 'Event title must contain at least 2 characters');
      return;
    }

    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required to create an event');
      return;
    }

    const membershipResult = await client.query(
      `select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1`,
      [entityId, actor.id]
    );
    if (!permissionService.canCreateEvent(actor, membershipResult.rows[0] || null)) {
      sendError(res, 403, 'EVENT_CREATE_FORBIDDEN', 'You do not have permission to create events for this entity');
      return;
    }

    await client.query('begin');
    const eventResult = await client.query(
      `insert into events (entity_id, title, description, status, starts_at, ends_at, location, created_by_user_id)
       values ($1, $2, $3, 'draft', $4, $5, $6, $7)
       returning id, entity_id, title, status, starts_at, ends_at, location, created_at`,
      [entityId, title, description, startsAt, endsAt, location, actor.id]
    );
    const event = eventResult.rows[0];

    await client.query(
      `insert into event_participants (event_id, user_id, role, status)
       values ($1, $2, 'organizer', 'confirmed')`,
      [event.id, actor.id]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, event_id, metadata)
       values ($1, 'event.created', $2, $3, '{}'::jsonb)`,
      [actor.id, entityId, event.id]
    );
    await client.query('commit');

    sendJson(res, 201, { ok: true, event });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (error?.code === '23503') {
      sendError(res, 400, 'EVENT_ENTITY_NOT_FOUND', 'Referenced entity does not exist');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'EVENT_CREATE_FAILED', 'Failed to create event', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

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
