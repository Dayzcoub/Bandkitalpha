import type { AppContext } from '../app/types.js';
import { canAccess } from '../lib/permissions/permissions.js';
import { canSeeDiagnostics } from '../lib/permissions/diagnostics.js';
import { pageHeader, contentGrid } from '../components/layout/page.js';
import { defaultRightRail, routeMapPreview, securityBadges } from '../components/domain/commonBlocks.js';
import { button, card, formField, img, kpi, listRow, badge } from '../components/ui/primitives.js';
import { emptyState, errorState, loadingState, restrictedState } from '../components/ui/states.js';
import { auditEvents, bands, chats, complaints, documents, events, marketplaceOffers, notifications, posts, profiles, quickActions, trustChecks } from '../mocks/mockData.js';
import { auditEventRow, bandCard, chatMessages, chatRow, complaintCard, documentCard, eventCard, offerCard, postCard, profileCompactCard, profileHeader, quickActionCard, statusStrip, trustCheckCard } from '../components/domain/cards.js';
import { formatDateTime } from '../lib/format/format.js';

export function renderPage(ctx: AppContext): string {
  if (!canAccess(ctx.match.route.access, ctx.state)) {
    return contentGrid(restrictedState(ctx.t('state.restrictedTitle'), restrictedReason(ctx), ctx.t('actions.setup'), ctx.match.route.access === 'verified'), defaultRightRail(ctx), ctx.match.route.wide);
  }
  if (ctx.state.uiState !== 'normal' && ctx.state.uiState !== 'long') {
    return contentGrid(renderForcedState(ctx), defaultRightRail(ctx), ctx.match.route.wide);
  }
  const path = ctx.match.route.path;
  if (ctx.path === '/') return renderLanding(ctx);
  if (path.startsWith('/auth/') || path === '/login' || path === '/register') return renderAuth(ctx);
  if (path === '/onboarding') return renderOnboarding(ctx);
  if (path === '/feed') return renderFeed(ctx);
  if (path === '/profile/me' || path === '/profile/:profileId') return renderProfile(ctx);
  if (path === '/bands') return renderBands(ctx);
  if (path === '/bands/new') return renderBandWizard(ctx);
  if (path === '/bands/:bandId') return renderBandDetail(ctx);
  if (path === '/bands/:bandId/settings') return renderSettingsPlaceholder(ctx, 'bands.settingsTitle');
  if (path === '/events') return renderEvents(ctx);
  if (path === '/events/new') return renderEventWizard(ctx);
  if (path === '/events/:eventId') return renderEventDetail(ctx);
  if (path === '/events/:eventId/settings') return renderSettingsPlaceholder(ctx, 'events.settingsTitle');
  if (path === '/chats') return renderChats(ctx);
  if (path === '/chats/:chatId') return renderChatRoom(ctx);
  if (path === '/documents') return renderDocuments(ctx);
  if (path === '/documents/:documentId') return renderDocumentDetail(ctx);
  if (path === '/marketplace') return renderMarketplace(ctx);
  if (path === '/notifications') return renderNotifications(ctx);
  if (path === '/settings') return renderSettings(ctx);
  if (path === '/settings/security') return renderSecurity(ctx);
  if (path === '/settings/i18n') return renderI18nSettings(ctx);
  if (path === '/complaints/new') return renderComplaintForm(ctx);
  if (path === '/moderation') return renderModeration(ctx);
  if (path === '/moderation/complaints/:complaintId') return renderComplaintDetail(ctx);
  if (path === '/admin') return renderAdmin(ctx);
  if (path === '/admin/users') return renderAdminUsers(ctx);
  if (path === '/admin/roles') return renderAdminRoles(ctx);
  if (path === '/admin/localization') return renderAdminLocalization(ctx);
  if (path === '/admin/audit') return renderAdminAudit(ctx);
  return contentGrid(emptyState(ctx.t('state.notFoundTitle'), ctx.t('state.notFoundCopy'), ctx.t('actions.back'), 'emptyNoAccess'), '', true);
}

