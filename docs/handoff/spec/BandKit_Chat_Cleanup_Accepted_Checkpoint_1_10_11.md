# BandKit — Accepted Chat Cleanup Checkpoint 1.10.11

## Accepted state

The chat compact pinned strip / divider cleanup pass has been reviewed as the current working checkpoint after the previous chat messenger compact checkpoint.

Accepted latest functional commit before this checkpoint note:

- `3fab4c5` — `Remove stale pinned summary cleanup selectors`

This checkpoint note records the accepted state for continuation and handoff.

---

## Current repo state

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Previous accepted baseline: `1.10.10 chat messenger compact checkpoint`
- New accepted checkpoint: `1.10.11 chat cleanup checkpoint`
- VPS preview: `http://141.98.87.9`

---

## What is accepted in this checkpoint

### Chat window decisions preserved

- The chat message window stays clean.
- Search/filter controls are not returned inside the message thread.
- Search by chats remains in the room list only.
- The future message search should be a separate mode/window, similar to VK/Telegram, not a permanent panel in the message thread.
- The composer remains inside the message thread and sticks to the bottom.
- Chat list and message thread keep separate internal scroll areas.
- Mobile flow remains: chat list -> chat room -> back.

### Pinned strip cleanup

- The old heavy pinned/search dropdown model has been removed from active runtime styling.
- The top of the message thread now uses only a narrow pinned strip when a pinned message exists.
- If a room has no pinned message, no extra pinned/search panel is shown.
- Clicking the pinned strip jumps to the matching full message and highlights it.
- Rooms without pinned messages have tighter top spacing and reduced scroll padding.

### Divider cleanup

- Date divider and `Новые сообщения` divider no longer overlap.
- The unread divider is visually clearer.
- The first unread message has a subtle, readable highlight.
- Jump/scroll offsets were tuned so the pinned/unread target does not stick to the top edge.

### Composer and attachments

- Composer remains compact and messenger-like.
- Attachment button opens a backend-ready mock attachment menu.
- Attachment menu has its own compact scroll behavior inside the sticky composer.
- No real upload/storage logic was added in this pass.
- Reply context above composer is compact and limited in height.
- Reply close button no longer expands the composer block.

### Chat room list states

- Active chat room row has a clearer visual state through `.is-active` / `aria-current`.
- Unread badges in the room list are more readable.
- Hover and keyboard focus states were added for chat room rows.
- Chat row structure and navigation logic were not changed.

### CSS cleanup and layer discipline

- Removed dormant runtime for message-thread search from `src/app/App.ts`.
- Removed dormant old chat history dropdown/search/filter CSS from `src/styles/chat-history.css`.
- Removed stale `.bk-chat-pinned-summary` cleanup selectors from `public/styles/user-facing-cleanup.css`.
- Added a comment in `public/index.html` documenting the intended chat CSS layer order.
- Added narrow CSS polish layers instead of changing large existing layout files unnecessarily:
  - `chat-unread-states.css`
  - `chat-attachments.css`
  - `chat-room-states.css`
  - `chat-reply-context.css`

---

## Important files changed in this pass

- `src/app/App.ts`
- `src/styles/chat-history.css`
- `src/styles/chat-unread-states.css`
- `src/styles/chat-attachments.css`
- `src/styles/chat-room-states.css`
- `src/styles/chat-reply-context.css`
- `public/index.html`
- `public/styles/chat-unread-states.css`
- `public/styles/chat-attachments.css`
- `public/styles/chat-room-states.css`
- `public/styles/chat-reply-context.css`
- `public/styles/user-facing-cleanup.css`

---

## Key commits in this pass

- `5627095` — `Prevent chat dividers from overlapping`
- `460d11a` — `Add chat unread state polish`
- `639aded` — `Load chat unread state styles`
- `0a7f7e2` — `Sync chat unread styles to public assets`
- `23415c5` — `Remove dormant chat thread search runtime`
- `6096cad` — `Add compact chat attachment menu polish`
- `e124088` — `Sync chat attachment styles to public assets`
- `b35957e` — `Load chat attachment menu styles`
- `fe637b9` — `Polish chat rooms without pinned strip`
- `9a65696` — `Sync no-pinned chat polish to public assets`
- `33d0e43` — `Add chat room row state polish`
- `3710eba` — `Sync chat room row states to public assets`
- `368b0f2` — `Load chat room row state styles`
- `0d30170` — `Add compact chat reply context polish`
- `f9da281` — `Sync chat reply context styles to public assets`
- `e144a06` — `Load chat reply context styles`
- `d7c2f1a` — `Document chat CSS layer order`
- `25ed3e8` — `Remove dormant chat history dropdown styles`
- `3fab4c5` — `Remove stale pinned summary cleanup selectors`

---

## Known constraints / do not regress

Do not revert these accepted chat decisions:

- no search/filter panel inside the message thread;
- only a narrow pinned strip at the top of a chat room when a pinned message exists;
- no visible pinned/search placeholder when there is no pinned message;
- clicking a pinned strip jumps to the full message and highlights it;
- composer stays inside the message window;
- attachment menu remains backend-ready mock until upload/storage is implemented properly;
- room list and message history keep separate scroll containers;
- mobile keeps list -> chat -> back flow;
- external JS remains removed; only main renderer / controlled modules are used.

---

## Recommended next steps

1. Run a visual pass on VPS preview for:
   - `/chats`
   - `/chats/c1`
   - `/chats/c2`
   - `/chats/c3`
   - `/chats/c6`
   - `/chats/c8`
   - `/chats/c10`
   - `/chats/c13`
2. If preview is accepted, update the visible build marker from `1.10.8-avatar-strips` to the next checkpoint label.
3. Later extract chat runtime decoration from `src/app/App.ts` into dedicated chat modules/components.
4. Later implement separate message search mode/window instead of permanent search inside the thread.

---

## Handoff summary for next chat

Continue BandKit from repo `Dayzcoub/Bandkitalpha`, branch `main`.

Latest accepted functional commit before checkpoint note:

- `3fab4c5` — `Remove stale pinned summary cleanup selectors`

Current accepted state:

- chat compact pinned strip / divider cleanup accepted;
- message thread stays clean without search/filter panel;
- pinned strip is narrow and appears only when pinned message exists;
- no-pinned rooms have compact top spacing;
- composer, attachments and reply context are compact;
- chat list active/unread states are polished;
- stale old dropdown/search CSS and cleanup selectors were removed;
- continue from this state without reverting chat layout decisions.
