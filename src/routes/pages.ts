import type { AppContext } from '../app/types.js';
import { canAccess } from '../lib/permissions/permissions.js';
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

function renderLanding(ctx: AppContext): string {
  const productCard = card(`${img('illustrationPortfolio', 'bk-illustration', '')}<h2 class="bk-state-title">${ctx.t('landing.preview.title')}</h2><p class="bk-state-copy">${ctx.t('landing.preview.copy')}</p>${securityBadges(ctx)}<div class="bk-card-grid bk-card-grid-2">${quickActions.slice(0, 2).map((action) => quickActionCard(ctx, action)).join('')}</div>`, 'bk-landing-preview-card');
  return `<div class="bk-public-shell"><div class="bk-public-grid"><section class="bk-hero-copy">${img('logoPrimary', 'bk-brand-logo', ctx.t('asset.alt.logo'))}<h1 class="bk-hero-title">${ctx.t('app.name')}</h1><p class="bk-hero-subtitle">${ctx.t('app.tagline')}</p><div class="bk-action-row">${button(ctx.t('auth.signIn'), 'primary', '/login')}${button(ctx.t('auth.signUp'), 'secondary', '/register')}${button(ctx.t('nav.feed'), 'ghost', '/feed')}</div></section>${productCard}</div></div>`;
}

function renderAuth(ctx: AppContext): string {
  const titleKey = ctx.match.route.titleKey;
  const subtitleKey = ctx.match.route.subtitleKey;
  const isRegister = ctx.path === '/register';
  const isVerify = ctx.path.includes('2fa') || ctx.path.includes('verify');
  const form = `<form class="bk-form">${formField(ctx.t('auth.email'), '<input class="bk-input" type="email" autocomplete="email" />')}${isRegister ? formField(ctx.t('auth.phone'), '<input class="bk-input" type="tel" autocomplete="tel" />') : ''}${isRegister ? formField(ctx.t('auth.displayName'), '<input class="bk-input" type="text" autocomplete="name" />') : ''}${formField(ctx.t(isVerify ? 'auth.otp' : 'auth.password'), '<input class="bk-input" type="password" autocomplete="current-password" />', ctx.t('auth.securityHint'))}<div class="bk-auth-provider-grid">${button(ctx.t(isRegister ? 'auth.signUp' : 'auth.signIn'), 'primary')}${button(ctx.t('auth.google'), 'secondary')}${button(ctx.t('auth.apple'), 'secondary')}</div></form>`;
  const cardHtml = card(`<h1 class="bk-title">${ctx.t(titleKey)}</h1><p class="bk-subtitle">${subtitleKey ? ctx.t(subtitleKey) : ''}</p>${form}`);
  return `<div class="bk-auth-shell"><div class="bk-auth-grid"><section class="bk-hero-copy">${img('logoPrimary', 'bk-brand-logo', ctx.t('asset.alt.logo'))}<h2 class="bk-hero-title">${ctx.t('common.security')}</h2><p class="bk-hero-subtitle">${ctx.t('security.authPromise')}</p>${securityBadges(ctx)}</section>${cardHtml}</div></div>`;
}

