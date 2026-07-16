# BandKit — Chat UI Gap Map Against Accepted TZ v1.0

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

Working audit document. No application code changes.

Created after rollback of the broken runtime `ChatListPolish` layer. Current accepted app behavior remains the restored chat baseline:

- chat restored after broken list polish rollback;
- latest accepted working commit: `6d6c1e4`;
- `ChatEmptyStates` remains accepted;
- no search/filter panel inside the message window;
- no extra runtime list-polish observer.

## Source rules reviewed

This gap map is based on the accepted chat TZ/spec documents:

- `BandKit_Chat_Exit_And_Membership_Rules_v1_0.md`
- `BandKit_Chat_Access_Notifications_Attachments_Archive_Rules_v1_0.md`
- `BandKit_Chat_Message_Delete_Rules_v1_0.md`
- `BandKit_Chat_Message_Edit_Rules_v1_0.md`
- `BandKit_Chat_Advanced_Governance_Rules_v1_0.md`

## Core product rule summary

BandKit chat is not one generic messenger room type.

A chat may be attached to:

- direct user-to-user relationship;
- free group conversation;
- project/band/workspace;
- organization/orchestra;
- event;
- document/rider/booking/payment context;
- safety/moderation case;
- admin/role-based room.

Therefore the UI must not implement universal chat behavior for actions such as leave, mute, archive, delete, edit, forward, attach, pin or acknowledge.

Access, permissions, notifications and available actions must be derived from the parent context and role/policy state.

## Current implementation snapshot

### Current `/chats` and `/chats/:chatId` rendering

Current chat pages are still mock-first:

- `/chats` renders a policy card and a list of mock chats from `mockData.ts`.
- `/chats/:chatId` renders the same mock chat list and a mock message thread.
- The composer is originally rendered as a separate card and then moved inside the chat thread by the accepted chat layout decorator.

Current positive state:

- chat list and message thread scroll separately;
- mobile uses list → room → back flow;
- pinned strip is compact and only shown when a pinned message exists;
- pinned click scrolls to the full message and highlights it;
- empty/loading/error/not-selected states are prepared through `data-chat-state`.

Current risk:

- UI behavior is mostly controlled by DOM decorators in `App.ts` and `ChatMessageControls.ts` rather than a typed chat room model.
- Existing list rows do not expose a stable `chat.kind`, `parentEntityType`, `accessState`, `archiveState`, `notificationPolicy`, `readOnly` or `canWrite` model.

### Current stress rooms

`CHAT_STRESS_ROOMS` already visually covers several real chat types:

- project chat;
- event chat;
- direct chat;
- document/rider chat;
- technical/backline chat;
- safety/moderation chat;
- free group chat;
- organization chat;
- admin chat.

But these room types are currently only encoded as human-readable `meta` text and icons. They are not represented as policy-driving data.

### Current context card

`chatContextMeta()` currently collapses chat context into only three kinds:

- `direct`;
- `safety`;
- `project`.

This is useful as a mock preview, but it is too coarse for the accepted TZ. Event, organization, document/payment/rider, free group and admin/role chats need separate policy behavior.

### Current message actions

`ChatMessageControls.ts` currently appends two generic actions to every message:

- `Закрепить`;
- `Удалить`.

This is not TZ-safe as a final behavior.

Reason:

- normal author delete for everyone is not allowed in entity-bound chats;
- event/project/org/document/payment/safety/admin chats need context-specific delete/hide/request/report behavior;
- pinning and deleting must respect role, read-only state, archive state, safety/report state, pinned state, replied-to state and parent entity policy.

Current code is acceptable only as a temporary mock/control layer and should not be expanded without policy gating.

### Current attachments

Attachment menu is backend-ready mock only:

- file;
- BandKit document;
- photo/video;
- event;
- rider/setlist.

This matches the right direction, but it currently has no permission gating.

Required later:

- no attachments when user is read-only;
- no attachments when room is archived/read-only;
- no attachments after user leaves project/event/entity;
- entity documents must not be forwarded/exported outside entity context by normal participants;
- access to document attachments must be resolved through entity/document permissions.

### Current backend chat endpoint

Backend `handleListChatRooms` already returns basic room fields:

- `id`;
- `type`;
- `title`;
- `status`;
- `created_at`;
- `entity_name`;
- `event_title`;
- `message_count`.

This suggests the correct next frontend direction: map UI state from room type/status/entity/event context, not from a runtime DOM polish layer.

## Gap map

