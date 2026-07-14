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
  const greeting = card(`<div class="bk-dashboard-greeting"><div><h1 class="bk-title">${ctx.t('dashboard.greeting')}</h1><p class="bk-subtitle">${ctx.t('dashboard.subtitle')}</p></div>${button(ctx.t('dashboard.configure'), 'secondary', '/settings')}</div><div class="bk-kpi-grid bk-kpi-grid-reference">${kpi('3', ctx.t('dashboard.kpi.invites'))}${kpi('2', ctx.t('dashboard.kpi.todayEvents'))}${kpi('7', ctx.t('dashboard.kpi.unread'))}${kpi('1', ctx.t('dashboard.kpi.tasks'))}</div>`, 'bk-dashboard-greeting-card');
  const heroDiagnostics = canSeeDiagnostics(ctx) ? `<div class="bk-chip-row">${badge(ctx.t('common.mock'))}${badge(ctx.t('common.offline'))}${badge(ctx.t('common.i18nReady'), 'positive')}</div>` : '';
  const hero = card(`<div class="bk-workspace-hero"><div><div class="bk-eyebrow">${ctx.t('common.workspace')}</div><h2 class="bk-title">${ctx.t('dashboard.title')}</h2><p class="bk-subtitle">${ctx.t('dashboard.workspaceCopy')}</p>${heroDiagnostics}</div>${img('illustrationPortfolio', 'bk-hero-art', ctx.t('asset.alt.empty'))}</div>`, 'bk-dashboard-card bk-dashboard-card-reference');
  const quick = card(`<div class="bk-card-section-head"><h3 class="bk-card-title">${ctx.t('common.quickCreate')}</h3>${button(ctx.t('actions.view'), 'ghost', '/events')}</div><div class="bk-card-grid bk-card-grid-4">${quickActions.map((action) => quickActionCard(ctx, action)).join('')}</div>`, 'bk-quick-actions-card');
  const composer = card(`<div class="bk-composer-head">${img('avatarMusician', 'bk-avatar', ctx.t('asset.alt.avatar'))}<div><h3 class="bk-card-title">${ctx.t('feed.createPost')}</h3><div class="bk-meta">${ctx.t('security.linkNotice')}</div></div></div><textarea class="bk-textarea" aria-label="${ctx.t('feed.composerPlaceholder')}" placeholder="${ctx.t('feed.composerPlaceholder')}"></textarea><div class="bk-action-row">${button(ctx.t('feed.createPost'), 'primary')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div>`, 'bk-composer-card');
  const filter = card(`<div class="bk-chip-row"><span class="bk-badge bk-badge-positive">${ctx.t('feed.all')}</span><span class="bk-badge">${ctx.t('feed.projects')}</span><span class="bk-badge">${ctx.t('feed.events')}</span><span class="bk-badge">${ctx.t('feed.trustedOnly')}</span></div>`, 'bk-feed-filter-card');
  const list = posts.map((post) => postCard(ctx, post)).join('');
  // Real feed panel (backed by /me/feed): subscriptions, real entity posts and a
  // manager composer, above the mock social cards.
  const realFeed = ctx.state.currentUser ? '<div data-real-feed></div>' : '';
  return contentGrid([greeting, hero, quick, realFeed, composer, filter, list].join(''), defaultRightRail(ctx));
}

function renderProfile(ctx: AppContext): string {
  const profile = ctx.path === '/profile/me' ? profiles[0] : profiles[1];
  const activity = posts.slice(0, 2).map((post) => postCard(ctx, post)).join('');
  const about = card(`<h3 class="bk-card-title">${ctx.t('profile.about')}</h3><div class="bk-card-grid bk-card-grid-3">${kpi(profile.city, ctx.t('profile.city'))}${kpi(ctx.t(profile.availabilityKey), ctx.t('profile.availability'))}${kpi(ctx.t(profile.trustLevelKey), ctx.t('profile.trust'))}</div>`, 'bk-about-card');
  // Real professions editor (backed by /me/professions), only on your own profile when logged in.
  const professionsPanel = ctx.path === '/profile/me' && ctx.state.currentUser ? '<div data-real-professions></div>' : '';
  // Subject-facing reliability records (backed by /me/reliability): see what has
  // been recorded about you and open a dispute. Own profile, logged in only.
  const reliabilityPanel = ctx.path === '/profile/me' && ctx.state.currentUser ? '<div data-real-my-reliability></div>' : '';
  return contentGrid([pageHeader(ctx, ctx.path === '/profile/me' ? 'profile.meTitle' : 'profile.title', 'profile.subtitle'), profileHeader(ctx, profile), card(`<div class="bk-tab-row"><span class="bk-badge bk-badge-positive">${ctx.t('profile.tabs.activity')}</span><span class="bk-badge">${ctx.t('profile.tabs.about')}</span><span class="bk-badge">${ctx.t('profile.tabs.reviews')}</span></div>`), about, professionsPanel, reliabilityPanel, activity].join(''), defaultRightRail(ctx));
}

