# BandKit — Chat Access, Notifications, Attachments, Archive and System Message Rules v1.0

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

This document fixes the next layer of chat rules: room access, personal restrictions, read-only states, mute behavior, mentions, attachments, read receipts, archive retention and system messages.

---

## 1. Access rules

Chat permissions are computed from the parent context, not only from the chat room.

Accepted rules:

- active event participants can write in the event working chat;
- viewers, followers and subscribers cannot write in the event working chat;
- public event discussion, if added later, must be separate from the private working event chat;
- a former project participant is immediately removed from all related project chats;
- related chats are hidden from a former participant's chat list;
- former participants cannot see new messages, write, receive notifications or access documents through those chats;
- disputes, payments, safety review or legal/audit cases must use separate case-based access, not normal chat access.

---

## 2. Personal restrictions and read-only states

Platform-level restriction:

- no chat visibility;
- no writing;
- no notifications;
- no attachment access;
- no message search;
- old room/message links must not open content;
- no new dialogs;
- no mentions, replies, quotes or forwards.

Personal user-to-user restriction:

- direct messages stop completely;
- existing direct dialog is hidden or marked as restricted;
- shared project/event/entity chats are not automatically hidden if both users remain valid participants;
- shared working context remains visible so project/event work does not break;
- personal interaction is disabled: no direct message, direct mention, reply/quote to that user's messages, personal forwarding, contact request or personal invitation.

Read-only state:

- user can see allowed chats if access remains valid;
- user cannot write, reply, quote, edit, delete, pin, attach files or invite users;
- user can read important operational messages if access is preserved;
- support/moderation contact can remain available by policy.

---

## 3. Mute and notifications

Accepted rule:

> Users can mute direct chats and free group chats that are not attached to entities.

Mute is allowed for:

- direct/private chats;
- free group chats not related to projects, events, organizations, documents, payments or safety cases.

Entity-bound chats should not use full mute as the default because critical work updates can be missed.

For entity chats, later use softer controls:

- lower priority notifications;
- digest mode;
- mute non-critical chatter;
- still deliver critical organizer/admin/entity notifications.

Bypass rule:

- normal user mentions respect mute and all restrictions;
- entity-originated mentions may bypass mute;
- admin/moderator mentions may bypass mute;
- no mention bypasses platform-level restrictions;
- read-only restrictions still apply;
- personal user-to-user restrictions still prevent personal/direct interaction.

---

## 4. Mentions

All users can mention other users only where they have permission to write.

Mention types:

- direct user mention: `@username`;
- entity-generated mention/notice;
- admin/moderator mention;
- future role mentions: `@all`, `@admins`, `@crew`, `@musicians`, `@organizers`.

Rules:

- normal mentions respect mute and user restrictions;
- entity/admin/moderator mentions may bypass mute, but not access restrictions;
- personal restriction forbids direct mention, reply/quote and personal forwarding;
- read-only users cannot mention if they cannot write;
- role mentions must be permission-gated later;
- `@all` should be admin/organizer/moderator only.

---

## 5. Attachments, documentation and external forwarding

After a user leaves or is removed from a project/event/entity:

- they cannot attach new files to related chats;
- they lose access to related entity chats;
- they lose access to documentation through those chats;
- related chats are hidden;
- old room/document links must not grant access.

Accepted rule:

> In event and entity-bound chats, documentation access disappears when the user no longer has valid entity membership.

Deleting a chat message does not delete a project document.

Rules:

- deleting/hiding a message can hide attachment preview;
- if an attachment points to a project document, the document remains in the project document system;
- document access is controlled by entity membership and document permissions;
- message deletion is not document deletion;
- documents/riders/setlists should use versioning.

Entity document forwarding rules:

- documents and attachments that belong to an entity must remain inside that entity by default;
- regular participants cannot forward entity documents outside the entity context;
- regular participants cannot export or externally send entity documents from chat;
- riders, contracts, receipts, schedules, payment/booking documents and other entity materials are treated as confidential by default;
- forwarding inside the same entity is allowed only to rooms/users that already have access to that entity and document;
- external forwarding/export is allowed only to responsible roles.

Roles allowed to externally forward/export entity documents:

- event manager / event organizer for event documents;
- group/band/project administrator;
- group/band/project manager;
- organization administrator/manager where applicable.

External forwarding/export must be auditable later:

- who sent/exported;
- what document/attachment;
- from which entity;
- to whom or to what external channel;
- when;
- reason/purpose if required.

