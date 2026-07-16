# BandKit — Notifications Checkpoint 1.20.0

## Status

Accepted checkpoint. Second slice of wave 2. Migration `0025`.

The most-referenced domain in the project (35 specifications) and one of the least
described. It turned out not to need a decision from the owner: the specs already
answered two of the review's three "blocking questions", and the third was an
engineering call.

---

## The questions were already answered

**Channels — in-app only.** `User_Friends_And_Personal_Feed §Notifications` states it:
in-app now, push and email "future-ready", SMS only for security-critical flows and not
for social noise. (Practically as well: the Resend key is still not on the VPS.)

**Recipient — User, not Party.** Notifications for a Party would be an entity inbox, and
`CLAUDE.md` forbids it: "в MVP у сущности ровно один основной чат".

**Object, not projection** — the only real choice, and it makes itself. Read state,
deduplication and retention need storage regardless, and deriving notifications from
`audit_events` would turn the audit log into a product table with performance
requirements. Audit is not a notification source, for the same reason it is not an
analytics source.

## The one line of spec that shaped the schema

`Conversation_Lifecycle §10`, mandatory:

> проверяют актуальный доступ непосредственно перед отправкой … не раскрывают название
> закрытой сущности при отсутствии доступа

So a notification **stores no text**. A saved string "Иван пригласил вас в «Север»" would
outlive the access it describes and leak the private entity's name to precisely the
person it is hidden from. The table holds references — type, actor, entity, room — and
the subject is resolved at read time, joined against live membership and visibility.

**And the realtime lesson repeats.** With no delivery channel, "check access before
sending" and "check access when reading" are the same moment, so §10 is satisfied by
construction rather than by discipline. When email or push arrives, that check must move
to send time — it cannot be skipped there on the grounds that reading already does it.
That is part of the price of a channel, written down now rather than discovered later.

## What this adds

- `notification_types` reference table (stable keys; UI renders
  `t('notifications.type.<key>')`), `notifications` table.
- `GET /me/notifications` — own inbox with an unread count. There is no id to pass, so
  there is no way to ask for anyone else's.
- `POST /me/notifications/read` and `/:id/read`.
- Raised for: `entity_invitation`, `invitation_accepted`, `invitation_declined`,
  `conversation_request` — the four things that already exist and were invisible without
  this.
- `raiseNotification(client, …)` takes the caller's client so it fires **inside their
  transaction**: a notification about an invitation that rolled back is a lie.

Deduplication is structural, via partial unique indexes: one invitation notification per
(recipient, entity), one request notification per (recipient, room). Re-inviting after a
decline updates the existing row and marks it unread again rather than stacking a second.

Declines notify the inviter too. Silence would read as "still pending" and invite a nag.

---

## Verification

The §10 rule, end to end, on a clone with a private entity:

```text
invited, access exists   -> entity_name: 'Секретный Север'
after declining          -> entity_name: None
```

The private group's name disappears from the recipient's own notification the moment
access ends — because nothing was frozen. A stored payload would have leaked it forever.

```text
invitation           -> recipient sees it, unread=1, actor named
decline              -> inviter gets invitation_declined
re-invite            -> still 1 notification for that (recipient, entity)
conversation request -> recipient told someone asks; the message text is not in it
mark all read        -> marked=1, unread=0
anonymous            -> 401
```

Gates: `npm run check`, `tsc --noEmit`, API smoke — green.

---

## Do not regress

- Notifications reference; they never carry text. The moment one stores a rendered
  string, §10 is broken and the breakage is invisible until someone loses access.
- `raiseNotification` runs in the caller's transaction. Firing it after commit will
  eventually notify about something that did not happen.
- The recipient filter *is* the authorization. Do not add an endpoint that takes a
  recipient id.
- When a delivery channel appears, the access check moves to send time. Reading is not a
  substitute for it.

---

## Still open

- **`notification_preview = full | sender_only | generic`** (§10) — not modelled. It
  governs what a *delivered* notification may reveal, and nothing is delivered yet. It
  belongs with the first channel, not before it.
- Email and push — deliberately absent (Friends spec: future-ready).
- Chat message notifications — the obvious next type, and the one that needs preview
  policy, per-room muting and batching. Deliberately not in this slice: it would have
  dragged all three in.
- Retention — notifications accumulate forever today.
- Entity-scoped notifications ("your band was mentioned") — that is the Entity Inbox, out
  of MVP.
- The UI still renders `mockData.notifications`. The endpoint exists; the page does not
  use it yet.
