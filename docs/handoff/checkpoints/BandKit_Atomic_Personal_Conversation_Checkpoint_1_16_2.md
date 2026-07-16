# BandKit — Atomic Personal Conversation Checkpoint 1.16.2

## Status

Accepted checkpoint. **Closes mandatory chat slice 1** (`atomic personal conversation
identity + DB invariants`), which 1.16.0 and 1.16.1 had only half-done: the invariants
existed, the atomic creation did not.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Endpoint: `POST /api/v1/conversations/personal`

---

## What this adds

`POST /conversations/personal` with `{ user_id }` opens the canonical dialogue with
another user, creating it only if it does not exist. "Написать" from a profile, a
group, an event, a catalogue or a comment must all land on this same room (Chat and
Messaging Security §2, §10), so this is now the only way a personal room is ever made.

```text
201 { ok, created: true,  room }   the dialogue did not exist
200 { ok, created: false, room }   it already did — from either side
```

The pair is canonicalised in the handler exactly as the unique index expects
(`user_low_id < user_high_id`), so the dialogue is a property of the unordered pair,
not of who pressed the button. Verified: `newbie → demo`, `demo → newbie` and repeat
opens all return the same room id.

**Atomic per §1**, via `INSERT … ON CONFLICT (user_low_id, user_high_id) WHERE
conversation_scope = 'personal' DO NOTHING` plus a re-read. `DO NOTHING` rather than
`DO UPDATE`: an update would fire the `updated_at` trigger, and merely opening a chat
must not reorder everyone's chat list. When the insert loses the race it returns no
row, and the re-read — a new statement, so a fresh Read Committed snapshot — sees the
winner's row.

**Opening is not the right to post,** and the endpoint sends nothing. Conversation
Lifecycle §2 puts a stranger's first message into a message request; that is slice 2.
Merging "open" and "send" here would have to be undone there.

### Contract

```text
anonymous              -> 401
user_id not a uuid     -> 400 USER_ID_INVALID
user_id == self        -> 400 CONVERSATION_SELF          (§1 bans self-dialogue)
unknown / unavailable  -> 404 CONVERSATION_TARGET_NOT_FOUND
```

Unknown and unavailable share one answer so the endpoint cannot be used to probe the
user table by id. Self is answered plainly — the actor already knows their own id, so
it leaks nothing.

---

## §22.1 caught a real bug — a pool starvation deadlock

The required concurrency test (20 parallel opens of the same pair) failed on the first
run in a way the DB invariant could never have revealed:

```text
before: 1 × 201, 16 × 500, 3 × 200   — one room in the database, and 80% of callers got an error
after:  1 × 201, 19 × 200            — one room in the database, everyone got it
```

The database was never wrong: exactly one room, two members, one distinct id. The
*endpoint* was. `getPool()` is configured `max: 5`, and the handler took a pooled
connection for its transaction and only then called `resolveSessionUser`, which takes
a connection of its own. Every request therefore wanted two connections at once, so
five concurrent callers held one each and waited forever for a sixth —
`connectionTimeoutMillis: 3000` turned the deadlock into 500s.

Fixed by ordering: session, body validation, target lookup and the permission check
all run on pooled queries, and the dedicated connection is taken last, only for the
transaction.

**This is exactly why §22.1 is in the spec.** "A duplicate is impossible" and "a
concurrent open-or-create succeeds" are different properties, and only the first was
solved by 1.16.0.

---

## The same bug is in 25 other handlers — not fixed here

The shape (`getPool().connect()` first, `resolveSessionUser` inside) is repeated across
the codebase. Measured, not assumed — 20 parallel authenticated requests:

```text
GET /entities/demo-band   ->  6 × 200, 14 × 500
POST /conversations/personal (fixed) -> 20 × 200
```

Affected: `handleGetEntity`, `handleAddEntityMember`, `handleCreateEvent`,
`handleGetEvent`, `handleListSlots`, all nine feed handlers, three reliability
handlers, three parties handlers, two billing handlers, three moderation handlers.

Raising the pool `max` does **not** fix it: each request wants two connections, so any
`max` simply means it takes `max` concurrent callers to deadlock instead of five. Only
the ordering fixes it.

Left alone deliberately — it is not this slice, and the mandatory chat order forbids
wandering. It is not urgent either: one dev VPS, one user, no real traffic. It is debt,
and it deserves its own slice, the same way the access-control class did.

---

## Verification

Local, against a clone of the real database with `0020` + `0021` applied:

```text
contract          401 / 400 USER_ID_INVALID / 400 CONVERSATION_SELF / 404 — all as specified
same room         newbie→demo, demo→newbie, and repeats all return one id, created=false after the first
members           two rows, both member/active
§22.1 concurrency 20 parallel opens of a fresh pair -> 19×200 + 1×201, one distinct id, one room in the DB
§22.2 duplicates  covered by the DB tests in 1.16.1 (second dialogue, reversed pair, self-dialogue all rejected)
```

Gates: `npm run check`, `tsc --noEmit`, and the API smoke (17 steps) all green.

---

## Do not regress

- Take the pooled connection **last**. Anything that calls `resolveSessionUser` (or
  any other `getPool().query`) while holding a connection deadlocks the pool.
- `DO NOTHING`, never `DO UPDATE`, on this insert — `DO UPDATE` fires the `updated_at`
  trigger and silently reorders chat lists on every open.
- This endpoint opens a room. It must never send a message: slice 2 gates the first
  message behind a request.

---

## Next

Mandatory order, slice 2: **message requests, incoming privacy and anti-spam limits**
(Conversation Lifecycle §2). Note that "Написать" in the UI is still unwired — wiring
it before slice 2 would ship an inbox with no request gate, which §2 forbids. The
endpoint exists and is correct; the button waits.

Worth doing on its own, whenever: the pool-ordering fix across the other 25 handlers.
