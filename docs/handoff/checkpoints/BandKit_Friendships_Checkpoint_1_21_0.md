# BandKit — Friendships Checkpoint 1.21.0

## Status

Accepted checkpoint. Third slice of wave 2. Migration `0026`.

**Closes the `circle` gap**: `dm_policies` now carries all five modes `Conversation
Lifecycle §2` requires. Privacy of incoming messages is complete.

---

## Scope: the graph, not the personal feed

`User_Friends_And_Personal_Feed_v1_0` covers relationships **and** the personal feed,
post visibility, follows and mutes. This slice takes only the relationship graph — the
part `circle` needs. `user_follows`, `personal_posts` and mute scopes are untouched.

---

## Two deliberate deviations from the spec's model draft

The spec calls its schema a "Future backend model draft" and "Suggested tables" — a
sketch, not an obligation. Both deviations are things this project has already paid for
once.

**1. `blocked` is not a friendship status.** The draft lists
`pending | accepted | declined | cancelled | removed | blocked` in one column. Blocking
is a different axis:

- it is asymmetric — A blocks B is not B blocks A — while the row describes a *pair*;
- it is orthogonal — you can block a friend, and then what is the friendship?
- unblocking must restore what was there, and one column has already destroyed it.

This is exactly the disease `0023` cured in `users.status`: several state machines in one
field. Blocking gets its own table in mandatory chat slice 3. Not here.

**2. `declined`, `cancelled`, `removed` are one state with three reasons.** Per the
owner's rule from `0023` — status describes state, not the reason for it. So `ended` +
`ended_reason`, and **the reason is derived, never sent by the client**: ended while
accepted → `removed`; ended by the requester → `cancelled`; ended by the other side →
`declined`. A client cannot claim a reason that did not happen.

## The pair is canonical

Same shape as personal dialogues (`0020`/`0021`): `user_low_id < user_high_id`, primary
key on the pair. Friendship belongs to the pair, not to whoever pressed the button.

That buys something the draft's directional `requester/target` rows do not have: a
reciprocal request while one is already pending cannot create a second row — it lands on
the same one, and **is** an acceptance. Which is what a person means when they ask back.

## API: two endpoints, not five

```text
POST   /me/friends/:userId   ask — or accept, if they asked first
DELETE /me/friends/:userId   decline, cancel or unfriend; the state decides which
GET    /me/friends
GET    /me/friend-requests   incoming only
```

`POST` covers ask and accept because they are one intent — "I want us to be friends" —
and the state knows which it is. `DELETE` covers three endings for the same reason.

Declining sends no notification: the friends spec wants the sender to "see neutral state,
not necessarily explicit rejection".

**Two specs deliberately disagree, and both are honoured.** A declined *friend request*
may be sent again ("repeated requests may be rate-limited" — not forbidden). A rejected
*message request* is sticky and cannot be re-sent (`Lifecycle §2`). Different domains,
different rules; the difference is intentional, not an inconsistency to iron out.

---

## Verification

The point of the whole slice, on a clone:

```text
dm_policy = 'circle', users are friends              -> 201
user removes the friendship                          -> ended/removed
same pair, NOT friends, but sharing an active entity -> 403
   (shared active memberships for that pair: 1)
```

**The working graph does not open the personal door.** That is the friends spec's "these
systems must not be mixed", enforced rather than asserted. Aliasing `circle` to
`shared_context` — the tempting shortcut — would have given someone who chose "friends
only" exactly "my colleagues", the opposite of what they asked for.

```text
request -> pending; repeat -> FRIENDSHIP_PENDING; self -> FRIENDSHIP_SELF
target sees the incoming request with its source
target posts back -> accepted, and still ONE row for the pair
reasons derived: cancelled (requester ended), declined (target ended), removed (was friends)
re-request after a decline -> 201
dm_policies -> everyone, verified, circle, shared_context, nobody  (all five of §2)
notifications: friend_request to the target, friend_accepted to the asker, nothing on decline
```

Gates: `npm run check`, `tsc --noEmit`, API smoke — green.

---

## Do not regress

- Blocking never becomes a friendship status. It is asymmetric and orthogonal; slice 3
  gives it its own table.
- `ended_reason` is derived from state and actor. Never accept it from the client.
- `circle` reads the friendship graph and nothing else. The moment it consults entity
  membership, the setting lies.
- The pair stays canonical. `user_low_id < user_high_id` is what makes "one friendship
  per pair" free.

---

## Still open

- **Slice 2 is now formally closeable by §23 except anti-spam.** Privacy of incoming
  messages is complete; the rate limits `§2` demands (per actor, per window, and
  IP/device/risk) are not built. `POST /me/friends/:userId` is a new unbounded write —
  it raises a notification for the target, so it is a spam vector until that slice lands.
- `user_follows`, mutes, personal feed, post visibility — the rest of the friends spec.
- Friend list privacy ("who can see friends list" — Friends §Privacy settings) — the
  list is currently visible only to its owner, which is the safe default, but the axis is
  not modelled.
- Friendship with an anonymized account persists and is hidden from listings; whether it
  should be ended is part of the Party lifecycle question (review 4.1).
