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

// Кто видит событие (`events.visibility`, миграция 0028 — решение F1).
//
// `actorId` может быть null: публичное событие видно анониму, иначе `public` ничем не
// отличался бы от `registered` — значение без собственного поведения, ровно та болезнь,
// которой больны `private`/`members` у сущностей.
//
// Утечку §10 (публичное событие закрытой группы публикует группу) здесь ловить не нужно:
// её не существует по построению — триггер 0028 не даёт событию быть шире владельца.
export async function canViewEvent(client, actorId, eventId) {
  const result = await client.query(
    `select 1
       from events ev
      where ev.id = $1
        and (
          ev.visibility = 'public'
          or ($2::uuid is not null and ev.visibility = 'registered')
          or ($2::uuid is not null and (
            exists (
              select 1 from entity_memberships m
               where m.entity_id = ev.entity_id and m.user_id = $2 and m.status = 'active'
            )
            or exists (
              select 1 from event_participants p
               where p.event_id = ev.id and p.user_id = $2
                 and p.status in ('invited', 'applied', 'confirmed', 'completed')
            )
          ))
        )
      limit 1`,
    [eventId, actorId ?? null]
  );
  return result.rowCount > 0;
}

export async function handleListEvents(req, res) {
  try {
    // Previously unauthenticated and unscoped: it returned every event on the
    // platform — including location and schedule — to anonymous callers. Scoped to
    // the session since 1.15.1.
    //
    // С 0028 у события есть своя видимость (F1), поэтому список — это «мои события
    // ПЛЮС то, что открыто вошедшему». Маршрут остаётся `authed`: анонимной афиши
    // как поверхности ещё нет, а `GET /events/:id` уже отдаёт публичное событие
    // всякому. Понадобится афиша — это свой маршрут со своей пагинацией, а не
    // ослабление этого.
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
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
       where ev.visibility in ('registered', 'public')
          or exists (
               select 1 from entity_memberships m
                where m.entity_id = ev.entity_id and m.user_id = $1 and m.status = 'active'
             )
          or exists (
               select 1 from event_participants p
                where p.event_id = ev.id and p.user_id = $1
                  and p.status in ('invited', 'applied', 'confirmed', 'completed')
             )
       group by ev.id, e.id
       order by ev.created_at desc
       limit 50`,
      [actor.id]
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


// GET /events/:id — one event for someone entitled to see it. Unknown or
// invisible both answer 404: never confirm an event exists to an outsider.
// Единственный анонимно достижимый доменный маршрут (`access: 'public'` в routes.js), и
// это цена того, чтобы `public` что-то значил. Гейт здесь не грубый, а объектный: аноним
// видит ровно `visibility = 'public'` и ничего больше.
export async function handleGetEvent(req, res, eventId) {
  const client = await getPool().connect();
  try {
    // Может быть null — маршрут public. Резолв дешёвый: диспетчер уже сходил бы в базу
    // для authed-маршрута, а здесь мемоизация отдаёт готовое (session.js).
    const actor = await resolveSessionUser(req);
    if (!(await canViewEvent(client, actor?.id ?? null, eventId))) {
      // 404, а не 403: неизвестное и невидимое отвечают одинаково (правило с 1.15.1),
      // иначе перебор id выдал бы, какие события существуют.
      sendError(res, 404, 'EVENT_NOT_FOUND', 'Event not found');
      return;
    }
    const result = await client.query(
      `select ev.id, ev.title, ev.description, ev.status, ev.location,
              ev.starts_at, ev.ends_at, ev.created_at,
              e.id as entity_id, e.name as entity_name, e.slug as entity_slug,
              coalesce((select count(*) from event_participants p
                         where p.event_id = ev.id and p.status = 'confirmed'), 0)::int as participant_count
         from events ev
         left join entities e on e.id = ev.entity_id
        where ev.id = $1 limit 1`,
      [eventId]
    );
    // У анонима членства нет по определению — спрашивать базу не о чем.
    const membership = actor
      ? (await client.query(
          'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
          [result.rows[0].entity_id, actor.id]
        )).rows[0] || null
      : null;
    sendJson(res, 200, {
      ok: true,
      event: result.rows[0],
      // Lets the UI offer manager-only surfaces without guessing.
      can_manage: actor ? permissionService.canManageEntity(actor, membership) : false
    });
  } catch (error) {
    sendError(res, 500, 'EVENT_GET_FAILED', 'Failed to load the event');
  } finally {
    client.release();
  }
}
