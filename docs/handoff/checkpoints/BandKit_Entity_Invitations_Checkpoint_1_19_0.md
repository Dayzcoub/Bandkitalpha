# BandKit — Entity Invitations Checkpoint 1.19.0

## Status

Accepted checkpoint. First slice of wave 2. Migration `0024`.

Started as "Invitations is a missing domain, write a spec". It is not a domain and
needed no spec — it needed a flow. Finding it that way turned up a live privacy bypass.

---

## Invitations were never missing — the flow was

`entity_memberships.status` has carried `'invited'` since migration `0002`, and
`event_participants.status` **defaults** to it. The model was invitation-based from the
start. What did not exist:

```text
nothing ever wrote 'invited'
no accept / decline endpoints
entity_memberships had no 'declined' state (event_participants has had one all along)
handleAddEntityMember inserted 'active' directly
```

So no new domain, no `invitations` table, no `BandKit_Invitations_Domain_v1`. The
architecture review's recommendation to write one was wrong, and this checkpoint corrects
it: the review looked for a domain and found none, without checking whether the concept
already lived as a state on the relationship it describes.

---

## The bypass it exposed — verified, then closed

Adding someone straight to `'active'` was tolerable while membership only meant chat
access. It stopped being tolerable the morning `shared_context` shipped (1.17.0): an
active membership *is* shared context, and shared context *is* permission to message.

Measured end to end against a real backend before the fix:

```text
1. victim sets dm_policy = 'shared_context'
   stranger writes                                   -> 403   the policy works
2. stranger creates their own entity,
   adds the victim by email                          -> 201, status = 'active'
3. stranger writes to the same victim                -> 201   BYPASS
```

Two API calls to walk past a privacy setting the victim had deliberately chosen. After
`0024`, the identical script:

```text
2. adds the victim                                   -> 201, status = 'invited'
3. stranger writes                                   -> 403   closed
4. victim accepts the invitation                     -> 200
5. stranger writes                                   -> 201   consent was given
```

The hole was not new. It was created by 1.17.0 — a privacy feature that made an existing
consent gap load-bearing. **Adding a policy can turn old sloppiness into a vulnerability
without touching the sloppy code.**

---

## What this slice adds

- `handleAddEntityMember` invites instead of enrolling. It records `invited_by_user_id`
  and `invited_at`: an invitation whose sender is unknown cannot be judged by the person
  deciding on it.
- `GET /me/invitations` — pending invitations with the entity and who sent them.
- `POST /me/invitations/:entityId/accept | /decline`.
- `'declined'` added to `entity_memberships.status`, for symmetry with
  `event_participants`. Without it a refused invitation had nowhere to go: `'removed'`
  means someone threw you out, `'left'` means you were in — neither is true of an
  invitation you turned down.
- Re-invitation is allowed after `declined | former | removed | left`; an active or
  already-pending membership stays `409`.

Declining keeps the row rather than deleting it: re-inviting should be a deliberate act,
and "she declined once" is something the entity's managers may legitimately know. It is
not a block — that is a different axis, and it does not exist yet.

## Verification

```text
add member          -> 201, status='invited'  (was 'active')
write to victim     -> 403 before accept, 201 after
GET /me/invitations -> the entity, the role, and who invited
accept              -> 200, membership active
decline             -> 200, membership 'declined'
decide twice        -> 404 (not pending)
decide someone else's invitation -> 404 (one answer; cannot probe who is invited where)
anonymous           -> 401
re-invite after decline -> 201
invite an active member -> 409
```

Gates: `npm run check`, `tsc --noEmit`, API smoke — green. `member_count` is unaffected:
it already counted `status='active'` only, so invited members do not inflate it.

---

## Do not regress

- Membership is consent. Nothing may write `'active'` into `entity_memberships` except
  entity creation (the owner consented by creating it) and an accepted invitation.
- An active membership grants entity chat access **and** counts as shared context. Any
  future path that creates one — imports, bulk add, marketplace, event staffing — is a
  privacy decision, not a convenience.
- `invited` grants nothing. That is the whole point.

---

## Still open

- **Events have the same shape and were not touched.** `event_participants` defaults to
  `'invited'`, nothing writes it, and no accept/decline exists. It is not currently a
  bypass — `hasSharedContext` requires `status='confirmed'` for events, so an invited
  participant grants no context. But the flow is as absent as the entity one was, and
  slice 5 (event-chat access) will need it.
- Invitation expiry — not modelled.
- Inviting someone who has no account (by email) — not modelled.
- "Who may invite me" as a privacy axis (`Communication_Domain §6`) — not modelled. Today
  anyone who manages any entity may put an invitation in front of anyone. It grants
  nothing without consent, so it is not a bypass; it is unsolicited mail, and it is what
  the anti-spam slice will have to bound.
- Notifications: an invitation nobody is told about is a page you have to think to visit.
