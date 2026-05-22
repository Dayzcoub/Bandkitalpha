import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../src/db/client.js';
import { logInfo } from '../src/shared/logger.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(dirname, '../migrations');

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function hasMigration(client, id) {
  const result = await client.query('select id from schema_migrations where id = $1', [id]);
  return result.rowCount > 0;
}

async function run() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (await hasMigration(client, file)) {
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');

      await client.query('begin');
      await client.query(sql);
      await client.query('insert into schema_migrations (id) values ($1)', [file]);
      await client.query('commit');

      logInfo('Migration applied', { file });
    }
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