function renderOnboarding(ctx: AppContext): string {
  const steps = [
    ['1', 'onboarding.step.profile.title', 'onboarding.step.profile.copy'],
    ['2', 'onboarding.step.verification.title', 'onboarding.step.verification.copy'],
    ['3', 'onboarding.step.workspace.title', 'onboarding.step.workspace.copy'],
  ] as const;
  const stepCards = steps.map(([num, title, copy]) => card(`<div class="bk-step-index">${num}</div><h3 class="bk-card-title">${ctx.t(title)}</h3><p class="bk-state-copy">${ctx.t(copy)}</p>`, 'bk-flow-card')).join('');
  const roleGrid = card(`<h3 class="bk-card-title">${ctx.t('onboarding.rolePicker')}</h3><div class="bk-card-grid bk-card-grid-3">${['roleMusician','roleGroup','roleStudio'].map((key) => `<div class="bk-select-card">${img(key as never, 'bk-action-icon', ctx.t('asset.alt.icon'))}<span>${ctx.t(`onboarding.${key}`)}</span></div>`).join('')}</div>`, 'bk-onboarding-card');
  const main = [pageHeader(ctx, 'onboarding.title', 'onboarding.subtitle', 'actions.continue'), card(`${img('illustrationSecurity', 'bk-illustration', ctx.t('asset.alt.empty'))}<div class="bk-flow-grid">${stepCards}</div><div class="bk-action-footer">${button(ctx.t('actions.back'), 'secondary')}${button(ctx.t('actions.next'), 'primary')}</div>`), roleGrid].join('');
  return contentGrid(main, defaultRightRail(ctx));
}

function renderFeed(ctx: AppContext): string {
  const mobileHome = renderMobileFeedReference(ctx);
  const greeting = card(`<div class="bk-dashboard-greeting"><div><h1 class="bk-title">${ctx.t('dashboard.greeting')}</h1><p class="bk-subtitle">${ctx.t('dashboard.subtitle')}</p></div>${button(ctx.t('dashboard.configure'), 'secondary', '/settings')}</div><div class="bk-kpi-grid bk-kpi-grid-reference">${kpi('3', ctx.t('dashboard.kpi.invites'))}${kpi('2', ctx.t('dashboard.kpi.todayEvents'))}${kpi('7', ctx.t('dashboard.kpi.unread'))}${kpi('1', ctx.t('dashboard.kpi.tasks'))}</div>`, 'bk-dashboard-greeting-card bk-feed-desktop-block');
  const hero = card(`<div class="bk-workspace-hero"><div><div class="bk-eyebrow">${ctx.t('common.workspace')}</div><h2 class="bk-title">${ctx.t('dashboard.title')}</h2><p class="bk-subtitle">${ctx.t('dashboard.workspaceCopy')}</p><div class="bk-chip-row">${badge(ctx.t('common.mock'))}${badge(ctx.t('common.offline'))}${badge(ctx.t('common.i18nReady'), 'positive')}</div></div>${img('illustrationPortfolio', 'bk-hero-art', ctx.t('asset.alt.empty'))}</div>`, 'bk-dashboard-card bk-dashboard-card-reference bk-feed-desktop-block');
  const quick = card(`<div class="bk-card-section-head"><h3 class="bk-card-title">${ctx.t('common.quickCreate')}</h3>${button(ctx.t('actions.view'), 'ghost', '/events')}</div><div class="bk-card-grid bk-card-grid-4">${quickActions.map((action) => quickActionCard(ctx, action)).join('')}</div>`, 'bk-quick-actions-card bk-feed-desktop-block');
  const composer = card(`<div class="bk-composer-head">${img('avatarMusician', 'bk-avatar', ctx.t('asset.alt.avatar'))}<div><h3 class="bk-card-title">${ctx.t('feed.createPost')}</h3><div class="bk-meta">${ctx.t('security.linkNotice')}</div></div></div><textarea class="bk-textarea" aria-label="${ctx.t('feed.composerPlaceholder')}" placeholder="${ctx.t('feed.composerPlaceholder')}"></textarea><div class="bk-action-row">${button(ctx.t('feed.createPost'), 'primary')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div>`, 'bk-composer-card bk-feed-desktop-block');
  const list = posts.map((post) => `<div class="bk-feed-desktop-block">${postCard(ctx, post)}</div>`).join('');
  const main = [mobileHome, greeting, hero, quick, composer, card(`<div class="bk-chip-row"><span class="bk-badge bk-badge-positive">${ctx.t('feed.all')}</span><span class="bk-badge">${ctx.t('feed.projects')}</span><span class="bk-badge">${ctx.t('feed.events')}</span><span class="bk-badge">${ctx.t('feed.trustedOnly')}</span></div>`, 'bk-feed-filter-card bk-feed-desktop-block'), list].join('');
  return contentGrid(main, defaultRightRail(ctx));
}

