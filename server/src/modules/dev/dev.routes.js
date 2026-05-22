import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

const demo = {
  userHandle: 'demo-manager',
  userName: 'Demo Manager',
  userEmail: 'demo-manager@bandkit.local',
  entitySlug: 'demo-band',
  entityName: 'Demo Band',
  eventTitle: 'Demo Rehearsal',
  roomTitle: 'Demo Band Working Chat',
  documentTitle: 'Demo Technical Rider'
};

function assertStaging(env) {
  return env.nodeEnv === 'staging' || env.nodeEnv === 'development';
}

export async function handleDevSeedDemo(req, res, env) {
  if (!assertStaging(env)) {
    sendError(res, 403, 'DEV_ENDPOINT_DISABLED', 'Dev endpoint is disabled outside staging/development');
    return;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('begin');

    const userResult = await client.query(
      `insert into users (display_name, handle, email, status)
       values ($1, $2, $3, 'active')
       on conflict (handle) do update set display_name = excluded.display_name
       returning id, display_name, handle, email, status`,
      [demo.userName, demo.userHandle, demo.userEmail]
    );
    const user = userResult.rows[0];

    const entityResult = await client.query(
      `insert into entities (owner_user_id, type, name, slug, status, visibility, created_by_user_id)
       values ($1, 'band', $2, $3, 'active', 'members', $1)
       on conflict (slug) do update set name = excluded.name, status = 'active'
       returning id, name, slug, type, status, visibility`,
      [user.id, demo.entityName, demo.entitySlug]
    );
    const entity = entityResult.rows[0];

    await client.query(
      `insert into entity_memberships (entity_id, user_id, role, status)
       values ($1, $2, 'owner', 'active')
       on conflict (entity_id, user_id) do update set role = 'owner', status = 'active'`,
      [entity.id, user.id]
    );

    const eventResult = await client.query(
      `insert into events (entity_id, title, description, status, location, created_by_user_id)
       values ($1, $2, 'Seeded staging event for backend smoke tests', 'confirmed', 'BandKit Studio', $3)
       returning id, title, status, location`,
      [entity.id, demo.eventTitle, user.id]
    );
    const event = eventResult.rows[0];

    await client.query(
      `insert into event_participants (event_id, user_id, role, status)
       values ($1, $2, 'organizer', 'confirmed')
       on conflict (event_id, user_id) do update set role = 'organizer', status = 'confirmed'`,
      [event.id, user.id]
    );

    const roomResult = await client.query(
      `insert into chat_rooms (type, title, entity_id, event_id, status, created_by_user_id)
       values ('event', $1, $2, $3, 'active', $4)
       returning id, type, title, status`,
      [demo.roomTitle, entity.id, event.id, user.id]
    );
    const room = roomResult.rows[0];

    await client.query(
      `insert into chat_room_members (room_id, user_id, role, status)
       values ($1, $2, 'owner', 'active')
       on conflict (room_id, user_id) do update set role = 'owner', status = 'active'`,
      [room.id, user.id]
    );

    const messageResult = await client.query(
      `insert into chat_messages (room_id, author_user_id, kind, body, is_pinned, requires_ack)
       values ($1, $2, 'important', 'Demo important message from real PostgreSQL', true, true)
       returning id, kind, body, is_pinned, requires_ack, created_at`,
      [room.id, user.id]
    );
    const message = messageResult.rows[0];

    const documentResult = await client.query(
      `insert into documents (parent_type, entity_id, event_id, owner_user_id, title, document_type, status, created_by_user_id)
       values ('event', $1, $2, $3, $4, 'rider', 'active', $3)
       returning id, title, document_type, status, version_number`,
      [entity.id, event.id, user.id, demo.documentTitle]
    );
    const document = documentResult.rows[0];

    await client.query('commit');

    sendJson(res, 201, {
      ok: true,
      seeded: {
        user,
        entity,
        event,
        room,
        message,
        document
      }
    });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    sendError(res, 500, 'DEV_SEED_FAILED', 'Failed to seed demo data', {
      message: error?.message || String(error)
    });
  } finally {
    client.release();
  }
}
