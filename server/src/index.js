import http from 'node:http';
import { getEnv } from './config/env.js';
import { handleAdminAudit, handleAdminEntities, handleAdminModeration, handleAdminOverview, handleAdminReports, handleAdminTrust, handleAdminUsers } from './modules/admin/admin.routes.js';
import { handleAdminBilling } from './modules/admin/billing.routes.js';
import { handleAdminContent } from './modules/admin/content.routes.js';
import { handleAdminLocalization } from './modules/admin/localization.routes.js';
import { handleAdminNotifications } from './modules/admin/notifications.routes.js';
import { handleAdminSettings } from './modules/admin/settings.routes.js';
import { handleAdminStaffCatalog } from './modules/admin/staff.routes.js';
import { handleListChatRooms } from './modules/chats/chats.routes.js';
import { handleDevSeedDemo } from './modules/dev/dev.routes.js';
import { handleListDocuments } from './modules/documents/documents.routes.js';
import { handleCreateEntity, handleGetEntity, handleListEntities } from './modules/entities/entities.routes.js';
import { handleListEvents } from './modules/events/events.routes.js';
import { handleDatabaseHealth, handleHealth } from './modules/health/health.routes.js';
import { handleRegister, handleVerifyEmail, handleLogin, handleLogout, handleMe } from './modules/auth/auth.routes.js';
import { notFound, sendError } from './shared/http.js';
import { logError, logInfo } from './shared/logger.js';

const env = getEnv();

const adminGetRoutes = [
  { path: '/admin/overview', handler: handleAdminOverview },
  { path: '/admin/users', handler: handleAdminUsers },
  { path: '/admin/entities', handler: handleAdminEntities },
  { path: '/admin/reports', handler: handleAdminReports },
  { path: '/admin/moderation', handler: handleAdminModeration },
  { path: '/admin/trust', handler: handleAdminTrust },
  { path: '/admin/billing', handler: handleAdminBilling },
  { path: '/admin/content', handler: handleAdminContent },
  { path: '/admin/localization', handler: handleAdminLocalization },
  { path: '/admin/notifications', handler: handleAdminNotifications },
  { path: '/admin/roles', handler: handleAdminStaffCatalog },
  { path: '/admin/settings', handler: handleAdminSettings },
  { path: '/admin/audit', handler: handleAdminAudit }
];

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

      if (req.method === 'GET') {
        const adminRoute = adminGetRoutes.find((route) => url.pathname === `${env.apiPrefix}${route.path}`);
        if (adminRoute) {
          await adminRoute.handler(req, res);
          return;
        }
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/dev/seed-demo`) {
        await handleDevSeedDemo(req, res, env);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/auth/register`) {
        await handleRegister(req, res, env);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/auth/verify-email`) {
        await handleVerifyEmail(req, res);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/auth/login`) {
        await handleLogin(req, res, env);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/auth/logout`) {
        await handleLogout(req, res, env);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/auth/me`) {
        await handleMe(req, res);
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