function restrictedReason(ctx: AppContext): string {
  if (!ctx.state.currentUser) return ctx.t('errors.requiresLogin');
  if (ctx.match.route.access === 'verified') return ctx.t('security.verificationRequired');
  if (ctx.match.route.access === 'moderator') return ctx.t('errors.requiresModerator');
  if (ctx.match.route.access === 'admin') return ctx.t('errors.requiresAdmin');
  if (ctx.match.route.access === 'super_admin') return ctx.t('errors.requiresSuperAdmin');
  return ctx.t('state.restrictedCopy');
}

function renderForcedState(ctx: AppContext): string {
  if (ctx.state.uiState === 'loading') return loadingState(ctx.t('state.loadingTitle'), ctx.t('state.loadingCopy'));
  if (ctx.state.uiState === 'empty') return emptyState(ctx.t('state.emptyTitle'), ctx.t('state.emptyCopy'), ctx.t('actions.create'), 'emptyPosts');
  if (ctx.state.uiState === 'error') return errorState(ctx.t('state.errorTitle'), ctx.t('state.errorCopy'), ctx.t('actions.retry'));
  return restrictedState(ctx.t('state.restrictedTitle'), ctx.t('state.restrictedCopy'), ctx.t('actions.setup'));
}


// Honest placeholder for sections whose backend does not exist yet — the user
// must always be able to tell a real surface from a planned one.
function inDevelopment(ctx: AppContext, titleKey: string, actionLabelKey?: string, actionPath?: string): string {
  const action = actionLabelKey && actionPath ? `<div class="bk-action-row">${button(ctx.t(actionLabelKey), 'secondary', actionPath)}</div>` : '';
  const body = card(`${img('illustrationPortfolio', 'bk-illustration', '')}<h2 class="bk-state-title">${ctx.t('state.inDevTitle')}</h2><p class="bk-state-copy">${ctx.t('state.inDevCopy')}</p>${action}`, 'bk-indev-card');
  return contentGrid([pageHeader(ctx, titleKey, 'state.inDevTitle'), body].join(''), defaultRightRail(ctx));
}

function renderLanding(ctx: AppContext): string {
  const productCard = card(`${img('illustrationPortfolio', 'bk-illustration', '')}<h2 class="bk-state-title">${ctx.t('landing.preview.title')}</h2><p class="bk-state-copy">${ctx.t('landing.preview.copy')}</p>${securityBadges(ctx)}<div class="bk-card-grid bk-card-grid-2">${quickActions.slice(0, 2).map((action) => quickActionCard(ctx, action)).join('')}</div>`, 'bk-landing-preview-card');
  return `<div class="bk-public-shell"><div class="bk-public-grid"><section class="bk-hero-copy">${img('logoPrimary', 'bk-brand-logo', ctx.t('asset.alt.logo'))}<h1 class="bk-hero-title">${ctx.t('app.name')}</h1><p class="bk-hero-subtitle">${ctx.t('app.tagline')}</p><div class="bk-action-row">${button(ctx.t('auth.signIn'), 'primary', '/login')}${button(ctx.t('auth.signUp'), 'secondary', '/register')}${button(ctx.t('nav.feed'), 'ghost', '/feed')}</div></section>${productCard}</div></div>`;
}

