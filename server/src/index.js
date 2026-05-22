import http from 'node:http';
import { getEnv } from './config/env.js';
import { handleHealth } from './modules/health/health.routes.js';
import { notFound, sendError } from './shared/http.js';
import { logError, logInfo } from './shared/logger.js';

const env = getEnv();

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/health`) {
      handleHealth(req, res, env);
      return;
    }

    notFound(res);
  } catch (error) {
    logError('Request failed', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  }
});

server.listen(env.port, '127.0.0.1', () => {
  logInfo('BandKit backend listening', {
    port: env.port,
    apiPrefix: env.apiPrefix,
    env: env.nodeEnv
  });
});
