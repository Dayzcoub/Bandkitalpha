import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { checkLinkPolicy } from '../../shared/linkPolicy.js';

const MAX_POST_LENGTH = 8000;

// Resolves an entity by id, or ends the request. Feed surfaces hang off real
// entities only.
async function requireEntity(client, res, entityId) {
  const result = await client.query(
    `select id, name, status, visibility from entities where id = $1 limit 1`,
    [entityId]
  );
  const entity = result.rows[0];
  if (!entity || entity.status === 'deleted' || entity.status === 'anonymized') {
    sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
    return null;
  }
  return entity;
}

// PUT /entities/:id/subscription — subscribe (or re-activate a cancelled one).
// Idempotent upsert: history rows are kept, status flips back to active.
export async function handleSubscribe(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    if (!permissionService.canSubscribe(actor)) {
      sendError(res, 403, 'SUBSCRIBE_FORBIDDEN', 'Your account cannot subscribe');
      return;
    }
    const entity = await requireEntity(client, res, entityId);
    if (!entity) return;

    const result = await client.query(
      `insert into entity_subscriptions (user_id, entity_id, status)
       values ($1, $2, 'active')
       on conflict (user_id, entity_id)
         do update set status = 'active', updated_at = now()
       returning id, entity_id, status, notification_level, created_at`,
      [actor.id, entityId]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'feed.subscribed', $2, '{}'::jsonb)`,
      [actor.id, entityId]
    );
    sendJson(res, 200, { ok: true, subscription: result.rows[0] });
  } catch (error) {
    sendError(res, 500, 'SUBSCRIBE_FAILED', 'Failed to subscribe', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// DELETE /entities/:id/subscription — unsubscribe. The row stays as 'cancelled'
// (churn history is an anti-fraud signal), reads treat it as absent.
export async function handleUnsubscribe(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await client.query(
      `update entity_subscriptions set status = 'cancelled'
        where user_id = $1 and entity_id = $2 and status in ('active', 'muted')
        returning id`,
      [actor.id, entityId]
    );
    if (!result.rows[0]) {
      sendError(res, 404, 'SUBSCRIPTION_NOT_FOUND', 'You are not subscribed to this entity');
      return;
    }
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'feed.unsubscribed', $2, '{}'::jsonb)`,
      [actor.id, entityId]
    );
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendError(res, 500, 'UNSUBSCRIBE_FAILED', 'Failed to unsubscribe', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /entities/:id/posts — publish an entity post. Entity role only, never
// subscribers (spec). Link guard applies — posts are a public surface.
export async function handleCreateEntityPost(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const entity = await requireEntity(client, res, entityId);
    if (!entity) return;
    const membershipResult = await client.query(
      'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
      [entityId, actor.id]
    );
    if (!permissionService.canPublishEntityPost(actor, membershipResult.rows[0] || null)) {
      sendError(res, 403, 'POST_FORBIDDEN', 'You cannot publish posts for this entity');
      return;
    }

    const body = await readJsonBody(req);
    const text = String(body.body || '').trim();
    const visibility = ['public', 'subscribers', 'members'].includes(body.visibility) ? body.visibility : 'public';
    if (!text) {
      sendError(res, 400, 'POST_EMPTY', 'Post body is required');
      return;
    }
    if (text.length > MAX_POST_LENGTH) {
      sendError(res, 400, 'POST_TOO_LONG', `Post must be at most ${MAX_POST_LENGTH} characters`);
      return;
    }
    // Link guard (AntiFraud §4) — same policy as chat, same audit signal family.
    const link = checkLinkPolicy(text);
    if (link.blocked) {
      await client.query(
        `insert into audit_events (actor_user_id, action, entity_id, metadata)
         values ($1, 'feed.post_link_blocked', $2, jsonb_build_object('reason', $3::text))`,
        [actor.id, entityId, link.reason]
      );
      sendError(res, 422, 'POST_LINK_BLOCKED', 'External links are not allowed in posts', { reason: link.reason });
      return;
    }

    const result = await client.query(
      `insert into entity_posts (entity_id, author_user_id, body, visibility)
       values ($1, $2, $3, $4)
       returning id, entity_id, body, visibility, is_pinned, published_at`,
      [entityId, actor.id, text, visibility]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'feed.post_created', $2, jsonb_build_object('post_id', $3::text, 'visibility', $4::text))`,
      [actor.id, entityId, result.rows[0].id, visibility]
    );
    sendJson(res, 201, { ok: true, post: result.rows[0] });
  } catch (error) {
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'POST_CREATE_FAILED', 'Failed to publish post', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// The visibility layers the viewer may read on one entity: everyone sees public;
// an active subscriber adds subscribers; an active member adds subscribers +
// members (membership implies the subscriber layer, not vice versa).
async function allowedVisibilities(client, actorId, entityId) {
  const layers = ['public'];
  if (!actorId) return layers;
  const member = await client.query(
    `select 1 from entity_memberships where entity_id = $1 and user_id = $2 and status = 'active' limit 1`,
    [entityId, actorId]
  );
  if (member.rowCount > 0) return ['public', 'subscribers', 'members'];
  const sub = await client.query(
    `select 1 from entity_subscriptions where entity_id = $1 and user_id = $2 and status in ('active', 'muted') limit 1`,
    [entityId, actorId]
  );
  if (sub.rowCount > 0) layers.push('subscribers');
  return layers;
}

// GET /entities/:id/posts — one entity's feed, visibility-filtered for the
// viewer (anonymous viewers get public only). Hidden/removed posts excluded.
export async function handleListEntityPosts(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const entity = await requireEntity(client, res, entityId);
    if (!entity) return;
    const actor = await resolveSessionUser(req);
    const layers = await allowedVisibilities(client, actor?.id ?? null, entityId);
    const result = await client.query(
      `select p.id, p.entity_id, e.name as entity_name, p.body, p.visibility,
              p.is_pinned, p.published_at, u.display_name as author_name
         from entity_posts p
         join entities e on e.id = p.entity_id
         left join users u on u.id = p.author_user_id
        where p.entity_id = $1
          and p.visibility = any($2)
          and p.moderation_state in ('clean', 'flagged')
        order by p.is_pinned desc, p.published_at desc
        limit 100`,
      [entityId, layers]
    );
    const subscribed = actor
      ? (await client.query(
          `select 1 from entity_subscriptions where entity_id = $1 and user_id = $2 and status in ('active', 'muted') limit 1`,
          [entityId, actor.id]
        )).rowCount > 0
      : false;
    sendJson(res, 200, { ok: true, posts: result.rows, subscribed });
  } catch (error) {
    sendError(res, 500, 'POSTS_LIST_FAILED', 'Failed to list posts', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// GET /me/feed — the chronological home feed (spec: default MVP sorting stays
// chronological). Sources: entities the caller subscribes to (public +
// subscribers layers) and entities they are an active member of (all three
// layers). No ranking, no discovery.
export async function handleMyFeed(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await getPool().query(
      `select p.id, p.entity_id, e.name as entity_name, p.body, p.visibility,
              p.is_pinned, p.published_at, u.display_name as author_name
         from entity_posts p
         join entities e on e.id = p.entity_id
         left join users u on u.id = p.author_user_id
        where p.moderation_state in ('clean', 'flagged')
          and (
            (p.visibility in ('public', 'subscribers') and exists (
              select 1 from entity_subscriptions s
               where s.entity_id = p.entity_id and s.user_id = $1 and s.status = 'active'))
            or exists (
              select 1 from entity_memberships m
               where m.entity_id = p.entity_id and m.user_id = $1 and m.status = 'active')
          )
        order by p.published_at desc
        limit 100`,
      [actor.id]
    );
    sendJson(res, 200, { ok: true, posts: result.rows });
  } catch (error) {
    sendError(res, 500, 'FEED_FAILED', 'Failed to load feed', { message: error?.message || String(error) });
  }
}