| Area | TZ requirement | Current state | Gap | Risk |
|---|---|---|---|---|
| Chat type model | Chat actions depend on direct/free/project/event/org/safety/admin/document context | Basic mock chats + stress rows, many types only in text | No typed room policy model in frontend | High |
| Access source | Entity-bound access computed from parent entity membership | UI only shows mock context; no computed access | Cannot know canWrite/canAttach/canLeave/canDelete | High |
| Leave/exit actions | No universal `Покинуть чат` | No final room menu yet | Must avoid adding generic leave action | High |
| Direct chat actions | Hide/delete locally/block/report/mute/archive | Not modeled | Need direct-specific action set | Medium |
| Free group actions | Leave/mute/archive/invite/report | Stress room exists but not typed | Need free-group-specific mock | Medium |
| Project chat actions | Mute/archive/hide/leave project, not leave chat | Project context exists in card | No action policy | High |
| Event chat actions | Mute/archive/hide/decline participation, not leave chat | Event context exists partly | No event-specific chat policy | High |
| Safety chat actions | Preserve evidence, report/escalate/archive/block, no normal leave/delete | Safety context exists | Generic delete still appears | High |
| Admin/role chat | Role-derived access, transfer/remove role before exit | Stress room exists | No role-derived actions | Medium |
| Delete | Soft deletion by default; no normal delete-for-everyone in entity-bound chats | Generic `Удалить` action on every message | Violates final TZ if treated as product behavior | High |
| Edit | Time-windowed; entity-bound typo-only 2 min | Not implemented | Need policy before adding | Medium |
| Pin vs important | Important/announcement/decision/task are separate from pinned | Pin strip exists | No typed important messages/acks/tasks | Medium |
| Read receipts / acknowledgement | Direct shows read status; entity important messages can require acknowledgement | Not implemented | Need typed important message model | Medium |
| Mute | Full mute only direct/free group; entity chats need softer notification controls | Not implemented | Avoid simple muted icon on entity chats | Medium |
| Attachments | Entity document access and forwarding are permission-gated | Backend-ready mock menu only | Need gating before real upload | High |
| Archive | Entity chats archive/read-only and retain 50–55 days | Empty states exist; archive state not modeled | Need room status model | Medium |
| System messages | Required for joins/leaves/removals/role/event/document/pin/archive events | Not implemented as typed messages | Need compact system message type | Medium |
| Public discussion | Must not mix public discussion with private working chat | Current chat is working/private mock | Good, but preserve separation | Low |
| Search | Message search must respect restrictions; accepted UI says no search inside message window | Current message window is clean | Good; do not re-add | Low |

## Recommended next implementation order

### Step 1 — Data-model only, no visual redesign

Add a frontend mock type layer for chat rooms. This should not change the accepted layout.

Suggested fields:

```ts
export type MockChatKind =
  | 'direct'
  | 'free_group'
  | 'project'
  | 'event'
  | 'organization'
  | 'document'
  | 'safety'
  | 'admin_role';

export interface MockChatPolicyPreview {
  kind: MockChatKind;
  parentEntityType?: 'profile' | 'project' | 'event' | 'organization' | 'document' | 'case' | 'role';
  parentEntityId?: string;
  status: 'active' | 'read_only' | 'archived' | 'restricted';
  canWrite: boolean;
  canAttach: boolean;
  canPin: boolean;
  canDeleteForEveryone: boolean;
  canRequestDelete: boolean;
  canReport: boolean;
  notificationMode: 'normal' | 'muted' | 'digest' | 'critical_only';
}
```

Important: this step should only enrich mock data and maybe add internal helper functions. It should not add runtime DOM decoration.

### Step 2 — Context-aware message actions

Before any new visual polish, replace generic message action assumptions with policy-aware labels.

Examples:

- direct chat: `Удалить у себя`, `Пожаловаться`, maybe `Удалить для всех` only if policy says allowed;
- project/event/entity chat: `Удалить у себя`, `Запросить удаление`, `Пожаловаться`;
- safety chat: `Пожаловаться`, `Добавить контекст`; moderator role can get hide/escalate actions;
- read-only/archived: no write/reply/pin/attach/delete-for-everyone actions.

### Step 3 — Room menu by chat kind

Add a room menu only after the policy model exists.

Do not add universal `Покинуть чат`.

Examples:

- direct: `Скрыть диалог`, `Удалить у себя`, `Заблокировать`, `Пожаловаться`;
- free group: `Покинуть чат`, `Отключить уведомления`, `Архивировать`;
- project: `Отключить уведомления`, `Скрыть из списка`, `Архивировать`, `Покинуть проект`;
- event: `Отключить уведомления`, `Архивировать`, `Отказаться от участия`;
- safety: `Пожаловаться`, `Заблокировать`, `Архивировать`; moderator actions by role.

### Step 4 — Compact system messages

Add typed compact system messages for:

- join/leave/remove;
- role change;
- event moved/cancelled;
- document/rider/setlist updated;
- pinned/unpinned/deleted pinned message;
- archived/reopened;
- safety/report case created.

### Step 5 — Important message / acknowledgement mock

After system messages, add one safe mock important message pattern:

- announcement/decision/task;
- `Ознакомлен` button only where user can acknowledge;
- `Ознакомились 8 из 12` display for entity chats.

## Hard rules for future chat UI work

- Do not add runtime list polish observers.
- Do not implement universal leave chat.
- Do not show full mute as a normal default for entity-bound chats.
- Do not allow generic delete-for-everyone in event/project/entity/safety/admin chats.
- Do not treat pinned message as the only operational important message type.
- Do not mix public discussion and working chat.
- Do not return search/filter panels inside the message window.
- Do not expand attachment behavior before permission gating is represented.
- Prefer data model + render-time helpers over DOM mutation.

## Immediate safe next commit recommendation

The next code change should be:

> Add typed mock chat policy metadata without changing visible layout.

This is safer than visual polish and gives future UI decisions a product-correct foundation.
