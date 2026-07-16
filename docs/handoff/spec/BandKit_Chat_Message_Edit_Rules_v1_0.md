# BandKit — Chat Message Edit Rules v1.0

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

This document fixes how message editing should work in BandKit chats. The logic follows the same accountability model as message deletion, but edit windows are shorter, especially in entity-bound chats.

---

## Core principle

Editing is less destructive than deletion, but in BandKit it can still rewrite working history.

Chats may contain:

- project decisions;
- event logistics;
- participation confirmations;
- cancellations;
- rider/setlist details;
- booking/payment details;
- safety evidence;
- moderation context;
- reliability/reputation signals.

Therefore message editing must be limited by:

- chat type;
- author ownership;
- time since sending;
- whether the message was pinned;
- whether the message was replied to;
- whether the message was reported;
- whether it is attached to a project/event/document/payment/safety context;
- role and permissions.

Accepted rule: **editing is allowed only as a short correction window, not as a way to rewrite obligations.**

---

## Accepted top-level decision

Editing follows the same context logic as deletion, but with shorter windows.

Allowed for normal authors:

- direct/private chats, within a medium correction window;
- free group chats not linked to entities, within a short correction window;
- entity-bound chats, only within a very short typo-fix window.

Not allowed for normal authors after the correction window:

- event chats;
- project/band/group/orchestra chats;
- organization chats;
- document/rider/booking/payment-related chats;
- safety/report/moderation chats;
- admin/role rooms unless role policy allows it.

All shared edits must leave a visible `изменено` marker.

---

## Edit windows by chat type

| Chat context | Author can edit? | Time window | Marker | Notes |
|---|---:|---:|---|---|
| Direct/private chat | Yes | 20 minutes | `изменено` | Softer private-dialog logic |
| Free group chat not linked to entity | Yes | 5 minutes | `изменено` | Short correction window |
| Project/band/group/orchestra chat | Yes, typo-only | 2 minutes | `изменено` | Very short entity-bound correction |
| Organization chat | Yes, typo-only | 2 minutes | `изменено` | Role/accountability context |
| Event chat | Yes, typo-only | 2 minutes | `изменено` | Logistics/legal history |
| Document/rider/booking/payment-related chat | Usually no | — | Versioning/audit instead | Use document versions, not message edits |
| Safety/report chat | No after report/case creation | — | Audit only | Evidence must be preserved |
| Admin/role chat | Conditional by role policy | 2 minutes or role-based | `изменено` + audit | Usually stricter than normal chats |

Accepted values:

- Direct/private chat: **20 minutes**.
- Free group chat not tied to an entity: **5 minutes**.
- Entity-bound chats: **2 minutes**, typo-fix only.
- Document/payment/safety contexts: usually **no normal editing**.

---

## Direct/private chats

Direct chats are the softest context.

Allowed actions:

- author can edit own message within 20 minutes;
- edited message gets `изменено` marker;
- previous versions may be stored depending on backend policy;
- reported messages must preserve original content for moderation.

Recommended UX:

- action label: `Редактировать`;
- after edit: compact marker `изменено` near timestamp;
- optional edit history later.

Rules:

- if message was reported, edit must not destroy original version;
- if message has attachments, editing text does not edit/delete attachments;
- if message includes suspicious/external link, safety checks should rerun after edit.

---

## Free group chats not linked to entities

Free group chats may allow normal editing, but with a short window.

Allowed actions:

- author can edit own message within 5 minutes;
- edited message gets `изменено` marker;
- after 5 minutes, author cannot edit for everyone;
- author can send a correction message instead.

Recommended UX:

- `Редактировать` appears only within the allowed window;
- after window expires, hide/disable edit action;
- if disabled, optional tooltip: `Время редактирования истекло`.

Rules:

- if message is reported, editing is blocked;
- if message is pinned, editing is blocked unless admin explicitly allows replacement/edit flow;
- if message has been heavily replied to, editing should be blocked or versioned.

---

## Entity-bound chats

Entity-bound chats include:

- project chats;
- band/group/orchestra chats;
- organization chats;
- event chats;
- role/admin chats;
- chats attached to documents, riders, bookings, payments or agreements.

