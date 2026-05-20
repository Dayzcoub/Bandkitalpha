# BandKit — Chat History and Reply Logistics v1.0

## Purpose

This spec fixes the full intended logistics for chat history navigation, unread landing, replies with context, pinned messages, search, filters, anchors and future backend requirements.

This document extends the current logistics polish phase and must be followed before adding deeper chat modules.

---

## Product decision

There must be no separate primary button named `Go to unread` / `К непрочитанным` as the default entry behavior.

When a user opens `/chats/:chatId`, the room should automatically land at the first unread or most important relevant message.

A visible unread divider may exist inside the timeline:

- `Новые сообщения`
- `Unread`

But the default entry action is automatic.

---

## Required chat history behavior

### 1. Default unread landing

On room open:

- if the user has unread messages, scroll to the first unread message;
- if there are no unread messages, open near the latest messages;
- if the URL contains a message anchor, open that exact message instead;
- browser back/forward should preserve scroll position when returning to a chat.

### 2. Date separators

Message history must support date separators such as:

- `Сегодня`
- `Вчера`
- `18 мая 2026`

They help users navigate long histories without a separate heavy calendar UI.

### 3. Older message loading

History must support loading older messages above the current visible area.

MVP UI may show:

- `Загрузить старые сообщения`

Future backend should replace this with cursor-based pagination or automatic top-scroll loading.

### 4. Search inside chat

A room should provide search over the current chat history.

Search results should be jump targets, not just text matches.

Example result behavior:

- click result;
- jump to matching message;
- highlight message temporarily.

### 5. History filters

The room should support compact history filters.

Recommended MVP filters:

- `Все`
- `Непрочитанные`
- `Упоминания`
- `Файлы`
- `Документы`
- `Закреплённые`

For safety/suspicious chats also include:

- `Риски`
- `Ссылки`
- `Жалобы`

### 6. Pinned messages

Project/event chats should support pinned context.

Pinned examples:

- rehearsal time changed;
- event document updated;
- important decision;
- payment/booking confirmation;
- safety warning.

Pinned messages should be compact and not dominate the room.

### 7. Message anchors

Every important message must be addressable by a stable internal anchor.

Future URL format:

```text
/chats/c1?message=m128
```

This is required for:

- notifications;
- reports;
- moderation;
- document discussions;
- event discussions;
- search results;
- pinned messages.

### 8. Reply with attached context

When replying to a message, the composer should show an attached context block.

The context should include:

- original sender;
- original message preview;
- linked document/event/safety context when relevant;
- clear/remove control.

The reply should preserve source message reference for future backend:

```text
reply_to_message_id
```

### 9. Different room types must behave differently

#### Project chat

Emphasis:

- project members;
- events;
- documents;
- decisions;
- pinned work items;
- role-based access.

#### Event chat

Emphasis:

- event date;
- participants;
- RSVP/confirmation;
- setlist/rider/documents;
- schedule changes.

#### Direct trusted chat

Emphasis:

- personal participants;
- file exchange;
- safety notices;
- profile context;
- no automatic project/document access.

#### Safety/suspicious chat

Emphasis:

- blocked links;
- suspicious payment requests;
- report action;
- moderation context;
- evidence preservation;
- warning not to pay outside the platform.

---

## Current mock UI expectations

During MVP shell/logistics polish, without backend, the mock UI should include:

- automatic unread landing;
- visible unread divider;
- reply context above composer;
- compact history toolbar;
- date separators;
- pinned summary block;
- fake `Load older messages` row;
- message-level reply action;
- safety-specific filters in suspicious chat;
- active chat row highlight.

---

## Backend contract notes for later

Messages should not be stored as plain unstructured text only.

Future message model should support:

```text
message_id
chat_id
sender_id
created_at
edited_at
reply_to_message_id
message_type
body
attachments
linked_document_id
linked_event_id
linked_band_id
link_policy_state
moderation_state
read_by
pinned
pinned_by
pinned_at
deleted_at
```

Chat membership/read state should support:

```text
chat_id
user_id
role
last_read_message_id
first_unread_message_id
muted_until
notification_level
```

History API should support:

```text
load latest N messages
load before cursor
load after cursor
open message by id
search inside chat
return pinned messages
return unread count
return linked documents/events
```

---

## Implementation discipline

Do not add backend assumptions too early.

Do not turn chat into a separate large module before current Core MVP logistics are stable.

Keep changes in this phase as:

- mock UI;
- route logistics;
- state-independent behavior;
- future backend contract documentation.

The goal is to make chat feel like a coherent working context before real data is connected.
