# BandKit — Backend Development Principles v1.0

## Status

Accepted backend architecture guardrails.

This document fixes the backend development principles that must guide implementation after the chat policy and infrastructure planning pass.

Related accepted documents:

- `BandKit_Chat_Policy_Accepted_Checkpoint_1_10_13.md`
- `BandKit_Backend_PostgreSQL_VPS_Infrastructure_Plan_v1_0.md`
- `BandKit_Backend_Production_Readiness_Risk_Register_v1_0.md`

---

## 1. Backend must be modular from day one

Do not build one large backend file or API handlers that talk directly to the database everywhere.

Recommended module layout:

```text
src/
  modules/
    auth/
    users/
    chats/
    projects/
    events/
    documents/
    notifications/
    moderation/
    permissions/
    audit/
  services/
  repositories/
  policies/
  workers/
  migrations/
```

Core rule:

- routes/controllers handle HTTP shape;
- services hold business logic;
- repositories/data-access layer talks to database;
- policies/permissions decide what is allowed;
- workers handle async jobs later.

Accepted rule:

> No direct business-critical database logic scattered across random route handlers.

---

## 2. API versioning

All backend APIs should be versioned from the start.

Recommended base path:

```text
/api/v1/...
```

Reasons:

- allows future API changes without breaking clients;
- allows gradual migration from mock UI to real backend;
- allows mobile app/API clients later.

Examples:

```text
/api/v1/health
/api/v1/auth/session
/api/v1/chats/rooms
/api/v1/chats/rooms/:roomId/messages
/api/v1/projects/:projectId
/api/v1/events/:eventId
/api/v1/documents/:documentId
```

---

## 3. Standard error format

Backend errors must be predictable for frontend and future mobile apps.

Recommended response shape:

```json
{
  "error": {
    "code": "CHAT_ACCESS_DENIED",
    "message": "Нет доступа к чату",
    "details": {}
  }
}
```

Required error code families:

