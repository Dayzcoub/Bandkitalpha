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
    // `deleted` — единственный терминал сущности (F3, 0030). `anonymized` здесь больше
    // не проверяется не потому, что его забыли: у сущности его не бывает — имя группы не
    // её приватность, а несущая конструкция чужой истории.
    if (!entity || entity.status === 'deleted') {
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
  // A sanctioned account loses it — writing someone else's reputation is content
  // production, and "restrict user action" (Moderation Rules) means no writes,
  // same bar as canWriteMessage/canCreateEntity.
  canRecordReliabilityEvent(actor, membership) {
    return !isBarred(actor) && this.canManageEntity(actor, membership);
  }

  // Reading an engagement's reliability records is manager-scoped for now; the
  // public/party-level reputation summary is a later, anti-abuse-gated slice.
  canViewReliabilityEvents(actor, membership) {
    return this.canManageEntity(actor, membership);
  }

  // Resolving a dispute (upheld/retracted) is an organizer-side authority action
  // — a write — so a sanctioned manager loses it, same bar as recording. Staff
  // resolution is decided by platform role at the route, not through this path.
  canResolveReliabilityDispute(actor, membership) {
    return !isBarred(actor) && this.canManageEntity(actor, membership);
  }

  // Opening a dispute contests a record about YOURSELF — a defensive affordance,
  // not content production. Like reporting (canFileReport), a 'restricted' subject
  // keeps it: only a denied account (blocked/inactive) loses it. Barring restricted
  // here would silence someone defending their own reputation.
  canOpenReliabilityDispute(actor) {
    return !isDenied(actor);
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

  // Does `actor` satisfy `policy` with respect to the subject who chose it? This is the
  // whole privacy dictionary and it is deliberately axis-blind (F2, Privacy Model §3):
  // the axis says which door, the policy says who passes any door. Every value here
  // describes the actor↔subject relationship and nothing about the object behind the
  // door, which is why one evaluator serves every axis without becoming the god-object
  // D8 forbids — the meaning of an axis stays in its domain, one caller below.
  //
  // `context` carries what only a query can answer — { sharedContext, isFriend } —
  // because those are lookups, not decisions. Adding a policy value means adding a case
  // here; adding an axis means neither.
  satisfiesPolicy(actor, policy, context = {}) {
    switch (policy) {
      case 'everyone':
        return true;
      case 'verified':
        return Boolean(actor.email_verified);
      case 'shared_context':
        return Boolean(context.sharedContext);
      case 'circle':
        // The personal graph, deliberately not the working one: you can share a band
        // with someone and not be their friend, and be their friend without sharing any
        // project. Mixing them is what the friends spec forbids ("these systems must not
        // be mixed") — and aliasing 'circle' to shared_context would hand the working
        // graph the keys to the setting people choose to keep it out.
        return Boolean(context.isFriend);
      case 'nobody':
        return false;
      default:
        // Unknown, or an axis that resolved to nothing, fails closed. The composite FK
        // in 0029 makes an unknown value unstorable, which is the point of the FK; null
        // arrives here only if the axis itself is gone, and a policy that does not
        // resolve must not mean "anyone".
        return false;
    }
  }

  // May `actor` put a first message in front of `target` at all (Conversation
  // Lifecycle §2)? This decides whether a message request may be created, not whether
  // the message reaches the inbox — an allowed stranger still lands in a request.
  //
  // `policy` is the resolved `dm` axis, passed in rather than read off `target`: since
  // 0029 it is not a column on `users` but a row that may not exist (absent = the axis
  // default). Resolving it is a query, and this stays a pure decision.
  canRequestPersonalContact(actor, target, policy, context = {}) {
    if (isBarred(actor)) return false;
    if (!target || !target.id || target.id === actor.id) return false;
    return this.satisfiesPolicy(actor, policy, context);
  }

  // May `actor` ask `target` to be friends (`friend_request` axis, F2)? Until 0029 this
  // question had no answer at all: the route existed from 0026 and let anyone request
  // anyone. Same evaluator, different door.
  //
  // Note what the dictionary cannot express here: `circle` is not an option for this
  // axis (0029), because "only friends may ask to be friends" is not a strict setting
  // but a contradiction. The composite FK, not this method, is what enforces that.
  canRequestFriendship(actor, target, policy, context = {}) {
    if (isBarred(actor)) return false;
    if (!target || !target.id || target.id === actor.id) return false;
    return this.satisfiesPolicy(actor, policy, context);
  }

  // Может ли эта Party быть контрагентом ангажемента (F4)? До 0030 этого не спрашивал
  // никто: `POST /events/:eventId/engagements` брал `counterparty_party_id` из тела, а FK
  // гарантировал только существование строки `parties` — но не то, что за ней кто-то жив.
  // Ангажировать удалённую группу было можно.
  //
  // Это и есть та дыра, ради которой хотелось завести `parties.status`. Она закрывается
  // вопросом к субъекту, а не колонкой: Party — указатель (см. `partySubject.js`).
  //
  // `subject` приходит из `loadPartySubject`, не читается здесь: запрос принадлежит
  // маршруту, решение — сервису.
  //
  // ВНИМАНИЕ, ЗДЕСЬ ЛОВУШКА. Обе ветки сходятся на строке 'active', и это СОВПАДЕНИЕ, а не
  // общий словарь: у `users` не-active означает «ушёл» (deactivated | anonymized), у
  // `entities` — четыре разные вещи (draft — ещё не запущена, paused — временно молчит,
  // archived — история, deleted — ушла). Совпадение ответа не делает словари одним
  // словарём; не «упрощать» это в приведение статусов и не заводить общий enum (D11).
  canEngageParty(subject) {
    return Boolean(subject) && subject.subject_status === 'active';
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
