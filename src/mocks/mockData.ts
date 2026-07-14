import type { AssetKey } from '../lib/assets/assetRegistry.js';
import type { MockChatPolicyPreview } from './chatPolicy.js';
import { mockChatPolicyForRoom } from './chatPolicy.js';

export type MockBadgeTone = 'neutral' | 'positive' | 'warning' | 'danger';

export interface MockProfileBadge {
  labelKey: string;
  tone: MockBadgeTone;
}

export interface MockProfile {
  id: string;
  name: string;
  handle: string;
  roleKey: string;
  profileTypeKey: string;
  subscriptionTierKey: string;
  statusBadges: MockProfileBadge[];
  avatar: AssetKey;
  reputation: number;
  city: string;
  availabilityKey: string;
  trustLevelKey: string;
}

export interface MockPost {
  id: string;
  authorId: string;
  bodyKey: string;
  scopeKey: string;
  createdAt: string;
  flagged?: boolean;
  likes: number;
  comments: number;
  reposts: number;
}

export interface MockBand {
  id: string;
  name: string;
  typeKey: string;
  members: number;
  cover: AssetKey;
  statusKey: string;
  roleKey: string;
}

export interface MockEvent {
  id: string;
  titleKey: string;
  typeKey: string;
  startsAt: string;
  participants: number;
  statusKey: string;
  locationKey: string;
  cover: AssetKey;
}

export interface MockChat {
  id: string;
  title: string;
  typeKey: string;
  unread: number;
  suspicious?: boolean;
  lastMessageKey: string;
  policy: MockChatPolicyPreview;
}

export interface MockDocument {
  id: string;
  titleKey: string;
  typeKey: string;
  version: string;
  icon: AssetKey;
  statusKey: string;
  ownerKey: string;
  updatedAt: string;
}

export interface MockComplaint {
  id: string;
  targetKey: string;
  reasonKey: string;
  priorityKey: string;
  statusKey: string;
}

export interface MockMessage {
  id: string;
  sender: string;
  bodyKey: string;
  createdAt: string;
  suspicious?: boolean;
}

export interface MockQuickAction {
  id: string;
  titleKey: string;
  copyKey: string;
  route: string;
  icon: AssetKey;
  accessKey: string;
}

export interface MockTrustCheck {
  id: string;
  titleKey: string;
  copyKey: string;
  tone: MockBadgeTone;
}

export interface MockOffer {
  id: string;
  titleKey: string;
  metaKey: string;
  ownerId: string;
  icon: AssetKey;
  trustKey: string;
}

export interface MockAuditEvent {
  id: string;
  titleKey: string;
  metaKey: string;
  actorKey: string;
}

export const profiles: MockProfile[] = [
  {
    id: 'p1',
    name: 'Alex Rhythm',
    handle: '@alex-rhythm',
    roleKey: 'profile.role.musician',
    profileTypeKey: 'profile.type.soloPerformer',
    subscriptionTierKey: 'profile.tier.freeBasic',
    statusBadges: [
      { labelKey: 'badge.verified', tone: 'positive' },
      { labelKey: 'profile.type.soloPerformer', tone: 'neutral' },
      { labelKey: 'profile.tier.freeBasic', tone: 'neutral' },
    ],
    avatar: 'avatarGuitarist',
    reputation: 92,
    city: 'Helsinki',
    availabilityKey: 'mock.profile.availability.open',
    trustLevelKey: 'mock.trust.verifiedMember',
  },
  {
    id: 'p2',
    name: 'Mira Voice',
    handle: '@mira-voice',
    roleKey: 'profile.role.musician',
    profileTypeKey: 'profile.type.soloPerformer',
    subscriptionTierKey: 'profile.tier.performerPremium',
    statusBadges: [
      { labelKey: 'badge.verified', tone: 'positive' },
      { labelKey: 'profile.type.soloPerformer', tone: 'neutral' },
      { labelKey: 'profile.tier.performerPremium', tone: 'warning' },
    ],
    avatar: 'avatarVocalist',
    reputation: 96,
    city: 'Tallinn',
    availabilityKey: 'mock.profile.availability.session',
    trustLevelKey: 'mock.trust.trustedPro',
  },
  {
    id: 'p3',
    name: 'Nikita Sound',
    handle: '@nikita-sound',
    roleKey: 'profile.role.sound_engineer',
    profileTypeKey: 'profile.type.technicalSpecialist',
    subscriptionTierKey: 'profile.tier.performerPro',
    statusBadges: [
      { labelKey: 'badge.verified', tone: 'positive' },
      { labelKey: 'profile.type.technicalSpecialist', tone: 'neutral' },
      { labelKey: 'profile.tier.performerPro', tone: 'warning' },
    ],
    avatar: 'avatarSound',
    reputation: 89,
    city: 'Riga',
    availabilityKey: 'mock.profile.availability.busy',
    trustLevelKey: 'mock.trust.verifiedMember',
  },
];

