# BandKit — Accepted Product Architecture Checkpoint 1.10.14

## Status

Accepted product architecture checkpoint.

This checkpoint gathers the current accepted BandKit product, chat, policy, backend, infrastructure and monetization decisions into one navigation document.

Latest accepted architecture commit before this checkpoint note:

- `b564f5b` — `Document entity lifecycle and social rules framework`

---

## Repository state

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS preview: `http://141.98.87.9`
- Previous chat policy checkpoint: `1.10.13 chat policy accepted checkpoint`
- New architecture checkpoint: `1.10.14 product architecture accepted checkpoint`

---

## Current product direction

BandKit is a social/work platform for music collaboration.

It combines familiar social-platform patterns with stricter professional rules for:

- musicians;
- technicians;
- managers;
- organizers;
- bands/groups/orchestras;
- solo artists;
- projects;
- organizations;
- events/rehearsals/concerts;
- working chats;
- riders, setlists, offers, contracts, receipts and schedules;
- participation and invitations;
- declines, replacements and no-shows;
- reliability/reputation;
- moderation and safety;
- entity-based permissions.

Accepted principle:

> Use familiar social-network behavior where possible, but apply stricter BandKit rules when an action affects work, documents, obligations, safety, reputation or audit.

---

## Accepted documents index

### Chat and communication policies

- `BandKit_Chat_Policy_Accepted_Checkpoint_1_10_13.md`
- `BandKit_Chat_Exit_And_Membership_Rules_v1_0.md`
- `BandKit_Chat_Message_Delete_Rules_v1_0.md`
- `BandKit_Chat_Message_Edit_Rules_v1_0.md`
- `BandKit_Chat_Access_Notifications_Attachments_Archive_Rules_v1_0.md`
- `BandKit_Chat_Advanced_Governance_Rules_v1_0.md`
- `BandKit_Chat_Message_Actions_Accepted_Checkpoint_1_10_12.md`

### Platform/product policies

- `BandKit_Platform_Policy_Framework_v1_0.md`
- `BandKit_Platform_Roles_And_Permissions_v1_0.md`
- `BandKit_Platform_Entity_Lifecycle_And_Social_Rules_Framework_v1_0.md`
- `BandKit_Monetization_Entity_Features_Policy_v1_0.md`

### Backend/infrastructure policies

- `BandKit_Backend_PostgreSQL_VPS_Infrastructure_Plan_v1_0.md`
- `BandKit_Backend_Production_Readiness_Risk_Register_v1_0.md`
- `BandKit_Backend_Development_Principles_v1_0.md`

---

## Accepted chat model

Chat is not only casual messaging. It is a communication layer around different contexts:

- direct chats;
- free group chats;
- project/entity chats;
- event working chats;
- safety/moderation chats;
- admin/role rooms.

Accepted rules:

- direct chats are softer and familiar;
- free group chats behave like normal group chats;
- entity/event chats are stricter working contexts;
- public discussion is separate from working chat;
- chat permissions come from parent entity/event where relevant;
- entity/event working chats preserve accountability;
- deletion/editing is stricter in entity-bound chats;
- important messages can require acknowledgement;
- system messages preserve operational timeline;
- reports preserve original content and context.

---

## Accepted message action state

Current accepted UI/action checkpoint:

- message actions are small muted links;
- desktop shows actions on hover/focus;
- mobile shows actions on long tap;
- current frontend pin/delete behavior is mock/UI-ready;
- backend persistence is not implemented yet;
- future implementation must follow accepted chat policies.

Accepted current functional commit for message action style:

- `43a5ff3` — `Sync contextual chat message action styles`

---

## Accepted access and permission model

Permissions are contextual and layered.

Permission layers:

1. platform status;
2. social relationship;
3. entity role;
4. event role;
5. object-specific permission;
6. moderation/safety state.

Accepted principle:

> Global role is not the same as entity role, event role or chat/document permission.

Backend must enforce permissions through a central `PermissionService / PolicyResolver`.

Frontend may hide actions for UX, but backend is the source of truth.

---

## Accepted entity model

BandKit entities include:

- user profile;
- solo artist entity;
- band/group;
- orchestra;
- project;
- organization;
- event;
- document;
- post/comment;
- chat room;
- invitation/application;
- report/moderation case;
- reliability/reputation event.

Entities must not be treated only as visual UI objects. They define permissions, lifecycle and access rules.

---

## Accepted lifecycle model

### User lifecycle

```text
registered -> verified -> active -> restricted/read-only -> blocked -> deleted/anonymized
```

### Entity lifecycle

```text
draft -> active -> paused -> archived -> deleted/anonymized
```

### Event lifecycle

```text
draft -> published -> recruiting -> confirmed -> in_progress -> completed -> archived
                           └-> cancelled/rescheduled
```

### Document lifecycle

```text
draft -> active -> versioned/updated -> archived -> revoked/deleted
```

Accepted principle:

> Lifecycle state controls visibility, permissions, chats, documents, notifications and archive behavior.

---

## Accepted document model

Documents are first-class entity records, not just chat attachments.

Protected document types:

- rider;
- setlist;
- offer;
- contract draft;
- receipt/act;
- schedule;
- technical plan;
- booking/payment-related file;
- event file;
- group/project file.

Accepted rules:

- entity documents stay inside the entity by default;
- regular participants cannot externally export entity documents;
- event managers/organizers can export event documents where policy allows;
- group/project admins/managers can export entity documents where policy allows;
- export must be auditable later;
- deleting a chat message does not delete an entity document;
- documents should support versions where important.

