import http from 'node:http';
import { getEnv } from './config/env.js';
import { handleListChatRooms } from './modules/chats/chats.routes.js';
import { handleDevSeedDemo } from './modules/dev/dev.routes.js';
import { handleListDocuments } from './modules/documents/documents.routes.js';
import { handleCreateEntity, handleGetEntity, handleListEntities } from './modules/entities/entities.routes.js';
import { handleListEvents } from './modules/events/events.routes.js';
import { handleDatabaseHealth, handleHealth } from './modules/health/health.routes.js';
import { notFound, sendError } from './shared/http.js';
import { logError, logInfo } from './shared/logger.js';

const env = getEnv();

const server = http.createServer((req, res) => {
  Promise.resolve()
    .then(async () => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const entityDetailMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/entities/([^/]+)$`));

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/health`) {
        handleHealth(req, res, env);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/health/db`) {
        await handleDatabaseHealth(req, res);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/dev/seed-demo`) {
        await handleDevSeedDemo(req, res, env);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/entities`) {
        await handleListEntities(req, res);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/entities`) {
        await handleCreateEntity(req, res);
        return;
      }

      if (req.method === 'GET' && entityDetailMatch) {
        await handleGetEntity(req, res, decodeURIComponent(entityDetailMatch[1]));
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/events`) {
        await handleListEvents(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/chat-rooms`) {
        await handleListChatRooms(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/documents`) {
        await handleListDocuments(req, res);
        return;
      }

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
