import http from 'node:http';
import { getEnv } from './config/env.js';
import { buildRoutes } from './routes.js';
import { createRouter } from './router.js';
import { notFound, sendError } from './shared/http.js';
import { logError, logInfo } from './shared/logger.js';

const env = getEnv();

// Собирается на старте, а не на запросе: маршрут без объявленного доступа роняет процесс
// здесь, до первого запроса (F6). Незаявленный доступ обязан быть заметен нам раньше, чем
// кому-то ещё.
const dispatch = createRouter(buildRoutes(env), env.apiPrefix);

const server = http.createServer((req, res) => {
  Promise.resolve()
    .then(async () => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      if (await dispatch(req, res, url)) return;
      notFound(res);
    })
    .catch((error) => {
      logError('Request failed', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    });
});

server.listen(env.port, '127.0.0.1', () => {
  logInfo('BandKit backend listening', {
    port: env.port,
    apiPrefix: env.apiPrefix,
    env: env.nodeEnv
  });
});
