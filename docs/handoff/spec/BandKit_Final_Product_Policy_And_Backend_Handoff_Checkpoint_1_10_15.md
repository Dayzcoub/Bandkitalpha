# BandKit — Final Product Policy and Backend Handoff Checkpoint 1.10.15

## Status

Accepted final policy/backend handoff checkpoint before implementation.

This document is the current top-level entry point for BandKit product policies, chat rules, backend principles, staging infrastructure, MVP scope and launch readiness.

Latest accepted commit before this checkpoint note:

- `62aae00` — `Document production launch checklist`

---

## Repository state

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS preview/staging: `http://141.98.87.9`
- Current final handoff checkpoint: `1.10.15 final product policy and backend handoff`

---

## Product positioning

BandKit should not be positioned primarily as “another social network for musicians”.

Accepted positioning:

> BandKit is a working platform for music projects: team, events, documents, riders, chats and confirmations in one place.

BandKit uses familiar social platform logic where possible, but applies stricter rules when an action affects:

- working participation;
- event logistics;
- entity documents;
- contracts/offers/riders/schedules;
- accountability;
- reputation;
- safety;
- audit.

---

## MVP scope lock

MVP focuses on proving this core workflow:

```text
entity + team + event + document + working chat + acknowledgement
```

MVP includes:

- user/profile baseline;
- free entity creation;
- basic team and roles;
- entity event creation;
- working chat connected to entity/event;
- documents connected to entity/event;
- important message / acknowledgement concept;
- basic permission enforcement;
- staging backend foundation.

MVP excludes:

- platform payments;
- escrow;
- gig commissions;
- marketplace;
- broad public social feed as core launch feature;
- complex reputation automation;
- legal contract workflow;
- native mobile apps;
- full AI automation as a core dependency.

---

## Accepted specs index

### Top-level product checkpoints

- `BandKit_Product_Architecture_Accepted_Checkpoint_1_10_14.md`
- `BandKit_MVP_Scope_And_Product_Positioning_v1_0.md`
- `BandKit_Final_Product_Policy_And_Backend_Handoff_Checkpoint_1_10_15.md`

### Platform policies

- `BandKit_Platform_Policy_Framework_v1_0.md`
- `BandKit_Platform_Roles_And_Permissions_v1_0.md`
- `BandKit_Platform_Entity_Lifecycle_And_Social_Rules_Framework_v1_0.md`
- `BandKit_Monetization_Entity_Features_Policy_v1_0.md`
- `BandKit_Documents_And_Entity_Files_Policy_v1_0.md`
- `BandKit_Reputation_And_Reliability_Rules_v1_0.md`
- `BandKit_Platform_Moderation_And_Safety_Rules_v1_0.md`
- `BandKit_Account_Data_Privacy_Deletion_Export_Rules_v1_0.md`
- `BandKit_Feed_Posts_Comments_Public_Discussions_Rules_v1_0.md`

### Chat policies

- `BandKit_Chat_Policy_Accepted_Checkpoint_1_10_13.md`
- `BandKit_Chat_Exit_And_Membership_Rules_v1_0.md`
- `BandKit_Chat_Message_Delete_Rules_v1_0.md`
- `BandKit_Chat_Message_Edit_Rules_v1_0.md`
- `BandKit_Chat_Access_Notifications_Attachments_Archive_Rules_v1_0.md`
- `BandKit_Chat_Advanced_Governance_Rules_v1_0.md`
- `BandKit_Chat_Message_Actions_Accepted_Checkpoint_1_10_12.md`

### Backend / infrastructure / launch

- `BandKit_Backend_PostgreSQL_VPS_Infrastructure_Plan_v1_0.md`
- `BandKit_Backend_Production_Readiness_Risk_Register_v1_0.md`
- `BandKit_Backend_Development_Principles_v1_0.md`
- `BandKit_Production_Launch_Checklist_v1_0.md`

---

## Accepted core architecture

BandKit has public/social layers and private/working layers.

Public/social layer:

- public profile;
- public entity page;
- public event page;
- public posts;
- public discussion if enabled;
- followers/subscribers.

Private/working layer:

- entity working chat;
- event working chat;
- internal documents;
- role-based documents;
- important messages;
- acknowledgements;
- audit/system events.

Accepted rule:

> Public visibility never automatically grants access to working chat, internal documents or backstage logistics.

---

## Accepted permission model

Permissions are layered:

1. platform status;
2. social relationship;
3. entity role;
4. event role;
5. object-specific permission;
6. moderation/safety state.

Accepted backend rule:

> All sensitive permissions must be enforced by `PermissionService / PolicyResolver`, not only by frontend UI.

The backend must enforce checks for:

- viewing rooms;
- writing messages;
- editing/deleting/hiding messages;
- pinning messages;
- attaching files;
- viewing/exporting documents;
- mentioning users;
- acknowledging important messages;
- managing members;
- creating important/system actions.

HTTP and WebSocket access must match.

---

## Accepted chat model

Chat behavior depends on chat type:

- direct chat;
- free group chat;
- entity/project chat;
- event working chat;
- safety/moderation chat;
- admin/role chat.

Accepted rules:

- direct chats are softer;
- free group chats behave like normal group chats;
- entity/event chats are strict working contexts;
- public discussion is separate from working chat;
- entity/event participants enter through membership/participation, not direct room invite;
- former members/participants lose related working chats and document access;
- normal users cannot delete messages for everyone in entity/event working chats;
- entity/event edit windows are short typo-only windows;
- reports preserve evidence;
- important messages can require acknowledgement;
- system messages preserve operational timeline.

---

## Accepted document model

