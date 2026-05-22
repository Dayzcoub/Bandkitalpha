import { sendJson } from '../../shared/http.js';

export function handleHealth(req, res, env) {
  sendJson(res, 200, {
    ok: true,
    env: env.nodeEnv,
    at: new Date().toISOString()
  });
}
