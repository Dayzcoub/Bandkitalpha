// Таблица маршрутов. Единственное место, где написано, что у API вообще есть.
//
// `access` объявляется здесь и обязателен (`router.js`). Значения выведены из кода
// хендлеров, а не назначены по смыслу, и проверяются контрактным тестом
// (`scripts/check-route-contracts.mjs`), который стучится в каждый маршрут без сессии и
// сверяет ответ с объявлением. Объявление, которое никто не проверяет, — это комментарий.
//
// `public` здесь значит ровно «диспетчер не спрашивает сессию», а не «данные публичны»:
// object-level проверки живут в хендлерах. Публичных маршрутов одиннадцать: справочники,
// вход и — единственное исключение — `GET /events/:eventId`, где аноним видит только
// событие с `visibility = 'public'`, и решает это хендлер, а не диспетчер (F1, 0028).
//
// ПОРЯДОК ЗНАЧИМ: выигрывает первое совпадение, как в `if`-цепочке, которую эта таблица
// заменила. Порядок сохранён один в один — он был семантикой, а не оформлением.
import { handleAdminAudit, handleAdminEntities, handleAdminModeration, handleAdminOverview, handleAdminReports, handleAdminTrust, handleAdminUsers } from './modules/admin/admin.routes.js';
import { handleAdminBilling } from './modules/admin/billing.routes.js';
import { handleAdminContent } from './modules/admin/content.routes.js';
import { handleAdminLocalization } from './modules/admin/localization.routes.js';
import { handleAdminNotifications } from './modules/admin/notifications.routes.js';
import { handleAdminSettings } from './modules/admin/settings.routes.js';
import { handleAdminStaffCatalog } from './modules/admin/staff.routes.js';
import { handleListMessages, handleSendMessage, handleListMyRooms, handleGetRoom, handleUpdateMessage, handleDeleteMessage, handleOpenPersonalConversation, handleListConversationRequests, handleDecideConversationRequest, handleGetDmPolicy, handleSetDmPolicy } from './modules/chats/chats.routes.js';
import { handleListDocuments, handleListEntityDocuments, handleCreateEntityDocument } from './modules/documents/documents.routes.js';
import { handleUploadDocumentFile, handleDownloadDocumentFile, handleListDocumentFiles } from './modules/documents/files.routes.js';
import { handleAddEntityMember, handleCreateEntity, handleGetEntity, handleListEntities, handleListMyInvitations, handleDecideInvitation } from './modules/entities/entities.routes.js';
import { handleCreateEvent, handleListEvents, handleGetEvent } from './modules/events/events.routes.js';
import { handleDatabaseHealth, handleHealth } from './modules/health/health.routes.js';
import { handleGetTaxonomy } from './modules/taxonomy/taxonomy.routes.js';
import { handleGetMyProfessions, handleReplaceMyProfessions, handleListPartyCandidates } from './modules/parties/parties.routes.js';
import { handleCreateSlot, handleListSlots, handleCreateEngagement, handleListEngagements, handleUpdateEngagementStatus } from './modules/events/eventOps.routes.js';
import { handleListReliabilityCatalogue, handleRecordReliabilityEvent, handleListReliabilityEvents, handlePartyReliabilitySummary, handleOpenDispute, handleResolveDispute, handleListMyReliability } from './modules/reliability/reliability.routes.js';
import { handleReportCatalogue, handleCreateReport, handleListReports, handleGetReport, handleUpdateReport, handleReportAction } from './modules/moderation/reports.routes.js';
import { handleListPlans, handleGetEntityPlan, handleSetEntityPlan } from './modules/billing/plans.routes.js';
import { handleSubscribe, handleUnsubscribe, handleCreateEntityPost, handleListEntityPosts, handleMyFeed, handleMySubscriptions, handleCreateComment, handleListComments, handleLikePost, handleUnlikePost, handleUpdateSubscription } from './modules/feed/feed.routes.js';
import { handleRegister, handleVerifyEmail, handleLogin, handleLogout, handleMe } from './modules/auth/auth.routes.js';
import { handleEnroll2fa, handleConfirm2fa, handleDisable2fa } from './modules/auth/twofactor.routes.js';
import { handleListNotifications, handleReadNotifications } from './modules/notifications/notifications.routes.js';
import { handleRequestFriendship, handleEndFriendship, handleListFriends, handleListFriendRequests } from './modules/friends/friends.routes.js';