function renderMobileFeedReference(ctx: AppContext): string {
  const storyItems = [
    ['avatarVocalist', 'mobile.story.search', true],
    ['coverConcert', 'mobile.story.northern', false],
    ['coverStudio', 'mobile.story.acoustic', false],
    ['coverVenue', 'mobile.story.studio', false],
  ] as const;
  const stories = storyItems.map(([asset, label, add]) => `<a class="bk-mobile-story" href="/marketplace" data-route="/marketplace"><span class="bk-mobile-story-frame">${img(asset, 'bk-mobile-story-img', ctx.t('asset.alt.cover'))}${add ? '<span class="bk-mobile-story-plus">+</span>' : ''}</span><span>${ctx.t(label)}</span></a>`).join('');
  const attendees = ['avatarMusician', 'avatarVocalist', 'avatarGuitarist', 'avatarSound'].map((asset) => img(asset as never, 'bk-mini-face', ctx.t('asset.alt.avatar'))).join('');
  const invites = [
    ['coverConcert', 'mobile.invite.northern', 'mobile.invite.northernMeta', '15 000 ₽'],
    ['coverRehearsal', 'mobile.invite.acoustic', 'mobile.invite.acousticMeta', '8 000 ₽'],
    ['coverStudio', 'mobile.invite.studio', 'mobile.invite.studioMeta', '12 000 ₽'],
  ] as const;
  const inviteRows = invites.map(([asset, title, meta, price]) => `<div class="bk-mobile-invite-row">${img(asset, 'bk-mobile-thumb', ctx.t('asset.alt.cover'))}<div class="bk-mobile-row-main"><strong>${ctx.t(title)}</strong><span>${ctx.t(meta)}</span><span>${price}</span></div><button class="bk-mobile-circle bk-mobile-accept" type="button" aria-label="${ctx.t('actions.confirm')}">✓</button><button class="bk-mobile-circle bk-mobile-decline" type="button" aria-label="${ctx.t('actions.cancel')}">×</button></div>`).join('');
  return `<section class="bk-mobile-reference-home" aria-label="${ctx.t('feed.title')}"><div class="bk-mobile-stories">${stories}</div><section class="bk-mobile-event-card"><div class="bk-mobile-card-head"><h2>${ctx.t('mobile.upcoming')}</h2><button type="button" aria-label="${ctx.t('actions.close')}">×</button></div><div class="bk-mobile-event-main"><div class="bk-mobile-date"><strong>22</strong><span>${ctx.t('mobile.month.may')}</span></div><div><h3>${ctx.t('mobile.event.rehearsal')}</h3><p>${ctx.t('mobile.event.place')}</p><p>${ctx.t('mobile.event.time')}</p><div class="bk-mobile-face-row">${attendees}<span>+2</span></div></div></div>${button(ctx.t('mobile.event.confirm'), 'primary')}</section><section class="bk-mobile-panel"><div class="bk-mobile-section-head"><h2>${ctx.t('mobile.invites')}</h2><span class="bk-mobile-counter">3</span><a href="/events" data-route="/events">${ctx.t('actions.view')}</a></div><div class="bk-mobile-invite-list">${inviteRows}</div></section><section class="bk-mobile-panel bk-mobile-feed-card"><div class="bk-mobile-post-head">${img('avatarMusician', 'bk-avatar', ctx.t('asset.alt.avatar'))}<div><h3>${ctx.t('mobile.post.author')}</h3><span>${ctx.t('mobile.post.time')}</span></div><button type="button" aria-label="${ctx.t('actions.open')}">•••</button></div><p>${ctx.t('mobile.post.body')}</p><a href="/bands/b1" data-route="/bands/b1">@AcousticNightProject</a></section></section>`;
}

