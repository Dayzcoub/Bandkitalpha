# BandKit — Lifecycle Spec Alignment Checkpoint 1.16.1

## Status

Accepted checkpoint.

Aligns the conversation schema with
`BandKit_Conversation_Lifecycle_and_Abuse_Controls_v1.md`, which the owner shipped
(`fc53d38`, `e9640aa`) immediately after 1.16.0 and which is now required reading #4.
Schema only. Migration `0021`.

---

## What the new spec changed for work already done

**§1 names the invariant.** It mandates, in the database rather than in application
code:

```text
user_low_id  = min(user_a_id, user_b_id)
user_high_id = max(user_a_id, user_b_id)
UNIQUE(user_low_id, user_high_id)
CHECK(user_low_id <> user_high_id)
```

1.16.0 had built exactly this shape and called the columns `personal_user_a/b`. The
semantics were already right; only the vocabulary was ours. Renamed. `user_low_id <
user_high_id` is kept instead of `<>`: it is strictly stronger, implies the spec's
CHECK, and is the thing that makes the pair unordered.

Free to do now and never cheaper: nothing reads the columns yet, and staging holds no
personal dialogue. `0020` could not be edited in place — it is already applied and
recorded in `schema_migrations` on staging, so editing it would have split the local
schema from the live one permanently.

**§4 adds an invariant we did not have.** "В MVP у каждой сущности допускается ровно
один основной групповой чат", with sub-chats, role channels and entity DMs forbidden
until there is an ACL spec and a migration. The schema allowed any number. Two partial
unique indexes now enforce one chat per entity and one per event — two, because a chat
owned by an event and a chat owned by an entity are different conversations even when
the members coincide (Chat_and_Messaging_Security_v1 §3). §23 required this to be
implemented or explicitly agreed; it is implemented.

**§5 and §6 introduce state we do not model yet** — `history_access = full |
since_joined | from_timestamp | none`, and `event_chat_access = pending | active |
revoked | expired` with an `access_source`. Those are slices 4 and 5 of the mandatory
order; not this one, and deliberately not started.

---

## Verification

On a clone of the local database (`pg_dump` → `bandkit_migtest`), `0020` and `0021`
applied in sequence. Every invariant attacked directly in SQL, each rejected by the
database:

```text
second dialogue, same pair       -> chat_rooms_user_pair_uidx
same pair reversed               -> chat_rooms_conversation_shape   (low < high)
dialogue with oneself (§1)       -> chat_rooms_conversation_shape
second main chat for an entity   -> chat_rooms_one_entity_chat_uidx (§4)
second chat for an event         -> chat_rooms_one_event_chat_uidx  (§4)
```

Staging is compatible: zero entity-type chats, one chat per event, no personal
dialogues — nothing for the new indexes to collide with.

---

## The mandatory slice order — where this leaves us

CLAUDE.md now fixes nine chat slices and forbids expanding the chat domain until they
are done, in order. Slice 1 is *atomic* personal conversation identity + DB invariants.

```text
1. atomic personal conversation identity + DB invariants   <- invariants done (1.16.0 + 1.16.1)
                                                              atomic creation NOT done
2. message requests, incoming privacy, anti-spam limits
3. personal block across REST/realtime/write paths
4. entity history policy + immediate revoke
5. formal event-chat access lifecycle
6. forwarding/internal-link/file ACL, no inheritance
7. edit/delete/moderation/evidence lifecycle
8. archive/delete/retention/legal-hold lifecycle
9. the abuse/security test matrix (§22)
```

**Slice 1 is not closed.** §1 requires creation to be atomic (`INSERT … ON CONFLICT`
or equivalent, so concurrent requests cannot produce duplicates), and §22.1 requires a
test for exactly that: parallel creation of one personal dialogue. Both need the
open-or-create endpoint, which does not exist yet. The database now makes a duplicate
*impossible*; it does not yet make a concurrent open-or-create *succeed* — those are
different problems, and only the first is solved.

§22.2 (self-dialogue and second dialogue for the same pair) is covered by the tests
above.

---

## Do not regress

- The pair columns carry the spec's names. If a future spec renames them again, rename
  with them — a reader should be able to grep the spec's vocabulary and find the code.
- One chat per entity, one per event. Sub-chats, role channels and entity DMs stay
  forbidden until §4's "отдельная спецификация ACL и миграция" exists.
- Do not start slices 2–9 before slice 1 is closed; the order is mandatory, not a
  suggestion.

---

## Next

Finish slice 1: `POST` open-or-create for the canonical personal dialogue, atomic via
`INSERT … ON CONFLICT` on `(user_low_id, user_high_id)`, plus the §22.1 concurrency
test (fire N parallel requests for the same pair, assert exactly one room and N
identical ids). Then wire "Написать", which must open *that same* dialogue from
anywhere (Chat_and_Messaging_Security_v1 §2, §10).

Note for that slice: §2 of the lifecycle spec means opening a dialogue is not the same
as being allowed to post in it — message requests gate the first message. Opening the
room and sending into it must not be conflated in the endpoint's contract, or slice 2
will have to undo it.
