# BandKit — Advanced Chat Governance Rules v1.0

> ⚠ **Исторический документ. Не источник истины по чатам.**
>
> Написан против модели комнат `direct / free_group / entity / event / safety / admin`.
> Типы `free_group`, `safety` и `admin` **удалены** миграциями `0020`/`0021`: спека
> допускает ровно два класса переписки — личный диалог и чат сущности. `direct` жив как
> тип личного диалога, но им теперь управляет `conversation_scope = 'personal'` с
> инвариантами в БД (канонизированная пара, уникальность, запрет привязки к entity).
>
> Источник истины: `BandKit_Chat_and_Messaging_Security_v1.md` и
> `BandKit_Conversation_Lifecycle_and_Abuse_Controls_v1.md`, карта —
> `BandKit_Communication_Domain_v1.md`.
>
> **Правила ниже могут быть ценны, модель под ними — нет.** Читать как вход для будущих
> срезов, не как описание системы. Прежде чем брать отсюда правило, проверить, к какому
> из двух существующих классов переписки оно относится.

## Status

Accepted product logic.

This document extends the already accepted BandKit chat rules and must be read together with:

- `BandKit_Chat_Exit_And_Membership_Rules_v1_0.md`
- `BandKit_Chat_Message_Delete_Rules_v1_0.md`
- `BandKit_Chat_Message_Edit_Rules_v1_0.md`
- `BandKit_Chat_Access_Notifications_Attachments_Archive_Rules_v1_0.md`

The purpose of this document is to close the remaining core chat logic using the same strict model: entity-bound chats preserve accountability, safety-sensitive actions preserve evidence, and working history must not be silently rewritten.

---

## 1. Message reports

Every message can be reported where the user has permission to see it.

A report must preserve:

- original message content;
- message author;
- reporter;
- room ID;
- parent entity context;
- message timestamp;
- attachments metadata;
- reply/quote context;
- surrounding messages;
- current deletion/edit/pin state.

Reported messages must not be destroyed by normal user delete/edit actions.

Report reasons:

- suspicious link;
- fraud/scam;
- payment outside platform;
- spam;
- insults/harassment;
- threats;
- prohibited content;
- violation of project/event agreement;
- confidential information leak;
- other.

After reporting, user sees:

- `Жалоба отправлена.`
- `Сообщение и контекст сохранены для проверки.`

Moderator sees reported message, original content, edit/delete history, attachments, linked entity, reporter comment, surrounding context and prior reports.

After a message is reported:

- author cannot remove evidence;
- edit is blocked or original version is preserved;
- delete for everyone is blocked for normal users;
- moderators can hide visible message with a reason;
- original remains in moderation case storage.

---

## 2. Replies, quotes and forwards

Reply is allowed only if the user can see the source message and can write in the current chat.

Reply is blocked if:

- source message is unavailable;
- source belongs to restricted/sensitive context;
- personal restriction forbids reply/quote;
- source is hidden and user has no permission;
- room is read-only or archived.

Fallback texts:

- `Ответ на удалённое сообщение`
- `Ответ на скрытое сообщение`
- `Ответ недоступен`

Quote must not bypass confidentiality, deletion, personal restrictions or access rights. A quote cannot expose text from a message the viewer can no longer access.

Forwarding rules:

- direct/private: allowed only inside BandKit, source marker required;
- free group: allowed inside BandKit, source marker recommended;
- project/event/entity: only to users/rooms with access to the same entity context;
- safety/admin/moderation: normal users cannot forward;
- moderator/admin forwarding only inside case/admin tools with audit.

Forwarded content must preserve source metadata where policy allows: original room/entity, author, timestamp and access check result.

---

## 3. Important messages, announcements, decisions and tasks

Pinned message is not enough. BandKit must support different operational message types:

- normal message;
- pinned message;
- important message;
- organizer/admin announcement;
- decision;
- task;
- system message;
- safety warning.

Important messages can be created by event organizers, project/group admins, organization admins, moderators/admins and system/entity updates.

Important messages may:

- bypass normal mute;
- require acknowledgement;
- appear in event/project important updates list;
- generate system message;
- be protected from normal delete/edit;
- remain in archive/audit.

For project/event important messages, passive read is not enough when operational confirmation is needed.

Explicit actions:

- `Ознакомлен`
- `Принял задачу`
- `Подтверждаю участие`

Reactions such as `👍` do not count as legal/operational acknowledgement unless explicitly designed as such.

Organizer/admin can see acknowledgement status: `Ознакомились 8 из 12`, users who acknowledged, and users who have not acknowledged.

Decision/task messages should later have structured metadata: title, issuer, assigned users, due date, status, linked entity/document and acknowledgement/completion state.

