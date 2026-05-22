# BandKit — MVP Scope and Product Positioning v1.0

## Status

Accepted MVP direction.

This document defines the minimum launch scope for BandKit and prevents product scope creep during early development.

Related accepted documents:

- `BandKit_Product_Architecture_Accepted_Checkpoint_1_10_14.md`
- `BandKit_Platform_Policy_Framework_v1_0.md`
- `BandKit_Platform_Roles_And_Permissions_v1_0.md`
- `BandKit_Platform_Entity_Lifecycle_And_Social_Rules_Framework_v1_0.md`
- `BandKit_Monetization_Entity_Features_Policy_v1_0.md`
- `BandKit_Backend_Development_Principles_v1_0.md`

---

## Product positioning

BandKit should not be positioned first as “another social network for musicians”.

Accepted positioning:

> BandKit is a working platform for music projects: team, events, documents, riders, chats and confirmations in one place.

Shorter version:

> BandKit helps music teams organize people, events, documents and working communication.

Why not just “social network”:

- a generic social network is too broad;
- existing platforms already cover casual posting and messaging;
- BandKit's strength is entity-based collaboration;
- the core value is working structure around bands, artists, projects, events and documents.

---

## Core product thesis

Musicians and music teams already use scattered tools:

- messengers;
- social networks;
- cloud drives;
- spreadsheets;
- notes;
- calendars;
- manual PDF/doc files.

BandKit should connect these workflows around a music entity.

Core pain points:

- documents get lost in chats;
- event timing changes are missed;
- nobody knows who acknowledged an update;
- roles and responsibilities are unclear;
- riders/setlists/offers are scattered;
- project members and event participants are not managed in one place;
- work history is mixed with casual chat;
- there is no lightweight reliability/accountability layer.

---

## MVP goal

The MVP should prove that a music entity can use BandKit as a real working space.

MVP must answer:

1. Can a user create a music entity?
2. Can they invite/build a small team?
3. Can they create an event for that entity?
4. Can they keep event/entity documents in one place?
5. Can they communicate in a working chat with correct access rules?
6. Can important updates be acknowledged?
7. Can basic permissions prevent chaos?

Accepted MVP focus:

> Start with entity operations, not public social network growth.

---

## Primary MVP users

First target segments:

- active small bands;
- solo artists with a small team;
- cover bands;
- rehearsal/concert projects;
- small orchestras/ensembles;
- event/project managers for music teams;
- technical team coordinators.

Later segments:

- studios;
- venues;
- agencies;
- schools;
- large organizations;
- promoters;
- public fan/community layer.

---

## MVP core objects

MVP should include only the minimum working object set:

- user profile;
- music entity: band / solo artist / project / orchestra baseline;
- entity members and roles;
- event connected to entity;
- working chat connected to entity/event;
- entity/event documents;
- important message / acknowledgement;
- basic notifications;
- basic admin/moderation controls;
- backend permission skeleton.

---

## MVP included scope

### 1. User/profile baseline

MVP includes:

- user profile;
- basic account identity;
- basic visibility;
- basic auth/session implementation when backend starts;
- enough profile data to participate in entities/events.

Not MVP:

- complex public profile customization;
- marketplace ranking;
- advanced portfolio tools;
- public creator discovery algorithms.

---

### 2. Free entity creation

MVP includes free creation of a music entity.

Supported initial entity types can be simple:

- band/group;
- solo artist;
- project/orchestra as type variants if UI allows.

Entity MVP includes:

- entity profile/card;
- basic members list;
- owner/admin/member roles;
- invite/add team flow mock or basic implementation;
- entity calendar/event list;
- entity documents area;
- entity working chat or event working chat.

Not MVP:

- full organization hierarchy;
- multi-entity manager dashboard;
- paid plan enforcement;
- complex public promotion tools.

---

### 3. Team and roles

MVP includes:

- owner;
- admin/manager baseline;
- member;
- guest/participant where needed;
- former member access removal logic in policy/backend skeleton.

MVP must respect:

- no entity without responsible owner/admin;
- former members lose related working chat/document access;
- permissions enforced through PermissionService skeleton.

Not MVP:

- full custom role builder;
- deep role templates;
- enterprise organization permissions.

---

### 4. Events

MVP includes:

- create event under entity;
- basic event fields: title, date/time, location, description/status;
- participants list;
- event working chat;
- event documents;
- important update/acknowledgement concept;
- event lifecycle at basic level: draft/active/completed/archived or equivalent simplified state.

Not MVP:

- ticketing;
- public fan event system;
- payments;
- advanced booking workflow;
- complex recurring events;
- full reliability automation.

---

### 5. Working chat

MVP includes the accepted compact messenger UI direction and basic frontend/backend-ready behavior.

Must preserve accepted chat rules:

- direct/free/entity/event chat policy distinction;
- message actions are contextual;
- entity/event chats are stricter;
- no normal delete-for-everyone in entity/event working chats;
- edit/delete windows follow policy when backend enforces them;
- system messages visual style later;
- important messages and acknowledgements later in MVP path.

Minimum chat MVP:

- rooms/messages;
- pin/important concept;
- reply;
- soft delete UI state;
- context-aware actions;
- access controlled by parent entity/event;
- no public discussion mixed with working chat.

Not MVP:

