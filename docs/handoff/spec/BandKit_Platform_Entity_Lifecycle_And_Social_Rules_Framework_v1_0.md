# BandKit — Entity Lifecycle and Social Rules Framework v1.0

## Status

Accepted platform policy direction.

This document defines how BandKit adapts common social platform rules to its own professional music collaboration logic.

Related accepted documents:

- `BandKit_Platform_Policy_Framework_v1_0.md`
- `BandKit_Platform_Roles_And_Permissions_v1_0.md`
- `BandKit_Chat_Policy_Accepted_Checkpoint_1_10_13.md`
- `BandKit_Monetization_Entity_Features_Policy_v1_0.md`

---

## Core approach

BandKit should feel familiar to users of existing social platforms, but it must be stricter where the product becomes a working environment.

Standard social platform layer:

- user profiles;
- friends/contacts;
- followers/subscribers;
- groups/communities;
- events;
- posts;
- comments;
- likes/reactions;
- messages;
- reports;
- moderation.

BandKit professional layer:

- music entities;
- bands/groups/orchestras/solo artists/projects;
- working events;
- event participants and crew;
- backstage/working chats;
- riders, setlists, offers, contracts, schedules and other documents;
- participation confirmations;
- declines, replacements and no-shows;
- reliability/reputation;
- document confidentiality;
- audit and safety logic.

Accepted rule:

> Use familiar social-network behavior by default, but apply stricter BandKit rules when an action touches working participation, entity documents, event logistics, accountability, reputation or safety.

---

## 1. Main BandKit entity types

BandKit entities can include:

- user profile;
- solo artist entity;
- band/group;
- orchestra;
- project;
- organization;
- studio/venue/agency later;
- event;
- document;
- post/comment;
- chat room;
- invitation/application;
- report/moderation case;
- reliability/reputation event.

These entities should not be treated as only visual UI objects. They define permissions, lifecycle and access rules.

---

## 2. User lifecycle

Common social platform model:

```text
registered -> verified -> active -> restricted/read-only -> blocked -> deleted/anonymized
```

BandKit adaptation:

- verification can affect trust, visibility and limits;
- read-only/restricted states must affect chats, posts, comments, invites and documents;
- account deletion must not destroy entity history, event history, safety evidence or other users' legitimate access;
- owned entities require ownership transfer or archival rules before account deletion.

User lifecycle states:

- registered;
- email/phone verified;
- active;
- read-only;
- restricted;
- platform-level denied;
- deactivated;
- deleted/anonymized.

Future detailed policy should define account deletion/export separately.

---

## 3. Entity lifecycle

Applies to:

- solo artist;
- band/group;
- orchestra;
- project;
- organization.

Recommended lifecycle:

```text
draft -> active -> paused -> archived -> deleted
```

(`anonymized` убран — F3, 1.26.0; см. §Deleted.)

### Draft

Entity exists but is not fully public.

Use for:

- setup;
- filling profile;
- adding members;
- preparing documents.

### Active

Entity can operate normally:

- public profile if enabled;
- members;
- calendar;
- events;
- documents;
- invitations;
- chats;
- posts.

### Paused

Entity is temporarily inactive.

Possible behavior:

- profile may remain visible;
- new event creation may be disabled or limited;
- chats may stay active by policy;
- documents remain accessible to members by policy.

### Archived

Entity is no longer active but history is preserved.

Behavior:

- working chats become read-only or hidden by policy;
- documents retained according to policy;
- events remain in history;
- no new normal activity;
- owner/admin can restore if allowed.

### Deleted

> **Уточнено 2026-07-17 (F3, 1.26.0, миграция `0030`).** Раздел назывался
> «Deleted/anonymized». **Анонимизации у сущности нет** — терминал один, `deleted`, и
> значение `anonymized` убрано из словаря `entities.status`. Причина — правило этого же
> раздела: «do not destroy other users' legitimate history». Имя группы не её приватность,
> а несущая конструкция чужой истории; вычистив его, мы обессмыслим каждое прошлое событие
> и повесим репутацию контрагентов на безымянный Party. У `users` терминал другой
> (`anonymized`), и это не дефект симметрии, а разные модели (D11).
>
> Имя сущности, содержащее ПД человека, решается **переименованием**, а не терминальным
> статусом: стирание обязано дотянуться и до **живой** сущности (`solo_artist`, чей
> владелец удалил аккаунт, продолжает выступать). Действие, не состояние.
>
> Ниже — `deleted`. Причина ухода живёт в `termination_reason`/`terminated_at`/
> `terminated_by`, а не в статусе (D1/D2).

