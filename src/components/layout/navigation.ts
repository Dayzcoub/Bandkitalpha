import type { AppContext } from '../../app/types.js';
import { getAsset, type AssetKey } from '../../lib/assets/assetRegistry.js';
import { hasRole } from '../../lib/permissions/permissions.js';
import { canSeeDiagnostics } from '../../lib/permissions/diagnostics.js';

interface NavItem {
  path: string;
  labelKey: string;
  activeIcon: AssetKey;
  inactiveIcon: AssetKey;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
  superAdminOnly?: boolean;
}

export const appNavItems: NavItem[] = [
  { path: '/feed', labelKey: 'nav.feed', activeIcon: 'navFeedActive', inactiveIcon: 'navFeedInactive' },
  { path: '/marketplace', labelKey: 'nav.discover', activeIcon: 'navSearchActive', inactiveIcon: 'navSearchInactive' },
  { path: '/bands', labelKey: 'nav.projects', activeIcon: 'navProjectsActive', inactiveIcon: 'navProjectsInactive' },
  { path: '/events', labelKey: 'nav.events', activeIcon: 'navEventsActive', inactiveIcon: 'navEventsInactive' },
  { path: '/chats', labelKey: 'nav.chats', activeIcon: 'navChatsActive', inactiveIcon: 'navChatsInactive' },
  { path: '/documents', labelKey: 'nav.documents', activeIcon: 'navFilesActive', inactiveIcon: 'navFilesInactive' },
  { path: '/notifications', labelKey: 'nav.notifications', activeIcon: 'navNotificationsActive', inactiveIcon: 'navNotificationsInactive' },
  { path: '/profile/me', labelKey: 'nav.profile', activeIcon: 'navAdminActive', inactiveIcon: 'navMusiciansInactive' },
  { path: '/settings', labelKey: 'nav.settings', activeIcon: 'navSettingsActive', inactiveIcon: 'navSettingsInactive' },
  { path: '/moderation', labelKey: 'nav.moderation', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive', moderatorOnly: true },
  { path: '/admin', labelKey: 'nav.admin', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive', adminOnly: true },
];

export const adminNavItems: NavItem[] = [
  { path: '/admin', labelKey: 'admin.title', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive' },
  { path: '/admin/users', labelKey: 'admin.usersTitle', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive' },
  { path: '/admin/entities', labelKey: 'admin.entitiesTitle', activeIcon: 'navProjectsActive', inactiveIcon: 'navProjectsInactive' },
  { path: '/admin/reports', labelKey: 'admin.reportsTitle', activeIcon: 'navAdminActive', inactiveIcon: 'badgeWarning', moderatorOnly: true },
  { path: '/admin/moderation', labelKey: 'admin.moderationTitle', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive', moderatorOnly: true },
  { path: '/admin/trust', labelKey: 'admin.trustTitle', activeIcon: 'navAdminActive', inactiveIcon: 'badgeWarning' },
  { path: '/admin/billing', labelKey: 'admin.billingTitle', activeIcon: 'navFilesActive', inactiveIcon: 'navFilesInactive', superAdminOnly: true },
  { path: '/admin/content', labelKey: 'admin.contentTitle', activeIcon: 'navFeedActive', inactiveIcon: 'navFeedInactive' },
  { path: '/admin/roles', labelKey: 'admin.rolesTitle', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive', superAdminOnly: true },
  { path: '/admin/localization', labelKey: 'admin.localizationTitle', activeIcon: 'navFilesActive', inactiveIcon: 'navFilesInactive' },
  { path: '/admin/notifications', labelKey: 'admin.notificationsTitle', activeIcon: 'navNotificationsActive', inactiveIcon: 'navNotificationsInactive' },
  { path: '/admin/audit', labelKey: 'admin.auditTitle', activeIcon: 'navFilesActive', inactiveIcon: 'navFilesInactive' },
  { path: '/admin/settings', labelKey: 'admin.settingsTitle', activeIcon: 'navSettingsActive', inactiveIcon: 'navSettingsInactive', superAdminOnly: true },
];

function filteredNavItems(ctx: AppContext, mode: 'app' | 'admin'): NavItem[] {
  const items = mode === 'admin' ? adminNavItems : appNavItems;
  return items
    .filter((item) => !item.adminOnly || hasRole(ctx.state, 'admin'))
    .filter((item) => !item.moderatorOnly || hasRole(ctx.state, 'moderator'))
    .filter((item) => !item.superAdminOnly || hasRole(ctx.state, 'super_admin'));
}

function shouldShowProfileBack(ctx: AppContext): boolean {
  return ctx.path.startsWith('/profile/') && ctx.path !== '/profile/me';
}

function shouldShowChatBack(ctx: AppContext): boolean {
  return ctx.match.route.path === '/chats/:chatId';
}

function shellProfileBackButton(ctx: AppContext, placement: 'desktop' | 'mobile'): string {
  if (!shouldShowProfileBack(ctx)) return '';
  const className = placement === 'mobile' ? 'bk-shell-profile-back bk-shell-profile-back-mobile' : 'bk-shell-profile-back bk-shell-profile-back-desktop';
  return `<button class="bk-button bk-button-ghost ${className}" type="button" data-history-back aria-label="${ctx.t('actions.back')}">← ${ctx.t('actions.back')}</button>`;
}

function mobileChatBackButton(ctx: AppContext): string {
  if (!shouldShowChatBack(ctx)) return '';
  return `<button class="bk-button bk-icon-button bk-mobile-chat-back" type="button" data-route="/chats" aria-label="${ctx.t('chats.title')}"><span aria-hidden="true">←</span></button>`;
}

export function sideNav(ctx: AppContext, mode: 'app' | 'admin'): string {
  const filtered = filteredNavItems(ctx, mode);
  const workspaceDiagnostics = canSeeDiagnostics(ctx) ? `<div class="bk-chip-row"><span class="bk-badge">${mode === 'admin' ? ctx.t('admin.mockMode') : ctx.t('common.mock')}</span></div>` : '';
  const brandRoute = mode === 'admin' ? '/admin' : '/feed';
  const workspaceTitle = mode === 'admin' ? ctx.t('admin.consoleName') : ctx.t('mock.workspaceName');
  return `<aside class="bk-side-nav"><a class="bk-brand-row" href="${brandRoute}" data-route="${brandRoute}"><img class="bk-brand-mark" src="${getAsset('markTile')}" alt="${ctx.t('asset.alt.mark')}" /><img class="bk-brand-logo" src="${getAsset('logoPrimary')}" alt="${ctx.t('asset.alt.logo')}" /></a><nav class="bk-nav-list" aria-label="${ctx.t('common.actions')}">${filtered.map((item) => navLink(ctx, item)).join('')}</nav><div class="bk-nav-spacer"></div><section class="bk-card bk-workspace-card"><div class="bk-meta">${mode === 'admin' ? ctx.t('admin.consoleMode') : ctx.t('common.workspace')}</div><strong>${workspaceTitle}</strong>${workspaceDiagnostics}</section></aside>`;
}

function navLink(ctx: AppContext, item: NavItem): string {
  const active = ctx.path === item.path || (item.path !== '/feed' && ctx.path.startsWith(`${item.path}/`));
  const icon = active ? item.activeIcon : item.inactiveIcon;
  return `<a class="bk-nav-item" href="${item.path}" data-route="${item.path}" ${active ? 'aria-current="page"' : ''}><img class="bk-nav-icon" src="${getAsset(icon)}" alt="" /><span>${ctx.t(item.labelKey)}</span></a>`;
}

export function bottomNav(ctx: AppContext): string {
  if (ctx.match.route.shell === 'admin') {
    const items = filteredNavItems(ctx, 'admin').slice(0, 5);
    return `<nav class="bk-bottom-nav" aria-label="${ctx.t('admin.consoleName')}">${items.map((item) => {
      const active = ctx.path === item.path || (item.path !== '/admin' && ctx.path.startsWith(`${item.path}/`));
      const icon = active ? item.activeIcon : item.inactiveIcon;
      return `<a href="${item.path}" data-route="${item.path}" ${active ? 'aria-current="page"' : ''}><img class="bk-nav-icon" src="${getAsset(icon)}" alt="" /><span>${ctx.t(item.labelKey)}</span></a>`;
    }).join('')}</nav>`;
  }
  const items = [
    appNavItems[0],
    appNavItems[1],
    { path: '/feed', labelKey: 'feed.createPost', activeIcon: 'navFeedActive', inactiveIcon: 'navFeedActive' } as NavItem,
    appNavItems[4],
    appNavItems[7],
  ];
  return `<nav class="bk-bottom-nav" aria-label="${ctx.t('common.actions')}">${items.map((item, index) => {
    const active = index === 2 ? false : ctx.path === item.path || (item.path !== '/feed' && ctx.path.startsWith(`${item.path}/`));
    const icon = active ? item.activeIcon : item.inactiveIcon;
    const createClass = index === 2 ? ' class="bk-bottom-create"' : '';
    return `<a${createClass} href="${item.path}" data-route="${item.path}" ${active ? 'aria-current="page"' : ''}><img class="bk-nav-icon" src="${getAsset(icon)}" alt="" /><span>${ctx.t(item.labelKey)}</span></a>`;
  }).join('')}</nav>`;
}

export function mobileTopBar(ctx: AppContext, mode: 'app' | 'admin' = 'app'): string {
  const brandRoute = mode === 'admin' ? '/admin' : '/feed';
  const brandLabel = mode === 'admin' ? ctx.t('admin.consoleName') : ctx.t('app.name');
  const adminActions = mode === 'admin'
    ? `<button class="bk-button bk-icon-button" data-route="/admin/audit" aria-label="${ctx.t('admin.auditTitle')}"><img class="bk-nav-icon" src="${getAsset('navFilesInactive')}" alt="" /></button>`
    : `<button class="bk-button bk-icon-button" data-route="/marketplace" aria-label="${ctx.t('common.search')}"><img class="bk-nav-icon" src="${getAsset('navSearchInactive')}" alt="" /></button><button class="bk-button bk-icon-button bk-mobile-notification-button" data-route="/notifications" aria-label="${ctx.t('common.notifications')}"><img class="bk-nav-icon" src="${getAsset('navNotificationsInactive')}" alt="" /><span>3</span></button>`;
  return `<header class="bk-mobile-topbar"><a class="bk-mobile-brand" href="${brandRoute}" data-route="${brandRoute}"><img class="bk-brand-mark" src="${getAsset('markTile')}" alt="${ctx.t('asset.alt.mark')}" /><span>${brandLabel}</span></a><div class="bk-mobile-top-actions">${shellProfileBackButton(ctx, 'mobile')}${mobileChatBackButton(ctx)}${adminActions}<button class="bk-button bk-icon-button bk-mobile-menu-trigger" type="button" data-mobile-menu-open aria-label="${ctx.t('common.actions')}"><span aria-hidden="true">☰</span></button></div></header>`;
}

export function mobileMenuDrawer(ctx: AppContext, mode: 'app' | 'admin'): string {
  const filtered = filteredNavItems(ctx, mode);
  const workspaceDiagnostics = canSeeDiagnostics(ctx) ? `<div class="bk-chip-row"><span class="bk-badge">${mode === 'admin' ? ctx.t('admin.mockMode') : ctx.t('common.mock')}</span></div>` : '';
  const menuTitle = mode === 'admin' ? ctx.t('admin.consoleName') : ctx.t('common.workspace');
  const workspaceTitle = mode === 'admin' ? ctx.t('admin.consoleMode') : ctx.t('mock.workspaceName');
  return `<div class="bk-mobile-menu-layer" data-mobile-menu-layer aria-hidden="true"><button class="bk-mobile-menu-backdrop" type="button" data-mobile-menu-close aria-label="${ctx.t('actions.close')}"></button><aside class="bk-mobile-menu-panel" aria-label="${ctx.t('common.actions')}"><div class="bk-mobile-menu-head"><div><div class="bk-meta">${menuTitle}</div><strong>${ctx.t('app.name')}</strong></div><button class="bk-button bk-icon-button" type="button" data-mobile-menu-close aria-label="${ctx.t('actions.close')}">×</button></div><nav class="bk-mobile-menu-list">${filtered.map((item) => navLink(ctx, item)).join('')}</nav><section class="bk-card bk-mobile-menu-workspace"><div class="bk-meta">${menuTitle}</div><strong>${workspaceTitle}</strong>${workspaceDiagnostics}</section></aside></div>`;
}

export function topBar(ctx: AppContext): string {
  if (ctx.match.route.shell === 'admin') {
    const settingsButton = hasRole(ctx.state, 'super_admin') ? `<button class="bk-button bk-button-secondary" data-route="/admin/settings">${ctx.t('admin.settingsTitle')}</button>` : '';
    return `<header class="bk-top-bar"><input class="bk-search" type="search" aria-label="${ctx.t('admin.searchLabel')}" placeholder="${ctx.t('admin.searchPlaceholder')}" /><div class="bk-top-actions"><button class="bk-button bk-button-primary" data-route="/admin/audit">${ctx.t('admin.openAudit')}</button>${settingsButton}<button class="bk-button bk-button-secondary" data-route="/feed">${ctx.t('admin.backToApp')}</button></div></header>`;
  }
  return `<header class="bk-top-bar"><input class="bk-search" type="search" aria-label="${ctx.t('common.search')}" placeholder="${ctx.t('common.searchPlaceholder')}" /><div class="bk-top-actions">${shellProfileBackButton(ctx, 'desktop')}<button class="bk-button bk-button-primary" data-route="/events/new">${ctx.t('events.create')}</button><button class="bk-button bk-button-secondary" data-route="/settings">${ctx.t('nav.settings')}</button><button class="bk-button bk-icon-button" data-route="/notifications" aria-label="${ctx.t('common.notifications')}"><img class="bk-nav-icon" src="${getAsset('navNotificationsInactive')}" alt="" /></button></div></header>`;
}