function renderBands(ctx: AppContext): string {
  const grid = card(`<div class="bk-card-grid bk-card-grid-3">${bands.map((band) => bandCard(ctx, band)).join('')}</div>`, 'bk-grid-card');
  const memberPanel = ctx.state.currentUser ? '<div data-real-member-add></div>' : '';
  return contentGrid([pageHeader(ctx, 'bands.title', 'bands.subtitle', 'bands.create', '/bands/new'), statusStrip(ctx), memberPanel, grid].join(''), defaultRightRail(ctx));
}

function renderBandDetail(ctx: AppContext): string {
  const band = bands.find((item) => item.id === ctx.match.params.bandId) ?? bands[0];
  const bandEvents = events.slice(0, 2).map((event) => listRow(ctx.t(event.titleKey), `${formatDateTime(event.startsAt, ctx.state.locale)} · ${ctx.t(event.locationKey)}`, event.cover, button(ctx.t('actions.view'), 'secondary', `/events/${event.id}`))).join('');
  const bandDocuments = documents.slice(0, 2).map((doc) => listRow(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t(doc.statusKey)}`, doc.icon, button(ctx.t('actions.view'), 'secondary', `/documents/${doc.id}`))).join('');
  const projectChat = chats[0];
  const chatPanel = projectChat ? listRow(projectChat.title, `${ctx.t(projectChat.typeKey)} · ${ctx.t(projectChat.lastMessageKey)}`, projectChat.suspicious ? 'badgeWarning' : 'navChatsInactive', button(ctx.t('actions.open'), 'secondary', `/chats/${projectChat.id}`)) : '';
  const logistics = card(`<div class="bk-card-section-head"><div><div class="bk-eyebrow">Рабочий контекст</div><h3 class="bk-card-title">${band.name} как пространство проекта</h3></div>${badge(ctx.t(band.roleKey), 'positive')}</div><div class="bk-kpi-grid bk-entity-kpi-grid">${kpi(ctx.t(band.roleKey), 'Моя роль')}${kpi(band.members, 'Участники')}${kpi(ctx.t(band.statusKey), ctx.t('common.status'))}</div><div class="bk-card-grid bk-card-grid-3">${card(`<h4 class="bk-card-title">Ближайшие события</h4><div class="bk-list">${bandEvents}</div><div class="bk-action-row">${button(ctx.t('events.create'), 'secondary', '/events/new')}</div>`, 'bk-context-card')}${card(`<h4 class="bk-card-title">Документы проекта</h4><div class="bk-list">${bandDocuments}</div><div class="bk-action-row">${button(ctx.t('documents.upload'), 'secondary', '/documents')}</div>`, 'bk-context-card')}${card(`<h4 class="bk-card-title">Чат проекта</h4><div class="bk-list">${chatPanel}</div><div class="bk-action-row">${button(ctx.t('nav.chats'), 'ghost', '/chats')}</div>`, 'bk-context-card')}</div><section class="bk-profile-feed-policy"><div><strong>Действую как</strong><span>В будущей логике здесь будет выбор: личный профиль или управляемая сущность.</span></div><div class="bk-chip-row">${badge('Личный профиль')}${badge(band.name, 'positive')}${badge(ctx.t(band.roleKey))}</div></section>`, 'bk-band-logistics-card');
  return contentGrid([pageHeader(ctx, 'bands.detailTitle', 'bands.subtitle', 'actions.invite'), bandCard(ctx, band), logistics, card(`<h3 class="bk-card-title">${ctx.t('bands.members')}</h3><div class="bk-card-grid bk-card-grid-3">${profiles.map((profile) => profileCompactCard(ctx, profile)).join('')}</div>`), card(`<h3 class="bk-card-title">${ctx.t('bands.documents')}</h3><div class="bk-list">${documents.slice(0, 2).map((doc) => listRow(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t(doc.statusKey)}`, doc.icon)).join('')}</div>`), permissionMatrix(ctx)].join(''), defaultRightRail(ctx));
}