Accepted rule:

> Normal users may edit only within a very short typo-fix window.

Accepted window:

- **2 minutes** after sending.

Reasoning:

Entity-bound chats can contain working decisions and obligations. Editing must not allow users to rewrite what they promised, confirmed, declined, agreed to, or requested.

Allowed normal-user actions:

- edit typo within 2 minutes;
- after that, send a correction message;
- request admin/moderator correction if needed;
- report if message has safety issue.

Required marker:

- `изменено`.

Recommended restriction text:

> Это сообщение относится к проекту/событию и может быть частью договорённостей. Время редактирования истекло — отправьте уточнение новым сообщением.

---

## Event chats

Event chats are especially strict.

Accepted rule:

> Event participants can edit only within 2 minutes, typo-fix only.

Event messages may contain:

- arrival times;
- cancellation notices;
- setup/load-in logistics;
- stage/rider requirements;
- payment/booking details;
- commitments and responsibilities.

Rules:

- after 2 minutes, editing is blocked;
- for changed plans, user must send a new message;
- organizer/admin can add official correction/system note;
- if the message is pinned, replied to, reported, or tied to participant status, editing is blocked immediately;
- audit/version should preserve the original if the message affects logistics.

Recommended UX:

- action label within window: `Редактировать`;
- after window: hidden/disabled;
- correction suggestion: `Отправьте уточнение новым сообщением`.

---

## Project / band / group / orchestra / organization chats

Accepted rule:

> Working entity chats allow only short typo correction, not history rewriting.

Allowed normal-user actions:

- edit own message within 2 minutes;
- after 2 minutes, send a correction;
- request admin correction/hide if needed.

Admin/manager actions:

- may add official correction note;
- may hide message with reason according to deletion rules;
- should not silently rewrite another user's message text.

Recommended UX marker:

- `изменено` near timestamp;
- optional version/audit view for admins later.

---

## Document / rider / booking / payment contexts

Messages connected to documents, riders, bookings, payments or agreements should not be freely edited.

Accepted rule:

> Use versioning or correction messages instead of normal message editing.

Examples:

- rider update should create a new document version;
- booking/payment correction should create audit event or official correction;
- setlist/rider changes should be versioned;
- message can link to the new version rather than rewriting old text.

Allowed actions:

- send correction;
- update linked document through proper versioning;
- admin/moderator hide with reason if needed.

---

## Safety / report / moderation contexts

Safety-sensitive messages must preserve original content.

Accepted rule:

> If a message is reported or part of a safety/moderation case, normal user editing must be blocked or original content must be preserved before edit.

MVP rule:

- block editing after report/case creation.

Future backend rule:

- preserve original version in moderation evidence;
- allow normal UI to show edited version only if policy allows;
- moderation view shows original and edited versions.

Recommended marker:

- `изменено` if edited before report;
- moderation audit keeps full version history.

---

## Messages that cannot be edited

Editing should be blocked if the message is:

- pinned;
- replied to and the edit would change meaning;
- reported;
- deleted/hidden;
- attached to a safety case;
- attached to a document/rider/booking/payment/agreement;
- a system message;
- a moderation/admin decision;
- older than the allowed edit window;
- part of event logistics after any participant has acknowledged it;
- authored by another user.

Recommended disabled reason text:

- `Это сообщение уже нельзя редактировать.`
- `Сообщение закреплено — сначала снимите закреп.`
- `Сообщение уже используется в ответах.`
- `Сообщение относится к событию/проекту.`
- `Время редактирования истекло.`

---

## Edit marker and version visibility

Every shared edit must show a visible marker.

Minimum marker:

- `изменено`

Recommended compact display:

```text
18:42 · изменено
```

For entity-bound chats, future admin/audit view may show:

- original text;
- edited text;
- edited by;
- edited at;
- edit reason if required;
- affected pinned/reply/report state.

For normal users, do not show heavy edit history in the main thread unless needed.

---

## Edit reason rules

