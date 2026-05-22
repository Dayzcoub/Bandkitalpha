# BandKit — Platform Roles and Permissions v1.0

## Status

Accepted product policy direction.

This document defines the platform role and permission model for BandKit. The model should feel familiar to users of common social platforms such as VK-style social networks, but it is adapted to BandKit's stricter professional logic around events, working chats, documents, participation, reliability and safety.

Related accepted documents:

- `BandKit_Platform_Policy_Framework_v1_0.md`
- `BandKit_Chat_Policy_Accepted_Checkpoint_1_10_13.md`
- `BandKit_Monetization_Entity_Features_Policy_v1_0.md`
- `BandKit_Backend_Development_Principles_v1_0.md`

---

## Core principle

BandKit should be understandable for users who already know social platforms.

Familiar social platform concepts:

- user profile;
- friends/contacts;
- followers/subscribers;
- groups/communities;
- events;
- posts/comments;
- messages/chats;
- admins/moderators;
- blocks/restrictions.

BandKit adaptation:

- a group/community can be a working music entity;
- an event is not just a public page, it can be an operational workspace;
- a chat can be casual or entity-bound;
- documents can be confidential entity records;
- participation can affect reliability;
- important messages can require acknowledgement;
- permissions are stricter when work, documents, safety or obligations are involved.

Accepted rule:

> User-facing rules should feel familiar like a social network, but entity-bound actions must follow stricter BandKit policies.

---

## Permission layers

Do not use one global role to decide everything.

BandKit permissions are calculated from several layers:

```text
1. Platform status
2. Social relationship
3. Entity role
4. Event role
5. Object-specific permission
6. Safety/moderation state
```

A user can be:

- a normal platform user;
- admin of one group;
- manager of one event;
- participant in another event;
- follower of another entity;
- read-only in one context;
- restricted from direct interaction with one user;
- still fully active elsewhere.

Accepted rule:

> Global role is not the same as entity role, event role or chat/document permission.

---

## 1. Platform status and global roles

### Platform user

Default registered user.

Can:

- create a profile;
- create free entities according to platform limits;
- use allowed social features;
- send/receive invites;
- participate in allowed chats/events;
- report content;
- manage own privacy settings.

### Verified user

A user with completed verification steps, for example email/phone verification and later optional identity/professional verification.

Can have:

- higher trust in search/applications;
- fewer anti-spam restrictions;
- better visibility signals;
- access to features that require verified contact information.

### Platform moderator

Moderation role.

Can:

- review reports;
- view required moderation context;
- hide content with reason;
- apply restrictions according to policy;
- preserve evidence;
- escalate cases;
- close moderation cases.

Cannot be treated as normal entity admin unless explicitly assigned there.

### Platform admin / super admin

Operational platform role.

Can:

- manage platform settings;
- manage feature flags;
- manage high-level moderation/admin tools;
- resolve serious operational incidents;
- manage production/admin bootstrap flows.

Must be protected by stronger security requirements.

### Read-only / restricted / platform-level denied status

These are account states, not normal social roles.

Read-only:

- can view allowed content;
- cannot write, reply, quote, edit, delete, pin, attach or invite.

Restricted:

- specific actions are limited by policy.

Platform-level denied state:

- no chat/content access according to safety policy;
- no writing;
- no notifications;
- no old-room link access;
- no mention/reply/quote/forward.

---

## 2. Social relationships

Social relationships should feel familiar to common social platforms.

Types:

- friend/contact;
- follower/subscriber;
- blocked/restricted personal relation;
- invited user;
- former participant/member.

### Friend/contact

May allow:

- easier direct messaging;
- profile visibility depending on privacy settings;
- invite suggestions;
- mutual activity visibility if allowed.

### Follower/subscriber

Can see public updates according to visibility settings.

Cannot automatically see:

- working chats;
- entity documents;
- private event logistics;
- internal team content.

### Personal restriction between users

Familiar social-network block behavior, adapted to working contexts.

Direct messages:

- full stop.

Shared entity/event chats:

- working messages are not automatically hidden if both users remain valid participants;
- personal interaction is disabled: no direct mention, reply/quote, personal forwarding, contact request or personal invitation.

Accepted rule:

> Personal restrictions block personal interaction, but must not break necessary shared work context.

---

## 3. Entity roles

Entity means:

- band/group;
- solo artist entity;
- orchestra;
- project;
- organization;
- studio/venue/agency later if needed.

Entity roles:

- owner;
- admin;
- manager;
- member;
- guest;
- follower/subscriber;
- former member.

### Entity owner