---

## Accepted invitations and participation model

Users enter entity/event working contexts through membership/participation, not by direct chat invite.

Invitation/application lifecycle:

```text
created -> sent -> accepted/declined/revoked/expired
```

Participation states:

```text
invited -> applied -> accepted/confirmed -> declined -> removed -> completed
                                      └-> replaced/no_show/late_cancel
```

Accepted principles:

- accepted membership/participation grants working access;
- declined/revoked/expired invitations do not grant access;
- former participants/members lose working chat/document access;
- reliability impact must be fair and dispute-friendly.

---

## Accepted reputation direction

Reputation and reliability must be based on verified collaboration context, not arbitrary social attacks.

Future reputation layers:

- public reputation summary;
- private event feedback;
- verified reliability events;
- moderation-confirmed incidents;
- positive participation history.

Accepted principles:

- feedback opens after real collaboration/event completion;
- no-show and late cancellation must be based on participation records;
- valid reasons, replacements and disputes must be supported;
- one angry user must not be able to destroy a profile.

---

## Accepted monetization direction

Every user can create an entity for free and get a real starter package.

Free starter package may include:

- entity profile;
- basic team/member management;
- basic roles;
- entity calendar;
- creating events;
- invitations;
- basic document storage;
- basic administration;
- working chats;
- basic notifications.

Paid expansion focuses on professional entity capabilities:

- rider wizard;
- offer wizard;
- contract drafting assistant;
- branded PDF export;
- versioned document packages;
- advanced event planning;
- advanced roles/admin tools;
- expanded storage/history;
- verified entity profile;
- automation/AI-assist tools.

Accepted financial boundary:

- no in-platform payments in MVP;
- no escrow;
- no commission from gigs;
- no settlement engine;
- future financial module only after legal/business/accounting review.

---

## Accepted backend/infrastructure direction

Current VPS is development/staging/preview infrastructure in near-real conditions.

It is not final production infrastructure.

Current staging stack:

```text
Development/Staging VPS
├─ Nginx
├─ frontend static build
├─ backend API service later
├─ PostgreSQL for dev/staging data
├─ Redis/Valkey later if needed
└─ local backup scripts
```

Accepted backend/database direction:

- PostgreSQL on current VPS for staging/MVP;
- PostgreSQL not publicly exposed;
- backend connects through `127.0.0.1`;
- `/api` proxy later;
- `/ws` proxy later;
- staging data is not production truth;
- public launch must move to production hosting/datacenter/cloud/managed environment;
- architecture must avoid hard lock-in to one VPS.

---

## Accepted backend development principles

Backend implementation must follow:

- modular architecture;
- `/api/v1` versioning;
- stable error codes;
- feature flags;
- deliberate mock-to-real migration;
- strict seed separation;
- central `PermissionService / PolicyResolver`;
- policy tests;
- audit-first design;
- async jobs/workers for heavy side effects;
- admin/moderation tools planned early;
- explicit data ownership;
- localization-ready system messages;
- matching HTTP/WebSocket permissions.

Recommended implementation order:

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
11. document model split;
12. system message model;
13. audit event model;
14. websocket prototype;
15. report/moderation MVP.

---

## Accepted production readiness risks

Before public launch, BandKit must address:

- local/staging/production separation;
- secret handling;
- backup and restore drill;
- logs and monitoring;
- rate limits;
- auth/sessions/2FA;
- storage lifecycle;
- PermissionService/PolicyResolver;
- WebSocket access revocation;
- push notification privacy;
- production data separation;
- legal/product policy docs;
- mock vs production separation;
- async jobs and queues.

---

## Do not regress

Do not revert these accepted decisions:

- current VPS is staging/preview, not final production;
- PostgreSQL is accepted for staging/MVP backend path;
- backend permissions must be central, not ad hoc;
- no universal chat policy for every context;
- no normal delete-for-everyone in entity/event working chats;
- no external export of entity documents by regular participants;
- public discussion is separate from working chat;
- entity documents are first-class records, not just attachments;
- important event/project messages can require acknowledgement;
- reputation must be collaboration-based and dispute-friendly;
- monetization is entity-feature expansion, not gig payment processing;
- mock/test data must not enter production;
- production launch requires separate infrastructure, backups, monitoring, legal pages and moderation tools.

---

## Recommended next specs

Next detailed specs should be created from the accepted framework:

1. `BandKit_Documents_And_Entity_Files_Policy_v1_0.md`
2. `BandKit_Reputation_And_Reliability_Rules_v1_0.md`
3. `BandKit_Platform_Moderation_And_Safety_Rules_v1_0.md`
4. `BandKit_Account_Data_Privacy_Deletion_Export_Rules_v1_0.md`
5. `BandKit_Feed_Posts_Comments_Public_Discussions_Rules_v1_0.md`
6. `BandKit_Production_Launch_Checklist_v1_0.md`

---

## Handoff summary

Continue BandKit from repo `Dayzcoub/Bandkitalpha`, branch `main`.

Latest accepted architecture commit before checkpoint note:

- `b564f5b` — `Document entity lifecycle and social rules framework`

Current accepted checkpoint:

- `1.10.14 product architecture accepted checkpoint`

The current foundation includes accepted chat policies, platform policy framework, roles/permissions, lifecycle/social framework, entity-feature monetization, backend/VPS infrastructure plan, production risk register and backend development principles.
