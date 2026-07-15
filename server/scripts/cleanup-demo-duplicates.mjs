// One-off cleanup for demo data duplicated by the smoke test.
//
// Before the seed was made idempotent, every smoke run (i.e. every deploy)
// inserted another "Demo Rehearsal" event with its own chat room, message and
// document. This keeps the OLDEST demo event per entity and deletes the newer
// duplicates; FK cascades remove their rooms, messages and documents.
//
// Safe by default — prints what it would delete and changes nothing:
//   node --env-file=.env scripts/cleanup-demo-duplicates.mjs
// Actually delete:
//   node --env-file=.env scripts/cleanup-demo-duplicates.mjs --apply
//
// Only ever touches rows matching the seed's exact demo titles under the
// 'demo-band' entity. Never runs in production.
import { getPool } from '../src/db/client.js';

const DEMO = {
  entitySlug: 'demo-band',
  eventTitle: 'Demo Rehearsal',
  roomTitle: 'Demo Band Working Chat',
  documentTitle: 'Demo Technical Rider'
};

const apply = process.argv.includes('--apply');

async function run() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'staging') {
    console.error(`Refusing to run outside development/staging (NODE_ENV=${nodeEnv})`);
    process.exitCode = 1;
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    const entity = await client.query('select id, name from entities where slug = $1 limit 1', [DEMO.entitySlug]);
    if (!entity.rows[0]) {
      console.log(`No '${DEMO.entitySlug}' entity — nothing to clean.`);
      return;
    }
    const entityId = entity.rows[0].id;

    // The keeper: the oldest demo event. Everything newer with the same title is
    // a smoke-run duplicate.
    const events = await client.query(
      `select id, created_at from events where entity_id = $1 and title = $2 order by created_at`,
      [entityId, DEMO.eventTitle]
    );
    if (events.rows.length === 0) {
      console.log('No demo events — nothing to clean.');
      return;
    }
    const keep = events.rows[0];
    const duplicates = events.rows.slice(1).map((r) => r.id);

    const counts = await client.query(
      `select
         (select count(*)::int from chat_rooms where title = $1) as rooms,
         (select count(*)::int from documents where title = $2) as docs,
         (select count(*)::int from chat_messages m join chat_rooms r on r.id = m.room_id where r.title = $1) as messages`,
      [DEMO.roomTitle, DEMO.documentTitle]
    );

    console.log(`entity            : ${entity.rows[0].name} (${entityId})`);
    console.log(`demo events       : ${events.rows.length}  (keeping oldest ${keep.id}, created ${keep.created_at.toISOString()})`);
    console.log(`duplicates to drop: ${duplicates.length}`);
    console.log(`current demo rooms/messages/docs: ${counts.rows[0].rooms} / ${counts.rows[0].messages} / ${counts.rows[0].docs}`);

    if (duplicates.length === 0) {
      console.log('\nAlready clean.');
      return;
    }
    if (!apply) {
      console.log('\nDRY RUN — nothing deleted. Re-run with --apply to delete the duplicates.');
      return;
    }

    // Cascades: deleting an event removes its chat_rooms (-> chat_messages) and
    // documents. Done in one transaction.
    await client.query('begin');
    const deleted = await client.query('delete from events where id = any($1::uuid[])', [duplicates]);
    await client.query('commit');

    const after = await client.query(
      `select
         (select count(*)::int from chat_rooms where title = $1) as rooms,
         (select count(*)::int from documents where title = $2) as docs`,
      [DEMO.roomTitle, DEMO.documentTitle]
    );
    console.log(`\nDeleted ${deleted.rowCount} duplicate events.`);
    console.log(`remaining demo rooms/docs: ${after.rows[0].rooms} / ${after.rows[0].docs}`);
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