---

## 4. Chat creation rules

Direct chat can be created only if both users are allowed to communicate and no restriction blocks contact.

Free group chat can be created by normal users if policy allows and must respect rate limits, participant limits, anti-spam rules, personal restrictions and invite permissions.

Project/band/group/orchestra chat should be created by the entity or entity admin/manager. Access is derived from project membership and roles.

Event chat should be created automatically with the event or by organizer action. Access is derived from event participant status and roles.

Safety/moderation chat is created by report/safety workflow or moderator/admin tools.

Admin/role chat is created by role/permission policy. Access is derived from role membership, not manual invite only.

---

## 5. Member management

Free group chat:

- invite by users with permission;
- invited user can accept/decline;
- system message required;
- admin/owner can remove according to policy;
- removal creates system message.

Project/event/entity chat:

- users are added through entity membership/participation, not manual chat invite;
- adding to event chat requires adding to event participant list;
- adding to project chat requires project membership/role;
- removal happens through parent entity membership;
- when user is removed from entity, related chats are hidden immediately;
- documentation access through those chats is revoked.

Safety/admin chat:

- only through moderator/admin/system action.

History visibility for newly added users:

- free group chat: configurable;
- project/event/entity chats: follows entity policy;
- confidential documents and prior attachments require access checks;
- safety/admin rooms expose only what role allows.

---

## 6. Public discussions vs working chats

Public event/project discussion is not the same as working chat.

Working chat:

- private;
- for participants/crew/organizers/members;
- operational;
- contains documents/logistics/decisions;
- strict access rules.

Public discussion:

- optional;
- visible to viewers/followers/subscribers according to settings;
- can be disabled;
- should be moderated;
- does not grant access to backstage/work chat;
- should not expose confidential documents or working decisions.

Accepted rule:

> Do not mix public discussion with private working chat.

If public discussion is implemented, it should behave more like comments/feed than backstage chat.

---

## 7. Chat lifecycle and type migration

Chats can change state, but not silently.

Cases:

- free group becomes project;
- discussion becomes event;
- project closes;
- event ends;
- chat becomes archived;
- chat becomes part of safety/moderation case.

Rules:

- system message required for major state change;
- permissions must be recalculated;
- deletion/edit rules update from the change point forward;
- old history may keep original rules unless policy requires stricter treatment;
- attachments must be rechecked against new entity permissions;
- public content must not become confidential without clear migration policy;
- confidential content must not become public by migration.

When a chat becomes entity-bound, normal author delete/edit freedoms become stricter, access becomes membership/role based, documentation rules apply and notifications follow entity rules.

When a chat is archived, writing is disabled, history and attachments follow archive policy, and reopening requires permission plus system message.

---

## 8. Drafts

Drafts are allowed as local UX helper.

MVP rules:

- one draft per chat;
- separate draft state for reply/edit modes;
- clear draft after send;
- clear or hide drafts when user loses access to entity chat;
- do not keep sensitive drafts forever;
- local storage is acceptable for MVP.

If user loses access to a project/event chat, related draft must not remain accessible in normal UI.

---

## 9. Reactions

Reactions can be added later, but they must not replace explicit acknowledgement.

Allowed basic reactions later:

- `👍`
- `👀`
- `✅`
- `❗`

Rules:

- reactions are lightweight feedback;
- reactions do not equal legal/operational confirmation;
- read-only users may react only if policy allows;
- reactions in safety/admin contexts can be disabled;
- important messages use explicit acknowledgement actions.

---

## 10. Anti-spam and abuse controls

Chat must include limits later:

- message rate limits;
- attachment rate limits;
- mention rate limits;
- repeated copy/paste detection;
- external link restrictions;
- suspicious payment/off-platform patterns;
- auto-flagging to safety flow;
- temporary read-only sanctions.

These controls must respect already accepted access, report, deletion and edit rules.

---

## Accepted product decision

BandKit advanced chat governance rules:

- message reports preserve original content and context;
- reported messages cannot be destroyed by normal delete/edit;
- reply/quote/forward must not bypass access, deletion, restrictions or confidentiality;
- forwarding from entity/safety/admin contexts is restricted;
- important messages, announcements, decisions and tasks are separate from normal messages;
- important project/event messages can require explicit acknowledgement;
- chats are created according to their parent entity, not as random rooms;
- entity chat membership follows entity membership;
- public discussions must be separate from private working chats;
- chat lifecycle changes require system messages and permission recalculation;
- drafts can exist but must disappear when access is lost;
- reactions are allowed later but are not acknowledgement;
- anti-spam/safety limits are required before production-scale chat.