Hard removal should be rare and controlled.

Rules:

- preserve audit/safety/legal records if required;
- do not destroy other users' legitimate history;
- ownership and last-admin rules apply.

Accepted rule:

> Entity lifecycle controls access to chats, documents, events and public visibility.

---

## 4. Event lifecycle

Events are stricter than normal social events because they can contain working obligations.

Recommended lifecycle:

```text
draft -> published -> recruiting -> confirmed -> in_progress -> completed -> archived
                           └-> cancelled/rescheduled
```

### Draft

Event is being prepared.

- visible to owner/organizer/managers;
- no public participation unless invited;
- documents can be drafted;
- working chat may be internal only.

### Published

Event is visible according to settings.

- public page can be visible;
- subscribers/viewers may follow public updates;
- working chat remains private.

### Recruiting

Participants can be invited or can apply if enabled.

- invitations/applications active;
- participant access not granted until accepted/confirmed;
- working documents remain protected.

### Confirmed

Core participants are confirmed.

- event working chat active;
- event documents available to valid participants by role;
- important messages and acknowledgements can be used.

### In progress

Event is happening.

- stricter edit/delete behavior;
- logistics updates are important messages/system events;
- no casual rewriting of history.

### Completed

Event has ended.

- post-event feedback/reliability flow may open;
- chat can remain active for a short operational period if policy later allows;
- documents retained according to policy.

### Archived

Event is closed.

- working chat read-only/archived;
- retention rules apply;
- history and attachments retained for accepted window unless legal/safety policy requires longer.

### Cancelled/rescheduled

Must create system messages and notifications.

- participants notified;
- access and obligations recalculated;
- reliability impact depends on context.

Accepted rule:

> Event participation drives access to event working chat and event documents.

---

## 5. Document lifecycle

Documents are first-class entity records, not just chat attachments.

Document lifecycle:

```text
draft -> active -> versioned/updated -> archived -> revoked/deleted
```

Document types:

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

Rules:

- documents have parent entity/event context;
- access is based on entity/event role and document policy;
- external export is limited to responsible roles;
- deleting a chat message does not delete entity document;
- versions should be preserved for important documents;
- document updates should generate system messages where relevant.

Accepted rule:

> Documents are not ordinary social attachments when they belong to an entity or event.

---

## 6. Invitations and applications

Common social platform model:

- invite user;
- accept/decline;
- join group/event;
- leave group/event.

BandKit adaptation:

- invitation/application can grant access to working chats and documents only after membership/participation is accepted;
- direct chat invite must not grant event/project access;
- adding to working chat should happen through parent entity membership/participation.

Invitation/application states:

```text
created -> sent -> accepted/declined/revoked/expired
```

Rules:

- entity admins/managers can invite by policy;
- event organizers/managers can invite by policy;
- user can apply if applications are enabled;
- accepted invitation creates membership/participation;
- membership/participation then grants chat/document access;
- revoked/declined/expired invite must not grant access.

Accepted rule:

> Users enter entity/event working contexts through entity membership or event participation, not by direct room invite.

---

## 7. Participation, decline, replacement and no-show

BandKit must distinguish normal social RSVP from working participation.

Participation states:

```text
invited -> applied -> accepted/confirmed -> declined -> removed -> completed
                                      └-> replaced/no_show/late_cancel
```

Important cases:

- early decline;
- late decline;
- no-show;
- valid reason;
- illness/emergency;
- replacement participant;
- organizer cancellation;
- event reschedule;
- dispute.

Rules:

- early decline should be allowed without unfair reliability damage;
- late decline may affect reliability depending on context;
- no-show can affect reliability more strongly;
- valid reasons and disputes must be supported;
- replacement can reduce or remove negative impact;
- organizer cancellation/reschedule must not unfairly punish participants.

Accepted rule:

> Reliability impact must be fair, context-aware and dispute-friendly. It must not become a revenge tool.