function renderAuth(ctx: AppContext): string {
  const titleKey = ctx.match.route.titleKey;
  const subtitleKey = ctx.match.route.subtitleKey;
  const isRegister = ctx.path === '/register';
  const isVerifyEmail = ctx.path === '/auth/verify-email';
  const isLogin = ctx.path === '/login';
  const isVerify = ctx.path.includes('2fa') || ctx.path.includes('verify');
  // Only login / register / verify-email are wired to the real backend so far.
  const wired = isLogin || isRegister || isVerifyEmail;
  const formKind = isVerifyEmail ? 'verify' : isRegister ? 'register' : 'login';
  const fields = isVerifyEmail
    ? formField(ctx.t('auth.otp'), '<input class="bk-input" type="text" data-auth-field="token" autocomplete="one-time-code" />', ctx.t('auth.securityHint'))
    : `${formField(ctx.t('auth.email'), '<input class="bk-input" type="email" data-auth-field="email" autocomplete="email" />')}${isRegister ? formField(ctx.t('auth.displayName'), '<input class="bk-input" type="text" data-auth-field="display_name" autocomplete="name" />') : ''}${formField(ctx.t(isVerify ? 'auth.otp' : 'auth.password'), `<input class="bk-input" type="password" data-auth-field="password" autocomplete="${isRegister ? 'new-password' : 'current-password'}" />`, ctx.t('auth.securityHint'))}${isLogin ? `<div data-auth-2fa-wrap hidden>${formField(ctx.t('auth.2fa.codeLabel'), '<input class="bk-input" type="text" data-auth-field="code" autocomplete="one-time-code" inputmode="numeric" />')}</div>` : ''}`;
  const primaryLabel = isRegister ? ctx.t('auth.signUp') : isVerifyEmail ? ctx.t('actions.continue') : ctx.t('auth.signIn');
  const primaryBtn = wired
    ? `<button class="bk-button bk-button-primary" type="button" data-auth-submit>${primaryLabel}</button>`
    : button(primaryLabel, 'primary');
  const providers = isVerifyEmail ? '' : `${button(ctx.t('auth.google'), 'secondary')}${button(ctx.t('auth.apple'), 'secondary')}`;
  const messageBox = wired ? '<div class="bk-meta" data-auth-message role="status"></div>' : '';
  const form = `<form class="bk-form"${wired ? ` data-auth-form="${formKind}"` : ''}>${fields}${messageBox}<div class="bk-auth-provider-grid">${primaryBtn}${providers}</div></form>`;
  const cardHtml = card(`<h1 class="bk-title">${ctx.t(titleKey)}</h1><p class="bk-subtitle">${subtitleKey ? ctx.t(subtitleKey) : ''}</p>${form}`);
  return `<div class="bk-auth-shell"><div class="bk-auth-grid"><section class="bk-hero-copy">${img('logoPrimary', 'bk-brand-logo', ctx.t('asset.alt.logo'))}<h2 class="bk-hero-title">${ctx.t('common.security')}</h2><p class="bk-hero-subtitle">${ctx.t('security.authPromise')}</p>${securityBadges(ctx)}</section>${cardHtml}</div></div>`;
}

function renderOnboarding(ctx: AppContext): string {
  const steps = [
    ['1', 'onboarding.step.profile.title', 'onboarding.step.profile.copy'],
    ['2', 'onboarding.step.verification.title', 'onboarding.step.verification.copy'],
    ['3', 'onboarding.step.workspace.title', 'onboarding.step.workspace.copy'],
  ] as const;
  const profileTypes = [
    ['avatarMusician', 'profile.type.personalUser'],
    ['avatarVocalist', 'profile.type.soloPerformer'],
    ['roleMusician', 'profile.type.musician'],
    ['roleDrummer', 'profile.type.sessionMusician'],
    ['roleGroup', 'bands.type.bandProject'],
    ['roleManager', 'profile.type.managerBooking'],
    ['roleStudio', 'profile.type.organizationRepresentative'],
    ['roleSoundEngineer', 'profile.type.technicalSpecialist'],
    ['coverStudio', 'profile.type.teacherCoach'],
  ] as const;
  const stepCards = steps.map(([num, title, copy]) => card(`<div class="bk-step-index">${num}</div><h3 class="bk-card-title">${ctx.t(title)}</h3><p class="bk-state-copy">${ctx.t(copy)}</p>`, 'bk-flow-card')).join('');
  const roleGrid = card(`<h3 class="bk-card-title">${ctx.t('onboarding.rolePicker')}</h3><p class="bk-state-copy">${ctx.t('onboarding.step.profile.copy')}</p><div class="bk-card-grid bk-card-grid-3">${profileTypes.map(([key, label]) => `<div class="bk-select-card">${img(key as never, 'bk-action-icon', ctx.t('asset.alt.icon'))}<span>${ctx.t(label)}</span></div>`).join('')}</div>`, 'bk-onboarding-card');
  const main = [pageHeader(ctx, 'onboarding.title', 'onboarding.subtitle', 'actions.continue'), card(`${img('illustrationSecurity', 'bk-illustration', ctx.t('asset.alt.empty'))}<div class="bk-flow-grid">${stepCards}</div><div class="bk-action-footer">${button(ctx.t('actions.back'), 'secondary')}${button(ctx.t('actions.next'), 'primary')}</div>`), roleGrid].join('');
  return contentGrid(main, defaultRightRail(ctx));
}

