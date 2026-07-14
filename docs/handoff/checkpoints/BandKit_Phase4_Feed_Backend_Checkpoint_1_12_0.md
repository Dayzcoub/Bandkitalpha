# BandKit — Phase 4 Feed Backend Checkpoint 1.12.0

## Status

Accepted checkpoint.

First slice of the Phase 4 **feed** domain (fourth domain after reputation, link guard, moderation). Backend for entity posts and subscriptions per Feed Rules v1.0 and Entity Subscriptions & Public Feeds v1.0. MVP-narrow by spec: minimal entity updates, chronological only — no algorithmic feed, reactions, reposts, media, or per-entity feed settings.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/migrations/0016_feed_posts_subscriptions.sql
server/src/modules/feed/feed.routes.js                (new)
server/src/modules/moderation/reports.routes.js       (post evidence snapshot; hide/unhide posts)
server/src/modules/permissions/PermissionService.js   (canSubscribe / canPublishEntityPost)
server/src/index.js                                   (route wiring)
```

Schema (`0016`):

- `entity_subscriptions` — one row per (user, entity); status active / muted / cancelled / blocked (cancelled keeps churn history — an anti-fraud signal); `notification_level` stored now, delivery arrives with the notifications domain.
- `entity_posts` — body, visibility (`public` / `subscribers` / `members` — MVP subset of the spec's layers), optional `event_id`, `is_pinned`, `moderation_state` (clean / flagged / hidden / removed).

API:

```text
PUT    /api/v1/entities/:id/subscription    (subscribe; idempotent re-activate)
DELETE /api/v1/entities/:id/subscription    (unsubscribe → status 'cancelled')
POST   /api/v1/entities/:id/posts           (publish — entity managers only)
GET    /api/v1/entities/:id/posts           (visibility-filtered; anon = public only)
GET    /api/v1/me/feed                       (chronological: subscriptions + memberships)
```

Key rules enforced:

- **Subscription is not membership**: subscribers get public+subscribers layers only; the members layer requires an active entity membership. Publishing requires a managing role AND an unsanctioned account (`canPublishEntityPost`; Feed Rules: restricted users cannot post).
- **Link guard on posts** (AntiFraud §4): external links / shorteners / punycode blocked with `422 POST_LINK_BLOCKED` + audit `feed.post_link_blocked`.
- Hidden/removed posts drop out of every non-staff read.
- Audits: `feed.subscribed`, `feed.unsubscribed`, `feed.post_created`.

Moderation integration (posts are real reportable objects now):

- reporting a `post` snapshots it into the report's evidence `context` — visibility-checked (a reporter only snapshots what they could see), so no existence probing;
- `hide_content` / `unhide_content` now support posts (`moderation_state` 'hidden' ↔ prior, faithful restore); `GET /reports/:id` returns the post's live `object_status`.

---

## Verification

Local, curl (manager, non-member outsider, staff sessions):

```text
manager publishes public/subscribers/members posts   -> 201 x3
post with bit.ly link                                 -> 422 shortener
non-member publishes                                  -> 403
anon GET posts                                        -> 1 (public only)
outsider before subscribe                             -> 1; after PUT subscription -> 2 (+subscribers)
member GET posts                                      -> 3 (all layers)
outsider /me/feed                                     -> 2; member /me/feed -> 3
DELETE subscription                                   -> 200; /me/feed -> 0; second DELETE -> 404
report post                                           -> 201, evidence snapshot (kind entity_post, body)
staff hide_content                                    -> 200; anon list -> 0; snapshot intact
staff unhide_content                                  -> 200; restores 'clean'; anon list -> 1
```

---

## Deferred (later slices)

- frontend (subscribe button, real /feed, post composer) — next slice;
- comments, reactions, reposts, media, per-entity feed settings, notification delivery, mute controls, user-to-user friends/follows, rate limits.

---

## Do not regress

- Subscription must never grant workspace access (members layer, chat, documents).
- Publishing is entity-role-gated and blocked for sanctioned accounts.
- Keep the link guard + audit on the post write path.
- Keep hidden posts out of all non-staff reads; evidence snapshots must survive hiding/deleting.
- Keep /me/feed chronological (no ranking) per spec.

---

## Next recommended work

Frontend slice: subscribe/unsubscribe on entity pages, real posts on /feed, and a manager post composer.
