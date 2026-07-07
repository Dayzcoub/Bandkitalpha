import { getPool } from '../../db/client.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';

const allowedEntityTypes = new Set(['band', 'solo_artist', 'orchestra', 'project', 'organization', 'studio', 'venue', 'agency', 'other']);
const allowedVisibility = new Set(['private', 'members', 'registered', 'public']);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

async function getDevActor(client, req) {
  const handle = req.headers['x-bandkit-dev-user'] || 'demo-manager';
  const result = await client.query(
    `select id, display_name, handle, email, status
     from users
     where handle = $1
     limit 1`,
    [handle]
  );

  return result.rows[0] || null;
}

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

export async function handleGetEntity(req, res, entityId) {
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
       where e.id::text = $1 or e.slug = $1
       group by e.id
       limit 1`,
      [entityId]
    );

    const entity = result.rows[0];

    if (!entity) {
      sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
      return;
    }

    if (!permissionService.canViewEntity({ id: 'staging-reader' }, entity)) {
      sendError(res, 403, 'ENTITY_FORBIDDEN', 'Entity access denied');
      return;
    }

    sendJson(res, 200, {
      ok: true,
      entity
    });
  } catch (error) {
    sendError(res, 500, 'ENTITY_GET_FAILED', 'Failed to get entity', {
      message: error?.message || String(error)
    });
  }
}

export async function handleCreateEntity(req, res) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const body = await readJsonBody(req);
    const name = String(body.name || '').trim();
    const type = String(body.type || 'project').trim();
    const visibility = String(body.visibility || 'members').trim();
    const requestedSlug = slugify(body.slug || name);

    if (!name || name.length < 2) {
      sendError(res, 400, 'ENTITY_NAME_INVALID', 'Entity name must contain at least 2 characters');
      return;
    }

    if (!allowedEntityTypes.has(type)) {
      sendError(res, 400, 'ENTITY_TYPE_INVALID', 'Entity type is invalid');
      return;
    }

    if (!allowedVisibility.has(visibility)) {
      sendError(res, 400, 'ENTITY_VISIBILITY_INVALID', 'Entity visibility is invalid');
      return;
    }

    if (!requestedSlug) {
      sendError(res, 400, 'ENTITY_SLUG_INVALID', 'Entity slug is invalid');
      return;
    }

    // Actor comes from the session (server-side source of truth). The dev-header
    // fallback stays only outside production for tooling/smoke scripts.
    let actor = await resolveSessionUser(req);
    if (!actor && process.env.NODE_ENV !== 'production') {
      actor = await getDevActor(getPool(), req);
    }
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required to create an entity');
      return;
    }
    if (!permissionService.canCreateEntity(actor)) {
      sendError(res, 403, 'ENTITY_CREATE_FORBIDDEN', 'Entity creation is not allowed for this actor');
      return;
    }

    await client.query('begin');

    const entityResult = await client.query(
      `insert into entities (owner_user_id, type, name, slug, status, visibility, created_by_user_id)
       values ($1, $2, $3, $4, 'active', $5, $1)
       returning id, name, slug, type, status, visibility, created_at`,
      [actor.id, type, name, requestedSlug, visibility]
    );
    const entity = entityResult.rows[0];

    await client.query(
      `insert into entity_memberships (entity_id, user_id, role, status)
       values ($1, $2, 'owner', 'active')`,
      [entity.id, actor.id]
    );

    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'entity.created', $2, $3::jsonb)`,
      [actor.id, entity.id, JSON.stringify({ source: 'staging-api', slug: entity.slug })]
    );

    await client.query('commit');

    sendJson(res, 201, {
      ok: true,
      entity,
      owner: {
        id: actor.id,
        handle: actor.handle,
        display_name: actor.display_name
      }
    });
  } catch (error) {
    await client.query('rollback').catch(() => {});

    if (error?.code === '23505') {
      sendError(res, 409, 'ENTITY_CONFLICT', 'Entity slug or unique field already exists');
      return;
    }

    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }

    sendError(res, 500, 'ENTITY_CREATE_FAILED', 'Failed to create entity', {
      message: error?.message || String(error)
    });
  } finally {
    client.release();
  }
}

// POST /entities/:id/members — an entity manager adds a user as member/guest.
// Elevated grants (manager/admin/owner) are out of scope for this slice; they
// need stricter rules (TZ §15). Session-authenticated, entity-scoped.
export async function handleAddEntityMember(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const body = await readJsonBody(req);
    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    const handle = body.handle ? String(body.handle).trim() : '';
    const role = String(body.role || 'member');

    if (!email && !handle) {
      sendError(res, 400, 'MEMBER_TARGET_REQUIRED', 'email or handle is required');
      return;
    }
    if (!['member', 'guest'].includes(role)) {
      sendError(res, 400, 'MEMBER_ROLE_INVALID', 'role must be member or guest');
      return;
    }

    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }

    const managerMembership = await client.query(
      `select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1`,
      [entityId, actor.id]
    );
    if (!permissionService.canManageEntity(actor, managerMembership.rows[0] || null)) {
      sendError(res, 403, 'MEMBER_ADD_FORBIDDEN', 'You do not manage this entity');
      return;
    }

    const targetResult = await client.query(
      `select id, email, handle, display_name from users
       where ($1 <> '' and email = $1) or ($2 <> '' and handle = $2)
       limit 1`,
      [email, handle]
    );
    const target = targetResult.rows[0];
    if (!target) {
      sendError(res, 404, 'MEMBER_USER_NOT_FOUND', 'User not found');
      return;
    }

    await client.query('begin');
    // Re-activate a previously removed/former/left membership; a currently
    // active or invited one stays a 409 (no update, no row returned).
    const inserted = await client.query(
      `insert into entity_memberships (entity_id, user_id, role, status)
       values ($1, $2, $3, 'active')
       on conflict (entity_id, user_id) do update
         set role = excluded.role, status = 'active', updated_at = now()
         where entity_memberships.status in ('former', 'removed', 'left')
       returning role, status`,
      [entityId, target.id, role]
    );
    if (inserted.rowCount === 0) {
      await client.query('rollback');
      sendError(res, 409, 'MEMBER_ALREADY_EXISTS', 'User is already a member of this entity');
      return;
    }
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'entity.member_added', $2, $3::jsonb)`,
      [actor.id, entityId, JSON.stringify({ target_user_id: target.id, role })]
    );
    await client.query('commit');

    sendJson(res, 201, {
      ok: true,
      membership: {
        entity_id: entityId,
        role,
        status: 'active',
        user: { id: target.id, email: target.email, handle: target.handle, display_name: target.display_name }
      }
    });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (error?.code === '23503') {
      sendError(res, 404, 'MEMBER_ENTITY_NOT_FOUND', 'Entity not found');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'MEMBER_ADD_FAILED', 'Failed to add member', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
