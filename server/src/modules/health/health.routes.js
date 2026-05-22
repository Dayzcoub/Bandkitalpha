import { checkDatabase } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

export function handleHealth(req, res, env) {
  sendJson(res, 200, {
    ok: true,
    env: env.nodeEnv,
    at: new Date().toISOString()
  });
}

export async function handleDatabaseHealth(req, res) {
  try {
    const db = await checkDatabase();
    const statusCode = db.ok ? 200 : 503;

    sendJson(res, statusCode, {
      ok: db.ok,
      database: db
    });
  } catch (error) {
    sendError(res, 503, 'DATABASE_HEALTH_FAILED', 'Database health check failed', {
      message: error?.message || String(error)
    });
  }
}
