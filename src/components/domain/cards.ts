import type { AppContext } from '../../app/types.js';
import { card, cardHeader, badge, button, img, listRow, kpi } from '../ui/primitives.js';
import { canSeeDiagnostics } from '../../lib/permissions/diagnostics.js';
import { checkLinkPolicy, escapeHtml } from '../../lib/security/linkPolicy.js';
import { formatDateTime, formatNumber } from '../../lib/format/format.js';
import {
  bands,
  profiles,
  type MockPost,
  type MockProfile,
  type MockBand,
  type MockEvent,
  type MockChat,
  type MockDocument,
  type MockComplaint,
  messages,
  type MockOffer,
  type MockQuickAction,
  type MockTrustCheck,
  type MockAuditEvent,
} from '../../mocks/mockData.js';

function profileRoute(profile: MockProfile): string {
  return `/profile/${encodeURIComponent(profile.id)}`;
}

// A real report affordance: RealReportTarget opens a reason picker on click and
// posts to /reports with this object type/id (polymorphic — works for mock ids
// today and real ones later).
function reportLink(ctx: AppContext, objectType: string, objectId: string, extraClass = ''): string {
  const className = `bk-report-link${extraClass ? ` ${extraClass}` : ''}`;
  return `<button class="${className}" type="button" data-report-target data-report-type="${escapeHtml(objectType)}" data-report-id="${escapeHtml(objectId)}">⚑ ${escapeHtml(ctx.t('actions.report'))}</button>`;
}

function metaIconChip(label: string, icon: string, tone: 'neutral' | 'positive' | 'warning' = 'neutral', value = ''): string {
  const safeLabel = escapeHtml(label);
  const safeValue = value ? `<span class="bk-meta-chip-value">${escapeHtml(value)}</span>` : '';
  return `<span class="bk-meta-chip bk-meta-chip-${tone}" title="${safeLabel}" aria-label="${safeLabel}"><span class="bk-meta-chip-icon" aria-hidden="true">${icon}</span>${safeValue}</span>`;
}

function socialMetricChip(label: string, icon: string, value: string | number): string {
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(String(value));
  return `<button class="bk-social-metric-chip" type="button" title="${safeLabel}: ${safeValue}" aria-label="${safeLabel}: ${safeValue}"><span class="bk-social-metric-icon" aria-hidden="true">${icon}</span><span class="bk-social-metric-value">${safeValue}</span></button>`;
}

function profileStatusIcon(labelKey: string): string {
  if (labelKey.includes('verified')) return '✓';
  if (labelKey.includes('soloPerformer')) return '♪';
  if (labelKey.includes('technicalSpecialist')) return '⚙';
  if (labelKey.includes('performerPremium')) return '✦';
  if (labelKey.includes('performerPro')) return '★';
  if (labelKey.includes('freeBasic')) return 'B';
  return '•';
}

function availabilityIcon(key: string): string {
  if (key.includes('open')) return '↗';
  if (key.includes('session')) return '◐';
  if (key.includes('busy')) return '◷';
  return '○';
}

function trustIcon(key: string): string {
  if (key.includes('trusted')) return '◆';
  if (key.includes('verified')) return '✓';
  return '◇';
}

function profileMetaChips(ctx: AppContext, profile: MockProfile, mode: 'compact' | 'full' = 'compact'): string {
  const diagnostics = canSeeDiagnostics(ctx);
  const statusSource = mode === 'full' || diagnostics
    ? profile.statusBadges
    : profile.statusBadges.filter((item) => item.labelKey === 'badge.verified');
  const statusChips = statusSource
    .map((item) => metaIconChip(ctx.t(item.labelKey), profileStatusIcon(item.labelKey), item.tone === 'danger' ? 'warning' : item.tone))
    .join('');
  const trust = metaIconChip(ctx.t(profile.trustLevelKey), trustIcon(profile.trustLevelKey), 'positive');
  const availability = metaIconChip(ctx.t(profile.availabilityKey), availabilityIcon(profile.availabilityKey), 'neutral');
  const rating = metaIconChip(`${ctx.t('profile.rating')}: ${formatNumber(profile.reputation, ctx.state.locale)}`, '★', 'positive', formatNumber(profile.reputation, ctx.state.locale));
  return `${statusChips}${trust}${availability}${rating}`;
}