Highest responsible role.

Can:

- manage entity settings;
- manage admins/managers;
- transfer ownership;
- manage entity plan/paid features;
- manage document policy;
- export entity documents if allowed;
- archive/delete entity according to lifecycle policy;
- view entity audit where allowed.

Important:

- entity must not be left without an owner/responsible admin.

### Entity admin

Administrative role below owner.

Can:

- manage members;
- assign lower roles if policy allows;
- create events;
- manage documents;
- create important announcements;
- hide messages with reason;
- export documents according to policy;
- view operational audit where allowed.

### Entity manager

Operational role.

Can:

- manage calendar/events;
- send invitations from entity;
- coordinate team;
- work with documents;
- export entity documents if responsible role policy allows;
- manage event operations;
- view acknowledgements.

Usually cannot:

- transfer ownership;
- delete entity;
- manage billing/plan unless granted;
- assign owner-level roles.

### Entity member

Normal working member.

Can:

- participate in entity chats where allowed;
- see allowed documents;
- participate in events;
- receive invitations;
- upload/attach files if allowed;
- acknowledge important messages.

Cannot by default:

- export confidential documents externally;
- delete messages for everyone in entity-bound chats;
- change roles;
- hide other users' messages;
- manage entity plan;
- delete/archive entity.

### Entity guest

Temporary or limited member.

Can see and do only what is required for their task/event/project.

Should not automatically get access to full entity history or all documents.

### Entity follower/subscriber

Public social role.

Can see public entity content only.

Cannot see internal chats, documents, backstage event logistics or confidential materials.

### Former member

After removal/exit:

- related chats are hidden;
- new messages are not visible;
- writing is disabled;
- entity documents become inaccessible;
- only separate dispute/safety/legal case access may remain.

---

## 4. Event roles

Events have separate roles even if created by an entity.

Event roles:

- event owner;
- organizer;
- event manager;
- participant;
- crew/technician;
- guest;
- viewer/subscriber;
- former participant.

### Event owner / organizer

Can:

- manage event;
- invite/remove participants;
- change timing/status;
- manage event working chat;
- create important event announcements;
- require acknowledgements;
- view acknowledgement status;
- manage event documents;
- export event documents externally if responsible role policy allows;
- hide messages with reason.

### Event manager

Operational manager.

Can:

- manage participants;
- coordinate schedule;
- handle event documents;
- send important updates;
- track acknowledgements;
- export event documents if assigned as responsible.

### Event participant

Active participant.

Can:

- write in event working chat;
- view allowed event documents;
- acknowledge important messages;
- attach allowed files;
- receive critical updates.

Cannot by default:

- delete messages for everyone;
- export event documents externally;
- change event composition/status;
- hide other users' messages;
- rewrite event history.

### Crew / technician

Participant-like role with technical access.

May see:

- rider;
- technical plan;
- load-in timing;
- stage/sound/logistics documents;
- relevant working chat.

### Viewer/subscriber

Public event observer.

Can see public event page/discussion if enabled.

Cannot access working event chat or internal documents.

### Former participant

After leaving/removal:

- event chat hidden;
- event documents inaccessible;
- notifications stop;
- access only via separate case if required.

---

## 5. Chat permissions

Chat permissions are based on chat type and parent context.

Chat types:

- direct chat;
- free group chat;
- entity chat;
- event chat;
- safety/moderation chat;
- admin/role chat.

Direct chat:

- behaves like familiar personal messages;
- blocked/restricted personal relationship can stop it;
- edit/delete windows are softer.

Free group chat:

- behaves like normal group chat;
- user can leave/mute;
- edit/delete windows are allowed by policy.

Entity/event chat:

- permissions come from entity/event role;
- no normal delete-for-everyone for ordinary members;
- strict edit windows;
- documents remain inside entity;
- important messages can require acknowledgement.

Safety/admin chat:

- permissions come from case/admin roles;
- normal users cannot destroy context;
- audit and moderation rules apply.

---

## 6. Document permissions

Documents are first-class entity records, not just chat files.

Document permissions:

- view;
- edit/version;
- attach/share inside entity;
- export externally;
- view audit;
- manage access.

Rules:

- ordinary participants can view only allowed documents;
- ordinary participants cannot externally export entity documents;
- event manager/organizer can export event documents;
- entity owner/admin/manager can export entity documents according to policy;
- document export must be auditable later;
- deleting a chat message does not delete an entity document.

Examples of protected documents:

- rider;
- setlist;
- offer;
- contract;
- receipt;
- schedule;
- technical plan;
- booking/payment-related file.

---