Cannot attach or forward if user left the entity, is removed, read-only, room is archived/read-only, or attachment type is restricted.

---

## 6. Read receipts and acknowledgements

Direct/private chats:

- show normal read status.

Event/project/entity chats:

- important messages should support acknowledgement tracking.

Important messages include:

- event timing changes;
- load-in/soundcheck updates;
- rider updates;
- task assignments;
- cancellation notices;
- organizer/admin announcements;
- safety warnings.

Recommended behavior:

- normal users may see `Ознакомились 8 из 12`;
- organizer/admin can see who acknowledged/read;
- important messages can require explicit `Ознакомлен`;
- reactions like `👍` are not legal acknowledgement unless explicitly designed as such.

---

## 7. Archive and retention

Accepted rule:

> Archive entity-related chats and keep conversation history and attachments for 50–55 days.

Behavior:

- after project/event completion or chat closure, chat can become archived/read-only;
- archived chats are not active in the normal chat list;
- archived chats can be available through entity history if permissions allow;
- normal users cannot write to archived chats;
- attachments remain stored for retention period if access allows.

Retention:

- 50–55 days for chat history and attachments.

Exceptions:

- safety/moderation/legal cases may require longer retention;
- payment/booking/document records may follow separate retention;
- deleted/hidden message originals may be retained longer in audit/moderation storage.

---

## 8. System messages

System messages are required for important chat and entity events.

Required system messages:

- user joined;
- user left;
- user was removed;
- role changed;
- event moved/rescheduled;
- event cancelled;
- event participation changed;
- document updated;
- rider/setlist updated;
- message pinned;
- message unpinned;
- pinned message deleted/hidden;
- message hidden by admin/moderator;
- chat archived;
- chat reopened;
- user became read-only, when visible by policy;
- safety/report case created, when visible by policy.

Examples:

- `Mira Voice присоединилась к чату события.`
- `Alex Rhythm покинул проект. Связанные чаты скрыты для пользователя.`
- `Band Manager изменил роль Drum Tech: участник → техник.`
- `Событие перенесено: 18:00 → 19:30.`
- `Документ обновлён: Технический райдер v3.`
- `Alex Rhythm закрепил сообщение.`
- `Сообщение скрыто модерацией · причина: подозрительная ссылка.`

System message rules:

- ordinary users cannot delete system messages;
- ordinary users cannot edit system messages;
- system messages may be hidden only by admin/moderator/system policy;
- system messages must be compact in the thread;
- system messages should link to related entity/action when possible;
- system messages must respect access permissions;
- sensitive system messages may be visible only to moderators/admins.

---

## Backend implications

Future backend should include:

- computed chat access policy from parent entity membership;
- personal restriction relations;
- platform-level restriction state;
- read-only state;
- notification preferences per chat/entity;
- critical notification bypass rules;
- mention event records;
- attachment access checks through entity/document permissions;
- entity document external-forward/export permissions;
- document forwarding/export audit events;
- read receipts and explicit acknowledgements;
- archive state and retention expiry;
- system message types and payloads.

Suggested concepts:

- `chat_rooms.parent_entity_type`;
- `chat_rooms.parent_entity_id`;
- `user_restrictions`;
- `chat_notification_preferences`;
- `chat_mentions`;
- `chat_message_attachments`;
- `entity_document_permissions`;
- `entity_document_export_events`;
- `chat_read_receipts`;
- `chat_acknowledgements`;
- `chat_archive_state`;
- `chat_system_messages` or `chat_messages.message_type = system`.

---

## Accepted product decision

BandKit chat rules:

- event participants can write in event chats;
- viewers/followers/subscribers cannot write in working event chats;
- former project participants are immediately removed from related chats and those chats are hidden;
- platform-level restricted users cannot see or write anywhere;
- personal restrictions stop personal interaction but do not break shared working chat visibility;
- users can be read-only;
- mute is allowed for direct and free group chats not attached to entities;
- normal user mentions respect mute and restrictions;
- entity/admin/moderator mentions may bypass mute, but not access restrictions;
- users who left projects/events cannot attach files or access documentation through related chats;
- deleting a message does not delete the project document;
- entity documents and attachments stay inside the entity by default;
- external forwarding/export of riders, contracts, receipts, schedules and other entity documents is allowed only to event managers/organizers, group/project admins and group/project managers;
- direct chats show read status;
- event/project important messages track who acknowledged/read them;
- archived chat history and attachments are retained for 50–55 days;
- system messages are required for joins, leaves, removals, role changes, event moves, document updates, pinned/hidden messages and other critical entity events.