function profileLinkHeader(ctx: AppContext, profile: MockProfile, meta: string, extraClass = ''): string {
  const route = profileRoute(profile);
  const className = `bk-card-header bk-profile-link${extraClass ? ` ${extraClass}` : ''}`;
  return `<a class="${className}" href="${route}" data-route="${route}" aria-label="Открыть профиль ${escapeHtml(profile.name)}">${img(profile.avatar, 'bk-avatar', ctx.t('asset.alt.avatar'))}<div><h3 class="bk-card-title">${escapeHtml(profile.name)}</h3><div class="bk-meta">${meta}</div></div></a>`;
}

function profileAvatarStripItem(ctx: AppContext, profile: MockProfile): string {
  const route = profileRoute(profile);
  const label = `Открыть профиль ${profile.name}`;
  return `<article class="bk-avatar-strip-item"><a class="bk-avatar-strip-link" href="${route}" data-route="${route}" aria-label="${escapeHtml(label)}">${img(profile.avatar, 'bk-avatar', `${ctx.t('asset.alt.avatar')}: ${profile.name}`)}</a></article>`;
}

function shouldRenderAvatarOnlyProfilePreview(ctx: AppContext): boolean {
  return ctx.match.route.path === '/bands/:bandId' || ctx.match.route.path === '/events/:eventId';
}

interface EntityFeedMock {
  subscribers: string;
  posts: number;
  notificationLevel: string;
  notificationLabel: string;
  subscriptionState: 'subscribed' | 'open' | 'request';
  latestTitle: string;
  latestMeta: string;
  adminMeta: string;
  latestBody: string;
  shortBody: string;
  visibility: string;
  visibilityLabel: string;
  subscriptionMode: string;
  commentPolicy: string;
  feedSource: string;
}

function entityFeedMock(band: MockBand): EntityFeedMock {
  const map: Record<string, EntityFeedMock> = {
    b1: {
      subscribers: '2.4K',
      posts: 36,
      notificationLevel: 'Important only',
      notificationLabel: 'Важные обновления',
      subscriptionState: 'subscribed',
      latestTitle: 'Открытая репетиция и концертный сет',
      latestMeta: 'Концертные новости · 2 часа назад',
      adminMeta: 'Public · концертные новости · 2 часа назад',
      latestBody: 'Анонс концерта, короткий отчёт с репетиции и приглашение подписчикам следить за ближайшими событиями.',
      shortBody: 'Анонсы концертов, репетиции и новости проекта для подписчиков.',
      visibility: 'Public + Subscribers',
      visibilityLabel: 'Публичная лента',
      subscriptionMode: 'Открытая подписка',
      commentPolicy: 'Комментарии: подписчики',
      feedSource: 'profile',
    },
    b2: {
      subscribers: '820',
      posts: 18,
      notificationLevel: 'Events only',
      notificationLabel: 'Только события',
      subscriptionState: 'open',
      latestTitle: 'Прослушивание в оркестровую лабораторию',
      latestMeta: 'Открытый набор · вчера',
      adminMeta: 'Public · open roles · вчера',
      latestBody: 'Открытый набор, ближайшие публичные даты и новости оркестра. Подписка не даёт доступа к внутренним документам или чатам.',
      shortBody: 'Открытые наборы, события и публичные обновления оркестра.',
      visibility: 'Public',
      visibilityLabel: 'Открытая лента',
      subscriptionMode: 'Открытая подписка',
      commentPolicy: 'Комментарии: verified',
      feedSource: 'search',
    },
    b3: {
      subscribers: '146',
      posts: 9,
      notificationLevel: 'Silent',
      notificationLabel: 'Без уведомлений',
      subscriptionState: 'request',
      latestTitle: 'Студийное окно и правила безопасного контакта',
      latestMeta: 'Обновление студийной команды · 3 дня назад',
      adminMeta: 'Subscribers · studio update · 3 дня назад',
      latestBody: 'Свободные слоты, правила коммуникации и безопасный контакт без внешних ссылок.',
      shortBody: 'Студийные слоты, правила коммуникации и обновления команды.',
      visibility: 'Subscribers',
      visibilityLabel: 'Для подписчиков',
      subscriptionMode: 'Запрос подписки',
      commentPolicy: 'Комментарии: отключены',
      feedSource: 'recommendation',
    },
  };
  return map[band.id] ?? map.b1;
}