## 7. Moderation and safety permissions

Platform moderation is separate from entity administration.

Moderation roles may act on reports without being entity admins.

Moderator can:

- review reports;
- see preserved context;
- hide content with reason;
- apply restrictions;
- preserve evidence;
- escalate cases;
- audit actions.

Entity admin can moderate inside entity according to policy, but platform-level safety cases may override entity decisions.

Accepted rule:

> Moderation actions are audit-first and preserve evidence.

---

## 8. User-facing simplicity

The UI should not expose raw complexity to users.

Users should see familiar labels:

- `Владелец`
- `Администратор`
- `Менеджер`
- `Участник`
- `Гость`
- `Подписчик`
- `Организатор`
- `Техник`
- `Только чтение`

Actions should appear only when allowed.

Examples:

Normal event participant sees:

- `Ответить`
- `Пожаловаться`
- `Запросить удаление`
- `Ознакомлен`

Event organizer sees:

- `Ответить`
- `Закрепить`
- `Важное`
- `Скрыть`
- `Список ознакомления`
- `Экспорт документа`

Former participant sees no working chat.

Read-only user sees `Только чтение` and cannot write.

---

## 9. Permission matrix summary

| Action | Direct | Free group | Entity member | Entity manager/admin | Event participant | Event manager/organizer | Moderator |
|---|---:|---:|---:|---:|---:|---:|---:|
| Write | Yes | Yes | Yes | Yes | Yes | Yes | By role |
| Mute | Yes | Yes | Limited | Limited | Limited | Limited | N/A |
| Edit own message | 20 min | 5 min | 2 min typo-only | 2 min typo-only | 2 min typo-only | 2 min typo-only | By policy |
| Delete own for everyone | 40 min | 15 min | No | No | No | No | By policy |
| Hide message with reason | No | Admin only | No | Yes | No | Yes | Yes |
| Pin message | No/limited | Admin/owner | No/limited | Yes | No/limited | Yes | By policy |
| Export entity document | N/A | N/A | No | Yes | No | Yes | By case |
| Access working documents | N/A | N/A | Allowed docs | Yes | Allowed docs | Yes | By case |
| View public content | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View internal chat after leaving | N/A | Depends | No | No | No | No | By case |

This is a product-level summary. Backend must enforce exact rules through PermissionService.

---

## 10. Backend enforcement

All sensitive permissions must be enforced by backend, not only UI.

Required central resolver:

- `PermissionService` / `PolicyResolver`.

Required checks:

- `canViewRoom`;
- `canWriteMessage`;
- `canEditMessage`;
- `canDeleteMessage`;
- `canHideMessage`;
- `canPinMessage`;
- `canAttachFile`;
- `canForwardDocument`;
- `canExportDocument`;
- `canMentionUser`;
- `canAcknowledgeMessage`;
- `canViewDocument`;
- `canManageMembers`;
- `canCreateImportantMessage`;
- `canCreateSystemAction`.

Rules:

- frontend hides unavailable actions for UX;
- backend is source of truth;
- HTTP and WebSocket use the same permission model;
- parent entity membership drives entity-bound chat access;
- document permissions must be checked separately from message permissions.

---

## 11. Familiarity vs stricter BandKit logic

Users should recognize the product as a social platform:

- profile;
- friends/followers;
- groups;
- events;
- posts;
- comments;
- chats;
- admins;
- reports;
- blocks.

But users should also understand that BandKit is stricter where work begins:

- event working chat is not public comments;
- entity documents are not ordinary attachments;
- important messages can require acknowledgement;
- event/project history cannot be casually rewritten;
- former members lose working access;
- document export is limited to responsible roles;
- moderation preserves evidence.

Accepted UX principle:

> Make the rules feel natural to social-platform users, but explain stricter restrictions with short contextual text when they appear.

Examples:

- `Это рабочий чат события. Удаление для всех недоступно.`
- `Документ относится к группе и не может быть отправлен наружу без прав менеджера.`
- `Вы больше не участник проекта, поэтому рабочий чат скрыт.`
- `Сообщение закреплено или используется в ответах — редактирование недоступно.`

---

## Accepted product decision

BandKit roles and permissions follow common social platform principles but are adapted to professional music collaboration.

Accepted rules:

- permissions are contextual and layered;
- global role is not enough;
- entity roles and event roles are separate;
- chat permissions are derived from parent context;
- document permissions are separate and stricter;
- moderation roles are separate from entity admin roles;
- UI should remain familiar and simple;
- backend PermissionService is mandatory;
- entity-bound actions are stricter than normal social actions.
