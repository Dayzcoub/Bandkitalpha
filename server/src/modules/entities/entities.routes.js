import { getPool } from '../../db/client.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { getEntityPlan, getMemberCount } from '../billing/plans.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { raiseNotification } from '../notifications/notifications.routes.js';

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

// GET /entities — the entity directory, scoped to what the caller may see. A guest
// gets 'public' entities only; that is a real answer, not an error, because public
// entities are meant to be discoverable. The scoping mirrors canViewEntity — keep
// the two in step.
export async function handleListEntities(req, res) {
  try {
    const actor = await resolveSessionUser(req);
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
       where e.status <> 'deleted'
         and (
           e.visibility = 'public'
           or ($1::uuid is not null and e.visibility = 'registered')
           or ($1::uuid is not null and exists (
                select 1
                  from entity_memberships m
                 where m.entity_id = e.id
                   and m.user_id = $1::uuid
                   and m.status = 'active'
              ))
         )
       group by e.id
       order by e.created_at desc
       limit 50`,
      [actor?.id || null]
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
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    const result = await client.query(
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
    const membership = entity && actor
      ? (await client.query(
          'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
          [entity.id, actor.id]
        )).rows[0] || null
      : null;

    // Unknown and invisible both answer 404: an outsider is never told an entity
    // exists (same rule as events, checkpoint 1.15.1).
    if (!entity || !permissionService.canViewEntity(actor, entity, membership)) {
      sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
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
  } finally {
    client.release();
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

    // Non-latin names (e.g. Cyrillic) slugify to nothing — fall back to a
    // generated slug instead of rejecting the name.
    const finalSlug = requestedSlug || `entity-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    // Actor comes from the session, and only from the session. There used to be an
    // x-bandkit-dev-user header fallback here "for tooling outside production" —
    // but staging is a public host, so it let anyone on the internet create an
    // entity as any user they named. Tooling authenticates like everyone else.
    const actor = await resolveSessionUser(req);
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
      [actor.id, type, name, finalSlug, visibility]
    );
    const entity = entityResult.rows[0];

    await client.query(
      `insert into entity_memberships (entity_id, user_id, role, status)
       values ($1, $2, 'owner', 'active')`,
      [entity.id, actor.id]
    );

    // Every entity is also a party (organization) so it can be engaged as a
    // counterparty. Idempotent via unique(entity_id).
    await client.query(
      `insert into parties (kind, entity_id) values ('organization', $1)
       on conflict (entity_id) do nothing`,
      [entity.id]
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

    // Plan member limit (Monetization policy: "extended member limits" is a paid
    // axis). Checked before the lookup so we never hint whether a user exists.
    const plan = await getEntityPlan(client, entityId);
    const members = await getMemberCount(client, entityId);
    if (members >= plan.max_members) {
      sendError(res, 409, 'PLAN_MEMBER_LIMIT', 'This plan\'s member limit is reached', {
        plan: plan.key, limit: plan.max_members
      });
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
    // An invitation, not a membership. Adding someone straight to 'active' was a consent
    // bypass: an active membership grants entity chat access AND counts as shared
    // context, so anyone could create an entity, add a stranger, and thereby earn the
    // right to message them past their own `dm` policy — verified end to end before 0024.
    // The 'invited' state has been in the schema since 0002; only the flow was missing.
    //
    // A previously declined/removed/former/left membership may be invited again; an
    // active or already-pending one stays a 409 (no update, no row returned).
    const inserted = await client.query(
      `insert into entity_memberships (entity_id, user_id, role, status, invited_by_user_id, invited_at)
       values ($1, $2, $3, 'invited', $4, now())
       on conflict (entity_id, user_id) do update
         set role = excluded.role, status = 'invited', invited_by_user_id = excluded.invited_by_user_id,
             invited_at = now(), decided_at = null, updated_at = now()
         where entity_memberships.status in ('declined', 'former', 'removed', 'left')
       returning role, status`,
      [entityId, target.id, role, actor.id]
    );
    if (inserted.rowCount === 0) {
      await client.query('rollback');
      sendError(res, 409, 'MEMBER_ALREADY_EXISTS', 'User is already a member of or invited to this entity');
      return;
    }
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'entity.member_invited', $2, $3::jsonb)`,
      [actor.id, entityId, JSON.stringify({ target_user_id: target.id, role })]
    );
    // In the same transaction: an invitation nobody is told about is a page you have to
    // think to visit, and a notification about an invitation that rolled back is a lie.
    await raiseNotification(client, {
      recipient: target.id, type: 'entity_invitation', actor: actor.id, entityId
    });
    await client.query('commit');

    sendJson(res, 201, {
      ok: true,
      membership: {
        entity_id: entityId,
        role,
        status: 'invited',
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

// GET /me/invitations — entity invitations awaiting this user's decision.
// Consent lives here: until one of these is accepted, the membership grants nothing —
// no chat access, no shared context (migration 0024).
export async function handleListMyInvitations(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await getPool().query(
      `select m.entity_id, m.role, m.invited_at,
              e.name as entity_name, e.slug as entity_slug, e.type as entity_type,
              u.display_name as invited_by
         from entity_memberships m
         join entities e on e.id = m.entity_id
         left join users u on u.id = m.invited_by_user_id
        where m.user_id = $1 and m.status = 'invited'
          and e.status <> 'deleted'
        order by m.invited_at desc nulls last
        limit 100`,
      [actor.id]
    );
    sendJson(res, 200, { ok: true, invitations: result.rows });
  } catch (error) {
    sendError(res, 500, 'INVITATIONS_LIST_FAILED', 'Failed to list invitations');
  }
}

// POST /me/invitations/:entityId/accept | /decline — only the invited user decides.
//
// Declining keeps the row as 'declined' rather than deleting it: a re-invitation should
// be a deliberate act by the inviter, and "she said no once" is information the entity's
// managers are entitled to keep. It is not a block — that is a separate axis.
export async function handleDecideInvitation(req, res, entityId, decision) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const status = decision === 'accept' ? 'active' : 'declined';
    const result = await getPool().query(
      `update entity_memberships
          set status = $1, decided_at = now(), updated_at = now()
        where entity_id = $2 and user_id = $3 and status = 'invited'
        returning entity_id, role, status, invited_by_user_id`,
      [status, entityId, actor.id]
    );
    if (!result.rows[0]) {
      // Not yours, or not pending — one answer, so this cannot be used to probe who has
      // been invited where.
      sendError(res, 404, 'INVITATION_NOT_FOUND', 'No pending invitation for this entity');
      return;
    }
    await getPool().query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, $2, $3, '{}'::jsonb)`,
      [actor.id, decision === 'accept' ? 'entity.invitation_accepted' : 'entity.invitation_declined', entityId]
    );
    // Tell whoever invited: they acted, they deserve the answer. Declines included —
    // silence would read as "still pending" and invite a nag.
    if (result.rows[0].invited_by_user_id) {
      await raiseNotification(getPool(), {
        recipient: result.rows[0].invited_by_user_id,
        type: decision === 'accept' ? 'invitation_accepted' : 'invitation_declined',
        actor: actor.id,
        entityId
      });
    }
    sendJson(res, 200, { ok: true, membership: { entity_id: result.rows[0].entity_id, role: result.rows[0].role, status: result.rows[0].status } });
  } catch (error) {
    sendError(res, 500, 'INVITATION_DECIDE_FAILED', 'Failed to decide the invitation');
  }
}