function entitySubscriptionBadge(ctx: AppContext, state: EntityFeedMock['subscriptionState']): string {
  if (state === 'subscribed') return badge('Подписан', 'positive');
  if (state === 'request') return badge('Запрос подписки', 'warning');
  return badge('Можно подписаться');
}

function entityPrimaryAction(feed: EntityFeedMock): { label: string; variant: 'primary' | 'secondary' | 'ghost' } {
  if (feed.subscriptionState === 'subscribed') return { label: '⚙ Уведомл.', variant: 'ghost' };
  if (feed.subscriptionState === 'request') return { label: '＋ Запрос', variant: 'primary' };
  return { label: '＋ Подписка', variant: 'primary' };
}

function entitySubscriptionControls(ctx: AppContext, band: MockBand, feed: EntityFeedMock): string {
  const primaryAction = entityPrimaryAction(feed);
  const unsubscribe = feed.subscriptionState === 'subscribed' ? button('− Отписка', 'ghost') : '';
  const hideOrMute = feed.subscriptionState === 'subscribed' ? button('◌ Скрыть', 'ghost') : button('◌ Заглушить', 'ghost');
  return `<div class="bk-action-row bk-entity-actions">${button(primaryAction.label, primaryAction.variant)}${unsubscribe}${button('▤ Лента', 'secondary', `/bands/${band.id}`)}${hideOrMute}</div>`;
}

function entityFeedPreview(ctx: AppContext, band: MockBand, mode: 'compact' | 'full'): string {
  const feed = entityFeedMock(band);
  const diagnostics = canSeeDiagnostics(ctx);
  const meta = diagnostics ? feed.adminMeta : feed.latestMeta;
  const headChips = diagnostics
    ? `${entitySubscriptionBadge(ctx, feed.subscriptionState)}${badge(feed.visibility)}${badge(feed.notificationLevel)}`
    : feed.subscriptionState === 'subscribed' ? badge('Подписан', 'positive') : '';
  const headChipsHtml = headChips ? `<div class="bk-chip-row">${headChips}</div>` : '';
  const policyChips = diagnostics ? `<div class="bk-chip-row">${badge('Public')}${badge('Subscribers')}${badge('Members locked', 'warning')}</div>` : '';
  const eyebrow = diagnostics ? '<div class="bk-eyebrow">Entity public feed</div>' : '<div class="bk-eyebrow">Лента проекта</div>';

  if (mode === 'compact') {
    const stats = `${feed.subscribers} подписчиков · ${formatNumber(feed.posts, ctx.state.locale)} постов · ${feed.notificationLabel}`;
    return `<section class="bk-entity-feed-preview bk-entity-feed-preview-compact"><div class="bk-entity-feed-head"><div>${eyebrow}<h4 class="bk-card-title">${escapeHtml(feed.latestTitle)}</h4><p class="bk-meta">${escapeHtml(meta)}</p></div>${headChipsHtml}</div><p class="bk-state-copy">${escapeHtml(feed.shortBody)}</p><div class="bk-entity-feed-stats">${escapeHtml(stats)}</div></section>`;
  }

  return `<section class="bk-entity-feed-preview"><div class="bk-entity-feed-head"><div>${eyebrow}<h4 class="bk-card-title">${escapeHtml(feed.latestTitle)}</h4><p class="bk-meta">${escapeHtml(meta)}</p></div>${headChipsHtml}</div><p class="bk-state-copy">${escapeHtml(feed.latestBody)}</p><div class="bk-kpi-grid bk-entity-kpi-grid">${kpi(feed.subscribers, 'Подписчики')}${kpi(feed.posts, 'Посты')}${kpi(feed.notificationLabel, 'Уведомления')}</div><div class="bk-entity-feed-settings"><div>${badge(feed.visibilityLabel, 'positive')}${badge(feed.subscriptionMode)}${badge(feed.commentPolicy)}</div><p>Подписка показывает публичные и subscriber-only обновления, но не открывает workspace, приватные чаты, документы и управление проектом.</p></div><div class="bk-entity-feed-policy"><span>Подписка не даёт членство, доступ к workspace, приватным чатам и документам.</span>${policyChips}</div>${entitySubscriptionControls(ctx, band, feed)}</section>`;
}

