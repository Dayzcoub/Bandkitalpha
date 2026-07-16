// Dev/staging-only demo data: one band, one event, its chat room, one message and
// one document. Idempotent. NEVER runs in production.
//   node --env-file=.env scripts/seed-demo.mjs
//
// This used to be POST /api/v1/dev/seed-demo, gated only on NODE_ENV — and staging
// is a public host, so it was an unauthenticated write path open to the internet.
// It took nothing from the request and only ever wrote fixed rows: a script wearing
// an HTTP costume. The deploy runs it directly now, like the migrations and
// seed-auth, so there is nothing to reach.
import { getPool } from '../src/db/client.js';

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

// Returns the existing row for a deterministic key, or inserts it. Keeps the
// seed idempotent for tables that have no natural unique constraint.
async function findOrCreate(client, selectSql, selectParams, insertSql, insertParams) {
  const found = await client.query(selectSql, selectParams);
  if (found.rows[0]) return found.rows[0];
  const created = await client.query(insertSql, insertParams);
  return created.rows[0];
}

async function run() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'staging') {
    console.error(`seed-demo is disabled outside development/staging (NODE_ENV=${nodeEnv})`);
    process.exitCode = 1;
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

    await findOrCreate(
      client,
      `select id from chat_messages where room_id = $1 and body = $2 order by created_at limit 1`,
      [room.id, demo.messageBody],
      `insert into chat_messages (room_id, author_user_id, kind, body, is_pinned, requires_ack)
       values ($1, $2, 'important', $3, true, true)
       returning id`,
      [room.id, user.id, demo.messageBody]
    );

    await findOrCreate(
      client,
      `select id from documents where event_id = $1 and title = $2 order by created_at limit 1`,
      [event.id, demo.documentTitle],
      `insert into documents (parent_type, entity_id, event_id, owner_user_id, title, document_type, status, created_by_user_id)
       values ('event', $1, $2, $3, $4, 'rider', 'active', $3)
       returning id`,
      [entity.id, event.id, user.id, demo.documentTitle]
    );

    await client.query('commit');

    console.log(`seeded ${entity.name} (${entity.slug}) — event "${event.title}", its room, message and document`);
    console.log('Done. Demo data is for local/staging only.');
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