function renderProfile(ctx: AppContext): string {
  const profile = ctx.path === '/profile/me' ? profiles[0] : profiles[1];
  const activity = posts.slice(0, 2).map((post) => postCard(ctx, post)).join('');
  const about = card(`<h3 class="bk-card-title">${ctx.t('profile.about')}</h3><div class="bk-card-grid bk-card-grid-3">${kpi(profile.city, ctx.t('profile.city'))}${kpi(ctx.t(profile.availabilityKey), ctx.t('profile.availability'))}${kpi(ctx.t(profile.trustLevelKey), ctx.t('profile.trust'))}</div>`, 'bk-about-card');
  return contentGrid([pageHeader(ctx, ctx.path === '/profile/me' ? 'profile.meTitle' : 'profile.title', 'profile.subtitle'), profileHeader(ctx, profile), card(`<div class="bk-tab-row"><span class="bk-badge bk-badge-positive">${ctx.t('profile.tabs.activity')}</span><span class="bk-badge">${ctx.t('profile.tabs.about')}</span><span class="bk-badge">${ctx.t('profile.tabs.reviews')}</span></div>`), about, activity].join(''), defaultRightRail(ctx));
}

function renderBands(ctx: AppContext): string {
  const grid = card(`<div class="bk-card-grid bk-card-grid-3">${bands.map((band) => bandCard(ctx, band)).join('')}</div>`, 'bk-grid-card');
  return contentGrid([pageHeader(ctx, 'bands.title', 'bands.subtitle', 'bands.create', '/bands/new'), statusStrip(ctx), grid].join(''), defaultRightRail(ctx));
}