function entityPostOrigin(ctx: AppContext, post: MockPost): string {
  if (post.scopeKey === 'mock.post.scope.security') return '';
  const band = post.scopeKey === 'mock.post.scope.studio' ? bands[2] : bands[0];
  const feed = entityFeedMock(band);
  const visibilityBadge = feed.visibility === 'Subscribers' ? badge('Для подписчиков', 'warning') : badge('Public', 'positive');
  return `<section class="bk-entity-post-origin"><div><div class="bk-eyebrow">Лента проекта</div><strong>${escapeHtml(band.name)}</strong><p class="bk-meta">${escapeHtml(feed.latestMeta)} · ${escapeHtml(feed.notificationLabel)}</p></div><div class="bk-chip-row">${badge('Из подписки', 'positive')}${visibilityBadge}</div></section>`;
}

export function postCard(ctx: AppContext, post: MockPost): string {
  const author = profiles.find((p) => p.id === post.authorId) ?? profiles[0];
  const body = ctx.t(post.bodyKey);
  const linkPolicy = checkLinkPolicy(body);
  const warning = linkPolicy.hasBlockedLink ? `<div class="bk-blocked-link">${ctx.t('security.linkBlocked')}</div>` : '';
  const flag = post.flagged ? badge(ctx.t('badge.warning'), 'warning') : badge(ctx.t(post.scopeKey));
  const authorMeta = `${escapeHtml(author.handle)} · ${ctx.t(author.profileTypeKey)} · ${ctx.t(post.scopeKey)} · ${formatDateTime(post.createdAt, ctx.state.locale)}`;
  return card(`${profileLinkHeader(ctx, author, authorMeta)}<div class="bk-card-body"><p>${escapeHtml(body)}</p>${warning}${entityPostOrigin(ctx, post)}</div><footer class="bk-action-row bk-social-actions bk-social-metric-row"><span class="bk-social-scope-chip">${flag}</span>${socialMetricChip(ctx.t('feed.like'), '♥', formatNumber(post.likes, ctx.state.locale))}${socialMetricChip(ctx.t('feed.comment'), '☰', formatNumber(post.comments, ctx.state.locale))}${socialMetricChip(ctx.t('feed.repost'), '↻', formatNumber(post.reposts, ctx.state.locale))}<button class="bk-social-metric-chip" type="button" title="${escapeHtml(ctx.t('actions.report'))}" aria-label="${escapeHtml(ctx.t('actions.report'))}" data-report-target data-report-type="post" data-report-id="${escapeHtml(post.id)}"><span class="bk-social-metric-icon" aria-hidden="true">⚑</span></button></footer>`, 'bk-social-card');
}

function profileRelationshipActions(ctx: AppContext, profile: MockProfile): string {
  const isOwnProfile = ctx.path === '/profile/me' || profile.id === ctx.state.currentUser?.profileId;
  if (isOwnProfile) {
    return `<div class="bk-action-row bk-profile-social-actions">${button(ctx.t('feed.createPost'), 'primary', '/feed')}${button('Редактировать профиль', 'secondary', '/settings')}${button('Настройки приватности', 'ghost', '/settings')}</div>`;
  }
  return `<div class="bk-action-row bk-profile-social-actions">${button('Добавить в друзья', 'primary')}${button('Подписаться', 'secondary')}${button(ctx.t('profile.contact'), 'ghost')}${reportLink(ctx, 'user_profile', profile.id)}</div>`;
}