- `AUTH_REQUIRED`
- `ACCESS_DENIED`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `CHAT_ACCESS_DENIED`
- `CHAT_ACCESS_REVOKED`
- `MESSAGE_EDIT_WINDOW_EXPIRED`
- `MESSAGE_DELETE_FORBIDDEN`
- `ENTITY_DOCUMENT_EXPORT_FORBIDDEN`
- `ENTITY_MEMBERSHIP_REQUIRED`
- `READ_ONLY_RESTRICTION`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_ERROR`

Accepted rule:

> Frontend must not depend on fragile raw error text. It should use stable error codes.

---

## 4. Feature flags

BandKit needs feature flags because the product is large and will migrate from mock UI to real backend in stages.

Feature flag examples:

- real backend chat;
- mock fallback;
- attachments;
- entity documents;
- message reports;
- important messages;
- acknowledgements;
- public discussions;
- push notifications;
- WebSocket realtime;
- admin/moderation tools.

Rules:

- feature flags can be environment-based at first;
- do not expose unfinished production features by accident;
- staging can enable experimental flags;
- production defaults must be conservative.

---

## 5. Mock-to-real backend migration

Current frontend contains mock/UI-ready logic. Backend implementation must migrate it deliberately.

Areas to migrate:

- users;
- rooms;
- messages;
- pinned messages;
- delete/edit states;
- attachments;
- documents;
- roles;
- permissions;
- reports;
- acknowledgements;
- system messages.

Rules:

- frontend mock state is not backend truth;
- mock data must be environment-gated;
- real backend state must come from API/database;
- transition should happen feature by feature;
- do not remove mock fallbacks until real flow is stable in staging.

Accepted rule:

> Mock behavior can guide UX, but production state must live in backend/database.

---

## 6. Seed and fixture separation

Seed/demo/test data must be separated by environment.

Seed types:

- local dev seed;
- staging seed;
- demo seed;
- automated test seed;
- production seed.

Production seed must be minimal:

- base roles;
- system settings;
- first controlled admin/bootstrap flow;
- required reference data.

Production must not include:

- mock chat rooms;
- stress messages;
- fake users;
- demo events;
- demo documents;
- test fixtures.

Accepted rule:

> Test fixtures and demo data must never load in production.

---

## 7. PermissionService / PolicyResolver first

BandKit policies are too complex to implement ad hoc.

A central permission resolver is mandatory.

Required future methods:

```text
canViewRoom
canWriteMessage
canEditMessage
canDeleteMessage
canHideMessage
canPinMessage
canAttachFile
canForwardDocument
canExportDocument
canMentionUser
canAcknowledgeMessage
canViewDocument
canManageMembers
canCreateImportantMessage
canCreateSystemAction
```

Rules:

- UI may hide actions, but backend must enforce them;
- every sensitive API calls PermissionService;
- document permissions and chat permissions must be connected;
- parent entity membership must drive entity-bound chat access;
- WebSocket subscriptions must use the same resolver.

Accepted rule:

> Policies live in backend, not only in frontend.

---

## 8. Policy tests are high priority

The hardest part of BandKit backend is not storing data. It is enforcing rules correctly.

Policy tests should cover:

- former project participant cannot see related chats;
- event participant can write in event chat;
- viewer/follower cannot write in event working chat;
- read-only user cannot write/reply/quote/attach;
- platform-level restricted user cannot access chats;
- personal restriction blocks direct interaction but not shared working visibility;
- regular user cannot export rider/contract/document outside entity;
- event manager can export event document;
- group/project admin can export project document;
- event message cannot be deleted for everyone by normal participant;
- direct message can be deleted for everyone within 40 minutes;
- free group message can be edited within 5 minutes;
- entity-bound message edit expires after 2 minutes;
- reported message cannot be destroyed by normal deletion;
- archived room is read-only.

Accepted rule:

> Permission and policy tests are required before production-grade backend.

---

## 9. Audit-first approach

Sensitive actions must create audit events.

Audit-worthy events:

- role changes;
- membership changes;
- message hide/delete by admin/moderator;
- message report;
- document external export;
- document permission change;
- event participation change;
- important message creation;
- acknowledgement requirement;
- safety/moderation action;
- platform-level restriction;
- read-only restriction;
- production admin action.

Rules:

- audit should include actor, target, entity, timestamp, reason and action type;
- audit events should be append-only;
- normal users see only allowed compact system messages;
- admins/moderators see permitted audit details.

Accepted rule:

> If an action affects access, accountability, moderation or documents, assume it needs audit.

---

## 10. Jobs and workers

Do not overload synchronous API requests with every side effect.

Chat send should eventually work like:

1. validate permission;
2. save message;
3. return success;
4. async notification fanout;
5. async search indexing;
6. async audit/event processing;
7. async push delivery;
8. async attachment processing.

Future worker areas:

- email/push notifications;
- message search indexing;
- file preview/thumbnail generation;
- upload cleanup;
- archive retention;
- backup checks;
- moderation queue events;
- document export audit processing.

Accepted rule:

> API should stay responsive; heavy side effects move to jobs/workers as the backend grows.

---

## 11. Admin and moderation tools are part of the backend plan

Policies are useless if nobody can operate them.

Future admin/moderator tools need:

- report queue;
- message context viewer;
- hide message with reason;
- user restrictions/read-only controls;
- role management;
- membership management;
- document export audit viewer;
- system events viewer;
- activity/audit log;
- ability to resolve/escalate cases.

Accepted rule:

> Moderation/admin capabilities must be planned alongside backend APIs, not added as an afterthought.

---

## 12. Data ownership model

Backend must understand who owns or controls each data type.

Data ownership examples:

- direct message: participants with privacy restrictions;
- free group message: room context;
- project message: project entity;
- event message: event entity;
- group/orchestra document: group/project entity;
- event rider/document: event entity;
- report: moderation/safety context;
- rating/reputation event: platform + related entity context;
- system message: generated from source action.

Why it matters:

- account deletion;
- data export;
- access after leaving entity;
- moderation preservation;
- document confidentiality;
- retention policy.

Accepted rule:

> Store parent entity and ownership context explicitly for sensitive records.

---

## 13. Localization-ready backend

BandKit will need localization. Backend should not hardcode user-facing system text only in Russian.

System messages should be stored as type + payload.

Preferred storage:

```json
{
  "type": "event_rescheduled",
  "payload": {
    "old_time": "18:00",
    "new_time": "19:30"
  }
}
```

Frontend or notification layer can render localized text:

```text
Событие перенесено: 18:00 → 19:30
```

Rules:

- error codes are stable and language-neutral;
- system messages are typed;
- notification templates are localizable;
- audit events store structured payload;
- do not store only pre-rendered Russian text when the event must be reused in multiple languages.

Accepted rule:

> Store events structurally; render language-specific text at the edge.

---

## 14. API and realtime access must match

HTTP and WebSocket paths must enforce the same access rules.

Rules:

- WebSocket room subscribe checks PermissionService;
- permission changes revoke active realtime subscriptions;
- user removal from entity triggers room access revocation;
- read-only state updates client capabilities;
- platform-level restriction closes/restricts active sessions where policy requires.

Accepted rule:

> Realtime is not a separate permission universe.

---

## 15. Backend implementation order

Recommended order:

1. backend skeleton;
2. `/api/v1/health`;
3. environment/config loader;
4. logger;
5. PostgreSQL connection;
6. migration tool;
7. basic user/auth skeleton;
8. PermissionService skeleton;
9. chat room/message schema;
10. chat API MVP;
11. document model split: attachment vs entity document;
12. system message model;
13. audit event model;
14. websocket prototype;
15. report/moderation MVP.

Do not start with a large complex feature before health/config/migrations/permissions are in place.

---

## Accepted backend development decision

BandKit backend development must follow these principles:

- modular architecture;
- `/api/v1` versioning;
- stable error codes;
- feature flags;
- deliberate mock-to-real migration;
- strict seed separation;
- central PermissionService/PolicyResolver;
- policy tests;
- audit-first design;
- async jobs/workers for side effects;
- admin/moderation tooling planned early;
- explicit data ownership;
- localization-ready system messages;
- matching HTTP/WebSocket permissions;
- implementation starts with skeleton, health, config, database and migrations before complex features.
