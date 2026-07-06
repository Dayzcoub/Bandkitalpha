import type { RouteDefinition, RouteMatch } from './types.js';

export const routes: RouteDefinition[] = [
  { path: '/', shell: 'public', access: 'any', titleKey: 'app.name', subtitleKey: 'app.tagline', section: 'public', exact: true, wide: true },
  { path: '/login', shell: 'auth', access: 'guest', titleKey: 'auth.login.title', subtitleKey: 'auth.login.subtitle', section: 'auth', exact: true, wide: true },
  { path: '/register', shell: 'auth', access: 'guest', titleKey: 'auth.register.title', subtitleKey: 'auth.register.subtitle', section: 'auth', exact: true, wide: true },
  { path: '/auth/verify-email', shell: 'auth', access: 'pending', titleKey: 'auth.verifyEmail.title', subtitleKey: 'auth.verifyEmail.subtitle', section: 'auth', exact: true, wide: true },
  { path: '/auth/verify-phone', shell: 'auth', access: 'pending', titleKey: 'auth.verifyPhone.title', subtitleKey: 'auth.verifyPhone.subtitle', section: 'auth', exact: true, wide: true },
  { path: '/auth/2fa', shell: 'auth', access: 'pending', titleKey: 'auth.twoFactor.title', subtitleKey: 'auth.twoFactor.subtitle', section: 'auth', exact: true, wide: true },
  { path: '/auth/recovery', shell: 'auth', access: 'guest', titleKey: 'auth.recovery.title', subtitleKey: 'auth.recovery.subtitle', section: 'auth', exact: true, wide: true },
  { path: '/onboarding', shell: 'app', access: 'user', titleKey: 'profile.title', subtitleKey: 'auth.securityHint', navKey: 'nav.profile', iconKey: 'navMusiciansInactive', section: 'app', exact: true },
  { path: '/feed', shell: 'app', access: 'user', titleKey: 'feed.title', subtitleKey: 'feed.subtitle', navKey: 'nav.feed', iconKey: 'navFeedInactive', section: 'app', exact: true },
  { path: '/profile/me', shell: 'app', access: 'user', titleKey: 'profile.meTitle', subtitleKey: 'profile.subtitle', navKey: 'nav.profile', iconKey: 'navMusiciansInactive', section: 'app', exact: true },
  { path: '/profile/:profileId', shell: 'app', access: 'any', titleKey: 'profile.title', subtitleKey: 'profile.subtitle', navKey: 'nav.profile', iconKey: 'navMusiciansInactive', section: 'app', exact: true },
  { path: '/bands', shell: 'app', access: 'user', titleKey: 'bands.title', subtitleKey: 'bands.subtitle', navKey: 'nav.projects', iconKey: 'navProjectsInactive', section: 'app', exact: true },
  { path: '/bands/new', shell: 'app', access: 'verified', titleKey: 'bands.create', subtitleKey: 'bands.subtitle', navKey: 'nav.projects', iconKey: 'navProjectsInactive', section: 'app', exact: true },
  { path: '/bands/:bandId', shell: 'app', access: 'any', titleKey: 'bands.detailTitle', subtitleKey: 'bands.subtitle', navKey: 'nav.projects', iconKey: 'navProjectsInactive', section: 'app', exact: true },
  { path: '/bands/:bandId/settings', shell: 'app', access: 'band_admin', titleKey: 'bands.settingsTitle', subtitleKey: 'common.permissions', navKey: 'nav.projects', iconKey: 'navSettingsInactive', section: 'app', exact: true },
  { path: '/events', shell: 'app', access: 'user', titleKey: 'events.title', subtitleKey: 'events.subtitle', navKey: 'nav.events', iconKey: 'navEventsInactive', section: 'app', exact: true },
  { path: '/events/new', shell: 'app', access: 'verified', titleKey: 'events.create', subtitleKey: 'events.subtitle', navKey: 'nav.events', iconKey: 'navEventsInactive', section: 'app', exact: true },
  { path: '/events/:eventId', shell: 'app', access: 'any', titleKey: 'events.detailTitle', subtitleKey: 'events.subtitle', navKey: 'nav.events', iconKey: 'navEventsInactive', section: 'app', exact: true },
  { path: '/events/:eventId/settings', shell: 'app', access: 'event_admin', titleKey: 'events.settingsTitle', subtitleKey: 'common.permissions', navKey: 'nav.events', iconKey: 'navSettingsInactive', section: 'app', exact: true },
  { path: '/chats', shell: 'app', access: 'user', titleKey: 'chats.title', subtitleKey: 'chats.subtitle', navKey: 'nav.chats', iconKey: 'navChatsInactive', section: 'app', exact: true },
  { path: '/chats/:chatId', shell: 'app', access: 'user', titleKey: 'chats.roomTitle', subtitleKey: 'chats.subtitle', navKey: 'nav.chats', iconKey: 'navChatsInactive', section: 'app', exact: true },
  { path: '/documents', shell: 'app', access: 'user', titleKey: 'documents.title', subtitleKey: 'documents.subtitle', navKey: 'nav.documents', iconKey: 'navFilesInactive', section: 'app', exact: true },
  { path: '/documents/:documentId', shell: 'app', access: 'user', titleKey: 'documents.detailTitle', subtitleKey: 'documents.subtitle', navKey: 'nav.documents', iconKey: 'navFilesInactive', section: 'app', exact: true },
  { path: '/marketplace', shell: 'app', access: 'verified', titleKey: 'marketplace.title', subtitleKey: 'marketplace.subtitle', navKey: 'nav.marketplace', iconKey: 'navSearchInactive', section: 'app', exact: true },
  { path: '/notifications', shell: 'app', access: 'user', titleKey: 'notifications.title', subtitleKey: 'notifications.subtitle', navKey: 'nav.notifications', iconKey: 'navNotificationsInactive', section: 'app', exact: true },
  { path: '/settings', shell: 'app', access: 'user', titleKey: 'settings.title', subtitleKey: 'settings.subtitle', navKey: 'nav.settings', iconKey: 'navSettingsInactive', section: 'app', exact: true },
  { path: '/settings/security', shell: 'app', access: 'user', titleKey: 'settings.securityTitle', subtitleKey: 'common.security', navKey: 'nav.settings', iconKey: 'navSettingsInactive', section: 'app', exact: true },
  { path: '/settings/i18n', shell: 'app', access: 'user', titleKey: 'settings.i18nTitle', subtitleKey: 'settings.subtitle', navKey: 'nav.settings', iconKey: 'navSettingsInactive', section: 'app', exact: true },
  { path: '/complaints/new', shell: 'app', access: 'verified', titleKey: 'actions.report', subtitleKey: 'moderation.subtitle', navKey: 'nav.moderation', iconKey: 'badgeWarning', section: 'app', exact: true },
  { path: '/moderation', shell: 'admin', access: 'moderator', titleKey: 'moderation.title', subtitleKey: 'moderation.subtitle', navKey: 'nav.moderation', iconKey: 'navAdminInactive', section: 'admin', exact: true },
  { path: '/moderation/complaints/:complaintId', shell: 'admin', access: 'moderator', titleKey: 'moderation.caseTitle', subtitleKey: 'moderation.subtitle', navKey: 'nav.moderation', iconKey: 'badgeWarning', section: 'admin', exact: true },
  { path: '/admin', shell: 'admin', access: 'admin', titleKey: 'admin.title', subtitleKey: 'admin.subtitle', navKey: 'nav.admin', iconKey: 'navAdminInactive', section: 'admin', exact: true },
  { path: '/admin/users', shell: 'admin', access: 'admin', titleKey: 'admin.usersTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.users', iconKey: 'navAdminInactive', section: 'admin', exact: true },
  { path: '/admin/entities', shell: 'admin', access: 'admin', titleKey: 'admin.entitiesTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.entities', iconKey: 'navProjectsInactive', section: 'admin', exact: true },
  { path: '/admin/reports', shell: 'admin', access: 'moderator', titleKey: 'admin.reportsTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.reports', iconKey: 'badgeWarning', section: 'admin', exact: true },
  { path: '/admin/moderation', shell: 'admin', access: 'moderator', titleKey: 'admin.moderationTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.moderation', iconKey: 'navAdminInactive', section: 'admin', exact: true },
  { path: '/admin/trust', shell: 'admin', access: 'admin', titleKey: 'admin.trustTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.security', iconKey: 'badgeWarning', section: 'admin', exact: true },
  { path: '/admin/billing', shell: 'admin', access: 'super_admin', titleKey: 'admin.billingTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.billing', iconKey: 'navFilesInactive', section: 'admin', exact: true },
  { path: '/admin/content', shell: 'admin', access: 'admin', titleKey: 'admin.contentTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.content', iconKey: 'navFeedInactive', section: 'admin', exact: true },
  { path: '/admin/roles', shell: 'admin', access: 'super_admin', titleKey: 'admin.rolesTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.roles', iconKey: 'navAdminInactive', section: 'admin', exact: true },
  { path: '/admin/localization', shell: 'admin', access: 'admin', titleKey: 'admin.localizationTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.localization', iconKey: 'navFilesInactive', section: 'admin', exact: true },
  { path: '/admin/notifications', shell: 'admin', access: 'admin', titleKey: 'admin.notificationsTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.notifications', iconKey: 'navNotificationsInactive', section: 'admin', exact: true },
  { path: '/admin/audit', shell: 'admin', access: 'admin', titleKey: 'admin.auditTitle', subtitleKey: 'common.audit', navKey: 'nav.audit', iconKey: 'navFilesInactive', section: 'admin', exact: true },
  { path: '/admin/settings', shell: 'admin', access: 'super_admin', titleKey: 'admin.settingsTitle', subtitleKey: 'admin.subtitle', navKey: 'nav.settings', iconKey: 'navSettingsInactive', section: 'admin', exact: true },
  { path: '/admin/support', shell: 'admin', access: 'admin', titleKey: 'admin.supportTitle', subtitleKey: 'admin.subtitle', navKey: 'admin.supportTitle', iconKey: 'navChatsInactive', section: 'admin', exact: true },
  { path: '/admin/system', shell: 'admin', access: 'super_admin', titleKey: 'admin.systemTitle', subtitleKey: 'admin.subtitle', navKey: 'admin.systemTitle', iconKey: 'navFilesInactive', section: 'admin', exact: true },
  { path: '/admin/staff', shell: 'admin', access: 'super_admin', titleKey: 'admin.staffTitle', subtitleKey: 'admin.subtitle', navKey: 'admin.staffTitle', iconKey: 'navAdminInactive', section: 'admin', exact: true },
];

const notFoundRoute: RouteDefinition = { path: '*', shell: 'public', access: 'any', titleKey: 'state.notFoundTitle', subtitleKey: 'state.notFoundCopy', section: 'public', exact: true, wide: true };

export function matchRoute(pathname: string): RouteMatch {
  const clean = normalizePath(pathname);
  for (const route of routes) {
    const params = matchPattern(route.path, clean);
    if (params) return { route, params };
  }
  return { route: notFoundRoute, params: {} };
}

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '') return '/';
  const withoutHash = pathname.split('#')[0]?.split('?')[0] ?? '/';
  const normalized = withoutHash.endsWith('/') && withoutHash.length > 1 ? withoutHash.slice(0, -1) : withoutHash;
  return normalized || '/';
}

function matchPattern(pattern: string, path: string): Record<string, string> | null {
  if (pattern === '*') return {};
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (pattern === '/' && path === '/') return {};
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i];
    const actual = pathParts[i];
    if (!expected || !actual) return null;
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}