function profileCover(ctx: AppContext): string {
  return `<div class="bk-profile-cover-stack">${img('coverProfile', 'bk-cover', ctx.t('asset.alt.cover'))}</div>`;
}

export function profileHeader(ctx: AppContext, profile: MockProfile): string {
  const isOwnProfile = ctx.path === '/profile/me' || profile.id === ctx.state.currentUser?.profileId;
  const diagnostics = canSeeDiagnostics(ctx);
  const relationshipIcon = isOwnProfile
    ? metaIconChip('Мой профиль', '●', 'positive')
    : metaIconChip('Не в друзьях', '◇', 'neutral');
  const feedIcon = isOwnProfile
    ? metaIconChip('Лента: друзья + подписки', '▦', 'positive')
    : metaIconChip('Публичная лента', '▤', 'neutral');
  const feedPolicyChips = diagnostics ? `<div class="bk-meta-chip-row">${metaIconChip('Public', 'P')}${metaIconChip('Friends', 'F')}${metaIconChip('Workspace', 'W')}${metaIconChip('Draft', 'D')}</div>` : '';
  return card(`${profileCover(ctx)}<div class="bk-card-header bk-profile-head">${img(profile.avatar, 'bk-avatar bk-avatar-lg', ctx.t('asset.alt.avatar'))}<div><h2 class="bk-title">${escapeHtml(profile.name)}</h2><div class="bk-meta">${escapeHtml(profile.handle)} · ${ctx.t(profile.roleKey)} · ${ctx.t(profile.profileTypeKey)} · ${escapeHtml(profile.city)}</div><div class="bk-meta-chip-row">${profileMetaChips(ctx, profile, 'full')}${relationshipIcon}${feedIcon}</div></div></div><div class="bk-kpi-grid bk-profile-social-kpis"><div class="bk-kpi"><div class="bk-kpi-value">★ ${formatNumber(profile.reputation, ctx.state.locale)}</div><div class="bk-kpi-label">Рейтинг</div></div><div class="bk-kpi"><div class="bk-kpi-value">128</div><div class="bk-kpi-label">Друзья</div></div><div class="bk-kpi"><div class="bk-kpi-value">2.4K</div><div class="bk-kpi-label">Подписчики</div></div><div class="bk-kpi"><div class="bk-kpi-value">36</div><div class="bk-kpi-label">Посты</div></div></div><section class="bk-profile-feed-policy"><div><strong>Личная лента</strong><span>Посты идут по времени публикации. Приватные черновики видит только автор.</span></div>${feedPolicyChips}</section>${profileRelationshipActions(ctx, profile)}`, 'bk-profile-card bk-profile-social-card');
}

export function profileCompactCard(ctx: AppContext, profile: MockProfile): string {
  if (shouldRenderAvatarOnlyProfilePreview(ctx)) {
    return profileAvatarStripItem(ctx, profile);
  }
  return card(`${profileLinkHeader(ctx, profile, `${ctx.t(profile.profileTypeKey)} · ${escapeHtml(profile.city)}`)}<div class="bk-meta-chip-row">${profileMetaChips(ctx, profile, 'compact')}</div><div class="bk-action-row bk-profile-compact-actions">${button('👤 Профиль', 'secondary', profileRoute(profile))}${button('＋ В друзья', 'secondary')}${button('＋ Подписка', 'ghost')}</div>`, 'bk-compact-card');
}

