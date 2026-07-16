# BandKit — Message Requests and Incoming Privacy Checkpoint 1.17.0

## Status

Accepted checkpoint. **Mandatory chat slice 2, in part**: message requests and
incoming privacy are done; the anti-spam rate limits of §2 are not, and are named
below rather than quietly skipped.

Migration `0022`.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Spec: `BandKit_Conversation_Lifecycle_and_Abuse_Controls_v1.md` §2

---

## What this adds

Opening the canonical dialogue (1.16.2) was never the right to post into it. Now the
write path enforces that.

**Incoming privacy** — `dm_policies` reference table + `users.dm_policy`, defaulting to
`everyone`. `GET`/`PUT /me/dm-policy` reads and changes your own. Keys are stable; the
UI renders `t('chat.dmPolicy.<key>')`, matching how report reasons already work, so no
user-facing string lives in the database.

| policy | who may put a first message in front of you |
|---|---|
| `everyone` | anyone |
| `verified` | accounts with a verified email |
| `shared_context` | an active membership in the same entity, or confirmed participation in the same event |
| `nobody` | no one |

**Message requests** — `conversation_requests`, keyed by `room_id`. A first message
from someone who is not yet an established contact is stored, but the dialogue becomes
a *request*: it does not appear in the recipient's `/me/chat-rooms`, only in
`GET /me/conversation-requests`, with the starter message attached because deciding
without reading it is impossible.

```text
POST /conversations/:roomId/request/accept
POST /conversations/:roomId/request/reject
```

The requester may send **one** starter message; a second gets `409`. The recipient
answering *is* acceptance — that is the only thing writing back could mean, and it
means a rejected requester regains contact only if the recipient chooses to speak
first.

---

## Two decisions that carry the security of this slice

**Rejection is invisible to the sender.** §2: "отправителю не раскрываются … факт
отклонения". So a requester writing again gets a byte-identical answer whether the
request is pending or was rejected — one code, `409 CONVERSATION_REQUEST_PENDING`, for
both. Verified as identical bytes, not by reading the code. Do not add a distinct
"rejected" error, however much clearer it would read: it would hand a blocked stranger
a read receipt on their own rejection.

**"Rejection must not create a new request on next contact" is structural.** The
request table is keyed by `room_id`, so a rejected row stays and there is nowhere to
put a second one. Nothing has to remember the rule.

---

## `circle` is deliberately missing, and that is a spec gap

§2 lists five policies. Four are here. The fifth — "пользователи из разрешённого
социального круга" — needs the friends/circle domain of
`BandKit_User_Friends_And_Personal_Feed_v1_0.md`, and **that domain has no schema at
all**: nothing in `server/migrations/` mentions friends, circles or contacts.

So `circle` is absent from `dm_policies`, and the FK on `users.dm_policy` makes it
unsettable (`PUT /me/dm-policy` with `circle` → `400`). The alternative was a setting
whose name promises a social circle and whose behaviour is something else. Add the row
when the domain exists; nothing else here changes.

---

## Not done in this slice — the anti-spam limits

§2 also requires: "anti-spam лимиты на создание диалогов и requests по actor,
IP/device/risk context и временному окну."

Present: the one-starter-message limit, which §22.3 also asks for.
Absent: per-actor rate limits over a time window, and anything keyed on IP, device or
risk context — the platform models none of those today, so it needs its own slice
rather than a token counter.

Until then, an allowed sender can open dialogues with many people, one starter message
each. `nobody`/`verified`/`shared_context` narrow who that can be; nothing yet limits
the rate.

---

## Verification

Local, on a clone of the real database with `0020`–`0022` applied.

```text
first message from a stranger    -> 201, request created, message stored
second, third from requester     -> 409, 409                       (one starter only)
recipient's /me/chat-rooms       -> does not contain the room
recipient's /me/conversation-requests -> the request, with the starter body

sender's answer while pending    -> 409 CONVERSATION_REQUEST_PENDING
recipient rejects                -> 200
sender's answer after rejection  -> 409 CONVERSATION_REQUEST_PENDING   (byte-identical)
requests rows for that room      -> 1, status=rejected                 (no new request)
requester's own request list     -> empty                              (rejection not surfaced)

recipient writes back            -> 201, request becomes accepted
requester writes again           -> 201                                (contact established)

policy everyone       -> 201
policy nobody         -> 403
policy verified, sender unverified -> 403
policy shared_context, no shared membership -> 403
policy shared_context, membership restored  -> 201
PUT /me/dm-policy circle -> 400 DM_POLICY_INVALID
GET/PUT /me/dm-policy, GET /me/conversation-requests, anonymous -> 401
```

The `shared_context` case is worth a note: it first returned `201` where I expected
`403`, and the code was right — the two accounts really did share an active membership
in `rejoin-test-band`. The expectation was wrong, not the gate. Re-tested by removing
and restoring the membership.

Gates: `npm run check`, `tsc --noEmit`, API smoke — all green.

---

## Do not regress

- Pending and rejected must stay indistinguishable to the sender. This is the single
  easiest thing here to "improve" into a leak.
- The request table stays keyed by `room_id`. A surrogate key would let a second
  request exist and quietly undo §2.
- Entity chats are untouched by all of this: the gate only runs for
  `conversation_scope = 'personal'`.
- Link Guard already blocks every external link in every message, so §2's "внешние
  ссылки по максимально строгой политике" during a request holds by construction, not
  because this slice did anything. If link policy ever gains a laxer mode, requests
  must keep the strict one.
- Attachments are forbidden during a request by the fact that messages have no
  attachments at all yet. When they arrive, that rule needs real code.

---

## Next

1. Finish slice 2: anti-spam rate limits (per actor, per window). IP/device/risk
   context needs a model that does not exist — decide whether it is in scope for MVP
   or explicitly deferred, per §23.
2. Then slice 3: personal block across every REST/realtime/write path.

"Написать" in the UI stays unwired: with the gate in place a button would now be
honest, but the inbox has no requests screen yet, so a first message would vanish from
the sender's view into a list nobody can see. UI belongs with slice 3 or after.
