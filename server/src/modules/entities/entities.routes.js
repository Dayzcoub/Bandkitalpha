import { getPool } from '../../db/client.js';
import { permissionService } from '../permissions/PermissionService.js';
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

    await client.query('begin');

    const actor = await getDevActor(client, req);

    if (!permissionService.canCreateEntity(actor)) {
      await client.query('rollback');
      sendError(res, 403, 'ENTITY_CREATE_FORBIDDEN', 'Entity creation is not allowed for this actor');
      return;
    }

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