export function bandCard(ctx: AppContext, band: MockBand): string {
  const feed = entityFeedMock(band);
  const diagnostics = canSeeDiagnostics(ctx);
  const isDetail = Boolean(ctx.match.params.bandId);
  const entityDebugBadge = diagnostics ? badge('Entity feed') : '';
  const roleBadge = diagnostics ? badge(ctx.t(band.roleKey)) : '';
  const subscriptionBadge = diagnostics || feed.subscriptionState === 'subscribed' ? entitySubscriptionBadge(ctx, feed.subscriptionState) : '';
  const route = `/bands/${band.id}`;
  const summary = `<div class="bk-band-media">${img(band.cover, 'bk-cover', ctx.t('asset.alt.cover'))}</div><div class="bk-card-header bk-card-header-tight"><div><h3 class="bk-card-title">${escapeHtml(band.name)}</h3><div class="bk-meta">${ctx.t(band.typeKey)} · ${band.members} ${ctx.t('bands.members')}</div></div></div><div class="bk-chip-row">${badge(ctx.t(band.statusKey), band.statusKey.includes('active') ? 'positive' : 'warning')}${roleBadge}${subscriptionBadge}${entityDebugBadge}</div>${entityFeedPreview(ctx, band, isDetail ? 'full' : 'compact')}`;
  const surface = isDetail ? summary : `<a class="bk-band-card-link-surface" href="${route}" data-route="${route}" aria-label="Открыть ${escapeHtml(band.name)}">${summary}</a>`;
  const primaryAction = entityPrimaryAction(feed);
  return card(`${surface}<div class="bk-action-row bk-band-card-actions">${button(ctx.t('actions.view'), 'secondary', route)}${button(primaryAction.label, primaryAction.variant)}${button(ctx.t('actions.invite'), 'ghost')}</div>`, 'bk-band-card bk-entity-card');
}

export function eventCard(ctx: AppContext, event: MockEvent): string {
  const route = `/events/${event.id}`;
  const startsAt = formatDateTime(event.startsAt, ctx.state.locale);
  const statusTone = event.statusKey.includes('confirmed') ? 'positive' : 'warning';
  return card(`<a class="bk-event-card-surface" href="${route}" data-route="${route}" aria-label="Открыть событие ${escapeHtml(ctx.t(event.titleKey))}"><div class="bk-event-media">${img(event.cover, 'bk-cover bk-cover-compact', ctx.t('asset.alt.cover'))}</div><div class="bk-event-main"><div class="bk-event-date-pill"><span>${escapeHtml(startsAt)}</span></div><div class="bk-event-title-block"><h3 class="bk-card-title">${ctx.t(event.titleKey)}</h3><p class="bk-meta">${ctx.t(event.typeKey)} · ${ctx.t(event.locationKey)}</p></div></div><div class="bk-event-meta-grid">${kpi(event.participants, ctx.t('events.participants'))}${kpi(ctx.t(event.statusKey), ctx.t('common.status'))}${kpi(ctx.t(event.locationKey), 'Локация')}</div><div class="bk-chip-row bk-event-chips">${badge(ctx.t(event.statusKey), statusTone)}${badge(ctx.t(event.typeKey))}</div></a><div class="bk-action-row bk-event-actions">${button(ctx.t('actions.view'), 'secondary', route)}${button(ctx.t('events.rsvp'), 'primary')}</div>`, 'bk-event-card bk-event-card-polished');
}

export function chatRow(ctx: AppContext, chat: MockChat): string {
  const trailing = chat.unread ? badge(String(chat.unread), 'warning') : badge(ctx.t('badge.trusted'), 'positive');
  return listRow(chat.title, `${ctx.t(chat.typeKey)} · ${ctx.t(chat.lastMessageKey)}`, chat.suspicious ? 'badgeWarning' : 'navChatsInactive', trailing);
}

export function chatMessages(ctx: AppContext): string {
  return messages.map((message) => {
    const body = ctx.t(message.bodyKey);
    const policy = checkLinkPolicy(body);
    return card(`<div class="bk-card-header"><div class="bk-list-row-main"><h3 class="bk-card-title">${escapeHtml(message.sender)}</h3><div class="bk-meta">${formatDateTime(message.createdAt, ctx.state.locale)}</div></div></div><p class="bk-card-body">${escapeHtml(body)}</p>${policy.hasBlockedLink || message.suspicious ? `<div class="bk-blocked-link">${ctx.t('security.linkBlocked')}</div>` : ''}`, 'bk-social-card');
  }).join('');
}