Documents are first-class entity records, not ordinary chat attachments.

Document types include:

- rider;
- setlist;
- offer/commercial proposal;
- contract draft;
- receipt/act;
- schedule;
- technical plan;
- booking/payment-related file;
- event file;
- group/project file.

Accepted rules:

- message attachment and entity document are different concepts;
- deleting a chat message does not delete an entity document;
- entity documents stay inside the entity by default;
- regular participants cannot externally export entity documents;
- export is limited to responsible roles;
- export must be auditable later;
- production files must move to object storage.

---

## Accepted lifecycle model

User lifecycle:

```text
registered -> verified -> active -> restricted/read-only -> blocked -> deleted/anonymized
```

Entity lifecycle:

```text
draft -> active -> paused -> archived -> deleted/anonymized
```

Event lifecycle:

```text
draft -> published -> recruiting -> confirmed -> in_progress -> completed -> archived
                           └-> cancelled/rescheduled
```

Document lifecycle:

```text
draft -> active -> versioned/updated -> archived -> revoked/deleted
```

Accepted rule:

> Lifecycle state controls visibility, permissions, chats, documents, notifications and archive behavior.

---

## Accepted reputation model

Reputation must be verified-context based.

Accepted rules:

- feedback only after real collaboration/event context;
- no-show and late cancellation must be based on participation records;
- valid reasons, replacements and disputes must be supported;
- organizer cancellation/reschedule must not unfairly punish participants;
- one angry user must not be able to destroy a profile;
- MVP should store participation context before exposing broad public ratings.

---

## Accepted moderation/safety model

Reportable objects:

- users/profiles;
- messages;
- posts/comments;
- entities;
- events;
- documents/files;
- reviews/reputation events;
- invitation/application abuse.

Accepted rules:

- reports preserve context and evidence;
- normal delete/edit cannot destroy reported evidence;
- moderation actions require reason and audit;
- entity admins and platform moderators have separate responsibilities;
- serious sanctions require appeal/dispute path later;
- anti-fraud and external-link safety are first-class concerns.

---

## Accepted privacy/account data model

Accepted rules:

- privacy is layered;
- account deletion must not break entity/event history;
- owned entities/events need transfer/closure before deletion;
- shared working content may remain with anonymized author;
- safety/legal/audit data can be retained where required;
- user export must respect access rights and confidentiality.

---

## Accepted monetization model

Every user can create an entity for free and get a real starter package.

Free starter package can include:

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

Paid expansion focuses on entity capabilities:

- rider wizard;
- offer wizard;
- contract draft assistant;
- branded exports;
- document versions;
- advanced event planning;
- advanced roles/admin tools;
- expanded storage/history;
- verified entity profile;
- automation/AI-assist tools.

Accepted financial boundary:

- no platform payments in MVP;
- no escrow;
- no gig commissions;
- no settlement engine;
- future financial module only after legal/business/accounting review.

---

## Accepted backend/staging infrastructure

Current VPS is staging/preview infrastructure in near-real conditions, not production.

Accepted staging path:

```text
Development/Staging VPS
├─ Nginx
├─ frontend static build
├─ backend API service later
├─ PostgreSQL for dev/staging data
├─ Redis/Valkey later if needed
└─ local backup scripts
```

Accepted rules:

- PostgreSQL can run on current VPS for staging/MVP;
- PostgreSQL must not be publicly exposed;
- backend connects locally through `127.0.0.1`;
- `/api` and `/ws` proxied through Nginx later;
- staging data is not production truth;
- public launch requires proper production hosting/datacenter/cloud/managed environment.

---

## Accepted backend development principles

Backend must follow:

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
- admin/moderation tools planned early;
- explicit data ownership;
- localization-ready system messages;
- matching HTTP/WebSocket permissions.

Recommended first implementation path:

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

## Production launch blockers

No public production launch without:

- separated production environment;
- production PostgreSQL and storage;
- off-server backups;
- tested restore drill;
- monitoring/logging;
- secrets and security baseline;
- permission enforcement;
- mock/test data disabled;
- moderation/support path;
- legal/product pages;
- key MVP flows tested.

Current VPS remains staging/preview and is not the final production environment.

---

## Do not regress

Do not revert these accepted decisions:

- BandKit is a working platform first, not a generic social network first;
- MVP scope is entity + team + event + document + working chat + acknowledgement;
- current VPS is staging/preview only;
- backend permissions must be centralized;
- entity documents are first-class records;
- regular participants cannot externally export entity documents;
- public discussion is separate from working chat;
- entity/event working chats are stricter than casual chats;
- no platform payments/escrow/commission in MVP;
- reputation must be context-based and dispute-friendly;
- moderation must preserve evidence and audit;
- production launch requires operational readiness.

---

## Next recommended work

Implementation direction:

1. start backend skeleton;
2. add `/api/v1/health`;
3. add config/env/logger;
4. add PostgreSQL connection and migrations;
5. add PermissionService skeleton;
6. add initial schemas for users/entities/events/chats/documents;
7. keep frontend mock-to-real migration controlled by feature flags.

Optional documentation direction later:

- detailed API contract;
- database schema plan;
- backend deployment runbook;
- staging VPS setup runbook;
- admin/moderation UI spec.

---

## Handoff summary

Continue BandKit from repo `Dayzcoub/Bandkitalpha`, branch `main`.

Latest accepted commit before this checkpoint note:

- `62aae00` — `Document production launch checklist`

Current accepted checkpoint:

- `1.10.15 final product policy and backend handoff`

This checkpoint closes the policy/planning phase and establishes the baseline for controlled backend/UI implementation.