| Context | Reason required? |
|---|---:|
| Direct/private chat | No |
| Free group chat | No |
| Project/band/group/orchestra chat | No for 2-minute typo edit; yes for admin correction/hide |
| Organization chat | No for 2-minute typo edit; yes for admin correction/hide |
| Event chat | No for 2-minute typo edit; yes for organizer/admin correction |
| Document/rider/booking/payment context | Use version reason/change note |
| Safety/report/moderation context | Yes in moderation/audit flow |
| Admin/role chat | Usually yes for role/admin correction |

---

## Relation to deletion rules

Editing and deletion must not conflict.

Accepted relationship:

| Chat context | Edit own message | Delete for everyone |
|---|---:|---:|
| Direct/private chat | Up to 20 minutes | Up to 40 minutes |
| Free group chat not linked to entity | Up to 5 minutes | Up to 15 minutes |
| Project/band/group/orchestra chat | Up to 2 minutes, typo-only | No normal author delete |
| Organization chat | Up to 2 minutes, typo-only | No normal author delete |
| Event chat | Up to 2 minutes, typo-only | No normal author delete |
| Document/rider/booking/payment context | Versioning/audit instead | No normal author delete |
| Safety/report chat | Block after report/case | No normal author delete |

Reasoning:

- Editing windows are shorter than deletion windows.
- Entity-bound chats allow only tiny typo correction.
- If a user needs to change meaning, they should send a new correction message.
- Deletion/hiding in entity-bound contexts is admin/organizer/moderator action with reason and audit.

---

## Confirmation and UI behavior

For normal quick edits, no heavy modal is needed.

Recommended UX:

1. User taps/clicks `Редактировать`.
2. Composer switches to edit mode.
3. Composer shows compact context label:
   - `Редактирование сообщения`
4. Submit updates the message if still within allowed window.
5. Message receives `изменено` marker.

If the window expired while editing:

> Время редактирования истекло. Отправьте уточнение новым сообщением.

For entity-bound chats, if edit is blocked:

> Это сообщение относится к проекту/событию и может быть частью договорённостей. Отправьте уточнение новым сообщением.

For admin/organizer correction:

- use official correction message or system note;
- do not silently rewrite another user's text.

---

## Backend model requirements

Future backend should support edit audit/versioning.

Minimum fields:

- `message_id`;
- `room_id`;
- `chat_type`;
- `parent_entity_type`;
- `parent_entity_id`;
- `author_id`;
- `edited_by_user_id`;
- `edited_by_role`;
- `edited_at`;
- `edit_count`;
- `is_edited`;
- `edit_window_expires_at`;
- `original_text_hash`;
- `previous_text` or version pointer if policy allows;
- `new_text`;
- `edit_reason` if required;
- `was_pinned`;
- `had_replies`;
- `was_reported`;
- `had_attachments`;
- `preserved_for_moderation`.

Suggested tables/concepts:

- `chat_messages.is_edited`;
- `chat_messages.edited_at`;
- `chat_messages.edit_count`;
- `chat_message_edit_events`;
- `chat_message_versions`;
- `moderation_case_message_versions`;
- `document_versions` for document/rider/setlist contexts.

---

## MVP frontend recommendation

For current mock frontend stage:

1. Add `Редактировать` action later next to `Ответить / Закрепить / Удалить`.
2. Show it only when the current mock context allows editing.
3. For direct/private mock: allow edit.
4. For free group mock: allow edit.
5. For entity-bound mock: either hide edit or show a short disabled explanation.
6. Add `изменено` marker after local edit.
7. No backend persistence yet.

Do not add broad edit behavior until chat type/context policy is wired.

---

## Accepted product decision

BandKit edit rules:

- direct chats: author can edit for up to 20 minutes;
- free group chats not tied to entities: author can edit for up to 5 minutes;
- project/event/organization/entity-bound chats: author can edit for up to 2 minutes only for typo correction;
- document/rider/booking/payment contexts should use versioning/audit instead of message editing;
- safety/report messages should block editing after report/case creation;
- all shared edits show `изменено`;
- pinned, reported, deleted, system, admin decision and heavily referenced messages should not be editable;
- changing meaning in entity-bound chats should be done by sending a new correction message, not by rewriting old text.