const defaultForeignProfile = profiles[1];
const mockProfilesById = new Map(profiles.map((profile) => [profile.id, profile]));

Object.defineProperty(profiles, '1', {
  configurable: true,
  enumerable: true,
  get() {
    if (typeof window === 'undefined') return defaultForeignProfile;
    const match = window.location.pathname.match(/^\/profile\/([^/]+)$/);
    if (!match?.[1]) return defaultForeignProfile;
    return mockProfilesById.get(decodeURIComponent(match[1])) ?? defaultForeignProfile;
  },
});

export const posts: MockPost[] = [
  { id: 'post-1', authorId: 'p1', scopeKey: 'mock.post.scope.band', createdAt: '2026-05-18T12:30:00Z', bodyKey: 'mock.post.body.rehearsal', likes: 18, comments: 4, reposts: 2 },
  { id: 'post-2', authorId: 'p2', scopeKey: 'mock.post.scope.studio', createdAt: '2026-05-17T18:15:00Z', bodyKey: 'mock.post.body.drummerSearch', likes: 31, comments: 9, reposts: 5 },
  { id: 'post-3', authorId: 'p3', scopeKey: 'mock.post.scope.security', createdAt: '2026-05-16T10:05:00Z', bodyKey: 'mock.post.body.suspicious', flagged: true, likes: 2, comments: 1, reposts: 0 },
  { id: 'post-4', authorId: 'p1', scopeKey: 'mock.post.scope.band', createdAt: '2026-05-15T19:40:00Z', bodyKey: 'mock.post.body.rehearsal', likes: 24, comments: 7, reposts: 3 },
  { id: 'post-5', authorId: 'p2', scopeKey: 'mock.post.scope.studio', createdAt: '2026-05-15T14:20:00Z', bodyKey: 'mock.post.body.drummerSearch', likes: 42, comments: 11, reposts: 6 },
  { id: 'post-6', authorId: 'p3', scopeKey: 'mock.post.scope.band', createdAt: '2026-05-14T21:10:00Z', bodyKey: 'mock.post.body.rehearsal', likes: 16, comments: 5, reposts: 1 },
  { id: 'post-7', authorId: 'p1', scopeKey: 'mock.post.scope.studio', createdAt: '2026-05-14T11:00:00Z', bodyKey: 'mock.post.body.drummerSearch', likes: 28, comments: 8, reposts: 4 },
  { id: 'post-8', authorId: 'p2', scopeKey: 'mock.post.scope.band', createdAt: '2026-05-13T18:35:00Z', bodyKey: 'mock.post.body.rehearsal', likes: 37, comments: 10, reposts: 2 },
  { id: 'post-9', authorId: 'p3', scopeKey: 'mock.post.scope.band', createdAt: '2026-05-12T20:15:00Z', bodyKey: 'mock.post.body.rehearsal', likes: 21, comments: 6, reposts: 2 },
  { id: 'post-10', authorId: 'p2', scopeKey: 'mock.post.scope.studio', createdAt: '2026-05-12T15:05:00Z', bodyKey: 'mock.post.body.drummerSearch', likes: 33, comments: 12, reposts: 5 },
  { id: 'post-11', authorId: 'p1', scopeKey: 'mock.post.scope.band', createdAt: '2026-05-11T22:25:00Z', bodyKey: 'mock.post.body.rehearsal', likes: 19, comments: 4, reposts: 1 },
  { id: 'post-12', authorId: 'p2', scopeKey: 'mock.post.scope.studio', createdAt: '2026-05-11T13:45:00Z', bodyKey: 'mock.post.body.drummerSearch', likes: 26, comments: 7, reposts: 3 },
];

