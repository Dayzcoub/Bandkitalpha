import http from 'node:http';
import { getEnv } from './config/env.js';
import { handleAdminAudit, handleAdminEntities, handleAdminModeration, handleAdminOverview, handleAdminReports, handleAdminTrust, handleAdminUsers } from './modules/admin/admin.routes.js';
import { handleAdminBilling } from './modules/admin/billing.routes.js';
import { handleAdminContent } from './modules/admin/content.routes.js';
import { handleAdminLocalization } from './modules/admin/localization.routes.js';
import { handleAdminNotifications } from './modules/admin/notifications.routes.js';
import { handleAdminSettings } from './modules/admin/settings.routes.js';
import { handleAdminStaffCatalog } from './modules/admin/staff.routes.js';
import { handleListChatRooms, handleListMessages, handleSendMessage, handleListMyRooms, handleGetRoom, handleUpdateMessage, handleDeleteMessage } from './modules/chats/chats.routes.js';
import { handleDevSeedDemo } from './modules/dev/dev.routes.js';
import { handleListDocuments, handleListEntityDocuments, handleCreateEntityDocument } from './modules/documents/documents.routes.js';
import { handleAddEntityMember, handleCreateEntity, handleGetEntity, handleListEntities } from './modules/entities/entities.routes.js';
import { handleCreateEvent, handleListEvents } from './modules/events/events.routes.js';
import { handleDatabaseHealth, handleHealth } from './modules/health/health.routes.js';
import { handleGetTaxonomy } from './modules/taxonomy/taxonomy.routes.js';
import { handleGetMyProfessions, handleReplaceMyProfessions, handleListPartyCandidates } from './modules/parties/parties.routes.js';
import { handleCreateSlot, handleListSlots, handleCreateEngagement, handleListEngagements, handleUpdateEngagementStatus } from './modules/events/eventOps.routes.js';
import { handleListReliabilityCatalogue, handleRecordReliabilityEvent, handleListReliabilityEvents, handlePartyReliabilitySummary, handleOpenDispute, handleResolveDispute, handleListMyReliability } from './modules/reliability/reliability.routes.js';
import { handleReportCatalogue, handleCreateReport, handleListReports, handleGetReport, handleUpdateReport, handleReportAction } from './modules/moderation/reports.routes.js';
import { handleSubscribe, handleUnsubscribe, handleCreateEntityPost, handleListEntityPosts, handleMyFeed, handleMySubscriptions, handleCreateComment, handleListComments, handleLikePost, handleUnlikePost, handleUpdateSubscription } from './modules/feed/feed.routes.js';
import { handleRegister, handleVerifyEmail, handleLogin, handleLogout, handleMe } from './modules/auth/auth.routes.js';
import { handleEnroll2fa, handleConfirm2fa, handleDisable2fa } from './modules/auth/twofactor.routes.js';
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
      const entityMembersMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/entities/([^/]+)/members$`));
      const eventSlotsMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/events/([^/]+)/slots$`));
      const eventEngagementsMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/events/([^/]+)/engagements$`));
      const eventEngagementDetailMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/events/([^/]+)/engagements/([^/]+)$`));
      const engagementReliabilityMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/events/([^/]+)/engagements/([^/]+)/reliability$`));
      const partyReliabilitySummaryMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/parties/([^/]+)/reliability-summary$`));
      const reliabilityDisputeMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/reliability-events/([^/]+)/dispute$`));
      const reportDetailMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/reports/([^/]+)$`));
      const reportActionsMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/reports/([^/]+)/actions$`));
      const entitySubscriptionMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/entities/([^/]+)/subscription$`));
      const entityPostsMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/entities/([^/]+)/posts$`));
      const postCommentsMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/posts/([^/]+)/comments$`));
      const postLikeMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/posts/([^/]+)/like$`));
      const roomMessagesMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/chat-rooms/([^/]+)/messages$`));
      const roomDetailMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/chat-rooms/([^/]+)$`));
      const roomMessageDetailMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/chat-rooms/([^/]+)/messages/([^/]+)$`));
      const entityDocumentsMatch = url.pathname.match(new RegExp(`^${env.apiPrefix}/entities/([^/]+)/documents$`));

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

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/auth/2fa/enroll`) {
        await handleEnroll2fa(req, res);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/auth/2fa/confirm`) {
        await handleConfirm2fa(req, res);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/auth/2fa/disable`) {
        await handleDisable2fa(req, res);
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

      if (req.method === 'POST' && entityMembersMatch) {
        await handleAddEntityMember(req, res, decodeURIComponent(entityMembersMatch[1]));
        return;
      }

      if (req.method === 'PUT' && entitySubscriptionMatch) {
        await handleSubscribe(req, res, decodeURIComponent(entitySubscriptionMatch[1]));
        return;
      }

      if (req.method === 'DELETE' && entitySubscriptionMatch) {
        await handleUnsubscribe(req, res, decodeURIComponent(entitySubscriptionMatch[1]));
        return;
      }

      if (req.method === 'PATCH' && entitySubscriptionMatch) {
        await handleUpdateSubscription(req, res, decodeURIComponent(entitySubscriptionMatch[1]));
        return;
      }

      if (req.method === 'POST' && postCommentsMatch) {
        await handleCreateComment(req, res, decodeURIComponent(postCommentsMatch[1]));
        return;
      }

      if (req.method === 'GET' && postCommentsMatch) {
        await handleListComments(req, res, decodeURIComponent(postCommentsMatch[1]));
        return;
      }

      if (req.method === 'PUT' && postLikeMatch) {
        await handleLikePost(req, res, decodeURIComponent(postLikeMatch[1]));
        return;
      }

      if (req.method === 'DELETE' && postLikeMatch) {
        await handleUnlikePost(req, res, decodeURIComponent(postLikeMatch[1]));
        return;
      }

      if (req.method === 'POST' && entityPostsMatch) {
        await handleCreateEntityPost(req, res, decodeURIComponent(entityPostsMatch[1]));
        return;
      }

      if (req.method === 'GET' && entityPostsMatch) {
        await handleListEntityPosts(req, res, decodeURIComponent(entityPostsMatch[1]));
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/me/feed`) {
        await handleMyFeed(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/me/subscriptions`) {
        await handleMySubscriptions(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/events`) {
        await handleListEvents(req, res);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/events`) {
        await handleCreateEvent(req, res);
        return;
      }

      if (req.method === 'GET' && eventSlotsMatch) {
        await handleListSlots(req, res, decodeURIComponent(eventSlotsMatch[1]));
        return;
      }

      if (req.method === 'POST' && eventSlotsMatch) {
        await handleCreateSlot(req, res, decodeURIComponent(eventSlotsMatch[1]));
        return;
      }

      if (req.method === 'GET' && eventEngagementsMatch) {
        await handleListEngagements(req, res, decodeURIComponent(eventEngagementsMatch[1]));
        return;
      }

      if (req.method === 'POST' && eventEngagementsMatch) {
        await handleCreateEngagement(req, res, decodeURIComponent(eventEngagementsMatch[1]));
        return;
      }

      if (req.method === 'PATCH' && eventEngagementDetailMatch) {
        await handleUpdateEngagementStatus(req, res, decodeURIComponent(eventEngagementDetailMatch[1]), decodeURIComponent(eventEngagementDetailMatch[2]));
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/reliability/event-types`) {
        await handleListReliabilityCatalogue(req, res);
        return;
      }

      if (req.method === 'GET' && engagementReliabilityMatch) {
        await handleListReliabilityEvents(req, res, decodeURIComponent(engagementReliabilityMatch[1]), decodeURIComponent(engagementReliabilityMatch[2]));
        return;
      }

      if (req.method === 'POST' && engagementReliabilityMatch) {
        await handleRecordReliabilityEvent(req, res, decodeURIComponent(engagementReliabilityMatch[1]), decodeURIComponent(engagementReliabilityMatch[2]));
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/chat-rooms`) {
        await handleListChatRooms(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/me/chat-rooms`) {
        await handleListMyRooms(req, res);
        return;
      }

      if (req.method === 'GET' && roomMessagesMatch) {
        await handleListMessages(req, res, decodeURIComponent(roomMessagesMatch[1]));
        return;
      }

      if (req.method === 'GET' && entityDocumentsMatch) {
        await handleListEntityDocuments(req, res, decodeURIComponent(entityDocumentsMatch[1]));
        return;
      }

      if (req.method === 'POST' && entityDocumentsMatch) {
        await handleCreateEntityDocument(req, res, decodeURIComponent(entityDocumentsMatch[1]));
        return;
      }

      if (req.method === 'POST' && roomMessagesMatch) {
        await handleSendMessage(req, res, decodeURIComponent(roomMessagesMatch[1]));
        return;
      }

      if (req.method === 'PATCH' && roomMessageDetailMatch) {
        await handleUpdateMessage(req, res, decodeURIComponent(roomMessageDetailMatch[1]), decodeURIComponent(roomMessageDetailMatch[2]));
        return;
      }

      if (req.method === 'DELETE' && roomMessageDetailMatch) {
        await handleDeleteMessage(req, res, decodeURIComponent(roomMessageDetailMatch[1]), decodeURIComponent(roomMessageDetailMatch[2]));
        return;
      }

      if (req.method === 'GET' && roomDetailMatch) {
        await handleGetRoom(req, res, decodeURIComponent(roomDetailMatch[1]));
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/documents`) {
        await handleListDocuments(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/taxonomy`) {
        await handleGetTaxonomy(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/parties/candidates`) {
        await handleListPartyCandidates(req, res);
        return;
      }

      if (req.method === 'GET' && partyReliabilitySummaryMatch) {
        await handlePartyReliabilitySummary(req, res, decodeURIComponent(partyReliabilitySummaryMatch[1]));
        return;
      }

      if (req.method === 'POST' && reliabilityDisputeMatch) {
        await handleOpenDispute(req, res, decodeURIComponent(reliabilityDisputeMatch[1]));
        return;
      }

      if (req.method === 'PATCH' && reliabilityDisputeMatch) {
        await handleResolveDispute(req, res, decodeURIComponent(reliabilityDisputeMatch[1]));
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/moderation/report-catalogue`) {
        await handleReportCatalogue(req, res);
        return;
      }

      if (req.method === 'POST' && url.pathname === `${env.apiPrefix}/reports`) {
        await handleCreateReport(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/reports`) {
        await handleListReports(req, res);
        return;
      }

      if (req.method === 'POST' && reportActionsMatch) {
        await handleReportAction(req, res, decodeURIComponent(reportActionsMatch[1]));
        return;
      }

      if (req.method === 'GET' && reportDetailMatch) {
        await handleGetReport(req, res, decodeURIComponent(reportDetailMatch[1]));
        return;
      }

      if (req.method === 'PATCH' && reportDetailMatch) {
        await handleUpdateReport(req, res, decodeURIComponent(reportDetailMatch[1]));
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/me/reliability`) {
        await handleListMyReliability(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === `${env.apiPrefix}/me/professions`) {
        await handleGetMyProfessions(req, res);
        return;
      }

      if (req.method === 'PUT' && url.pathname === `${env.apiPrefix}/me/professions`) {
        await handleReplaceMyProfessions(req, res);
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
