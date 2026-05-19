import type { AppContext } from '../../app/types.js';
import { card, cardHeader, badge, button, img, listRow, kpi } from '../ui/primitives.js';
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

export function postCard(ctx: AppContext, post: MockPost): string {
  const author = profiles.find((p) => p.id === post.authorId) ?? profiles[0];
  const body = ctx.t(post.bodyKey);
  const linkPolicy = checkLinkPolicy(body);
  const warning = linkPolicy.hasBlockedLink ? `<div class="bk-blocked-link">${ctx.t('security.linkBlocked')}</div>` : '';
  const flag = post.flagged ? badge(ctx.t('badge.warning'), 'warning') : badge(ctx.t(post.scopeKey));
  return card(`${cardHeader(author.name, `${author.handle} · ${ctx.t(author.profileTypeKey)} · ${ctx.t(post.scopeKey)} · ${formatDateTime(post.createdAt, ctx.state.locale)}`, author.avatar)}<div class="bk-card-body"><p>${escapeHtml(body)}</p>${warning}</div><footer class="bk-action-row bk-social-actions"><span>${flag}</span>${button(`${ctx.t('feed.like')} · ${formatNumber(post.likes, ctx.state.locale)}`, 'ghost')}${button(`${ctx.t('feed.comment')} · ${formatNumber(post.comments, ctx.state.locale)}`, 'ghost')}${button(`${ctx.t('feed.repost')} · ${formatNumber(post.reposts, ctx.state.locale)}`, 'ghost')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</footer>`, 'bk-social-card');
}

function profileStatusBadges(ctx: AppContext, profile: MockProfile): string {
  return profile.statusBadges.map((item) => badge(ctx.t(item.labelKey), item.tone)).join('');
}

export function profileHeader(ctx: AppContext, profile: MockProfile): string {
  return card(`${img('coverProfile', 'bk-cover', ctx.t('asset.alt.cover'))}<div class="bk-card-header bk-profile-head">${img(profile.avatar, 'bk-avatar bk-avatar-lg', ctx.t('asset.alt.avatar'))}<div><h2 class="bk-title">${escapeHtml(profile.name)}</h2><div class="bk-meta">${escapeHtml(profile.handle)} · ${ctx.t(profile.roleKey)} · ${ctx.t(profile.profileTypeKey)} · ${escapeHtml(profile.city)}</div><div class="bk-chip-row">${profileStatusBadges(ctx, profile)}${badge(ctx.t(profile.trustLevelKey), 'positive')}${badge(ctx.t(profile.availabilityKey))}</div></div></div><div class="bk-kpi-grid"><div class="bk-kpi"><div class="bk-kpi-value">${formatNumber(profile.reputation, ctx.state.locale)}</div><div class="bk-kpi-label">${ctx.t('profile.rating')}</div></div><div class="bk-kpi"><div class="bk-kpi-value">${ctx.t(profile.subscriptionTierKey)}</div><div class="bk-kpi-label">${ctx.t('subscription.currentTier')}</div></div><div class="bk-kpi"><div class="bk-kpi-value">${ctx.t(profile.profileTypeKey)}</div><div class="bk-kpi-label">${ctx.t('profile.profileType')}</div></div></div><div class="bk-action-row">${button(ctx.t('profile.contact'), 'primary')}${button(ctx.t('profile.invite'), 'secondary')}</div>`, 'bk-profile-card');
}

export function profileCompactCard(ctx: AppContext, profile: MockProfile): string {
  return card(`${cardHeader(profile.name, `${ctx.t(profile.profileTypeKey)} · ${escapeHtml(profile.city)}`, profile.avatar)}<div class="bk-chip-row">${profileStatusBadges(ctx, profile)}${badge(ctx.t(profile.trustLevelKey), 'positive')}${badge(`${ctx.t('profile.rating')}: ${formatNumber(profile.reputation, ctx.state.locale)}`, 'positive')}${badge(ctx.t(profile.availabilityKey))}</div><div class="bk-action-row">${button(ctx.t('profile.contact'), 'secondary')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div>`, 'bk-compact-card');
}

export function bandCard(ctx: AppContext, band: MockBand): string {
  return card(`${img(band.cover, 'bk-cover', ctx.t('asset.alt.cover'))}<div class="bk-card-header bk-card-header-tight"><div><h3 class="bk-card-title">${escapeHtml(band.name)}</h3><div class="bk-meta">${ctx.t(band.typeKey)} · ${band.members} ${ctx.t('bands.members')}</div></div></div><div class="bk-chip-row">${badge(ctx.t(band.statusKey), band.statusKey.includes('active') ? 'positive' : 'warning')}${badge(ctx.t(band.roleKey))}</div><div class="bk-action-row">${button(ctx.t('actions.view'), 'secondary', `/bands/${band.id}`)}${button(ctx.t('actions.invite'), 'ghost')}</div>`, 'bk-band-card');
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
  return card(`${img(action.icon, 'bk-action-icon', ctx.t('asset.alt.icon'))}<h3 class="bk-card-title">${ctx.t(action.titleKey)}</h3><p class="bk-state-copy">${ctx.t(action.copyKey)}</p><div class="bk-action-row">${badge(ctx.t(action.accessKey))}${button(ctx.t('actions.open'), 'secondary', action.route)}</div>`, 'bk-action-card');
}

export function trustCheckCard(ctx: AppContext, check: MockTrustCheck): string {
  return `<div class="bk-trust-row"><div>${badge(ctx.t(check.titleKey), check.tone)}</div><p class="bk-state-copy">${ctx.t(check.copyKey)}</p></div>`;
}

export function offerCard(ctx: AppContext, offer: MockOffer): string {
  const owner = profiles.find((p) => p.id === offer.ownerId) ?? profiles[0];
  return card(`${cardHeader(ctx.t(offer.titleKey), `${ctx.t(offer.metaKey)} · ${owner.name} · ${ctx.t(owner.profileTypeKey)}`, offer.icon)}<div class="bk-chip-row">${profileStatusBadges(ctx, owner)}${badge(ctx.t(offer.trustKey), 'positive')}${badge(`${ctx.t('profile.rating')}: ${formatNumber(owner.reputation, ctx.state.locale)}`, 'positive')}</div><div class="bk-action-row">${button(ctx.t('marketplace.contact'), 'primary')}${button(ctx.t('actions.report'), 'danger', '/complaints/new')}</div>`, 'bk-offer-card');
}

export function auditEventRow(ctx: AppContext, event: MockAuditEvent): string {
  return `<div class="bk-audit-row"><div class="bk-audit-dot"></div><div><div class="bk-list-row-title">${ctx.t(event.titleKey)}</div><div class="bk-meta">${ctx.t(event.metaKey)} · ${ctx.t(event.actorKey)}</div></div></div>`;
}

export function statusStrip(ctx: AppContext): string {
  return card(`<div class="bk-status-strip"><div>${kpi('3', ctx.t('trust.checks'))}</div><div>${kpi(ctx.t('qa.allowed'), ctx.t('qa.guard'))}</div><div>${kpi(ctx.t('common.i18nReady'), ctx.t('common.language'))}</div></div>`, 'bk-status-card');
}