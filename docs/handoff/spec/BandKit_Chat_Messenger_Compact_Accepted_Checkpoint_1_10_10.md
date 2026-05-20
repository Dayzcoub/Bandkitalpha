# BandKit — Accepted Chat Messenger Compact Checkpoint 1.10.10

## Accepted state

The chat logistics and compact messenger UI pass has been reviewed on desktop preview and accepted as the current working checkpoint.

Accepted latest functional commit before this checkpoint note:

- `2642263` — `Keep chat list search inside room list`

This checkpoint note itself records the accepted state for handoff into the next chat.

---

## Current repo state

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Previous accepted baseline: `1.10.9 logistics polish checkpoint`
- New accepted checkpoint: `1.10.10 chat messenger compact checkpoint`
- VPS preview: `http://141.98.87.9`

---

## What is accepted in this checkpoint

### Chat room navigation

- `/chats` and `/chats/:chatId` support direct navigation to individual chat rooms.
- Chat rows are fully clickable.
- Separate `Open` buttons were removed from chat rows.
- Active chat row is highlighted.
- Keyboard activation is supported with `Enter` / `Space`.

### Chat context

- Chat detail pages now show context based on active room type.
- Supported mock context types:
  - project/event/document chat;
  - direct trusted chat;
  - safety/suspicious chat.
- Safety rooms include link policy / report / moderation context.
- Direct chat explains that personal conversation does not grant project/document access.

### Chat history logistics

- No separate `Go to unread` button is used by default.
- Room open lands around the first unread / relevant message.
- Unread divider is displayed inside the timeline.
- Date divider is displayed inside the timeline.
- Reply with attached context is available.
- Message anchors are displayed as mock internal ids such as `#m1`, `#m2`.
- Pinned summary block exists.
- Load older messages mock control exists.
- Chat history filters exist:
  - all;
  - unread;
  - mentions;
  - files;
  - documents;
  - pinned.
- Safety chats additionally include risk/link/report filters.

### Chat list search and stress testing

- Search by chat rooms is available inside the chat room list.
- The search field is kept inside the room list and no longer breaks the two-column layout.
- Extra mock rooms were added up to `/chats/c15` to test list scrolling.
- Extra mock messages were added to test message-thread scrolling.
- Safety context also applies to mock safety rooms such as `c9` and `c13`.

### Compact messenger UI

- Chat UI was moved away from heavy card layout toward compact messenger density.
- Current visual reference direction: VK-like messenger density.
- Chat context block is more compact.
- Chat type chips are smaller.
- Message cards are visually lighter and closer to message flow.
- Chat room list items are compact.
- Composer is compact.
- Reply/action/meta elements are compact.

### Internal scroll behavior

- Chat list scrolls inside its own panel.
- Message history scrolls inside its own panel.
- Composer is moved into the message thread and sticks to the bottom of the message window.
- The outer page should not stretch endlessly because of many rooms/messages.
- On mobile/tablet, the room list becomes a compact horizontal area while the message thread remains the main scroll window.

---

## Files added in the chat pass

- `src/styles/chat-history.css`
- `src/styles/chat-viewport.css`
- `src/styles/chat-compact.css`
- `src/styles/chat-window.css`
- `src/styles/chat-search-stress.css`
- `docs/handoff/spec/BandKit_Chat_History_And_Reply_Logistics_v1_0.md`

These CSS files are loaded in `public/index.html` after the existing UI/style layers.

---

## Important implementation notes

The current chat work is still mock/UI-layer only. It does not add backend persistence.

The mock helpers are currently placed in `src/app/App.ts` as runtime decoration logic:

- chat context injection;
- chat room navigation decoration;
- chat search insertion;
- mock stress rooms/messages;
- composer relocation into the message thread;
- reply context wiring.

This was acceptable for MVP logistics polishing, but later should be refactored into real chat components and typed mock data before backend integration.

---

## Known constraints / do not regress

Do not revert these accepted chat decisions:

- chat rows are clickable as whole tiles;
- no separate `Open` buttons in chat list rows;
- no default `Go to unread` button;
- composer belongs inside the message thread window;
- chat list and message history must have separate internal scroll areas;
- chat filters/search must remain compact;
- suspicious/safety chats must keep stronger safety context;
- external links remain restricted in first-stage MVP messaging.

---

## Recommended next steps after handoff

Continue from this checkpoint.

Potential next work:

1. Run a final pass on `/chats/c1`, `/chats/c2`, `/chats/c3`, `/chats/c7`, `/chats/c9`, `/chats/c13` on VPS preview.
2. If the visual state remains accepted, update the visible build marker from `1.10.8-avatar-strips` to the next checkpoint label.
3. Start extracting chat runtime decoration from `src/app/App.ts` into dedicated chat UI/components when the design is stable.
4. Later replace mock stress data with real typed mock data and backend-ready contracts.

---

## Handoff summary for next chat

Continue BandKit from repo `Dayzcoub/Bandkitalpha`, branch `main`.

Latest accepted functional commit before checkpoint note:

- `2642263` — `Keep chat list search inside room list`

Current accepted state:

- chat messenger compact pass accepted;
- chat room list search fixed;
- internal scroll works for room list and message thread;
- composer is inside the message window;
- UI direction is compact VK-like messenger density;
- continue from this state without reverting the chat layout decisions.
