# BandKit — Chat Message Delete Rules v1.0

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

Message deletion must not be simple silent hard removal. Deletion behavior depends on chat type, user role, message ownership, entity context, moderation/safety status, and whether the message is pinned, replied to, reported, or connected to working obligations.

---

## Core principle

BandKit chats are not only casual conversations. Many chats are connected to projects, bands, organizations, events, bookings, riders, documents, payments, safety reports, moderation and reliability history.

Therefore deletion must balance privacy, clean UX, accountability, legal/contractual clarity, anti-fraud evidence, moderation audit, and project/event history integrity.

Accepted rule: **soft deletion by default**.

A deleted shared message should normally remain in the thread as a compact placeholder with deletion metadata.

---

## Accepted top-level decision

Deleting messages “for everyone” is allowed only where the message is not part of an entity-bound working history.

Allowed for normal authors:

- direct/private chats, within a longer time window;
- free group chats not attached to an entity, within a shorter time window.

Not allowed for normal authors:

- event chats;
- project/band/group/orchestra chats;
- organization chats;
- document/rider/booking/payment-related chats;
- safety/report/moderation chats;
- admin/role rooms, unless role policy explicitly allows it.

For entity-bound chats, a normal user can hide/delete locally, report the message, request deletion, or ask an admin/organizer/moderator to hide the message.

---

## Deletion modes

| Mode | Meaning | Who can use it | Default use |
|---|---|---|---|
| Delete for me | Hide message locally for one user | Any viewer, when policy allows | Personal cleanup |
| Delete for everyone | Soft-delete shared message for all participants | Author only in allowed contexts and time windows | Direct/free group chats |
| Admin hide | Hide shared message with reason and audit | Project/event/org admin, organizer, owner | Entity-bound chats |
| Moderator hide | Hide shared message with reason and preserved evidence | Moderator/safety/admin role | Safety, reports, fraud, abuse |
| Hard delete | Physical removal from storage | System/admin only, rare | Legal/compliance purge, spam purge |

---

## Time windows by chat type

| Chat context | Author can delete for everyone? | Time window | Notes |
|---|---:|---:|---|
| Direct/private chat | Yes | 40 minutes | Softer private-dialog logic |
| Free group chat not linked to entity | Yes | 15 minutes | Short correction window |
| Project/band/group/orchestra chat | No | — | Working history / obligations |
| Organization chat | No | — | Role and accountability context |
| Event chat | No | — | Legal/logistics/duty history |
| Document/rider/booking/payment-related chat | No | — | Must preserve record/versioning |
| Safety/report chat | No | — | Evidence must be preserved |
| Admin/role chat | Conditional by role policy | — | Usually admin hide with audit, not author delete |

Accepted values:

- Direct/private chat: **40 minutes**.
- Free group chat: **15 minutes**.
- Entity-bound chats: **no normal author delete for everyone**.

---

## Direct/private chats

Direct chats are the softest context.

Allowed actions:

- author can delete own message for everyone within 40 minutes;
- user can delete/hide messages locally for themselves;
- user can hide/delete the dialog locally;
- user can block/report the other participant.

Shared delete placeholder:

- `Сообщение удалено автором.`

Reason:

- optional;
- no required reason for normal author deletion in direct chats.

If the message was reported, original content must remain available to moderation even if hidden from normal participants.

---

## Free group chats not linked to entities

Free group chats may allow normal author deletion, but with a shorter window.

Allowed actions:

- author can delete own message for everyone within 15 minutes;
- user can delete/hide locally;
- admin/moderator can hide messages if policy allows;
- users can report messages.

Shared delete placeholder:

- `Сообщение удалено автором.`

Reason:

- optional for author delete;
- recommended quick reasons: `ошибка в сообщении`, `неактуальная информация`, `другое`.

If a free group chat later becomes attached to an entity, future messages should follow entity-bound rules.

---

## Entity-bound chats

Entity-bound chats include project chats, band/group/orchestra chats, organization chats, event chats, role/admin chats, and chats attached to documents, riders, bookings, payments or agreements.

Accepted rule:

> Normal users cannot delete messages for everyone in entity-bound chats.

These chats may contain work decisions, rehearsal/concert logistics, timings, duties, confirmations, rider/setlist decisions, payments, bookings, rentals, reliability evidence, legal or contractual context.

Allowed normal-user actions:

- `Удалить у себя` / local hide;
- `Пожаловаться`;
- `Запросить удаление`;
- `Редактировать` only if edit rules allow it;
- no shared deletion.

Admin/organizer/moderator actions:

