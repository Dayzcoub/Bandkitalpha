// A sanction limits what an account may do; a lifecycle status says whether the account
// is alive at all. They used to share `users.status`, which is why neither had a state
// machine — see migration 0023.
//
// Sanctioned: reading generally stays available to 'read_only'/'restricted'; writing does
// not. Terminal: an anonymized account can do nothing; a deactivated one cannot act until
// it comes back.
const WRITE_BLOCKING_SANCTIONS = new Set(['read_only', 'restricted', 'blocked']);
const INACTIVE_STATUSES = new Set(['deactivated', 'anonymized']);

// Denied outright: the account is gone, switched off, or blocked. Nothing is available,
// not even the safety affordances.
function isDenied(actor) {
  return Boolean(
    !actor
    || !actor.id
    || INACTIVE_STATUSES.has(actor.status)
    || actor.sanction === 'blocked'
  );
}

// Cannot write: everything above, plus the softer sanctions. A 'restricted' or
// 'read_only' account keeps reading and keeps the safety affordances (reporting), but
// stops producing content — Moderation Rules, "restrict user action".
//
// Note: 'read_only' was NOT in the old SANCTIONED_STATUSES, so a read-only account could
// write. Nothing ever set that status, so it never bit; it is fixed here rather than
// carried over.
function isBarred(actor) {
  return Boolean(isDenied(actor) || WRITE_BLOCKING_SANCTIONS.has(actor.sanction));
}

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
    return !isBarred(actor);
  }

  // Entity visibility levels come from the CHECK in migration 0002 and mean what
  // they say: 'public' is readable by anyone including guests, 'registered' by any
  // signed-in account, and 'members'/'private' only by an active member. The
  // membership is passed in, not looked up, so this stays a pure decision and the
  // route owns the query.
  canViewEntity(actor, entity, membership = null) {
    if (!entity || entity.status === 'deleted' || entity.status === 'anonymized') {
      return false;
    }

    if (entity.visibility === 'public') {
      return true;
    }

    if (entity.visibility === 'registered') {
      return Boolean(actor && actor.id);
    }

    return Boolean(actor && actor.id && membership && membership.status === 'active');
  }

  // Managing your own individual party (e.g. your professions) only requires an
  // active account; the party is always derived from the session, never input.
  canManageOwnParty(actor) {
    return !isDenied(actor);
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
    if (isBarred(actor) || !room || room.status !== 'active') {
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
    // Deliberately isDenied, not isBarred: a restricted account keeps the ability to
    // report. Taking safety tools from a sanctioned user punishes them for being
    // sanctioned and silences a possible victim.
    return !isDenied(actor);
  }

  // Triaging/acting on reports is platform moderation staff only. Entity admins
  // moderate inside their entity separately; a read-only auditor cannot act.
  canModeratePlatform(actor) {
    return Boolean(actor && ['super_admin', 'platform_admin', 'platform_moderator'].includes(actor.platform_role));
  }

  // Subscribing to an entity feed is a read-side affordance: any account that is
  // not blocked/deleted may follow. Subscription never grants workspace access.
  canSubscribe(actor) {
    return !isDenied(actor);
  }

  // Publishing an entity post requires a managing role in the entity AND an
  // unsanctioned account (Feed Rules: "restricted/read-only users cannot post").
  canPublishEntityPost(actor, membership) {
    return Boolean(!isBarred(actor) && this.canManageEntity(actor, membership));
  }

  // Social interactions (comments, reactions) are open to any unsanctioned
  // account; post visibility is checked separately at the route.
  canInteractSocially(actor) {
    return !isBarred(actor);
  }

  // Opening the canonical personal dialogue with another user. Opening is not the
  // right to post: the first message from a stranger belongs in a message request
  // (Conversation Lifecycle §2), which is a separate slice — this only decides
  // whether the room may exist.
  //
  // A dialogue with oneself is forbidden (§1); any future "Saved messages" is a
  // separate system object, not this.
  canOpenPersonalConversation(actor, target) {
    return Boolean(
      actor
      && actor.id
      && !isBarred(actor)
      && target
      && target.id
      && target.id !== actor.id
      && !isDenied(target)
    );
  }

  // May `actor` put a first message in front of `target` at all (Conversation
  // Lifecycle §2)? This decides whether a message request may be created, not whether
  // the message reaches the inbox — an allowed stranger still lands in a request.
  //
  // `sharedContext` is computed by the route (shared active entity membership or
  // shared event participation), because it is a query, not a decision.
  //
  // 'circle' is in the spec but not here: it needs the friends domain, which has no
  // schema yet. It is absent from dm_policies rather than quietly aliased to
  // something else.
  canRequestPersonalContact(actor, target, sharedContext) {
    if (isBarred(actor)) return false;
    if (!target || !target.id || target.id === actor.id) return false;

    switch (target.dm_policy) {
      case 'everyone':
        return true;
      case 'verified':
        return Boolean(actor.email_verified);
      case 'shared_context':
        return Boolean(sharedContext);
      case 'nobody':
        return false;
      default:
        // An unknown policy fails closed. The FK to dm_policies makes this
        // unreachable, which is the point of the FK.
        return false;
    }
  }

  // Reading the platform owner console. It is read-only, so every staff role may
  // look — read_only_auditor exists for exactly this — but nobody outside staff
  // may: these screens expose the whole user registry and the audit log.
  canReadAdminConsole(actor) {
    return Boolean(
      actor
      && actor.id
      && !isBarred(actor)
      && PLATFORM_STAFF_ROLES.has(actor.platform_role)
    );
  }
}

export const permissionService = new PermissionService();
