import type { AppContext, Role, VerificationMode, UiStateMode, ThemeMode, Locale } from '../../app/types.js';
import { routes } from '../../app/router.js';
import { card, kpi, badge, listRow, button, img } from '../ui/primitives.js';
import { canAccess } from '../../lib/permissions/permissions.js';
import { escapeHtml } from '../../lib/security/linkPolicy.js';
import { events, trustChecks, profiles } from '../../mocks/mockData.js';
import { trustCheckCard } from './cards.js';
import { formatDateTime } from '../../lib/format/format.js';

export function defaultRightRail(ctx: AppContext): string {
  return [
    profileRailCard(ctx),
    reliabilityRailCard(ctx),
    securityRailCard(ctx),
    workspaceRailCard(ctx),
    qaControlCard(ctx),
  ].join('');
}

export function routeInspector(ctx: AppContext): string {
  const accessOk = canAccess(ctx.match.route.access, ctx.state);
  return card(`<h3 class="bk-card-title">${ctx.t('rightRail.title')}</h3><p class="bk-state-copy">${ctx.t('common.layoutNotice')}</p><div class="bk-kpi-grid bk-kpi-grid-compact">${kpi(ctx.t(`shell.${ctx.match.route.shell}`), ctx.t('qa.shell'))}${kpi(ctx.t(`access.${ctx.match.route.access}`), ctx.t('qa.access'))}${kpi(accessOk ? ctx.t('qa.allowed') : ctx.t('qa.blocked'), ctx.t('qa.guard'))}</div>`, 'bk-rail-card');
}

export function profileRailCard(ctx: AppContext): string {
  const profile = profiles[0];
  return card(`<div class="bk-rail-card-head"><h3 class="bk-card-title">${ctx.t('rightRail.profile')}</h3><button class="bk-rail-close" type="button" aria-label="${ctx.t('actions.close')}">×</button></div><div class="bk-rail-profile-row">${img(profile.avatar, 'bk-avatar bk-avatar-lg', ctx.t('asset.alt.avatar'))}<div><h3 class="bk-card-title">${escapeHtml(profile.name)}</h3><div class="bk-meta">${ctx.t(profile.roleKey)} · ${escapeHtml(profile.city)}</div><div class="bk-chip-row">${badge(ctx.t(profile.availabilityKey), 'positive')}</div></div></div><div class="bk-action-row">${button(ctx.t('profile.openProfile'), 'ghost', '/profile/me')}</div>`, 'bk-rail-card bk-profile-rail-card');
}

export function reliabilityRailCard(ctx: AppContext): string {
  return card(`<div class="bk-rail-card-head"><h3 class="bk-card-title">${ctx.t('rightRail.reliability')}</h3>${badge(ctx.t('badge.trusted'), 'positive')}</div><div class="bk-rating-row"><span class="bk-rating-value">4.8</span><span class="bk-rating-star">★</span><span class="bk-meta">${ctx.t('rightRail.excellent')}</span></div><div class="bk-progress"><span></span></div><div class="bk-mini-stat-list"><div><span>${ctx.t('rightRail.finishedEvents')}</span><strong>37</strong></div><div><span>${ctx.t('rightRail.punctuality')}</span><strong>96%</strong></div><div><span>${ctx.t('rightRail.penalties')}</span><strong>0</strong></div><div><span>${ctx.t('rightRail.cancellations')}</span><strong>1</strong></div></div>`, 'bk-rail-card bk-reliability-card');
}

export function workspaceRailCard(ctx: AppContext): string {
  const upcoming = events.slice(0, 2).map((event) => listRow(ctx.t(event.titleKey), `${ctx.t(event.typeKey)} · ${formatDateTime(event.startsAt, ctx.state.locale)}`, event.cover)).join('');
  return card(`<div class="bk-rail-card-head"><h3 class="bk-card-title">${ctx.t('rightRail.upcoming')}</h3><button class="bk-rail-close" type="button" aria-label="${ctx.t('actions.close')}">×</button></div><div class="bk-list">${upcoming}</div>`, 'bk-rail-card');
}

