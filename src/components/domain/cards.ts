import type { AppContext } from '../../app/types.js';
import { card, cardHeader, badge, button, img, listRow, kpi } from '../ui/primitives.js';
import { canSeeDiagnostics } from '../../lib/permissions/diagnostics.js';
import { checkLinkPolicy, escapeHtml } from '../../lib/security/linkPolicy.js';
import { formatDateTime, formatNumber } from '../../lib/format/format.js';
import {
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

function profileLinkHeader(ctx: AppContext, profile: MockProfile, meta: string, extraClass = ''): string {
  const route = profileRoute(profile);
  const className = `bk-card-header bk-profile-link${extraClass ? ` ${extraClass}` : ''}`;
  return `<a class="${className}" href="${route}" data-route="${route}" aria-label="Открыть профиль ${escapeHtml(profile.name)}">${img(profile.avatar, 'bk-avatar', ctx.t('asset.alt.avatar'))}<div><h3 class="bk-card-title">${escapeHtml(profile.name)}</h3><div class="bk-meta">${meta}</div></div></a>`;
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
  if (feed.subscriptionState === 'subscribed') return { label: '⚙ Уведомления', variant: 'ghost' };
  if (feed.subscriptionState === 'request') return { label: 'Запросить', variant: 'primary' };
  return { label: 'Подписаться', variant: 'primary' };
}

function entityFeedPreview(ctx: AppContext, band: MockBand, mode: 'compact' | 'full'): string {
  const feed = entityFeedMock(band);
  const diagnostics = canSeeDiagnostics(ctx);
  const primaryAction = entityPrimaryAction(feed);
  const meta = diagnostics ? feed.adminMeta : feed.latestMeta;
  const headChips = diagnostics
    ? `${entitySubscriptionBadge(ctx, feed.subscriptionState)}${badge(feed.visibility)}${badge(feed.notificationLevel)}`
    : feed.subscriptionState === 'subscribed' ? badge('Подписан', 'positive') : '';
  const headChipsHtml = headChips ? `<div class="bk-chip-row">${headChips}</div>` : '';
  const policyChips = diagnostics ? `<div class="bk-chip-row">${badge('Public')}${badge('Subscribers')}${badge('Members locked', 'warning')}</div>` : '';
  const eyebrow = diagnostics ? '<div class="bk-eyebrow">Entity public feed</div>' : '';

  if (mode === 'compact') {
    const stats = `${feed.subscribers} подписчиков · ${formatNumber(feed.posts, ctx.state.locale)} постов · ${feed.notificationLabel}`;
    return `<section class="bk-entity-feed-preview bk-entity-feed-preview-compact"><div class="bk-entity-feed-head"><div>${eyebrow}<h4 class="bk-card-title">${escapeHtml(feed.latestTitle)}</h4><p class="bk-meta">${escapeHtml(meta)}</p></div>${headChipsHtml}</div><p class="bk-state-copy">${escapeHtml(feed.shortBody)}</p><div class="bk-entity-feed-stats">${escapeHtml(stats)}</div></section>`;
  }

  return `<section class="bk-entity-feed-preview"><div class="bk-entity-feed-head"><div>${eyebrow}<h4 class="bk-card-title">${escapeHtml(feed.latestTitle)}</h4><p class="bk-meta">${escapeHtml(meta)}</p></div>${headChipsHtml}</div><p class="bk-state-copy">${escapeHtml(feed.latestBody)}</p><div class="bk-kpi-grid bk-entity-kpi-grid">${kpi(feed.subscribers, 'Подписчики')}${kpi(feed.posts, 'Посты')}${kpi(feed.notificationLabel, 'Уведомления')}</div><div class="bk-entity-feed-policy"><span>Подписка не даёт членство, доступ к workspace, приватным чатам и документам.</span>${policyChips}</div><div class="bk-action-row bk-entity-actions">${button(primaryAction.label, primaryAction.variant)}${button('Открыть ленту', 'secondary', `/bands/${band.id}`)}${button('Заглушить', 'ghost')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div></section>`;
}

export function postCard(ctx: AppContext, post: MockPost): string {
  const author = profiles.find((p) => p.id === post.authorId) ?? profiles[0];
  const body = ctx.t(post.bodyKey);
  const linkPolicy = checkLinkPolicy(body);
  const warning = linkPolicy.hasBlockedLink ? `<div class="bk-blocked-link">${ctx.t('security.linkBlocked')}</div>` : '';
  const flag = post.flagged ? badge(ctx.t('badge.warning'), 'warning') : badge(ctx.t(post.scopeKey));
  const authorMeta = `${escapeHtml(author.handle)} · ${ctx.t(author.profileTypeKey)} · ${ctx.t(post.scopeKey)} · ${formatDateTime(post.createdAt, ctx.state.locale)}`;
  return card(`${profileLinkHeader(ctx, author, authorMeta)}<div class="bk-card-body"><p>${escapeHtml(body)}</p>${warning}</div><footer class="bk-action-row bk-social-actions"><span>${flag}</span>${button(`${ctx.t('feed.like')} · ${formatNumber(post.likes, ctx.state.locale)}`, 'ghost')}${button(`${ctx.t('feed.comment')} · ${formatNumber(post.comments, ctx.state.locale)}`, 'ghost')}${button(`${ctx.t('feed.repost')} · ${formatNumber(post.reposts, ctx.state.locale)}`, 'ghost')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</footer>`, 'bk-social-card');
}

function profileStatusBadges(ctx: AppContext, profile: MockProfile): string {
  return profile.statusBadges.map((item) => badge(ctx.t(item.labelKey), item.tone)).join('');
}

function profilePublicStatusBadges(ctx: AppContext, profile: MockProfile): string {
  const diagnostics = canSeeDiagnostics(ctx);
  const source = diagnostics ? profile.statusBadges : profile.statusBadges.filter((item) => item.labelKey === 'badge.verified');
  return source.map((item) => badge(ctx.t(item.labelKey), item.tone)).join('');
}

function profileRelationshipActions(ctx: AppContext, profile: MockProfile): string {
  const isOwnProfile = ctx.path === '/profile/me' || profile.id === ctx.state.currentUser?.profileId;
  if (isOwnProfile) {
    return `<div class="bk-action-row bk-profile-social-actions">${button(ctx.t('feed.createPost'), 'primary', '/feed')}${button('Редактировать профиль', 'secondary', '/settings')}${button('Настройки приватности', 'ghost', '/settings')}</div>`;
  }
  return `<div class="bk-action-row bk-profile-social-actions">${button('Добавить в друзья', 'primary')}${button('Подписаться', 'secondary')}${button(ctx.t('profile.contact'), 'ghost')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div>`;
}

function profileBackControl(isOwnProfile: boolean): string {
  if (isOwnProfile) return '';
  return `<div class="bk-profile-return-row"><button class="bk-button bk-button-ghost bk-profile-return-button" type="button" data-history-back aria-label="Вернуться назад">← Назад</button><span>Вернуться к просмотру с того же места</span></div>`;
}

export function profileHeader(ctx: AppContext, profile: MockProfile): string {
  const isOwnProfile = ctx.path === '/profile/me' || profile.id === ctx.state.currentUser?.profileId;
  const diagnostics = canSeeDiagnostics(ctx);
  const relationshipBadge = isOwnProfile ? badge('Мой профиль', 'positive') : badge('Не в друзьях');
  const feedStateBadge = isOwnProfile ? badge('Лента: друзья + подписки', 'positive') : badge('Публичная лента');
  const feedPolicyChips = diagnostics ? `<div class="bk-chip-row">${badge('Public')}${badge('Friends')}${badge('Workspace')}${badge('Draft')}</div>` : '';
  return card(`${profileBackControl(isOwnProfile)}${img('coverProfile', 'bk-cover', ctx.t('asset.alt.cover'))}<div class="bk-card-header bk-profile-head">${img(profile.avatar, 'bk-avatar bk-avatar-lg', ctx.t('asset.alt.avatar'))}<div><h2 class="bk-title">${escapeHtml(profile.name)}</h2><div class="bk-meta">${escapeHtml(profile.handle)} · ${ctx.t(profile.roleKey)} · ${ctx.t(profile.profileTypeKey)} · ${escapeHtml(profile.city)}</div><div class="bk-chip-row">${profileStatusBadges(ctx, profile)}${badge(ctx.t(profile.trustLevelKey), 'positive')}${badge(ctx.t(profile.availabilityKey))}${relationshipBadge}${feedStateBadge}</div></div></div><div class="bk-kpi-grid bk-profile-social-kpis"><div class="bk-kpi"><div class="bk-kpi-value">${formatNumber(profile.reputation, ctx.state.locale)}</div><div class="bk-kpi-label">${ctx.t('profile.rating')}</div></div><div class="bk-kpi"><div class="bk-kpi-value">128</div><div class="bk-kpi-label">Друзья</div></div><div class="bk-kpi"><div class="bk-kpi-value">2.4K</div><div class="bk-kpi-label">Подписчики</div></div><div class="bk-kpi"><div class="bk-kpi-value">36</div><div class="bk-kpi-label">Посты</div></div></div><section class="bk-profile-feed-policy"><div><strong>Личная лента</strong><span>Посты идут по времени публикации. Приватные черновики видит только автор.</span></div>${feedPolicyChips}</section>${profileRelationshipActions(ctx, profile)}`, 'bk-profile-card bk-profile-social-card');
}

export function profileCompactCard(ctx: AppContext, profile: MockProfile): string {
  const diagnostics = canSeeDiagnostics(ctx);
  const diagnosticsBadge = diagnostics ? badge('Подписка доступна') : '';
  return card(`${profileLinkHeader(ctx, profile, `${ctx.t(profile.profileTypeKey)} · ${escapeHtml(profile.city)}`)}<div class="bk-chip-row">${profilePublicStatusBadges(ctx, profile)}${badge(ctx.t(profile.trustLevelKey), 'positive')}${badge(ctx.t(profile.availabilityKey))}${diagnosticsBadge}</div><div class="bk-action-row bk-profile-compact-actions">${button('Профиль', 'secondary', profileRoute(profile))}${button('Добавить в друзья', 'secondary')}${button('Подписаться', 'ghost')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div>`, 'bk-compact-card');
}

export function bandCard(ctx: AppContext, band: MockBand): string {
  const feed = entityFeedMock(band);
  const diagnostics = canSeeDiagnostics(ctx);
  const isDetail = Boolean(ctx.match.params.bandId);
  const entityDebugBadge = diagnostics ? badge('Entity feed') : '';
  const roleBadge = diagnostics ? badge(ctx.t(band.roleKey)) : '';
  const subscriptionBadge = diagnostics || feed.subscriptionState === 'subscribed' ? entitySubscriptionBadge(ctx, feed.subscriptionState) : '';
  const route = `/bands/${band.id}`;
  const summary = `${img(band.cover, 'bk-cover', ctx.t('asset.alt.cover'))}<div class="bk-card-header bk-card-header-tight"><div><h3 class="bk-card-title">${escapeHtml(band.name)}</h3><div class="bk-meta">${ctx.t(band.typeKey)} · ${band.members} ${ctx.t('bands.members')}</div></div></div><div class="bk-chip-row">${badge(ctx.t(band.statusKey), band.statusKey.includes('active') ? 'positive' : 'warning')}${roleBadge}${subscriptionBadge}${entityDebugBadge}</div>${entityFeedPreview(ctx, band, isDetail ? 'full' : 'compact')}`;
  const surface = isDetail ? summary : `<a class="bk-band-card-link-surface" href="${route}" data-route="${route}" aria-label="Открыть ${escapeHtml(band.name)}">${summary}</a>`;
  const primaryAction = entityPrimaryAction(feed);
  return card(`${surface}<div class="bk-action-row bk-band-card-actions">${button(ctx.t('actions.view'), 'secondary', route)}${button(primaryAction.label, primaryAction.variant)}${button(ctx.t('actions.invite'), 'ghost')}</div>`, 'bk-band-card bk-entity-card');
}

export function eventCard(ctx: AppContext, event: MockEvent): string {
  return card(`${img(event.cover, 'bk-cover bk-cover-compact', ctx.t('asset.alt.cover'))}${cardHeader(ctx.t(event.titleKey), `${ctx.t(event.typeKey)} · ${formatDateTime(event.startsAt, ctx.state.locale)}`, 'navEventsInactive')}<div class="bk-chip-row">${badge(ctx.t(event.statusKey), event.statusKey.includes('confirmed') ? 'positive' : 'warning')}${badge(`${event.participants} ${ctx.t('events.participants')}`)}${badge(ctx.t(event.locationKey))}</div><div class="bk-action-row">${button(ctx.t('actions.view'), 'secondary', `/events/${event.id}`)}${button(ctx.t('events.rsvp'), 'primary')}</div>`, 'bk-event-card');
}

export function chatRow(ctx: AppContext, chat: MockChat): string {
  const trailing = chat.unread ? badge(String(chat.unread), 'warning') : badge(ctx.t('badge.trusted'), 'positive');
  return listRow(chat.title, `${ctx.t(chat.typeKey)} · ${ctx.t(chat.lastMessageKey)}`, chat.suspicious ? 'badgeWarning' : 'navChatsInactive', trailing);
}

export function chatMessages(ctx: AppContext): string {
  return messages.map((message) => {
    const body = ctx.t(message.bodyKey);
    const policy = checkLinkPolicy(body);
    return card(`<div class="bk-card-header"><div class="bk-list-row-main"><h3 class="bk-card-title">${escapeHtml(message.sender)}</h3><div class="bk-meta">${formatDateTime(message.createdAt, ctx.state.locale)}</div></div>${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div><p class="bk-card-body">${escapeHtml(body)}</p>${policy.hasBlockedLink || message.suspicious ? `<div class="bk-blocked-link">${ctx.t('security.linkBlocked')}</div>` : ''}`, 'bk-social-card');
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
  return card(`${cardHeader(ctx.t(offer.titleKey), ownerMeta, offer.icon)}${profileLinkHeader(ctx, owner, `${escapeHtml(owner.handle)} · ${ctx.t(owner.profileTypeKey)}`, 'bk-offer-owner-link')}<div class="bk-chip-row">${profilePublicStatusBadges(ctx, owner)}${badge(ctx.t(offer.trustKey), 'positive')}${badge(`${ctx.t('profile.rating')}: ${formatNumber(owner.reputation, ctx.state.locale)}`, 'positive')}</div><div class="bk-action-row">${button('Профиль', 'secondary', profileRoute(owner))}${button(ctx.t('marketplace.contact'), 'primary')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div>`, 'bk-offer-card');
}

export function auditEventRow(ctx: AppContext, event: MockAuditEvent): string {
  return `<div class="bk-audit-row"><div class="bk-audit-dot"></div><div><div class="bk-list-row-title">${ctx.t(event.titleKey)}</div><div class="bk-meta">${ctx.t(event.metaKey)} · ${ctx.t(event.actorKey)}</div></div></div>`;
}

export function statusStrip(ctx: AppContext): string {
  if (!canSeeDiagnostics(ctx)) return '';
  return card(`<div class="bk-status-strip"><div>${kpi('3', ctx.t('trust.checks'))}</div><div>${kpi(ctx.t('qa.allowed'), ctx.t('qa.guard'))}</div><div>${kpi(ctx.t('common.i18nReady'), ctx.t('common.language'))}</div></div>`, 'bk-status-card');
}