# BandKit — Canonical Conversations Migration Checkpoint 1.16.0

## Status

Accepted checkpoint.

First slice of the chat work the whole audit was clearing the way for. The schema now
expresses the canonical conversation model of
`BandKit_Chat_and_Messaging_Security_v1.md` §1–3, and **the database enforces it** —
not the application.

Schema only, deliberately: no endpoint or UI changes, so nothing about the running app
changes shape. The "Написать" flow is the next slice.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Migration: `server/migrations/0020_canonical_conversations.sql`
- PostgreSQL 16 (local and VPS)

---

## The gap this closes

Measured before the change:

```text
chat_rooms.type CHECK: direct, free_group, entity, event, safety, admin
no conversation_scope column
nothing prevented a second dialogue for the same user pair
```

The spec allows exactly two classes and nothing between them — a personal dialogue
between two users, and a chat belonging to exactly one entity. The schema could
express neither.

## What the database now guarantees

```sql
conversation_scope in ('personal', 'entity')   -- via the shape constraint
```

| | personal | entity |
|---|---|---|
| `type` | `direct` | `entity` or `event` |
| `entity_id` / `event_id` | both null | at least one set |
| `personal_user_a/b` | both set, `a < b` | both null |
| uniqueness | one room per unordered pair | — |

**The pair lives on the room, not only in `chat_room_members`.** "At most one dialogue
per unordered pair" cannot be expressed as a constraint over the many rows of a
membership table, so the two participants are stored on `chat_rooms` and covered by a
partial unique index. Ordering the ids (`a < b`) is what makes the pair *unordered*:
`(A,B)` and `(B,A)` canonicalise to the same row, so the reversed insert hits the same
index.

`free_group`, `safety` and `admin` are gone from the type CHECK. They were speculative
and never carried real data on staging.

## The migration refuses rather than guesses

Rooms of a type with no place in the model, personal rooms without exactly two
members, and pairs that already have more than one dialogue each raise a named
exception listing the offending rows. Merging two dialogues means moving messages —
that is a decision, not a migration step. The runner wraps each file in a transaction,
so a refusal leaves the schema untouched.

This fired for real on the local dev box (`free_group` "Dev Team Room", 14 messages,
not mine to delete) and the schema was unchanged, which is the intended behaviour.
Staging has zero such rooms.

---

## Verification

Tested on a **clone of the local database** (`pg_dump` → `bandkit_migtest`), so real
data shape was exercised without touching the original.

Backfill:

```text
direct "DM Test"              -> conversation_scope=personal, pair set, no entity/event
event  "Demo Band Working…"   -> conversation_scope=entity, entity+event set, no pair
```

Every invariant of spec §11 that this slice owns was attacked directly in SQL, and
each was rejected by the database:

```text
second dialogue, same pair          -> chat_rooms_personal_pair_uidx
same pair reversed (B,A)            -> chat_rooms_conversation_shape  (a < b)
personal dialogue with an entity_id -> chat_rooms_conversation_shape
entity chat with no entity/event    -> chat_rooms_check
pair of one user with themselves    -> chat_rooms_conversation_shape
free_group resurrected              -> chat_rooms_conversation_shape
```

App against the migrated schema: `/me/chat-rooms` returns the event room for
`demo-manager`; in the browser `/chats` lists "DM Test", and opening it renders
"BandKit Owner — Личный чат" with its three messages. No console errors. The frontend
still distinguishes personal chats via `room.type === 'direct'`, which the shape
constraint now ties to `conversation_scope = 'personal'`, so the two cannot drift.

Deploy path confirmed: the VPS wrapper runs `run-migrations.js` (line 176), and
staging holds no room that would block the migration.

---

## Decisions worth knowing

**`personal_user_a/b` cascade on user delete.** Deleting a user deletes their personal
dialogues. Today a deleted user instead leaves an orphaned room with one member, which
the new shape constraint would reject, so something had to give. Revisit with the
account deletion/anonymisation rules: entity history must survive account deletion,
but a two-party dialogue arguably should not. Flagged in the migration itself.

**`type` is kept alongside `conversation_scope`,** not replaced. The frontend reads
`type`, and the shape constraint forbids the two disagreeing. Dropping `type` is a
later, separate slice.

---

## Do not regress

- The pair columns and `chat_room_members` must agree. Room creation is the only
  writer; if a second writer appears, the two can drift — the unique index protects
  the pair, nothing yet protects the membership rows from disagreeing with it.
- Never relax `a < b`. It is the whole reason the pair is unordered.
- A personal room has no `entity_id`, ever. That is what keeps entity admins out of
  their members' private dialogues (spec §2).

---

## Next

1. **`POST` open-or-create the canonical personal dialogue** + wire the "Написать"
   button, which must open *that same* dialogue from anywhere (spec §2, §10). This is
   where the pair columns start earning their keep: the endpoint canonicalises the two
   ids and relies on the unique index to make "open or create" race-free.
2. Entity chat membership derived from entity access policy (spec §4) — in particular
   an event chat is not open to everyone interested in the event.
3. Later: drop `type`, and make the UI read `conversation_scope`.