function renderBandDetail(ctx: AppContext): string {
  const band = bands.find((item) => item.id === ctx.match.params.bandId) ?? bands[0];
  return contentGrid([pageHeader(ctx, 'bands.detailTitle', 'bands.subtitle', 'actions.invite'), bandCard(ctx, band), card(`<h3 class="bk-card-title">${ctx.t('bands.members')}</h3><div class="bk-card-grid bk-card-grid-3">${profiles.map((profile) => profileCompactCard(ctx, profile)).join('')}</div>`), card(`<h3 class="bk-card-title">${ctx.t('bands.documents')}</h3><div class="bk-list">${documents.slice(0, 2).map((doc) => listRow(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t(doc.statusKey)}`, doc.icon)).join('')}</div>`), permissionMatrix(ctx)].join(''), defaultRightRail(ctx));
}

function renderEvents(ctx: AppContext): string {
  const schedule = card(`<div class="bk-timeline">${events.map((event) => `<div class="bk-timeline-item"><div class="bk-timeline-date">${formatDateTime(event.startsAt, ctx.state.locale)}</div>${eventCard(ctx, event)}</div>`).join('')}</div>`, 'bk-schedule-card');
  return contentGrid([pageHeader(ctx, 'events.title', 'events.subtitle', 'events.create', '/events/new'), schedule].join(''), defaultRightRail(ctx));
}

function renderEventDetail(ctx: AppContext): string {
  const event = events.find((item) => item.id === ctx.match.params.eventId) ?? events[0];
  return contentGrid([pageHeader(ctx, 'events.detailTitle', 'events.subtitle', 'events.rsvp'), eventCard(ctx, event), card(`<h3 class="bk-card-title">${ctx.t('events.participants')}</h3><div class="bk-card-grid bk-card-grid-3">${profiles.map((profile) => profileCompactCard(ctx, profile)).join('')}</div>`), card(`<h3 class="bk-card-title">${ctx.t('events.documents')}</h3><div class="bk-list">${documents.map((doc) => listRow(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t(doc.statusKey)}`, doc.icon)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderChats(ctx: AppContext): string {
  const policy = card(`<h3 class="bk-card-title">${ctx.t('chats.policyTitle')}</h3><p class="bk-state-copy">${ctx.t('chats.policyCopy')}</p><div class="bk-chip-row">${badge(ctx.t('security.linkNotice'), 'warning')}${badge(ctx.t('security.reportAvailable'), 'positive')}</div>`, 'bk-chat-policy-card');
  return contentGrid([pageHeader(ctx, 'chats.title', 'chats.subtitle'), policy, card(`<h3 class="bk-card-title">${ctx.t('chats.rooms')}</h3><div class="bk-list">${chats.map((chat) => chatRow(ctx, chat)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderChatRoom(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'chats.roomTitle', 'chats.subtitle'), card(`<div class="bk-chat-layout"><div class="bk-list">${chats.map((chat) => chatRow(ctx, chat)).join('')}</div><div class="bk-chat-thread">${chatMessages(ctx)}</div></div>`, 'bk-chat-room-card'), card(`<label class="bk-field"><span class="bk-label">${ctx.t('chats.composer')}</span><textarea class="bk-textarea" placeholder="${ctx.t('chats.composerPlaceholder')}"></textarea></label><div class="bk-blocked-link">${ctx.t('security.linkNotice')}</div><div class="bk-action-row">${button(ctx.t('chats.send'), 'primary')}${button(ctx.t('chats.attachments'), 'secondary')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderDocuments(ctx: AppContext): string {
  const hub = card(`<div class="bk-kpi-grid">${kpi(documents.length, ctx.t('documents.total'))}${kpi('2', ctx.t('documents.shared'))}${kpi('1', ctx.t('documents.reviewQueue'))}</div>`, 'bk-doc-hub-card');
  return contentGrid([pageHeader(ctx, 'documents.title', 'documents.subtitle', 'documents.upload'), hub, card(`<div class="bk-card-grid bk-card-grid-3">${documents.map((doc) => documentCard(ctx, doc)).join('')}</div>`, 'bk-grid-card')].join(''), defaultRightRail(ctx));
}

function renderDocumentDetail(ctx: AppContext): string {
  const doc = documents.find((item) => item.id === ctx.match.params.documentId) ?? documents[0];
  return contentGrid([pageHeader(ctx, 'documents.detailTitle', 'documents.subtitle', 'actions.exportPdf'), documentCard(ctx, doc), permissionMatrix(ctx), card(`<h3 class="bk-card-title">${ctx.t('documents.versionHistory')}</h3><div class="bk-audit">${auditEvents.map((event) => auditEventRow(ctx, event)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderMarketplace(ctx: AppContext): string {
  const filters = card(`<input class="bk-search" type="search" aria-label="${ctx.t('marketplace.filters')}" placeholder="${ctx.t('common.searchPlaceholder')}" /><div class="bk-chip-row">${badge(ctx.t('marketplace.filter.musicians'), 'positive')}${badge(ctx.t('marketplace.filter.studios'))}${badge(ctx.t('marketplace.filter.safeOnly'), 'warning')}</div>`, 'bk-marketplace-filter-card');
  const cards = card(`<div class="bk-card-grid bk-card-grid-3">${marketplaceOffers.map((offer) => offerCard(ctx, offer)).join('')}</div>`, 'bk-grid-card');
  return contentGrid([pageHeader(ctx, 'marketplace.title', 'marketplace.subtitle'), filters, cards].join(''), defaultRightRail(ctx));
}

function renderNotifications(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'notifications.title', 'notifications.subtitle'), card(`<div class="bk-list">${notifications.map((n) => listRow(ctx.t(n.titleKey), ctx.t(n.metaKey), n.icon)).join('')}</div><div class="bk-action-row">${button(ctx.t('notifications.markRead'), 'secondary')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderSettings(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'settings.title', 'settings.subtitle'), card(`<div class="bk-list">${listRow(ctx.t('settings.securityTitle'), ctx.t('common.security'), 'navSettingsInactive', button(ctx.t('actions.view'), 'secondary', '/settings/security'))}${listRow(ctx.t('settings.i18nTitle'), ctx.t('common.language'), 'navSettingsInactive', button(ctx.t('actions.view'), 'secondary', '/settings/i18n'))}${listRow(ctx.t('settings.privacyTitle'), ctx.t('settings.privacyCopy'), 'badgeRestricted', button(ctx.t('actions.view'), 'secondary'))}</div>`)].join(''), defaultRightRail(ctx));
}

function renderSecurity(ctx: AppContext): string {
  const checks = card(`<h3 class="bk-card-title">${ctx.t('trust.checks')}</h3><div class="bk-trust-list">${trustChecks.map((check) => trustCheckCard(ctx, check)).join('')}</div>`, 'bk-security-card');
  return contentGrid([pageHeader(ctx, 'settings.securityTitle', 'common.security'), card(`${securityBadges(ctx)}<div class="bk-list">${listRow(ctx.t('auth.twoFactor.title'), ctx.t('security.twoFactorRequired'), 'badgeTwoFactor', button(ctx.t('actions.setup'), 'primary'))}${listRow(ctx.t('settings.sessions'), ctx.t('settings.logoutAll'), 'navAdminInactive', button(ctx.t('settings.logoutAll'), 'danger'))}</div>`), checks].join(''), defaultRightRail(ctx));
}

function renderI18nSettings(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'settings.i18nTitle', 'settings.subtitle'), card(`<div class="bk-kpi-grid">${kpi(ctx.state.locale.toUpperCase(), ctx.t('settings.locale'))}${kpi(Intl.DateTimeFormat().resolvedOptions().timeZone, ctx.t('settings.timezone'))}${kpi(formatDateTime(new Date().toISOString(), ctx.state.locale), ctx.t('common.date'))}</div>`), card(`<h3 class="bk-card-title">${ctx.t('admin.localizationKeys')}</h3><div class="bk-list">${['common.searchPlaceholder', 'security.linkNotice', 'state.restrictedCopy'].map((key) => listRow(key, ctx.t(key), 'docSetlist')).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderComplaintForm(ctx: AppContext): string {
  const targetSelect = `<select class="bk-select"><option>${ctx.t('entity.post')}</option><option>${ctx.t('entity.message')}</option><option>${ctx.t('entity.profile')}</option></select>`;
  return contentGrid([pageHeader(ctx, 'actions.report', 'moderation.subtitle'), card(`<form class="bk-form">${formField(ctx.t('common.type'), targetSelect)}${formField(ctx.t('common.details'), '<textarea class="bk-textarea"></textarea>', ctx.t('security.reportAvailable'))}<div class="bk-action-row">${button(ctx.t('actions.send'), 'primary')}${button(ctx.t('actions.cancel'), 'secondary')}</div></form>`)].join(''), defaultRightRail(ctx));
}

function renderModeration(ctx: AppContext): string {
  const queueStats = card(`<div class="bk-kpi-grid">${kpi(complaints.length, ctx.t('moderation.queue'))}${kpi('1', ctx.t('moderation.priority.high'))}${kpi('0', ctx.t('moderation.slaBreaches'))}</div>`, 'bk-moderation-kpi-card');
  return contentGrid([pageHeader(ctx, 'moderation.title', 'moderation.subtitle'), queueStats, card(`<h3 class="bk-card-title">${ctx.t('moderation.filters')}</h3><div class="bk-chip-row">${badge(ctx.t('moderation.priority.high'), 'danger')}${badge(ctx.t('moderation.priority.medium'), 'warning')}${badge(ctx.t('moderation.priority.low'))}</div>`), ...complaints.map((c) => complaintCard(ctx, c))].join(''), defaultRightRail(ctx));
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
  return renderWizard(ctx, 'bands.create', 'bands.subtitle', ['bands.wizard.identity', 'bands.wizard.members', 'bands.wizard.permissions']);
}

function renderEventWizard(ctx: AppContext): string {
  return renderWizard(ctx, 'events.create', 'events.subtitle', ['events.wizard.basic', 'events.wizard.participants', 'events.wizard.documents']);
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
