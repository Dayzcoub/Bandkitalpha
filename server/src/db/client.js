import pg from 'pg';

let pool;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || '';
}

export function hasDatabaseUrl() {
  return Boolean(getDatabaseUrl());
}

export function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    pool = new pg.Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000
    });
  }

  return pool;
}

export async function checkDatabase() {
  if (!hasDatabaseUrl()) {
    return {
      ok: false,
      configured: false,
      message: 'DATABASE_URL is not configured'
    };
  }

  const result = await getPool().query('select now() as now');

  return {
    ok: true,
    configured: true,
    now: result.rows[0]?.now || null
  };
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