- `Скрыть сообщение`;
- must provide reason;
- action must be audited;
- original content should remain in audit/moderation storage if policy requires.

Shared placeholder examples:

- `Сообщение скрыто администратором.`
- `Сообщение скрыто организатором.`
- `Сообщение скрыто администратором организации.`

Required details:

- `Удалил: <display name / role>`
- `Причина: <reason>`

---

## Event chats

Event chats require especially strict deletion rules.

Accepted rule:

> Normal event participants cannot delete messages for everyone.

Event chats may include participation commitments, cancellations, technical requirements, timings, payment/rider/booking details, responsibility and reliability history.

Allowed normal-user actions:

- hide locally;
- report;
- request deletion;
- leave/decline the event through event participation flow, not by deleting chat history.

Allowed organizer/admin actions:

- hide with mandatory reason;
- preserve audit;
- optionally add system message if the hidden message affected logistics.

Required reason examples:

- `неактуальная информация`;
- `ошибка в расписании`;
- `конфиденциальные данные`;
- `нарушение правил`;
- `другое`.

---

## Project / band / group / orchestra / organization chats

Accepted rule:

> Normal members cannot delete messages for everyone in working entity chats.

Allowed normal-user actions:

- hide locally;
- report;
- request deletion;
- edit only according to edit policy.

Allowed admin/manager actions:

- hide message with mandatory reason;
- audit action;
- preserve original content if the message is tied to safety, dispute, booking, payment, event or moderation.

Recommended placeholder:

- `Сообщение скрыто администратором.`
- `Удалил: <admin name>`
- `Причина: <reason>`

---

## Safety / report / moderation chats

Safety-sensitive messages must never be destroyed by normal user deletion.

Accepted rule:

> If a message is reported or part of a safety/moderation case, normal user deletion must not destroy evidence.

Allowed user actions:

- report;
- hide locally if policy allows;
- block contact;
- add context to report.

Moderator actions:

- hide with reason;
- preserve original content in moderation case;
- preserve attachments if relevant;
- add event to moderation/audit timeline.

Placeholder:

- `Сообщение скрыто модерацией.`
- `Удалил: <moderator/admin role>`
- `Причина: <reason>`

Moderator-facing note:

- `Оригинал сохранён в материалах проверки.`

Required reasons:

- `подозрительная ссылка`;
- `мошенничество`;
- `оплата вне платформы`;
- `оскорбления/угрозы`;
- `спам`;
- `нарушение правил`;
- `другое`.

---

## Display rule: show who deleted and why

Accepted rule:

> Shared deletion/hiding must show who deleted the message and why.

For normal author deletion in allowed contexts:

- `Сообщение удалено автором.`
- optional: `Удалил: <author name>`
- optional: `Причина: <reason>`

For admin/organizer/moderator hiding:

- `Сообщение скрыто администратором.`
- `Сообщение скрыто организатором.`
- `Сообщение скрыто модерацией.`
- `Удалил: <display name or role>`
- `Причина: <reason>`

UX note:

- do not show a huge block in the message thread;
- use compact text in the message card;
- full audit details should be shown only to users with permission.

Examples:

```text
Сообщение удалено автором · причина: ошибка в сообщении
```

```text
Сообщение скрыто администратором · причина: неактуальная информация
```

```text
Сообщение скрыто модерацией · причина: подозрительная ссылка
```

---

## Delete for me / local hide

Local deletion/hiding affects only the current user.

Behavior:

- message may disappear locally or become a local placeholder;
- other users still see the message;
- no shared system message;
- no shared audit event required, except internal user preference/history state if needed.

Recommended local placeholder:

- `Вы скрыли это сообщение.`

Use local placeholder instead of full disappearance when replies or thread context would otherwise become confusing.

---

## Pinned message deletion

If a pinned message is deleted or hidden, the pinned strip must not break.

MVP behavior:

- pinned strip remains visible;
- text changes to `Закреплённое сообщение удалено.`;
- clicking pinned strip scrolls to the deleted placeholder message if it still exists in the thread.

Later behavior:

- admin/organizer can unpin deleted message;
- admin/organizer can replace pinned message;
- UI can show `Закреплённое сообщение удалено — выберите новое закрепление.`

Rules:

- do not automatically pin another message;
- record audit/system event if pinned message was hidden by admin/moderator;
- if the deleted pinned message was safety-related, preserve original content for moderation.

---

## Replies to deleted messages

Replies must not break when the source message is deleted.

Behavior:

- reply preview should show `Ответ на удалённое сообщение`;
- original author may be hidden depending on deletion mode/privacy policy;
- if the user has moderation/admin rights, full original may be available in audit view.