export function qaControlCard(ctx: AppContext): string {
  return card(`<details class="bk-qa-details"><summary>${ctx.t('rightRail.qa')}</summary><p class="bk-state-copy">${ctx.t('qa.controlsCopy')}</p><div class="bk-qa-grid">${select(ctx, 'locale', ctx.t('common.language'), ['ru', 'en'], ctx.state.locale)}${select(ctx, 'role', ctx.t('common.role'), ['guest', 'user', 'moderator', 'admin', 'super_admin'], ctx.state.role)}${select(ctx, 'verification', ctx.t('common.security'), ['verified', 'emailPending', 'phonePending', 'twoFactorRequired', 'restrictedAccount'], ctx.state.verification)}${select(ctx, 'uiState', ctx.t('common.state'), ['normal', 'loading', 'empty', 'error', 'restricted', 'long'], ctx.state.uiState)}${select(ctx, 'theme', ctx.t('common.theme'), ['dark', 'light'], ctx.state.theme)}</div></details>`, 'bk-rail-card bk-qa-card');
}

function select(
  ctx: AppContext,
  pref: 'locale' | 'role' | 'verification' | 'uiState' | 'theme',
  label: string,
  values: Array<Locale | Role | VerificationMode | UiStateMode | ThemeMode>,
  current: string,
): string {
  const options = values.map((value) => `<option value="${escapeHtml(value)}" ${current === value ? 'selected' : ''}>${ctx.t(optionKey(pref, value))}</option>`).join('');
  return `<label class="bk-field"><span class="bk-label">${escapeHtml(label)}</span><select class="bk-select" data-pref="${pref}" aria-label="${escapeHtml(label)}">${options}</select></label>`;
}

function optionKey(pref: string, value: string): string {
  if (pref === 'locale') return `locale.${value}`;
  if (pref === 'role') return `role.${value}`;
  if (pref === 'verification') return `verification.${value}`;
  if (pref === 'uiState') return `state.${value}`;
  if (pref === 'theme') return `theme.${value}`;
  return value;
}

export function safetyRailCard(ctx: AppContext): string {
  return card(`<h3 class="bk-card-title">${ctx.t('rightRail.safetyTitle')}</h3><div class="bk-trust-list">${trustChecks.map((check) => trustCheckCard(ctx, check)).join('')}</div><div class="bk-chip-row">${badge(ctx.t('security.auditReady'), 'positive')}${badge(ctx.t('security.reportAvailable'), 'warning')}</div>`, 'bk-rail-card');
}

export function securityRailCard(ctx: AppContext): string {
  return card(`<div class="bk-rail-card-head"><h3 class="bk-card-title">${ctx.t('rightRail.securityTitle')}</h3><button class="bk-rail-close" type="button" aria-label="${ctx.t('actions.close')}">×</button></div><div class="bk-security-list"><div>${badge(ctx.t('badge.email'), 'positive')}<span>${ctx.t('security.emailConfirmed')}</span></div><div>${badge(ctx.t('badge.phone'), 'positive')}<span>${ctx.t('security.phoneConfirmed')}</span></div><div>${badge(ctx.t('badge.twoFactor'), 'positive')}<span>${ctx.t('security.twoFactorEnabled')}</span></div><div>${badge(ctx.t('security.auditReady'), 'positive')}<span>${ctx.t('security.recommendationsSaved')}</span></div></div><div class="bk-action-row">${button(ctx.t('settings.securityTitle'), 'ghost', '/settings/security')}</div>`, 'bk-rail-card bk-security-rail-card');
}

export function securityBadges(ctx: AppContext): string {
  return `<div class="bk-chip-row">${badge(ctx.t('badge.verified'), ctx.state.verification === 'verified' ? 'positive' : 'warning')}${badge(ctx.t('badge.email'), ctx.state.verification === 'emailPending' ? 'warning' : 'positive')}${badge(ctx.t('badge.phone'), ctx.state.verification === 'phonePending' ? 'warning' : 'positive')}${badge(ctx.t('badge.twoFactor'), ctx.state.verification === 'twoFactorRequired' ? 'warning' : 'positive')}</div>`;
}

export function routeMapPreview(ctx: AppContext): string {
  const preview = routes.slice(0, 18).map((route) => {
    const allowed = canAccess(route.access, ctx.state);
    return `<div class="bk-route-row"><span>${escapeHtml(route.path)}</span><span>${ctx.t(`shell.${route.shell}`)}</span><span>${ctx.t(`access.${route.access}`)}</span><span>${badge(allowed ? ctx.t('qa.allowed') : ctx.t('qa.blocked'), allowed ? 'positive' : 'warning')}</span></div>`;
  }).join('');
  return card(`<h3 class="bk-card-title">${ctx.t('qa.routeMap')}</h3><div class="bk-route-table">${preview}</div>`);
}