function renderFeed(ctx: AppContext): string {
  const quick = card(`<div class="bk-card-section-head"><h3 class="bk-card-title">${ctx.t('common.quickCreate')}</h3>${button(ctx.t('actions.view'), 'ghost', '/events')}</div><div class="bk-card-grid bk-card-grid-4">${quickActions.map((action) => quickActionCard(ctx, action)).join('')}</div>`, 'bk-quick-actions-card');
  // Everything below is backed by the real API (/me/feed, subscriptions, posts).
  const realFeed = '<div data-real-feed></div>';
  return contentGrid([pageHeader(ctx, 'feed.title', 'feed.subtitle'), quick, realFeed].join(''), defaultRightRail(ctx));
}

function renderProfile(ctx: AppContext): string {
  if (ctx.path !== '/profile/me') return inDevelopment(ctx, 'profile.title');
  const user = ctx.state.currentUser;
  const verified = ctx.state.verification === 'verified';
  const header = card(`<div class="bk-rail-profile-row">${img('avatarMusician', 'bk-avatar bk-avatar-lg', ctx.t('asset.alt.avatar'))}<div><h2 class="bk-title">${user ? user.displayName : ''}</h2><div class="bk-meta">${user ? user.handle : ''}</div><div class="bk-chip-row">${badge(ctx.t('badge.email'), verified ? 'positive' : 'warning')}</div></div></div>`, 'bk-about-card');
  const professionsPanel = '<div data-real-professions></div>';
  const reliabilityPanel = '<div data-real-my-reliability></div>';
  return contentGrid([pageHeader(ctx, 'profile.meTitle', 'profile.subtitle'), header, professionsPanel, reliabilityPanel].join(''), defaultRightRail(ctx));
}

function renderBands(ctx: AppContext): string {
  const entitiesPanel = '<div data-real-entities-list></div>';
  const memberPanel = '<div data-real-member-add></div>';
  return contentGrid([pageHeader(ctx, 'bands.title', 'bands.subtitle'), entitiesPanel, memberPanel].join(''), defaultRightRail(ctx));
}

function renderBandDetail(ctx: AppContext): string {
  return inDevelopment(ctx, 'bands.detailTitle', 'bands.title', '/bands');
}

function renderEvents(ctx: AppContext): string {
  const listPanel = '<div data-real-events-list></div>';
  const createPanel = '<div data-real-event-create></div>';
  const slotsPanel = '<div data-real-event-slots></div>';
  const engagementsPanel = '<div data-real-event-engagements></div>';
  return contentGrid([pageHeader(ctx, 'events.title', 'events.subtitle'), listPanel, createPanel, slotsPanel, engagementsPanel].join(''), defaultRightRail(ctx));
}

function renderEventDetail(ctx: AppContext): string {
  return inDevelopment(ctx, 'events.detailTitle', 'events.title', '/events');
}