export const bands: MockBand[] = [
  { id: 'b1', name: 'Northern Lights Band', typeKey: 'bands.type.bandProject', members: 5, cover: 'coverBand', statusKey: 'bands.status.active', roleKey: 'bands.role.owner' },
  { id: 'b2', name: 'City Orchestra Lab', typeKey: 'bands.type.orchestra', members: 32, cover: 'coverOrchestra', statusKey: 'bands.status.recruiting', roleKey: 'bands.role.member' },
  { id: 'b3', name: 'Studio Night Crew', typeKey: 'bands.type.sessionCrew', members: 8, cover: 'coverStudio', statusKey: 'bands.status.private', roleKey: 'bands.role.manager' },
];

export const events: MockEvent[] = [
  { id: 'e1', titleKey: 'mock.event.mainRehearsal', typeKey: 'events.rehearsal', startsAt: '2026-05-25T17:00:00Z', participants: 6, statusKey: 'events.status.confirmed', locationKey: 'mock.location.rehearsalRoom', cover: 'coverRehearsal' },
  { id: 'e2', titleKey: 'mock.event.clubShow', typeKey: 'events.concert', startsAt: '2026-06-02T20:30:00Z', participants: 12, statusKey: 'events.status.draft', locationKey: 'mock.location.clubStage', cover: 'coverConcert' },
  { id: 'e3', titleKey: 'mock.event.studioSession', typeKey: 'events.session', startsAt: '2026-06-09T14:00:00Z', participants: 4, statusKey: 'events.status.pending', locationKey: 'mock.location.studioA', cover: 'coverStudio' },
];

export const chats: MockChat[] = [
  { id: 'c1', title: 'Northern Lights Band', typeKey: 'chats.group', unread: 3, lastMessageKey: 'mock.chat.last.rehearsalMoved', policy: mockChatPolicyForRoom('c1') },
  { id: 'c2', title: 'Mira Voice', typeKey: 'chats.direct', unread: 0, lastMessageKey: 'mock.chat.last.vocalFiles', policy: mockChatPolicyForRoom('c2') },
  { id: 'c3', title: 'Suspicious outreach sample', typeKey: 'chats.direct', unread: 1, suspicious: true, lastMessageKey: 'mock.chat.last.suspicious', policy: mockChatPolicyForRoom('c3') },
];

export const messages: MockMessage[] = [
  { id: 'm1', sender: 'Mira Voice', bodyKey: 'mock.message.rehearsalMove', createdAt: '2026-05-18T09:00:00Z' },
  { id: 'm2', sender: 'Alex Rhythm', bodyKey: 'mock.message.eventUpdated', createdAt: '2026-05-18T09:03:00Z' },
  { id: 'm3', sender: 'Suspicious account', bodyKey: 'mock.message.suspicious', createdAt: '2026-05-18T09:05:00Z', suspicious: true },
];