If a message with replies is hidden by admin/moderator, reply previews should show that the referenced message was hidden. Do not remove reply chain structure.

---

## Attachments and linked documents

Deleting a message with attachments must not blindly delete files or linked documents.

Rules:

- message attachments are hidden from normal users when message is deleted for everyone;
- if attachment is a standalone project document, deleting the message must not delete the document itself;
- if attachment is uploaded only as message media, it may be hidden from normal users;
- safety/moderation storage may preserve attachments;
- document/rider/setlist changes should use versioning, not message deletion.

---

## Editing and deletion relationship

Deletion rules imply edit rules.

| Chat context | Edit own message | Delete for everyone |
|---|---:|---:|
| Direct/private chat | Up to 40 minutes | Up to 40 minutes |
| Free group chat not linked to entity | Up to 15 minutes | Up to 15 minutes |
| Project/band/group/orchestra chat | Very short typo window or disabled | No normal author delete |
| Organization chat | Very short typo window or disabled | No normal author delete |
| Event chat | Very short typo window or disabled | No normal author delete |
| Document/rider/booking/payment context | Use versioning/audit | No normal author delete |
| Safety/report chat | Disabled after report | No normal author delete |

Recommended entity-bound edit window:

- 3–5 minutes only for typo correction;
- always mark as `изменено`;
- disable edit if message is pinned, replied to, reported, attached to document/payment/booking, or already part of a moderation/safety case.

---

## Confirmation rules

Deletion confirmation depends on context.

Direct/private author delete:

> Удалить сообщение для всех участников диалога? Это можно сделать только в течение ограниченного времени.

Free group author delete:

> Сообщение будет удалено для всех участников чата. В истории останется отметка об удалении.

Entity-bound user request:

> Это сообщение относится к проекту/событию и может быть частью договорённостей. Вы можете скрыть его у себя или отправить запрос на удаление.

Admin/moderator hide:

> Сообщение будет скрыто для участников. Оригинал и причина будут сохранены в журнале действий.

---

## Audit model requirements

Shared deletion/hiding must create audit data.

Minimum fields:

- `message_id`;
- `room_id`;
- `chat_type`;
- `parent_entity_type`;
- `parent_entity_id`;
- `original_author_id`;
- `deleted_by_user_id`;
- `deleted_by_role`;
- `delete_mode`;
- `delete_reason`;
- `deleted_at`;
- `was_pinned`;
- `had_replies`;
- `had_attachments`;
- `was_reported`;
- `preserved_for_moderation`;
- `visible_placeholder_text`.

Possible `delete_mode` values:

- `local_hide`;
- `author_delete_for_everyone`;
- `admin_hide`;
- `organizer_hide`;
- `moderator_hide`;
- `system_hard_delete`.

---

## Backend implications

Future backend should separate message content, message visibility state, per-user local hidden state, shared deletion state, moderation-preserved original content, deletion audit log, attachment visibility, reply references, and pinned message references.

Suggested concepts:

- `chat_messages.deleted_at`;
- `chat_messages.deleted_by`;
- `chat_messages.delete_mode`;
- `chat_messages.delete_reason`;
- `chat_messages.visible_placeholder`;
- `chat_message_audit_events`;
- `chat_message_local_states`;
- `moderation_case_messages`;
- `chat_message_attachments.visibility_state`.

Hard delete should be rare and isolated to system/admin maintenance tools.

---

## MVP frontend behavior

Current frontend mock behavior may stay simple:

- `Удалить` performs soft delete in the current UI;
- message body becomes `Сообщение удалено.`;
- actions are removed;
- if pinned, pinned strip shows `Закреплённое сообщение удалено.`;
- no backend persistence yet.

Next frontend improvements should follow this spec:

1. Add delete mode labels: author deleted, admin hidden, moderator hidden.
2. Add reason picker for admin/moderator hide.
3. Hide `Удалить для всех` in entity-bound chat mocks.
4. Replace it with `Удалить у себя`, `Запросить удаление`, `Пожаловаться`.
5. Add future API contract for delete/hide actions.

---

## Accepted product decision

BandKit deletion rules:

- direct chats: author can delete for everyone up to 40 minutes;
- free group chats not tied to entities: author can delete for everyone up to 15 minutes;
- project/event/organization/document/payment/safety/admin contexts: normal users cannot delete for everyone;
- entity-bound removal is admin/organizer/moderator hide with mandatory reason and audit;
- shared deletion/hiding always leaves a visible placeholder;
- placeholder must indicate who deleted/hidden the message and why, compactly;
- reported/safety-sensitive originals must be preserved for moderation;
- hard delete is rare and system/admin-only.