- full global search;
- voice/video;
- rich bots;
- complex public chat discovery;
- full-scale realtime fanout beyond prototype needs.

---

### 6. Documents

MVP includes documents as an entity/event feature, not just ordinary chat files.

Minimum document types:

- rider;
- setlist;
- offer/commercial material;
- schedule/technical note.

MVP behavior:

- upload/store metadata;
- attach/reference document in chat/event/entity;
- document access follows entity/event membership;
- deleting chat message does not delete entity document;
- external export restricted by role policy;
- local/staging storage acceptable, architecture must allow object storage later.

Not MVP:

- legally binding contract workflow;
- payments/settlement;
- full document signing;
- advanced version diff;
- AI document wizard as required baseline.

Paid expansion later:

- rider wizard;
- offer wizard;
- contract draft assistant;
- branded PDF exports;
- advanced document versions.

---

### 7. Important messages and acknowledgements

MVP should include at least a simple path for important updates.

Minimum concept:

- organizer/admin can mark message/update as important;
- participants can click `Ознакомлен`;
- organizer/admin can see acknowledgement count.

Full advanced implementation can come later.

Not MVP:

- complex task management;
- legal-grade acknowledgement;
- advanced reminders/escalation.

---

### 8. Basic notifications

MVP includes basic in-app notifications or notification-ready events.

Priority:

- invitation received;
- event update;
- important message;
- document update;
- membership/role change.

Not MVP:

- full push infrastructure if not ready;
- advanced digest;
- quiet hours;
- complex notification preferences.

Push/email can be added later but must follow privacy-safe rules.

---

### 9. Basic moderation/admin safety

MVP includes minimum safe controls.

Minimum:

- report message/user/entity content concept;
- preserve reported message context in backend design;
- platform/admin moderation hooks;
- ability to hide content with reason later;
- no destructive hard-delete by normal users.

Not MVP:

- full moderation dashboard;
- automated abuse detection;
- appeals flow;
- advanced trust/safety tooling.

---

### 10. Backend and infrastructure MVP

MVP backend starts with:

- `/api/v1/health`;
- config/env loader;
- logger;
- PostgreSQL connection;
- migrations;
- basic auth skeleton;
- PermissionService skeleton;
- chat/entity/event/document schemas;
- staging deployment on current VPS.

Accepted infrastructure:

- current VPS is staging/preview only;
- PostgreSQL on VPS for staging/MVP data;
- production launch later requires separate production hosting.

---

## Explicitly out of MVP

The following are not MVP:

- payments through platform;
- escrow;
- gig commissions;
- settlement engine;
- marketplace for hiring;
- public social feed as core launch feature;
- full recommendation/discovery algorithms;
- complex reputation automation;
- full legal contract workflow;
- digital signatures;
- public fan community layer;
- video/voice calls;
- full mobile native apps;
- enterprise organization dashboard;
- advanced AI automation as core requirement.

These can be future modules, but must not block MVP.

---

## Expansion roadmap after MVP

### Phase 2

- public profiles and entity pages polish;
- feed/posts/comments;
- public discussions separated from working chats;
- better invitations/applications;
- more document types;
- basic reputation feedback after events;
- improved notification center;
- admin/moderation tools.

### Phase 3

- paid entity feature plans;
- rider wizard;
- offer wizard;
- contract draft assistant;
- branded exports;
- advanced document versions;
- advanced event templates;
- expanded roles;
- storage quotas;
- analytics.

### Phase 4

- marketplace/discovery if justified;
- public reputation layer;
- mobile apps;
- payments/financial module only after legal/business/accounting review;
- large organization tools;
- production-scale realtime/search/storage.

---

## Success metrics for MVP

MVP should be evaluated by real working usage, not vanity social metrics.

Useful signals:

- user creates entity;
- entity has 3+ members;
- entity creates event;
- event has participants;
- document uploaded/created;
- important message sent;
- acknowledgement received;
- user returns after event/update;
- team uses BandKit instead of scattered chat/file flow for at least one real event;
- admin/manager sees value in documents + event + team + chat being connected.

Not primary MVP metrics:

- likes;
- public follower count;
- viral feed activity;
- generic social engagement.

---

## Why BandKit instead of existing tools

BandKit should answer:

- Telegram/VK chats lose documents and decisions;
- cloud drives lack event/team/chat context;
- spreadsheets lack permissions and communication;
- generic social networks lack working entity logic;
- Notion-like tools require manual structure;
- BandKit connects entity, team, event, document, chat and acknowledgement.

Accepted differentiator:

> BandKit is useful when a music team needs operational structure, not just communication.

---

## Do not expand MVP without decision

Any new feature request should be classified:

1. MVP core;
2. Phase 2;
3. Phase 3 paid expansion;
4. future/parking lot.

Accepted rule:

> If a feature does not help prove entity + team + event + document + working chat value, it should not enter MVP core.

---

## Accepted MVP decision

BandKit MVP is a minimum working platform for music entities.

MVP includes:

- user profile baseline;
- free entity creation;
- basic team/roles;
- entity event creation;
- working chat connected to entity/event;
- documents connected to entity/event;
- important message/acknowledgement concept;
- basic permission enforcement;
- staging backend foundation.

MVP excludes broad social-network expansion, marketplace, payments, complex reputation automation and advanced paid tools until the core workflow is proven.