export const documents: MockDocument[] = [
  { id: 'd1', titleKey: 'mock.document.rider', typeKey: 'documents.rider', version: 'v3', icon: 'docRider', statusKey: 'documents.status.approved', ownerKey: 'mock.workspaceName', updatedAt: '2026-05-18T13:00:00Z' },
  { id: 'd2', titleKey: 'mock.document.contract', typeKey: 'documents.contract', version: 'v1', icon: 'docContract', statusKey: 'documents.status.review', ownerKey: 'mock.band.northernLights', updatedAt: '2026-05-16T11:15:00Z' },
  { id: 'd3', titleKey: 'mock.document.setlist', typeKey: 'documents.setlist', version: 'v2', icon: 'docSetlist', statusKey: 'documents.status.draft', ownerKey: 'mock.event.clubShow', updatedAt: '2026-05-15T19:20:00Z' },
];

export const complaints: MockComplaint[] = [
  { id: 'q1', targetKey: 'mock.complaint.target.post', reasonKey: 'moderation.reason.fraud', priorityKey: 'moderation.priority.high', statusKey: 'moderation.status.new' },
  { id: 'q2', targetKey: 'mock.complaint.target.chat', reasonKey: 'moderation.reason.spam', priorityKey: 'moderation.priority.medium', statusKey: 'moderation.status.review' },
];

export const notifications = [
  { id: 'n1', titleKey: 'notifications.eventInvite', metaKey: 'mock.event.mainRehearsal', icon: 'navEventsInactive' as AssetKey },
  { id: 'n2', titleKey: 'notifications.roleRequest', metaKey: 'mock.band.northernLights', icon: 'navProjectsInactive' as AssetKey },
  { id: 'n3', titleKey: 'mock.notification.securityReview', metaKey: 'mock.trust.antiFraud', icon: 'badgeWarning' as AssetKey },
];

export const quickActions: MockQuickAction[] = [
  { id: 'qa-post', titleKey: 'quick.post.title', copyKey: 'quick.post.copy', route: '/feed', icon: 'navFeedInactive', accessKey: 'access.user' },
  { id: 'qa-band', titleKey: 'quick.band.title', copyKey: 'quick.band.copy', route: '/bands', icon: 'roleGroup', accessKey: 'access.verified' },
  { id: 'qa-event', titleKey: 'quick.event.title', copyKey: 'quick.event.copy', route: '/events', icon: 'navEventsInactive', accessKey: 'access.verified' },
  { id: 'qa-doc', titleKey: 'quick.document.title', copyKey: 'quick.document.copy', route: '/documents', icon: 'docRider', accessKey: 'access.user' },
];

export const trustChecks: MockTrustCheck[] = [
  { id: 'trust-verify', titleKey: 'trust.check.verification.title', copyKey: 'trust.check.verification.copy', tone: 'positive' },
  { id: 'trust-links', titleKey: 'trust.check.links.title', copyKey: 'trust.check.links.copy', tone: 'warning' },
  { id: 'trust-reports', titleKey: 'trust.check.reports.title', copyKey: 'trust.check.reports.copy', tone: 'positive' },
];

export const marketplaceOffers: MockOffer[] = [
  { id: 'offer-1', titleKey: 'mock.offer.drummer', metaKey: 'mock.offer.meta.session', ownerId: 'p2', icon: 'roleDrummer', trustKey: 'mock.trust.trustedPro' },
  { id: 'offer-2', titleKey: 'mock.offer.sound', metaKey: 'mock.offer.meta.concert', ownerId: 'p3', icon: 'roleSoundEngineer', trustKey: 'mock.trust.verifiedMember' },
  { id: 'offer-3', titleKey: 'mock.offer.studio', metaKey: 'mock.offer.meta.studio', ownerId: 'p1', icon: 'roleStudio', trustKey: 'mock.trust.verifiedMember' },
];

export const auditEvents: MockAuditEvent[] = [
  { id: 'audit-1', titleKey: 'audit.permissionChecked', metaKey: 'audit.meta.routeGuard', actorKey: 'audit.actor.system' },
  { id: 'audit-2', titleKey: 'audit.moderationViewed', metaKey: 'audit.meta.moderatorQueue', actorKey: 'audit.actor.moderator' },
  { id: 'audit-3', titleKey: 'audit.created', metaKey: 'audit.meta.mockEvent', actorKey: 'audit.actor.user' },
];