---

## 8. Reputation and reliability

Common social platform model:

- likes;
- reviews;
- comments;
- public reputation.

BandKit adaptation:

- reliability should be tied to verified participation context;
- not arbitrary public attacks;
- sensitive reliability events must support moderation/dispute.

Possible reputation layers:

- public reputation summary;
- private event feedback;
- verified reliability events;
- moderation-confirmed incidents;
- positive participation history.

Rules:

- only users connected to real participation should leave event feedback;
- no-show and late cancellation must be based on event participation records;
- feedback should open after event completion;
- disputes/appeals must exist;
- anti-abuse protections required;
- one angry user should not be able to destroy a profile.

Accepted rule:

> Reputation must be based on verified collaboration context, not free-form revenge.

---

## 9. Feed, posts and comments

Standard social platform logic applies by default.

Supported future content:

- profile posts;
- entity posts;
- event posts;
- comments;
- reactions;
- reposts;
- reports;
- visibility settings.

BandKit adaptation:

- public comments are not working chats;
- event public discussion is separate from event working chat;
- comments must not expose confidential entity documents;
- posts/comments have their own edit/delete/moderation policy;
- official event/entity updates can also generate system messages or important updates.

Accepted rule:

> Public discussion and working communication are separate layers.

---

## 10. Moderation and safety

Standard social platform moderation applies, but BandKit adds evidence preservation and entity context.

Reportable objects:

- user;
- profile;
- message;
- post/comment;
- entity;
- event;
- document;
- review/rating;
- invitation/application abuse.

Rules:

- reports preserve context;
- moderation actions require reason/audit;
- safety-sensitive content must not be destroyed by normal user actions;
- platform moderators can act across entities within policy;
- entity admins can moderate inside entity but cannot override platform safety.

Accepted rule:

> Safety and moderation preserve context, evidence and audit trail.

---

## 11. Public vs private/working layers

BandKit must separate public social layers from working layers.

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

## 12. Where standard social rules apply

Use common social-platform behavior for:

- basic profile visibility;
- follows/subscriptions;
- public posts;
- public comments;
- likes/reactions;
- public event discovery;
- public group/entity page;
- user reports;
- personal blocking;
- basic direct messages.

But all of these must still respect:

- privacy;
- safety;
- access restrictions;
- moderation;
- anti-fraud rules.

---

## 13. Where BandKit rules are stricter

BandKit-specific strict behavior applies to:

- event working chat;
- project/entity working chat;
- internal documents;
- riders/contracts/offers/receipts/schedules;
- event participation;
- important messages and acknowledgements;
- reliability/reputation;
- document export;
- message deletion/editing in entity context;
- safety/moderation evidence;
- access after leaving an entity.

Accepted rule:

> The more an action affects real work, documents, obligations or safety, the stricter the policy.

---

## 14. User-facing explanation principle

Strict rules must be explained simply.

Examples:

- `Это рабочий чат события. Удаление для всех недоступно.`
- `Вы больше не участник проекта, поэтому рабочий чат скрыт.`
- `Документ относится к группе и не может быть отправлен наружу без прав менеджера.`
- `Это важное сообщение. Организатор увидит, кто ознакомился.`
- `Для изменения договорённостей отправьте новое уточнение, а не редактируйте старое сообщение.`

Accepted rule:

> Users should understand stricter BandKit rules through short contextual explanations, not through hidden failures.

---

## 15. Framework to detailed specs

This framework intentionally avoids writing every detail in one huge document.

Detailed specs should later be created or expanded for:

1. entity lifecycle;
2. event lifecycle;
3. invitations and participation;
4. decline/cancellation/no-show;
5. reputation and reliability;
6. documents and entity files;
7. feed/posts/comments;
8. moderation and safety;
9. account privacy/deletion/export;
10. production launch checklist.

---

## Accepted product decision

BandKit platform lifecycle and social logic:

- follows familiar social platform rules where possible;
- adapts them to professional music collaboration;
- separates public social layer from private working layer;
- treats events and documents as working/accountability contexts;
- makes participation and membership drive access;
- keeps reputation tied to verified collaboration;
- requires moderation/audit for sensitive actions;
- explains stricter restrictions clearly in UI.
