# BandKit — Accepted Chat Message Actions Checkpoint 1.10.12

## Accepted state

The chat message actions pass is accepted after the previous `1.10.11 chat cleanup checkpoint`.

Latest accepted functional commit before this checkpoint note:

- `43a5ff3` — `Sync contextual chat message action styles`

This checkpoint records the current chat MVP state after adding contextual message actions.

---

## Current repo state

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS preview: `http://141.98.87.9`
- Previous accepted checkpoint: `1.10.11 chat cleanup checkpoint`
- New accepted checkpoint: `1.10.12 chat message actions checkpoint`

---

## Accepted chat decisions preserved

- The message window remains clean.
- Search/filter controls are not returned inside the message thread.
- Chat list search remains in the room list.
- Future message search should be implemented as a separate mode/window, not as a permanent panel in the thread.
- Pinned strip remains a narrow top strip, shown only when a pinned message exists.
- Rooms without pinned messages should not show fake pinned/search placeholders.
- Composer remains inside the message thread and sticks to the bottom.
- Chat list and message history keep separate internal scroll zones.
- Mobile flow remains: chat list -> chat room -> back.
- External JS is not reintroduced; controlled modules are imported through the main renderer.

---

## What is accepted in this checkpoint

### Message actions

- Messages now support frontend/mock actions:
  - `Ответить`
  - `Закрепить`
  - `Удалить`
- Actions are small muted links, not heavy buttons.
- On desktop, actions appear on message hover/focus.
- On mobile, actions appear by long-pressing a message.
- Long press is approximately `520ms`.
- Mobile scroll movement cancels long press, so normal scrolling should not open actions.
- Tapping outside a message closes open mobile actions.

### Pinning

- `Закрепить` updates the top pinned strip with the selected message.
- If a room has no pinned strip, pinning creates it.
- The newly pinned message is highlighted with `is-pinned-message`.
- The pinned action changes to `Закреплено` for the active pinned message.
- Clicking the pinned strip scrolls to the pinned message and highlights it.

### Deleting

- `Удалить` performs soft frontend deletion only.
- The message body becomes `Сообщение удалено.`
- Message actions are removed after deletion.
- If the deleted message was pinned, the pinned strip shows that the pinned message was deleted.

### Visual polish accepted

- Message action links are muted and do not visually clutter the message list.
- The pinned state remains visible enough to explain why actions stay visible on a pinned message.
- Delete action uses a subtle danger color only on hover/focus.
- Mobile actions are hidden until long tap.

---

## Important files changed in this pass

- `src/modules/ChatMessageControls.ts`
- `src/main.ts`
- `src/styles/chat-message-controls.css`
- `public/styles/chat-message-controls.css`
- `public/index.html`

---

## Key commits in this pass

- `15c0236` — `Add chat message pin and delete controls`
- `06bf2fa` — `Wire chat message controls into app shell`
- `6120407` — `Add chat message control styles`
- `f1ed720` — `Sync chat message control styles to public assets`
- `5dcaca7` — `Load chat message control styles`
- `13c6d82` — `Reveal chat message actions on hover or long press`
- `dd9b0e4` — `Make chat message actions muted and contextual`
- `43a5ff3` — `Sync contextual chat message action styles`

---

## Backend/persistence status

This pass is intentionally frontend/mock only.

Not implemented yet:

- persistent message deletion;
- persistent pinned-message state;
- permissions/role checks for pin/delete;
- audit log for moderation-sensitive deletion;
- server-side event emission;
- realtime sync between clients;
- undo/restore deleted message;
- backend storage schema changes.

Future backend integration should replace the frontend-only state with API-backed chat message actions.

---

## Known constraints / do not regress

Do not revert these decisions:

- no heavy action buttons under every message;
- desktop actions appear on hover/focus;
- mobile actions appear on long tap;
- actions remain muted links;
- message pinning updates the top pinned strip;
- soft-delete text should not remove the card from layout during this mock stage;
- no external scripts for chat behavior;
- message controls remain a controlled module imported through `src/main.ts`.

---

## Recommended next steps

1. Add explicit `Unpin` / pinned strip management.
2. Add role-aware mock visibility for message actions.
3. Later connect pin/delete to backend permissions and persistence.
4. Later extract chat runtime decoration from `src/app/App.ts` into dedicated chat modules/components.
5. Later build separate message-search mode/window.

---

## Handoff summary for next chat

Continue BandKit from repo `Dayzcoub/Bandkitalpha`, branch `main`.

Latest accepted functional commit before checkpoint note:

- `43a5ff3` — `Sync contextual chat message action styles`

Current accepted state:

- chat cleanup and message actions accepted;
- message actions are small muted links;
- desktop shows actions on hover/focus;
- mobile shows actions on long tap;
- pin message updates/creates the top pinned strip;
- delete message is soft frontend deletion;
- no backend persistence yet;
- do not revert compact chat layout decisions.
