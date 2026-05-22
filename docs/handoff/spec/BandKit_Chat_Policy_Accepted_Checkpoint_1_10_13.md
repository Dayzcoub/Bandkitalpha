# BandKit — Accepted Chat Policy Checkpoint 1.10.13

## Status

Accepted product checkpoint.

This document records the accepted BandKit chat policy baseline after the chat UI/action checkpoints and the full chat policy specification pass.

Latest accepted policy commit before this checkpoint note:

- `7999e65` — `Restrict external forwarding of entity documents`

---

## Repository state

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS preview: `http://141.98.87.9`
- Previous chat UI/action checkpoint: `1.10.12 chat message actions checkpoint`
- New policy checkpoint: `1.10.13 chat policy accepted checkpoint`

---

## Accepted chat policy documents

Current accepted chat policy specs:

1. `BandKit_Chat_Exit_And_Membership_Rules_v1_0.md`
   - leave chat rules;
   - project/event membership-linked chat access;
   - direct/free group/project/event/safety/admin exit behavior.

2. `BandKit_Chat_Message_Delete_Rules_v1_0.md`
   - delete for self;
   - delete for everyone;
   - entity-bound deletion restrictions;
   - admin/moderator hide with reason;
   - soft-delete placeholders;
   - pinned/reply/attachment/audit implications.

3. `BandKit_Chat_Message_Edit_Rules_v1_0.md`
   - edit windows by chat type;
   - direct chat: 20 minutes;
   - free group chat: 5 minutes;
   - entity-bound chats: 2 minutes typo-only;
   - `изменено` marker;
   - versioning/audit for documents and sensitive contexts.

4. `BandKit_Chat_Access_Notifications_Attachments_Archive_Rules_v1_0.md`
   - chat access by parent entity;
   - personal restrictions;
   - read-only states;
   - mute and notification bypass rules;
   - mentions;
   - attachments/documentation access;
   - external forwarding/export restrictions for entity documents;
   - read receipts/acknowledgements;
   - archive retention;
   - system messages.

5. `BandKit_Chat_Advanced_Governance_Rules_v1_0.md`
   - message reports;
   - reply/quote/forward governance;
   - important messages/announcements/decisions/tasks;
   - chat creation;
   - member management;
   - public discussions vs working chats;
   - chat lifecycle/type migration;
   - drafts;
   - reactions;
   - anti-spam and abuse controls.

---

## Accepted high-level policy model

BandKit chat is not a generic messenger only. It is a communication layer around:

- direct personal relationships;
- free group conversations;
- projects/bands/groups/orchestras;
- organizations;
- events;
- documents/riders/bookings/payments;
- safety/moderation cases;
- admin/role rooms.

The same chat UI can be reused, but permissions and message behavior are computed from the room type and parent entity.

---

## Core accepted rules

### Access and membership

- Active event participants can write in event working chats.
- Viewers/followers/subscribers cannot write in working event chats.
- Public event discussions, if implemented, must be separate from private working chats.
- Former project participants are immediately removed from related chats.
- Related chats are hidden from former participants.
- Former participants lose document access through those chats.
- Exceptional access for disputes, payments, safety or legal cases must be separate case-based access.

### Restrictions and read-only

- Platform-level restricted users cannot see or write anywhere.
- Personal restrictions stop personal interaction but do not break shared working chat visibility.
- In shared entity chats, work messages remain visible if both users are still valid participants.
- Personal restrictions forbid direct messages, direct mentions, reply/quote and personal forwarding.
- Read-only users can see allowed chats but cannot write, reply, quote, edit, delete, pin, attach files or invite users.

### Mute and mentions

- Mute is allowed for direct chats and free group chats not attached to entities.
- Entity-bound chats should not be fully muted by default because critical updates can be missed.
- Normal user mentions respect mute and restrictions.
- Entity/admin/moderator mentions may bypass mute, but not access restrictions.
- Role mentions such as `@all` should be permission-gated.

### Documents and attachments

- Users who left projects/events cannot attach files or access documentation through related chats.
- Deleting a message does not delete a project document.
- Entity documents and attachments stay inside the entity by default.
- Regular participants cannot externally forward/export entity documents from chat.
- External forwarding/export of riders, contracts, receipts, schedules and other entity documents is allowed only to responsible roles: event manager/organizer, group/project admin, group/project manager, and organization admin/manager where applicable.
- External export/forwarding must be auditable later.

### Message delete/edit

- Direct chats: author can delete for everyone up to 40 minutes and edit up to 20 minutes.
- Free group chats not tied to entities: author can delete for everyone up to 15 minutes and edit up to 5 minutes.
- Entity-bound chats: no normal author delete for everyone.
- Entity-bound chats: author can edit up to 2 minutes typo-only.
- Entity-bound removal is admin/organizer/moderator hide with mandatory reason and audit.
- Shared deletion/hiding always leaves a visible placeholder.
- Shared deletion/hiding must show who deleted/hidden the message and why, compactly.
- Reported/safety-sensitive originals must be preserved for moderation.

### Reports and governance

- Message reports preserve original content and context.
- Reported messages cannot be destroyed by normal delete/edit.
- Reply/quote/forward must not bypass access, deletion, restrictions or confidentiality.
- Forwarding from entity/safety/admin contexts is restricted.
- Public discussions must be separate from private working chats.
- Chat lifecycle changes require system messages and permission recalculation.

### Important messages and acknowledgements

- Important messages, announcements, decisions and tasks are separate from normal messages.
- Important project/event messages can require explicit acknowledgement.
- Supported future acknowledgement actions: `Ознакомлен`, `Принял задачу`, `Подтверждаю участие`.
- Reactions do not count as legal/operational acknowledgement unless explicitly designed as such.

### Archive and system messages

- Entity-related chats are archived/read-only after closure/completion.
- Conversation history and attachments are retained for 50–55 days.
- Safety/moderation/legal cases may require longer retention.
- System messages are required for joins, leaves, removals, role changes, event moves/cancellations, document updates, pinned/unpinned messages, hidden messages, archive/reopen and other critical entity events.
- Ordinary users cannot delete/edit system messages.

---

## Do not regress

Do not revert these accepted decisions:

- no universal `leave chat` action for all chat types;
- no normal author delete-for-everyone in entity-bound chats;
- no broad edit freedom in entity-bound chats;
- no external forwarding/export of entity documents by regular participants;
- no mixing public discussion and working chats;
- no hiding entity chat messages from personal restrictions if both users remain valid participants and working continuity requires visibility;
- no treating reactions as acknowledgement;
- no silent lifecycle changes without system messages;
- no hard-delete-by-default model.

---

## Next implementation direction

Recommended next frontend/UI steps:

1. Add chat room menu mock based on room context.
2. Add context-aware action sets:
   - direct chat;
   - free group chat;
   - project chat;
   - event chat;
   - safety/admin chat.
3. Add system message visual style.
4. Add important message / `Ознакомлен` mock.
5. Add message report mock flow.
6. Add role-aware attachment/document forwarding restrictions in UI.

Recommended next backend/spec direction:

1. Chat permission resolver.
2. Chat actions API contract.
3. Message report/moderation case schema.
4. Entity document permission/export audit schema.
5. Notification/mention policy resolver.

---

## Handoff summary

Continue BandKit from repo `Dayzcoub/Bandkitalpha`, branch `main`.

Latest accepted policy commit before this checkpoint note:

- `7999e65` — `Restrict external forwarding of entity documents`

Current accepted checkpoint:

- `1.10.13 chat policy accepted checkpoint`

The chat policy foundation is now accepted and should drive future chat UI/backend work.
