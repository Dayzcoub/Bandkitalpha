// Account statuses under a moderation sanction (restrict/suspend) or gone.
// Reading generally stays available to 'restricted'; writing does not.
const SANCTIONED_STATUSES = new Set(['restricted', 'blocked', 'deleted']);

// Platform staff roles, mirroring the users.platform_role CHECK in migration
// 0003 (Owner Console spec, "Access model").
const PLATFORM_STAFF_ROLES = new Set([
  'super_admin',
  'platform_admin',
  'platform_moderator',
  'support_agent',
  'read_only_auditor'
]);

export class PermissionService {
  canCreateEntity(actor) {
    return Boolean(actor && actor.id && !SANCTIONED_STATUSES.has(actor.status));
  }

  canViewEntity(actor, entity) {
    if (!entity || entity.status === 'deleted' || entity.status === 'anonymized') {
      return false;
    }

    if (entity.visibility === 'public' || entity.visibility === 'registered') {
      return true;
    }

    return Boolean(actor && actor.id);
  }

  // Managing your own individual party (e.g. your professions) only requires an
  // active account; the party is always derived from the session, never input.
  canManageOwnParty(actor) {
    return Boolean(actor && actor.id && actor.status !== 'blocked' && actor.status !== 'deleted');
  }

  canManageEntity(actor, membership) {
    if (!actor || !actor.id || !membership || membership.status !== 'active') {
      return false;
    }

    return ['owner', 'admin', 'manager'].includes(membership.role);
  }

  // Creating events for an entity requires a managing membership in that entity.
  canCreateEvent(actor, membership) {
    return this.canManageEntity(actor, membership);
  }

  // Reading a room requires an active/read-only membership in it, and the room
  // must not be hidden. Room membership is the tenant boundary here (IDOR is the
  // primary risk — Security Standard §2).
  canViewRoom(actor, membership, room) {
    if (!actor || !actor.id || !room || room.status === 'hidden') {
      return false;
    }
    return Boolean(membership && ['active', 'read_only'].includes(membership.status));
  }

  // Posting requires an active membership (read_only members cannot write), an
  // active room (read_only/archived/hidden rooms reject writes), and an
  // unsanctioned account — a moderation-restricted user loses write access
  // (Moderation Rules: "restrict user action").
  canWriteMessage(actor, membership, room) {
    if (!actor || !actor.id || SANCTIONED_STATUSES.has(actor.status) || !room || room.status !== 'active') {
      return false;
    }
    return Boolean(membership && membership.status === 'active');
  }

  // Moderating a room (e.g. pinning messages) requires an active managing
  // membership (owner/admin/manager) in an active room.
  canModerateRoom(actor, membership, room) {
    if (!actor || !actor.id || !room || room.status !== 'active') {
      return false;
    }
    return Boolean(membership && membership.status === 'active'
      && ['owner', 'admin', 'manager'].includes(membership.role));
  }

  // Creating a document under an entity requires a managing membership.
  canCreateDocument(actor, membership) {
    return this.canManageEntity(actor, membership);
  }

  // Viewing an entity's documents requires an active membership in that entity.
  // Fine-grained per-document ACLs (document_permissions) are a later slice.
  canViewEntityDocuments(actor, membership) {
    return Boolean(actor && actor.id && membership && membership.status === 'active');
  }

  canExportDocument() {
    return false;
  }

  // Recording a reliability event about an engagement's counterparty is an
  // organizer-side action: it requires a managing membership in the event's
  // owning entity (Reputation Rules: records come from verified collaboration
  // context, the organizer/participant relationship — not arbitrary visitors).
  canRecordReliabilityEvent(actor, membership) {
    return this.canManageEntity(actor, membership);
  }

  // Reading an engagement's reliability records is manager-scoped for now; the
  // public/party-level reputation summary is a later, anti-abuse-gated slice.
  canViewReliabilityEvents(actor, membership) {
    return this.canManageEntity(actor, membership);
  }

  // Any active account can file a moderation report (Moderation Rules: reporting
  // is a safety affordance available to users, not a privileged action).
  canFileReport(actor) {
    return Boolean(actor && actor.id && actor.status !== 'blocked' && actor.status !== 'deleted');
  }

  // Triaging/acting on reports is platform moderation staff only. Entity admins
  // moderate inside their entity separately; a read-only auditor cannot act.
  canModeratePlatform(actor) {
    return Boolean(actor && ['super_admin', 'platform_admin', 'platform_moderator'].includes(actor.platform_role));
  }

  // Subscribing to an entity feed is a read-side affordance: any account that is
  // not blocked/deleted may follow. Subscription never grants workspace access.
  canSubscribe(actor) {
    return Boolean(actor && actor.id && actor.status !== 'blocked' && actor.status !== 'deleted');
  }

  // Publishing an entity post requires a managing role in the entity AND an
  // unsanctioned account (Feed Rules: "restricted/read-only users cannot post").
  canPublishEntityPost(actor, membership) {
    return Boolean(actor && !SANCTIONED_STATUSES.has(actor.status) && this.canManageEntity(actor, membership));
  }

  // Social interactions (comments, reactions) are open to any unsanctioned
  // account; post visibility is checked separately at the route.
  canInteractSocially(actor) {
    return Boolean(actor && actor.id && !SANCTIONED_STATUSES.has(actor.status));
  }

  // Reading the platform owner console. It is read-only, so every staff role may
  // look — read_only_auditor exists for exactly this — but nobody outside staff
  // may: these screens expose the whole user registry and the audit log.
  canReadAdminConsole(actor) {
    return Boolean(
      actor
      && actor.id
      && !SANCTIONED_STATUSES.has(actor.status)
      && PLATFORM_STAFF_ROLES.has(actor.platform_role)
    );
  }
}

export const permissionService = new PermissionService();