function renderEvents(ctx: AppContext): string {
  const schedule = card(`<div class="bk-timeline">${events.map((event) => `<div class="bk-timeline-item"><div class="bk-timeline-date">${formatDateTime(event.startsAt, ctx.state.locale)}</div>${eventCard(ctx, event)}</div>`).join('')}</div>`, 'bk-schedule-card');
  const createPanel = ctx.state.currentUser ? '<div data-real-event-create></div>' : '';
  const slotsPanel = ctx.state.currentUser ? '<div data-real-event-slots></div>' : '';
  const engagementsPanel = ctx.state.currentUser ? '<div data-real-event-engagements></div>' : '';
  return contentGrid([pageHeader(ctx, 'events.title', 'events.subtitle', 'events.create', '/events/new'), createPanel, slotsPanel, engagementsPanel, schedule].join(''), defaultRightRail(ctx));
}

function renderEventDetail(ctx: AppContext): string {
  const event = events.find((item) => item.id === ctx.match.params.eventId) ?? events[0];
  const linkedBand = bands[0];
  const eventDocuments = documents.map((doc) => listRow(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t(doc.statusKey)}`, doc.icon, button(ctx.t('actions.view'), 'secondary', `/documents/${doc.id}`))).join('');
  const eventChat = chats[0];
  const eventChatRow = eventChat ? listRow(eventChat.title, `${ctx.t(eventChat.typeKey)} · ${ctx.t(eventChat.lastMessageKey)}`, eventChat.suspicious ? 'badgeWarning' : 'navChatsInactive', button(ctx.t('actions.open'), 'secondary', `/chats/${eventChat.id}`)) : '';
  const logistics = card(`<div class="bk-card-section-head"><div><div class="bk-eyebrow">Рабочий контекст</div><h3 class="bk-card-title">Событие как узел людей, документов и чата</h3></div>${badge(ctx.t(event.statusKey), event.statusKey.includes('confirmed') ? 'positive' : 'warning')}</div><div class="bk-kpi-grid bk-entity-kpi-grid">${kpi(formatDateTime(event.startsAt, ctx.state.locale), ctx.t('common.date'))}${kpi(event.participants, ctx.t('events.participants'))}${kpi(linkedBand.name, 'Проект')}</div><div class="bk-card-grid bk-card-grid-3">${card(`<h4 class="bk-card-title">Связанный проект</h4><div class="bk-list">${listRow(linkedBand.name, `${ctx.t(linkedBand.typeKey)} · ${ctx.t(linkedBand.roleKey)}`, linkedBand.cover, button(ctx.t('actions.view'), 'secondary', `/bands/${linkedBand.id}`))}</div>`, 'bk-context-card')}${card(`<h4 class="bk-card-title">Документы события</h4><div class="bk-list">${eventDocuments}</div><div class="bk-action-row">${button(ctx.t('documents.upload'), 'secondary', '/documents')}</div>`, 'bk-context-card')}${card(`<h4 class="bk-card-title">Чат события</h4><div class="bk-list">${eventChatRow}</div><div class="bk-action-row">${button(ctx.t('nav.chats'), 'ghost', '/chats')}</div>`, 'bk-context-card')}</div><section class="bk-profile-feed-policy"><div><strong>Мой статус</strong><span>Событие показывает роль участника и следующий шаг участия.</span></div><div class="bk-chip-row">${badge('Участник события', 'positive')}${badge(ctx.t(event.typeKey))}${badge(ctx.t(event.statusKey))}</div></section>`, 'bk-event-logistics-card');
  return contentGrid([pageHeader(ctx, 'events.detailTitle', 'events.subtitle', 'events.rsvp'), eventCard(ctx, event), logistics, card(`<h3 class="bk-card-title">${ctx.t('events.participants')}</h3><div class="bk-card-grid bk-card-grid-3">${profiles.map((profile) => profileCompactCard(ctx, profile)).join('')}</div>`), card(`<h3 class="bk-card-title">${ctx.t('events.documents')}</h3><div class="bk-list">${documents.map((doc) => listRow(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t(doc.statusKey)}`, doc.icon)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderChats(ctx: AppContext): string {
  const policy = card(`<h3 class="bk-card-title">${ctx.t('chats.policyTitle')}</h3><p class="bk-state-copy">${ctx.t('chats.policyCopy')}</p><div class="bk-chip-row">${badge(ctx.t('security.linkNotice'), 'warning')}${badge(ctx.t('security.reportAvailable'), 'positive')}</div>`, 'bk-chat-policy-card');
  return contentGrid([pageHeader(ctx, 'chats.title', 'chats.subtitle'), policy, card(`<h3 class="bk-card-title">${ctx.t('chats.rooms')}</h3><div class="bk-list" data-real-room-list>${chats.map((chat) => chatRow(ctx, chat)).join('')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderChatRoom(ctx: AppContext): string {
  return contentGrid([pageHeader(ctx, 'chats.roomTitle', 'chats.subtitle'), card(`<div class="bk-chat-layout"><div class="bk-list" data-real-room-list>${chats.map((chat) => chatRow(ctx, chat)).join('')}</div><div class="bk-chat-thread" data-real-thread>${chatMessages(ctx)}</div></div>`, 'bk-chat-room-card'), card(`<label class="bk-field"><span class="bk-label">${ctx.t('chats.composer')}</span><textarea class="bk-textarea" data-chat-body placeholder="${ctx.t('chats.composerPlaceholder')}"></textarea></label><div class="bk-blocked-link">${ctx.t('security.linkNotice')}</div><div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-chat-send>${ctx.t('chats.send')}</button>${button(ctx.t('chats.attachments'), 'secondary')}</div>`)].join(''), defaultRightRail(ctx));
}

function renderDocuments(ctx: AppContext): string {
  const hub = card(`<div class="bk-kpi-grid">${kpi(documents.length + 4, ctx.t('documents.total'))}${kpi('5', ctx.t('documents.shared'))}${kpi('2', ctx.t('documents.reviewQueue'))}${kpi('4', 'Утверждено')}</div>`, 'bk-doc-hub-card');
  const filters = card(`<input class="bk-search" type="search" aria-label="${ctx.t('common.search')}" placeholder="Поиск по райдерам, договорам, setlist и медиа" /><div class="bk-chip-row">${badge('Все документы', 'positive')}${badge('Райдеры')}${badge('Setlist')}${badge('Договоры')}${badge('Медиа / промо')}${badge(ctx.t('marketplace.filter.safeOnly'), 'warning')}</div>`, 'bk-doc-filter-card');
  const projectRows = [
    listRow('Технический райдер v3', 'Событие: Клубный концерт · Статус: утверждено · Доступ: участники события', 'docSetlist', badge('Утверждено', 'positive')),
    listRow('Контракт на клубный концерт', 'Проект: Northern Lights Band · Статус: на проверке · Доступ: владелец и менеджер', 'docSetlist', badge('На проверке', 'warning')),
    listRow('Основной setlist', 'Событие: Главная репетиция · Статус: черновик · Доступ: участники проекта', 'docSetlist', badge('Черновик')),
    listRow('Промо-фото и описание', 'Профиль: Alex Rhythm · Статус: опубликовано · Доступ: публично', 'docSetlist', badge('Публично', 'positive')),
  ].join('');
  const accessRows = [
    listRow('Проектные документы', 'Доступ через роль в группе/проекте, не через личную дружбу', 'badgeRestricted', badge(ctx.t('permission.read'))),
    listRow('Документы события', 'Доступ получают участники события, менеджер и владелец проекта', 'badgeRestricted', badge(ctx.t('security.twoFactorRequired'), 'warning')),
    listRow('Публичные материалы', 'Промо, портфолио, пресс-кит и медиа могут быть доступны подписчикам и гостям', 'badgeRestricted', badge('Public', 'positive')),
  ].join('');
  const documentCards = card(`<div class="bk-card-grid bk-card-grid-3">${documents.map((doc) => documentCard(ctx, doc)).join('')}</div>`, 'bk-grid-card');
  const main = [
    pageHeader(ctx, 'documents.title', 'documents.subtitle', 'documents.upload'),
    hub,
    filters,
    card(`<h3 class="bk-card-title">Документы проектов и событий</h3><p class="bk-state-copy">Райдеры, setlist, договоры, медиа и промо-файлы с привязкой к группе, событию или профилю.</p><div class="bk-list">${projectRows}</div>`, 'bk-doc-workflow-card'),
    card(`<h3 class="bk-card-title">Права доступа</h3><p class="bk-state-copy">Документы не открываются автоматически друзьям или подписчикам. Доступ задаётся через проект, событие, роль и статус безопасности.</p><div class="bk-list">${accessRows}</div>${securityBadges(ctx)}`, 'bk-doc-access-card'),
    documentCards,
  ].join('');
  return contentGrid(main, defaultRightRail(ctx));
}

function renderDocumentDetail(ctx: AppContext): string {
  const doc = documents.find((item) => item.id === ctx.match.params.documentId) ?? documents[0];
  const linkedBand = bands[0];
  const linkedEvent = events[1];
  const relatedChat = chats[0];
  const contextLinks = card(`<h3 class="bk-card-title">Контекст документа</h3><p class="bk-state-copy">Документ не висит отдельно: он связан с проектом, событием и рабочей коммуникацией.</p><div class="bk-list">${listRow(linkedBand.name, `${ctx.t(linkedBand.typeKey)} · ${ctx.t(linkedBand.roleKey)}`, linkedBand.cover, button(ctx.t('actions.view'), 'secondary', `/bands/${linkedBand.id}`))}${listRow(ctx.t(linkedEvent.titleKey), `${formatDateTime(linkedEvent.startsAt, ctx.state.locale)} · ${ctx.t(linkedEvent.locationKey)}`, linkedEvent.cover, button(ctx.t('actions.view'), 'secondary', `/events/${linkedEvent.id}`))}${listRow(relatedChat.title, `${ctx.t(relatedChat.typeKey)} · ${ctx.t(relatedChat.lastMessageKey)}`, relatedChat.suspicious ? 'badgeWarning' : 'navChatsInactive', button(ctx.t('actions.open'), 'secondary', `/chats/${relatedChat.id}`))}</div>`, 'bk-doc-context-card');
  const access = card(`<h3 class="bk-card-title">Почему у меня есть доступ</h3><p class="bk-state-copy">Доступ задаётся через контекст проекта, события и роль пользователя, а не через личную дружбу или подписку.</p><div class="bk-list">${listRow('Владелец / менеджер', 'Полный доступ, редактирование, экспорт и управление версиями', 'navAdminInactive', badge(ctx.t('security.twoFactorRequired'), 'warning'))}${listRow('Участники события', 'Просмотр актуальной версии и подтверждение ознакомления', 'roleMusician', badge(ctx.t('permission.read'), 'neutral'))}${listRow('Подписчики и друзья', 'Нет доступа, если документ не опубликован как публичный материал', 'badgeRestricted', badge('Ограничено', 'warning'))}</div>`, 'bk-doc-access-card');
  const nextActions = card(`<h3 class="bk-card-title">Следующие действия</h3><p class="bk-state-copy">После просмотра документа пользователь должен понимать, куда идти дальше.</p><div class="bk-action-row">${button(ctx.t('actions.exportPdf'), 'secondary')}${button(ctx.t('events.rsvp'), 'primary', `/events/${linkedEvent.id}`)}${button(ctx.t('nav.chats'), 'ghost', `/chats/${relatedChat.id}`)}</div><div class="bk-chip-row">${badge(ctx.t(doc.statusKey), doc.statusKey.includes('approved') ? 'positive' : 'warning')}${badge(`${ctx.t('common.owner')}: ${ctx.t(doc.ownerKey)}`)}${badge(formatDateTime(doc.updatedAt, ctx.state.locale))}</div>`, 'bk-doc-next-actions-card');
  const linkedContext = card(`<h3 class="bk-card-title">Сводка привязки</h3><div class="bk-kpi-grid">${kpi(linkedBand.name, 'Проект')}${kpi(ctx.t(linkedEvent.titleKey), 'Событие')}${kpi(ctx.t(doc.statusKey), 'Статус')}</div>`, 'bk-doc-context-card');
  return contentGrid([pageHeader(ctx, 'documents.detailTitle', 'documents.subtitle', 'actions.exportPdf'), documentCard(ctx, doc), linkedContext, contextLinks, access, nextActions, card(`<h3 class="bk-card-title">${ctx.t('documents.versionHistory')}</h3><div class="bk-audit">${auditEvents.map((event) => auditEventRow(ctx, event)).join('')}</div>`)].join(''), defaultRightRail(ctx));
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
  const twoFactorPanel = card(`<div class="bk-card-section-head"><h3 class="bk-card-title">${ctx.t('auth.2fa.panelTitle')}</h3><span class="bk-badge" data-2fa-status></span></div>`
    + `<p class="bk-state-copy" data-2fa-message role="status"></p>`
    + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-2fa-action="enroll">${ctx.t('auth.2fa.enable')}</button><button class="bk-button bk-button-danger" type="button" data-2fa-action="disable" hidden>${ctx.t('auth.2fa.disable')}</button></div>`
    + `<div data-2fa-enroll hidden><p class="bk-state-copy">${ctx.t('auth.2fa.addHint')}</p><code class="bk-meta" data-2fa-secret></code>${formField(ctx.t('auth.2fa.codeLabel'), '<input class="bk-input" type="text" data-2fa-field="code" autocomplete="one-time-code" inputmode="numeric" />')}<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-2fa-action="confirm">${ctx.t('auth.2fa.confirm')}</button></div></div>`
    + `<div data-2fa-disable-form hidden><p class="bk-state-copy">${ctx.t('auth.2fa.disablePrompt')}</p>${formField(ctx.t('auth.2fa.codeLabel'), '<input class="bk-input" type="text" data-2fa-field="disable-code" autocomplete="one-time-code" inputmode="numeric" />')}<div class="bk-action-row"><button class="bk-button bk-button-danger" type="button" data-2fa-action="disable-confirm">${ctx.t('auth.2fa.disable')}</button></div></div>`
    + `<div data-2fa-recovery hidden><strong class="bk-meta">${ctx.t('auth.2fa.recoveryTitle')}</strong><pre class="bk-meta" data-2fa-recovery-list></pre></div>`, 'bk-security-card');
  return contentGrid([pageHeader(ctx, 'settings.securityTitle', 'common.security'), card(`${securityBadges(ctx)}<div class="bk-list">${listRow(ctx.t('settings.sessions'), ctx.t('settings.logoutAll'), 'navAdminInactive', `<button class="bk-button bk-button-danger" type="button" data-auth-action="logout">${ctx.t('auth.logout')}</button>`)}</div>`), twoFactorPanel, checks].join(''), defaultRightRail(ctx));
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
  // Real reports queue (backed by /reports), rendered for platform moderation
  // staff only; the module empties it for everyone else, leaving the mock queue.
  const realReports = ctx.state.currentUser ? '<div data-real-moderation-reports></div>' : '';
  return contentGrid([pageHeader(ctx, 'moderation.title', 'moderation.subtitle'), queueStats, realReports, card(`<h3 class="bk-card-title">${ctx.t('moderation.filters')}</h3><div class="bk-chip-row">${badge(ctx.t('moderation.priority.high'), 'danger')}${badge(ctx.t('moderation.priority.medium'), 'warning')}${badge(ctx.t('moderation.priority.low'))}</div>`), ...complaints.map((c) => complaintCard(ctx, c))].join(''), defaultRightRail(ctx));
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
  const projectTypeSelect = `<select class="bk-select"><option>${ctx.t('bands.type.bandProject')}</option><option>${ctx.t('profile.type.soloPerformer')}</option><option>${ctx.t('profile.type.organizationRepresentative')}</option></select>`;
  const visibilitySelect = `<select class="bk-select"><option>${ctx.t('feed.visibility.workspace')}</option><option>${ctx.t('feed.visibility.noExternalLinks')}</option><option>${ctx.t('marketplace.filter.safeOnly')}</option></select>`;
  const memberRows = profiles.slice(0, 4).map((profile) => listRow(profile.name, `${ctx.t(profile.profileTypeKey)} · ${ctx.t(profile.availabilityKey)}`, profile.avatar, badge(ctx.t(profile.trustLevelKey), profile.reputation > 90 ? 'positive' : 'neutral'))).join('');
  const permissionRows = [
    listRow('Владелец проекта', 'Полный доступ к настройкам, ролям, документам и жалобам', 'navAdminInactive', badge(ctx.t('security.twoFactorRequired'), 'warning')),
    listRow('Менеджер / букинг', 'События, приглашения, документы и коммуникации', 'roleManager', badge(ctx.t('qa.allowed'), 'positive')),
    listRow('Участник', 'Профиль, расписание, чаты и подтверждение участия', 'roleMusician', badge(ctx.t('permission.read'), 'neutral')),
  ].join('');
  const quickSummary = card(`<div class="bk-kpi-grid">${kpi(ctx.t('bands.type.bandProject'), ctx.t('common.type'))}${kpi('4', ctx.t('bands.members'))}${kpi(ctx.t('marketplace.filter.safeOnly'), ctx.t('common.security'))}</div>`, 'bk-event-wizard-summary');
  const identityStep = card(`<div class="bk-step-index">1</div><h3 class="bk-card-title">${ctx.t('bands.wizard.identity')}</h3><p class="bk-state-copy">Название, тип проекта, город и публичность. Это mock-форма будущего create-project flow.</p><div class="bk-form bk-event-wizard-form">${formField('Название проекта', '<input class="bk-input" value="Northern Lights Band" />')}${formField(ctx.t('common.type'), projectTypeSelect)}${formField(ctx.t('profile.city'), '<input class="bk-input" value="Helsinki" />')}${formField('Видимость', visibilitySelect)}${formField(ctx.t('profile.about'), '<textarea class="bk-textarea">Рабочий проект для концертов, репетиций, документов и безопасной коммуникации.</textarea>')}</div>`, 'bk-flow-card bk-event-wizard-card');
  const membersStep = card(`<div class="bk-step-index">2</div><h3 class="bk-card-title">${ctx.t('bands.wizard.members')}</h3><p class="bk-state-copy">Первичный состав проекта: музыканты, сольные исполнители, менеджер или технический специалист.</p><div class="bk-list">${memberRows}</div><div class="bk-action-row">${button(ctx.t('actions.invite'), 'secondary')}${button(ctx.t('marketplace.filter.safeOnly'), 'ghost')}</div>`, 'bk-flow-card bk-event-wizard-card');
  const permissionsStep = card(`<div class="bk-step-index">3</div><h3 class="bk-card-title">${ctx.t('bands.wizard.permissions')}</h3><p class="bk-state-copy">Роли, 2FA для повышенных прав, запрет внешних ссылок и будущие guard patterns.</p><div class="bk-list">${permissionRows}</div><div class="bk-chip-row">${badge(ctx.t('security.linkNotice'), 'warning')}${badge(ctx.t('security.reportAvailable'), 'positive')}</div>`, 'bk-flow-card bk-event-wizard-card');
  const main = [
    pageHeader(ctx, 'bands.create', 'bands.subtitle'),
    quickSummary,
    card(`<div class="bk-eyebrow">${ctx.t('flow.wizardPattern')}</div><div class="bk-flow-grid bk-event-wizard-grid">${identityStep}${membersStep}${permissionsStep}</div><div class="bk-action-footer">${button(ctx.t('actions.back'), 'secondary')}${button(ctx.t('actions.save'), 'secondary')}${button(ctx.t('actions.next'), 'primary')}</div>`, 'bk-event-wizard-shell'),
  ].join('');
  return contentGrid(main, defaultRightRail(ctx));
}

function renderEventWizard(ctx: AppContext): string {
  const eventTypeSelect = `<select class="bk-select"><option>${ctx.t('events.rehearsal')}</option><option>${ctx.t('events.concert')}</option><option>${ctx.t('events.session')}</option></select>`;
  const projectSelect = `<select class="bk-select"><option>${bands[0].name}</option><option>${bands[1].name}</option><option>${bands[2].name}</option></select>`;
  const visibilitySelect = `<select class="bk-select"><option>${ctx.t('feed.visibility.workspace')}</option><option>${ctx.t('feed.visibility.noExternalLinks')}</option><option>${ctx.t('marketplace.filter.safeOnly')}</option></select>`;
  const notificationSelect = `<select class="bk-select"><option>In-app + push future-ready</option><option>Email digest</option><option>SMS future-ready</option></select>`;
  const participantRows = profiles.map((profile) => listRow(profile.name, `${ctx.t(profile.profileTypeKey)} · ${ctx.t(profile.availabilityKey)}`, profile.avatar, badge(ctx.t(profile.trustLevelKey), profile.reputation > 90 ? 'positive' : 'neutral'))).join('');
  const documentRows = documents.slice(0, 3).map((doc) => listRow(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t(doc.statusKey)}`, doc.icon)).join('');
  const quickSummary = card(`<div class="bk-kpi-grid">${kpi(ctx.t('events.concert'), ctx.t('common.type'))}${kpi('25 мая · 21:00', ctx.t('common.date'))}${kpi('6', ctx.t('events.participants'))}</div>`, 'bk-event-wizard-summary');
  const basicStep = card(`<div class="bk-step-index">1</div><h3 class="bk-card-title">${ctx.t('events.wizard.basic')}</h3><p class="bk-state-copy">Название, тип, проект, дата и место. Это mock-форма для будущего create-event flow.</p><div class="bk-form bk-event-wizard-form">${formField('Название события', '<input class="bk-input" value="Клубный концерт" />')}${formField(ctx.t('common.type'), eventTypeSelect)}${formField('Проект / группа', projectSelect)}${formField(ctx.t('common.date'), '<input class="bk-input" type="datetime-local" value="2026-06-02T20:30" />')}${formField('Место', '<input class="bk-input" value="Клубная сцена" />')}${formField('Видимость', visibilitySelect)}</div>`, 'bk-flow-card bk-event-wizard-card');
  const participantsStep = card(`<div class="bk-step-index">2</div><h3 class="bk-card-title">${ctx.t('events.wizard.participants')}</h3><p class="bk-state-copy">Роли и участники события: музыканты, техник, менеджер или организатор.</p><div class="bk-list">${participantRows}</div><div class="bk-action-row">${button(ctx.t('actions.invite'), 'secondary')}${button(ctx.t('marketplace.filter.safeOnly'), 'ghost')}</div>`, 'bk-flow-card bk-event-wizard-card');
  const documentsStep = card(`<div class="bk-step-index">3</div><h3 class="bk-card-title">${ctx.t('events.wizard.documents')}</h3><p class="bk-state-copy">Документы, напоминания и будущие push/email/SMS уведомления привязаны к событию.</p><div class="bk-list">${documentRows}</div>${formField(ctx.t('common.notifications'), notificationSelect)}<div class="bk-chip-row">${badge(ctx.t('security.linkNotice'), 'warning')}${badge(ctx.t('security.reportAvailable'), 'positive')}</div>`, 'bk-flow-card bk-event-wizard-card');
  const main = [
    pageHeader(ctx, 'events.create', 'events.subtitle'),
    quickSummary,
    card(`<div class="bk-eyebrow">${ctx.t('flow.wizardPattern')}</div><div class="bk-flow-grid bk-event-wizard-grid">${basicStep}${participantsStep}${documentsStep}</div><div class="bk-action-footer">${button(ctx.t('actions.back'), 'secondary')}${button(ctx.t('actions.save'), 'secondary')}${button(ctx.t('actions.next'), 'primary')}</div>`, 'bk-event-wizard-shell'),
  ].join('');
  return contentGrid(main, defaultRightRail(ctx));
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
