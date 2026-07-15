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
  documentTitle: 'Demo Technical Rider',
  messageBody: 'Demo important message from real PostgreSQL'
};

function assertStaging(env) {
  return env.nodeEnv === 'staging' || env.nodeEnv === 'development';
}

// Returns the existing row for a deterministic key, or inserts it. Keeps the
// seed idempotent for tables that have no natural unique constraint.
async function findOrCreate(client, selectSql, selectParams, insertSql, insertParams) {
  const found = await client.query(selectSql, selectParams);
  if (found.rows[0]) return found.rows[0];
  const created = await client.query(insertSql, insertParams);
  return created.rows[0];
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

    // Events/rooms/messages/documents have no natural unique key, so a plain
    // insert made every smoke run (i.e. every deploy) create another copy. Seed
    // is find-or-create on a deterministic key instead — re-seeding is a no-op.
    const event = await findOrCreate(
      client,
      `select id, title, status, location from events where entity_id = $1 and title = $2 order by created_at limit 1`,
      [entity.id, demo.eventTitle],
      `insert into events (entity_id, title, description, status, location, created_by_user_id)
       values ($1, $2, 'Seeded staging event for backend smoke tests', 'confirmed', 'BandKit Studio', $3)
       returning id, title, status, location`,
      [entity.id, demo.eventTitle, user.id]
    );

    await client.query(
      `insert into event_participants (event_id, user_id, role, status)
       values ($1, $2, 'organizer', 'confirmed')
       on conflict (event_id, user_id) do update set role = 'organizer', status = 'confirmed'`,
      [event.id, user.id]
    );

    const room = await findOrCreate(
      client,
      `select id, type, title, status from chat_rooms where event_id = $1 and title = $2 order by created_at limit 1`,
      [event.id, demo.roomTitle],
      `insert into chat_rooms (type, title, entity_id, event_id, status, created_by_user_id)
       values ('event', $1, $2, $3, 'active', $4)
       returning id, type, title, status`,
      [demo.roomTitle, entity.id, event.id, user.id]
    );

    await client.query(
      `insert into chat_room_members (room_id, user_id, role, status)
       values ($1, $2, 'owner', 'active')
       on conflict (room_id, user_id) do update set role = 'owner', status = 'active'`,
      [room.id, user.id]
    );

    const message = await findOrCreate(
      client,
      `select id, kind, body, is_pinned, requires_ack, created_at from chat_messages
        where room_id = $1 and body = $2 order by created_at limit 1`,
      [room.id, demo.messageBody],
      `insert into chat_messages (room_id, author_user_id, kind, body, is_pinned, requires_ack)
       values ($1, $2, 'important', $3, true, true)
       returning id, kind, body, is_pinned, requires_ack, created_at`,
      [room.id, user.id, demo.messageBody]
    );

    const document = await findOrCreate(
      client,
      `select id, title, document_type, status, version_number from documents
        where event_id = $1 and title = $2 order by created_at limit 1`,
      [event.id, demo.documentTitle],
      `insert into documents (parent_type, entity_id, event_id, owner_user_id, title, document_type, status, created_by_user_id)
       values ('event', $1, $2, $3, $4, 'rider', 'active', $3)
       returning id, title, document_type, status, version_number`,
      [entity.id, event.id, user.id, demo.documentTitle]
    );

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