export function documentCard(ctx: AppContext, doc: MockDocument): string {
  return card(`${cardHeader(ctx.t(doc.titleKey), `${ctx.t(doc.typeKey)} · ${ctx.t('documents.version')} ${doc.version}`, doc.icon)}<div class="bk-chip-row">${badge(ctx.t(doc.statusKey), doc.statusKey.includes('approved') ? 'positive' : 'warning')}${badge(`${ctx.t('common.owner')}: ${ctx.t(doc.ownerKey)}`)}${badge(formatDateTime(doc.updatedAt, ctx.state.locale))}</div><div class="bk-action-row">${button(ctx.t('actions.view'), 'secondary', `/documents/${doc.id}`)}${button(ctx.t('actions.exportPdf'), 'ghost')}</div>`, 'bk-document-card');
}

export function complaintCard(ctx: AppContext, complaint: MockComplaint): string {
  return card(`${cardHeader(ctx.t(complaint.targetKey), `${ctx.t(complaint.reasonKey)} · ${ctx.t(complaint.priorityKey)}`, 'badgeWarning')}<div class="bk-chip-row">${badge(ctx.t(complaint.statusKey), 'warning')}</div><div class="bk-action-row">${button(ctx.t('actions.view'), 'secondary', `/moderation/complaints/${complaint.id}`)}${button(ctx.t('moderation.action.restrict'), 'danger')}</div>`, 'bk-complaint-card');
}

export function quickActionCard(ctx: AppContext, action: MockQuickAction): string {
  const diagnostics = canSeeDiagnostics(ctx) ? badge(ctx.t(action.accessKey)) : '';
  return card(`${img(action.icon, 'bk-action-icon', ctx.t('asset.alt.icon'))}<h3 class="bk-card-title">${ctx.t(action.titleKey)}</h3><p class="bk-state-copy">${ctx.t(action.copyKey)}</p><div class="bk-action-row">${diagnostics}${button(ctx.t('actions.open'), 'secondary', action.route)}</div>`, 'bk-action-card');
}

export function trustCheckCard(ctx: AppContext, check: MockTrustCheck): string {
  return `<div class="bk-trust-row"><div>${badge(ctx.t(check.titleKey), check.tone)}</div><p class="bk-state-copy">${ctx.t(check.copyKey)}</p></div>`;
}

export function offerCard(ctx: AppContext, offer: MockOffer): string {
  const owner = profiles.find((p) => p.id === offer.ownerId) ?? profiles[0];
  const ownerMeta = `${ctx.t(offer.metaKey)} · ${escapeHtml(owner.name)} · ${ctx.t(owner.profileTypeKey)}`;
  return card(`${cardHeader(ctx.t(offer.titleKey), ownerMeta, offer.icon)}${profileLinkHeader(ctx, owner, `${escapeHtml(owner.handle)} · ${ctx.t(owner.profileTypeKey)}`, 'bk-offer-owner-link')}<div class="bk-meta-chip-row">${profileMetaChips(ctx, owner, 'compact')}</div><div class="bk-action-row">${button('Профиль', 'secondary', profileRoute(owner))}${button(ctx.t('marketplace.contact'), 'primary')}</div>`, 'bk-offer-card');
}

export function auditEventRow(ctx: AppContext, event: MockAuditEvent): string {
  return `<div class="bk-audit-row"><div class="bk-audit-dot"></div><div><div class="bk-list-row-title">${ctx.t(event.titleKey)}</div><div class="bk-meta">${ctx.t(event.metaKey)} · ${ctx.t(event.actorKey)}</div></div></div>`;
}

export function statusStrip(ctx: AppContext): string {
  if (!canSeeDiagnostics(ctx)) return '';
  return card(`<div class="bk-status-strip"><div>${kpi('3', ctx.t('trust.checks'))}</div><div>${kpi(ctx.t('qa.allowed'), ctx.t('qa.guard'))}</div><div>${kpi(ctx.t('common.i18nReady'), ctx.t('common.language'))}</div></div>`, 'bk-status-card');
}