function renderChats(ctx: AppContext): string {
  const policy = card(`<h3 class="bk-card-title">${ctx.t('chats.policyTitle')}</h3><p class="bk-state-copy">${ctx.t('chats.policyCopy')}</p><div class="bk-chip-row">${badge(ctx.t('security.linkNotice'), 'warning')}${badge(ctx.t('security.reportAvailable'), 'positive')}</div>`, 'bk-chat-policy-card');
  return contentGrid([pageHeader(ctx, 'chats.title', 'chats.subtitle'), policy, card(`<h3 class="bk-card-title">${ctx.t('chats.rooms')}</h3><div class="bk-list" data-real-room-list>${chats.map((chat) => chatRow(ctx, chat)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderChatRoom(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'chats.roomTitle', 'chats.subtitle'), card(`<div class="bk-chat-layout"><div class="bk-list" data-real-room-list>${chats.map((chat) => chatRow(ctx, chat)).join('')}</div><div class="bk-chat-thread" data-real-thread>${chatMessages(ctx)}</div></div>`, 'bk-chat-room-card'), card(`<label class="bk-field"><span class="bk-label">${ctx.t('chats.composer')}</span><textarea class="bk-textarea" data-chat-body placeholder="${ctx.t('chats.composerPlaceholder')}"></textarea></label><div class="bk-blocked-link">${ctx.t('security.linkNotice')}</div><div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-chat-send>${ctx.t('chats.send')}</button>${button(ctx.t('chats.attachments'), 'secondary')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderDocuments(ctx: AppContext): string {
  const docsPanel = '<div data-real-documents-list></div>';
  const storageNote = card(`<h3 class="bk-card-title">${ctx.t('state.inDevTitle')}</h3><p class="bk-state-copy">${ctx.t('documents.real.storageNote')}</p>`, 'bk-doc-access-card');
  return contentGrid([pageHeader(ctx, 'documents.title', 'documents.subtitle'), docsPanel, storageNote].join(''), defaultRightRail(ctx));
}

function renderDocumentDetail(ctx: AppContext): string {
  return inDevelopment(ctx, 'documents.detailTitle', 'documents.title', '/documents');
}

function renderMarketplace(ctx: AppContext): string {
  return inDevelopment(ctx, 'marketplace.title');
}

function renderNotifications(ctx: AppContext): string {
  return inDevelopment(ctx, 'notifications.title');
}

function renderSettings(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'settings.title', 'settings.subtitle'), card(`<div class="bk-list">${listRow(ctx.t('settings.securityTitle'), ctx.t('common.security'), 'navSettingsInactive', button(ctx.t('actions.view'), 'secondary', '/settings/security'))}${listRow(ctx.t('settings.i18nTitle'), ctx.t('common.language'), 'navSettingsInactive', button(ctx.t('actions.view'), 'secondary', '/settings/i18n'))}${listRow(ctx.t('settings.privacyTitle'), ctx.t('settings.privacyCopy'), 'badgeRestricted', button(ctx.t('actions.view'), 'secondary'))}</div>`)].join(''), defaultRightRail(ctx));
}

function renderSecurity(ctx: AppContext): string {
  const twoFactorPanel = card(`<div class="bk-card-section-head"><h3 class="bk-card-title">${ctx.t('auth.2fa.panelTitle')}</h3><span class="bk-badge" data-2fa-status></span></div>`
    + `<p class="bk-state-copy" data-2fa-message role="status"></p>`
    + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-2fa-action="enroll">${ctx.t('auth.2fa.enable')}</button><button class="bk-button bk-button-danger" type="button" data-2fa-action="disable" hidden>${ctx.t('auth.2fa.disable')}</button></div>`
    + `<div data-2fa-enroll hidden><p class="bk-state-copy">${ctx.t('auth.2fa.addHint')}</p><code class="bk-meta" data-2fa-secret></code>${formField(ctx.t('auth.2fa.codeLabel'), '<input class="bk-input" type="text" data-2fa-field="code" autocomplete="one-time-code" inputmode="numeric" />')}<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-2fa-action="confirm">${ctx.t('auth.2fa.confirm')}</button></div></div>`
    + `<div data-2fa-disable-form hidden><p class="bk-state-copy">${ctx.t('auth.2fa.disablePrompt')}</p>${formField(ctx.t('auth.2fa.codeLabel'), '<input class="bk-input" type="text" data-2fa-field="disable-code" autocomplete="one-time-code" inputmode="numeric" />')}<div class="bk-action-row"><button class="bk-button bk-button-danger" type="button" data-2fa-action="disable-confirm">${ctx.t('auth.2fa.disable')}</button></div></div>`
    + `<div data-2fa-recovery hidden><strong class="bk-meta">${ctx.t('auth.2fa.recoveryTitle')}</strong><pre class="bk-meta" data-2fa-recovery-list></pre></div>`, 'bk-security-card');
  return contentGrid([pageHeader(ctx, 'settings.securityTitle', 'common.security'), card(`${securityBadges(ctx)}<div class="bk-list">${listRow(ctx.t('settings.sessions'), ctx.t('settings.logoutAll'), 'navAdminInactive', `<button class="bk-button bk-button-danger" type="button" data-auth-action="logout">${ctx.t('auth.logout')}</button>`)}</div>`), twoFactorPanel].join(''), defaultRightRail(ctx));
}

function renderI18nSettings(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'settings.i18nTitle', 'settings.subtitle'), card(`<div class="bk-kpi-grid">${kpi(ctx.state.locale.toUpperCase(), ctx.t('settings.locale'))}${kpi(Intl.DateTimeFormat().resolvedOptions().timeZone, ctx.t('settings.timezone'))}${kpi(formatDateTime(new Date().toISOString(), ctx.state.locale), ctx.t('common.date'))}</div>`), card(`<h3 class="bk-card-title">${ctx.t('admin.localizationKeys')}</h3><div class="bk-list">${['common.searchPlaceholder', 'security.linkNotice', 'state.restrictedCopy'].map((key) => listRow(key, ctx.t(key), 'docSetlist')).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderComplaintForm(ctx: AppContext): string {
  // Reports are filed from the content itself (message/post/profile ⚑ actions).
  return inDevelopment(ctx, 'actions.report', 'nav.feed', '/feed');
}

function renderModeration(ctx: AppContext): string {
  const realReports = '<div data-real-moderation-reports></div>';
  return contentGrid([pageHeader(ctx, 'moderation.title', 'moderation.subtitle'), realReports].join(''), defaultRightRail(ctx));
}

function renderComplaintDetail(ctx: AppContext): string {
  const complaint = complaints.find((item) => item.id === ctx.match.params.complaintId) ?? complaints[0];
  return contentGrid([pageHeader(ctx, 'moderation.caseTitle', 'moderation.subtitle'), complaintCard(ctx, complaint), card(`<h3 class="bk-card-title">${ctx.t('moderation.auditTrail')}</h3><div class="bk-audit"><div>${ctx.t('common.status')}: ${ctx.t(complaint.statusKey)}</div><div>${ctx.t('common.priority')}: ${ctx.t(complaint.priorityKey)}</div><div>${ctx.t('common.audit')}: ${ctx.t('mock.auditEvent')}</div></div><div class="bk-action-row">${button(ctx.t('moderation.action.warn'), 'secondary')}${button(ctx.t('moderation.action.restrict'), 'danger')}${button(ctx.t('moderation.action.hide'), 'danger')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderAdmin(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'admin.title', 'admin.subtitle'), card(`<div class="bk-kpi-grid">${kpi('42', ctx.t('admin.usersTitle'))}${kpi(complaints.length, ctx.t('moderation.queue'))}${kpi('24', ctx.t('admin.localizationKeys'))}</div>`), card(`<h3 class="bk-card-title">${ctx.t('admin.securityDashboard')}</h3>${securityBadges(ctx)}<div class="bk-trust-list">${trustChecks.map((check) => trustCheckCard(ctx, check)).join('')}</div>`), routeMapPreview(ctx)].join(''), defaultRightRail(ctx));
}

function renderAdminUsers(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'admin.usersTitle', 'admin.subtitle'), card(`<div class="bk-card-grid bk-card-grid-3">${profiles.map((p) => profileCompactCard(ctx, p)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderAdminRoles(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'admin.rolesTitle', 'admin.subtitle'), card(`<h3 class="bk-card-title">${ctx.t('admin.roleMatrix')}</h3>${permissionMatrix(ctx)}`)].join(''), defaultRightRail(ctx));
}

function renderAdminLocalization(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'admin.localizationTitle', 'admin.subtitle'), card(`<h3 class="bk-card-title">${ctx.t('admin.localizationKeys')}</h3><div class="bk-list">${['common.searchPlaceholder', 'security.linkNotice', 'state.restrictedCopy', 'dashboard.title'].map((key) => listRow(key, ctx.t(key), 'docSetlist')).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderAdminAudit(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'admin.auditTitle', 'common.audit'), card(`<div class="bk-audit">${auditEvents.map((event) => auditEventRow(ctx, event)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderBandWizard(ctx: AppContext): string {
  return inDevelopment(ctx, 'bands.create', 'bands.title', '/bands');
}

function renderEventWizard(ctx: AppContext): string {
  return inDevelopment(ctx, 'events.create', 'events.title', '/events');
}

function renderWizard(ctx: AppContext, titleKey: string, subtitleKey: string, steps: string[]): string {
  const cards = steps.map((step, index) => card(`<div class="bk-step-index">${index + 1}</div><h3 class="bk-card-title">${ctx.t(step)}</h3><p class="bk-state-copy">${ctx.t('flow.wizardCopy')}</p>`, 'bk-flow-card')).join('');
  return contentGrid([pageHeader(ctx, titleKey, subtitleKey), card(`<div class="bk-eyebrow">${ctx.t('flow.wizardPattern')}</div><div class="bk-flow-grid">${cards}</div><div class="bk-action-footer">${button(ctx.t('actions.back'), 'secondary')}${button(ctx.t('actions.save'), 'secondary')}${button(ctx.t('actions.next'), 'primary')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderSettingsPlaceholder(ctx: AppContext, titleKey: string): string {
  return contentGrid([pageHeader(ctx, titleKey, 'common.permissions'), permissionMatrix(ctx), card(`<p class="bk-state-copy">${ctx.t('common.mockNotice')}</p>${securityBadges(ctx)}<div class="bk-action-row">${button(ctx.t('actions.save'), 'primary')}${button(ctx.t('actions.cancel'), 'secondary')}</div>`)].join(''), defaultRightRail(ctx));
}

function permissionMatrix(ctx: AppContext): string {
  return card(`<h3 class="bk-card-title">${ctx.t('common.permissions')}</h3><div class="bk-route-table"><div class="bk-route-row"><span>${ctx.t('role.user')}</span><span>${ctx.t('permission.read')}</span><span>${badge(ctx.t('qa.allowed'), 'positive')}</span></div><div class="bk-route-row"><span>${ctx.t('role.moderator')}</span><span>${ctx.t('permission.moderate')}</span><span>${badge(ctx.t('security.twoFactorRequired'), 'warning')}</span></div><div class="bk-route-row"><span>${ctx.t('role.admin')}</span><span>${ctx.t('permission.manage')}</span><span>${badge(ctx.t('qa.blocked'), 'warning')}</span></div></div>`, 'bk-permission-card');
}
