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
  { path: '/admin', labelKey: 'nav.admin', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive' },
  { path: '/moderation', labelKey: 'nav.moderation', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive', moderatorOnly: true },
  { path: '/admin/users', labelKey: 'nav.users', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive' },
  { path: '/admin/roles', labelKey: 'nav.roles', activeIcon: 'navAdminActive', inactiveIcon: 'navAdminInactive' },
  { path: '/admin/localization', labelKey: 'nav.localization', activeIcon: 'navFilesActive', inactiveIcon: 'navFilesInactive' },
  { path: '/admin/audit', labelKey: 'nav.audit', activeIcon: 'navFilesActive', inactiveIcon: 'navFilesInactive' },
];

export function sideNav(ctx: AppContext, mode: 'app' | 'admin'): string {
  const items = mode === 'admin' ? adminNavItems : appNavItems;
  const filtered = items.filter((item) => !item.adminOnly || hasRole(ctx.state, 'admin')).filter((item) => !item.moderatorOnly || hasRole(ctx.state, 'moderator'));
  const workspaceDiagnostics = canSeeDiagnostics(ctx) ? `<div class="bk-chip-row"><span class="bk-badge">${ctx.t('common.mock')}</span></div>` : '';
  return `<aside class="bk-side-nav"><a class="bk-brand-row" href="/feed" data-route="/feed"><img class="bk-brand-mark" src="${getAsset('markTile')}" alt="${ctx.t('asset.alt.mark')}" /><img class="bk-brand-logo" src="${getAsset('logoPrimary')}" alt="${ctx.t('asset.alt.logo')}" /></a><nav class="bk-nav-list" aria-label="${ctx.t('common.actions')}">${filtered.map((item) => navLink(ctx, item)).join('')}</nav><div class="bk-nav-spacer"></div><section class="bk-card bk-workspace-card"><div class="bk-meta">${ctx.t('common.workspace')}</div><strong>${ctx.t('mock.workspaceName')}</strong>${workspaceDiagnostics}</section></aside>`;
}

function navLink(ctx: AppContext, item: NavItem): string {
  const active = ctx.path === item.path || (item.path !== '/feed' && ctx.path.startsWith(`${item.path}/`));
  const icon = active ? item.activeIcon : item.inactiveIcon;
  return `<a class="bk-nav-item" href="${item.path}" data-route="${item.path}" ${active ? 'aria-current="page"' : ''}><img class="bk-nav-icon" src="${getAsset(icon)}" alt="" /><span>${ctx.t(item.labelKey)}</span></a>`;
}

export function bottomNav(ctx: AppContext): string {
  const items = [
    appNavItems[0],
    appNavItems[1],
    { path: '/events/new', labelKey: 'nav.events', activeIcon: 'navEventsActive', inactiveIcon: 'navEventsActive' } as NavItem,
    appNavItems[4],
    appNavItems[7],
  ];
  return `<nav class="bk-bottom-nav" aria-label="${ctx.t('common.actions')}">${items.map((item, index) => {
    const active = ctx.path === item.path || (item.path !== '/events/new' && ctx.path.startsWith(`${item.path}/`));
    const icon = active ? item.activeIcon : item.inactiveIcon;
    const createClass = index === 2 ? ' class="bk-bottom-create"' : '';
    return `<a${createClass} href="${item.path}" data-route="${item.path}" ${active ? 'aria-current="page"' : ''}><img class="bk-nav-icon" src="${getAsset(icon)}" alt="" /><span>${ctx.t(item.labelKey)}</span></a>`;
  }).join('')}</nav>`;
}

export function mobileTopBar(ctx: AppContext): string {
  return `<header class="bk-mobile-topbar"><a class="bk-mobile-brand" href="/feed" data-route="/feed"><img class="bk-brand-mark" src="${getAsset('markTile')}" alt="${ctx.t('asset.alt.mark')}" /><span>${ctx.t('app.name')}</span></a><div class="bk-mobile-top-actions"><button class="bk-button bk-icon-button" data-route="/marketplace" aria-label="${ctx.t('common.search')}"><img class="bk-nav-icon" src="${getAsset('navSearchInactive')}" alt="" /></button><button class="bk-button bk-icon-button bk-mobile-notification-button" data-route="/notifications" aria-label="${ctx.t('common.notifications')}"><img class="bk-nav-icon" src="${getAsset('navNotificationsInactive')}" alt="" /><span>3</span></button></div></header>`;
}

export function topBar(ctx: AppContext): string {
  return `<header class="bk-top-bar"><input class="bk-search" type="search" aria-label="${ctx.t('common.search')}" placeholder="${ctx.t('common.searchPlaceholder')}" /><div class="bk-top-actions"><button class="bk-button bk-button-primary" data-route="/feed">${ctx.t('common.quickCreate')}</button><button class="bk-button bk-button-secondary" data-route="/settings">${ctx.t('nav.settings')}</button><button class="bk-button bk-icon-button" data-route="/notifications" aria-label="${ctx.t('common.notifications')}"><img class="bk-nav-icon" src="${getAsset('navNotificationsInactive')}" alt="" /></button></div></header>`;
}