// `env` нужен четырём хендлерам (cookie-флаги и путь к файлам), поэтому таблица — функция.
export function buildRoutes(env) {
  return [
    { method: 'GET', path: '/health', limit: 'none', access: 'public', handler: (req, res) => handleHealth(req, res, env) },
    { method: 'GET', path: '/health/db', limit: 'none', access: 'public', handler: handleDatabaseHealth },

    // Консоль владельца платформы. Гейт здесь стоял с 1.15.2 и был единственным в проекте;
    // теперь он не исключение, а один из трёх уровней.
    { method: 'GET', path: '/admin/overview', limit: 'none', access: 'staff', handler: handleAdminOverview },
    { method: 'GET', path: '/admin/users', limit: 'none', access: 'staff', handler: handleAdminUsers },
    { method: 'GET', path: '/admin/entities', limit: 'none', access: 'staff', handler: handleAdminEntities },
    { method: 'GET', path: '/admin/reports', limit: 'none', access: 'staff', handler: handleAdminReports },
    { method: 'GET', path: '/admin/moderation', limit: 'none', access: 'staff', handler: handleAdminModeration },
    { method: 'GET', path: '/admin/trust', limit: 'none', access: 'staff', handler: handleAdminTrust },
    { method: 'GET', path: '/admin/billing', limit: 'none', access: 'staff', handler: handleAdminBilling },
    { method: 'GET', path: '/admin/content', limit: 'none', access: 'staff', handler: handleAdminContent },
    { method: 'GET', path: '/admin/localization', limit: 'none', access: 'staff', handler: handleAdminLocalization },
    { method: 'GET', path: '/admin/notifications', limit: 'none', access: 'staff', handler: handleAdminNotifications },
    { method: 'GET', path: '/admin/roles', limit: 'none', access: 'staff', handler: handleAdminStaffCatalog },
    { method: 'GET', path: '/admin/settings', limit: 'none', access: 'staff', handler: handleAdminSettings },
    { method: 'GET', path: '/admin/audit', limit: 'none', access: 'staff', handler: handleAdminAudit },

    // ЧЕТЫРЕ ПУТИ НИЖЕ НЕ ОГРАНИЧЕНЫ, И ЭТО НЕ УПУЩЕНИЕ, А СЛЕДСТВИЕ D5.
    //
    // Лимит в MVP считается по актору. У анонимного запроса актора нет — списывать
    // квоту не с кого. Ограничить регистрацию, вход и подтверждение почты можно только
    // по IP/device, а они вынесены в Security Layer следующей фазы (D5).
    //
    // Чем это оплачено, вслух: перебор паролей на `/auth/login` и массовая регистрация
    // ничем не ограничены. Пароли — scrypt, а `timingDecoyHash` уравнивает время ответа
    // для несуществующего пользователя, так что перебор дорог и не даёт оракула
    // существования почты; но «дорого» — не «нельзя». Это не закрывается лимитом по
    // актору ни при каком его значении, и первым потребителем IP-лимитера будет именно
    // этот блок. `clientIp()` к тому дню уже готова (2026-07-16) и говорит правду.
    { method: 'POST', path: '/auth/register', limit: 'none', access: 'public', handler: (req, res) => handleRegister(req, res, env) },
    { method: 'POST', path: '/auth/verify-email', limit: 'none', access: 'public', handler: handleVerifyEmail },
    { method: 'POST', path: '/auth/login', limit: 'none', access: 'public', handler: (req, res) => handleLogin(req, res, env) },
    // Выход работает с токеном напрямую и не требует живой сессии: разлогинить протухшую
    // куку — нормальный сценарий, а не ошибка.
    { method: 'POST', path: '/auth/logout', limit: 'none', access: 'public', handler: (req, res) => handleLogout(req, res, env) },
    { method: 'GET', path: '/auth/me', limit: 'none', access: 'authed', handler: handleMe },
    { method: 'POST', path: '/auth/2fa/enroll', limit: 'write.default', access: 'authed', handler: handleEnroll2fa },
    { method: 'POST', path: '/auth/2fa/confirm', limit: 'write.default', access: 'authed', handler: handleConfirm2fa },
    { method: 'POST', path: '/auth/2fa/disable', limit: 'write.default', access: 'authed', handler: handleDisable2fa },

    { method: 'GET', path: '/plans', limit: 'none', access: 'public', handler: handleListPlans },
    { method: 'GET', path: '/entities/:entityId/plan', limit: 'none', access: 'authed', handler: (req, res, p) => handleGetEntityPlan(req, res, p[0]) },
    { method: 'PUT', path: '/entities/:entityId/plan', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleSetEntityPlan(req, res, p[0]) },

    { method: 'GET', path: '/entities', limit: 'none', access: 'public', handler: handleListEntities },
    { method: 'POST', path: '/entities', limit: 'write.default', access: 'authed', handler: handleCreateEntity },
    { method: 'GET', path: '/entities/:entityId', limit: 'none', access: 'public', handler: (req, res, p) => handleGetEntity(req, res, p[0]) },
    { method: 'POST', path: '/entities/:entityId/members', limit: 'entity.invite', access: 'authed', handler: (req, res, p) => handleAddEntityMember(req, res, p[0]) },
    { method: 'PUT', path: '/entities/:entityId/subscription', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleSubscribe(req, res, p[0]) },
    { method: 'DELETE', path: '/entities/:entityId/subscription', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleUnsubscribe(req, res, p[0]) },
    { method: 'PATCH', path: '/entities/:entityId/subscription', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleUpdateSubscription(req, res, p[0]) },

    { method: 'POST', path: '/posts/:postId/comments', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleCreateComment(req, res, p[0]) },
    { method: 'GET', path: '/posts/:postId/comments', limit: 'none', access: 'public', handler: (req, res, p) => handleListComments(req, res, p[0]) },
    { method: 'PUT', path: '/posts/:postId/like', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleLikePost(req, res, p[0]) },
    { method: 'DELETE', path: '/posts/:postId/like', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleUnlikePost(req, res, p[0]) },
    { method: 'POST', path: '/entities/:entityId/posts', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleCreateEntityPost(req, res, p[0]) },
    { method: 'GET', path: '/entities/:entityId/posts', limit: 'none', access: 'public', handler: (req, res, p) => handleListEntityPosts(req, res, p[0]) },

    { method: 'GET', path: '/me/feed', limit: 'none', access: 'authed', handler: handleMyFeed },
    { method: 'GET', path: '/me/subscriptions', limit: 'none', access: 'authed', handler: handleMySubscriptions },

    { method: 'GET', path: '/events', limit: 'none', access: 'authed', handler: handleListEvents },
    { method: 'POST', path: '/events', limit: 'write.default', access: 'authed', handler: handleCreateEvent },
    // Единственный анонимно достижимый доменный маршрут. Иначе `public` в
    // `events.visibility` не отличался бы от `registered` — значение без поведения
    // (F1, 0028). Гейт объектный, внутри хендлера: аноним видит только `public`.
    { method: 'GET', path: '/events/:eventId', limit: 'none', access: 'public', handler: (req, res, p) => handleGetEvent(req, res, p[0]) },
    { method: 'GET', path: '/events/:eventId/slots', limit: 'none', access: 'authed', handler: (req, res, p) => handleListSlots(req, res, p[0]) },
    { method: 'POST', path: '/events/:eventId/slots', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleCreateSlot(req, res, p[0]) },
    { method: 'GET', path: '/events/:eventId/engagements', limit: 'none', access: 'authed', handler: (req, res, p) => handleListEngagements(req, res, p[0]) },
    { method: 'POST', path: '/events/:eventId/engagements', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleCreateEngagement(req, res, p[0]) },
    { method: 'PATCH', path: '/events/:eventId/engagements/:engagementId', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleUpdateEngagementStatus(req, res, p[0], p[1]) },

    { method: 'GET', path: '/reliability/event-types', limit: 'none', access: 'public', handler: handleListReliabilityCatalogue },
    { method: 'GET', path: '/events/:eventId/engagements/:engagementId/reliability', limit: 'none', access: 'authed', handler: (req, res, p) => handleListReliabilityEvents(req, res, p[0], p[1]) },
    { method: 'POST', path: '/events/:eventId/engagements/:engagementId/reliability', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleRecordReliabilityEvent(req, res, p[0], p[1]) },

    { method: 'POST', path: '/conversations/personal', limit: 'conversation.open', access: 'authed', handler: handleOpenPersonalConversation },

    { method: 'GET', path: '/me/friends', limit: 'none', access: 'authed', handler: handleListFriends },
    { method: 'GET', path: '/me/friend-requests', limit: 'none', access: 'authed', handler: handleListFriendRequests },
    { method: 'POST', path: '/me/friends/:userId', limit: 'friend.request', access: 'authed', handler: (req, res, p) => handleRequestFriendship(req, res, p[0]) },
    { method: 'DELETE', path: '/me/friends/:userId', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleEndFriendship(req, res, p[0]) },

    { method: 'GET', path: '/me/notifications', limit: 'none', access: 'authed', handler: handleListNotifications },
    { method: 'POST', path: '/me/notifications/read', limit: 'write.default', access: 'authed', handler: handleReadNotifications },
    { method: 'POST', path: '/me/notifications/:notificationId/read', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleReadNotifications(req, res, p[0]) },

    { method: 'GET', path: '/me/invitations', limit: 'none', access: 'authed', handler: handleListMyInvitations },
    { method: 'POST', path: '/me/invitations/:entityId/:decision(accept|decline)', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleDecideInvitation(req, res, p[0], p[1]) },

    { method: 'GET', path: '/me/conversation-requests', limit: 'none', access: 'authed', handler: handleListConversationRequests },
    { method: 'POST', path: '/conversations/:roomId/request/:decision(accept|reject)', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleDecideConversationRequest(req, res, p[0], p[1]) },

    { method: 'GET', path: '/me/dm-policy', limit: 'none', access: 'authed', handler: handleGetDmPolicy },
    { method: 'PUT', path: '/me/dm-policy', limit: 'write.default', access: 'authed', handler: handleSetDmPolicy },

    { method: 'GET', path: '/me/chat-rooms', limit: 'none', access: 'authed', handler: handleListMyRooms },
    { method: 'GET', path: '/chat-rooms/:roomId/messages', limit: 'none', access: 'authed', handler: (req, res, p) => handleListMessages(req, res, p[0]) },
    { method: 'POST', path: '/chat-rooms/:roomId/messages', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleSendMessage(req, res, p[0]) },
    { method: 'PATCH', path: '/chat-rooms/:roomId/messages/:messageId', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleUpdateMessage(req, res, p[0], p[1]) },
    { method: 'DELETE', path: '/chat-rooms/:roomId/messages/:messageId', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleDeleteMessage(req, res, p[0], p[1]) },
    { method: 'GET', path: '/chat-rooms/:roomId', limit: 'none', access: 'authed', handler: (req, res, p) => handleGetRoom(req, res, p[0]) },

    { method: 'GET', path: '/entities/:entityId/documents', limit: 'none', access: 'authed', handler: (req, res, p) => handleListEntityDocuments(req, res, p[0]) },
    { method: 'POST', path: '/entities/:entityId/documents', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleCreateEntityDocument(req, res, p[0]) },
    { method: 'GET', path: '/documents', limit: 'none', access: 'authed', handler: handleListDocuments },
    { method: 'POST', path: '/documents/:documentId/file', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleUploadDocumentFile(req, res, env, p[0]) },
    { method: 'GET', path: '/documents/:documentId/file', limit: 'none', access: 'authed', handler: (req, res, p) => handleDownloadDocumentFile(req, res, env, p[0]) },
    { method: 'GET', path: '/documents/:documentId/files', limit: 'none', access: 'authed', handler: (req, res, p) => handleListDocumentFiles(req, res, p[0]) },

    { method: 'GET', path: '/taxonomy', limit: 'none', access: 'public', handler: handleGetTaxonomy },

    { method: 'GET', path: '/parties/candidates', limit: 'none', access: 'authed', handler: handleListPartyCandidates },
    { method: 'GET', path: '/parties/:partyId/reliability-summary', limit: 'none', access: 'authed', handler: (req, res, p) => handlePartyReliabilitySummary(req, res, p[0]) },

    { method: 'POST', path: '/reliability-events/:reliabilityEventId/dispute', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleOpenDispute(req, res, p[0]) },
    { method: 'PATCH', path: '/reliability-events/:reliabilityEventId/dispute', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleResolveDispute(req, res, p[0]) },

    { method: 'GET', path: '/moderation/report-catalogue', limit: 'none', access: 'public', handler: handleReportCatalogue },
    { method: 'POST', path: '/reports', limit: 'write.default', access: 'authed', handler: handleCreateReport },
    { method: 'GET', path: '/reports', limit: 'none', access: 'authed', handler: handleListReports },
    { method: 'POST', path: '/reports/:reportId/actions', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleReportAction(req, res, p[0]) },
    { method: 'GET', path: '/reports/:reportId', limit: 'none', access: 'authed', handler: (req, res, p) => handleGetReport(req, res, p[0]) },
    { method: 'PATCH', path: '/reports/:reportId', limit: 'write.default', access: 'authed', handler: (req, res, p) => handleUpdateReport(req, res, p[0]) },

    { method: 'GET', path: '/me/reliability', limit: 'none', access: 'authed', handler: handleListMyReliability },
    { method: 'GET', path: '/me/professions', limit: 'none', access: 'authed', handler: handleGetMyProfessions },
    { method: 'PUT', path: '/me/professions', limit: 'write.default', access: 'authed', handler: handleReplaceMyProfessions }
  ];
}
