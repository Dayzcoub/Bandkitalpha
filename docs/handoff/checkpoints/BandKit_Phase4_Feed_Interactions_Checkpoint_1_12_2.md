# BandKit — Phase 4 Feed Interactions Checkpoint 1.12.2

## Status

Accepted checkpoint.

Closes out the feed domain for MVP: comments, likes, subscription mute/notification level, and full moderation coverage for the new content. With this, the feed does everything the Feed Rules v1.0 MVP asks (social behavior with visibility, moderation, link guard) without the explicitly-out-of-scope pieces (algorithmic feed, reposts, media, discovery).

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/migrations/0017_post_interactions.sql
server/src/modules/feed/feed.routes.js                (comments, likes, PATCH subscription, counts)
server/src/modules/moderation/reports.routes.js       (comment snapshot; hide/unhide comments)
server/src/modules/permissions/PermissionService.js   (canInteractSocially)
server/src/index.js                                   (route wiring)
src/modules/RealFeed.ts                               (likes, comments, report chips, mute)
src/locales/en|ru/feed.json                           (feed.real.* additions)
src/locales/bundles.ts                                (regenerated)
```

### Backend

- Migration `0017`: `entity_post_interactions` per the spec draft — one table for likes (contentless, unique per user/post) and comments (body + own `moderation_state`).
- `POST/GET /posts/:id/comments` — comments follow the parent post's visibility (`requireVisiblePost`: 404 for unseen posts, no probing); sanctioned accounts cannot comment (`canInteractSocially`); link guard applies (`422 COMMENT_LINK_BLOCKED` + audit `feed.comment_link_blocked`); hidden comments excluded from reads.
- `PUT/DELETE /posts/:id/like` — idempotent like toggle on visible posts. Reactions are never acknowledgements (spec).
- `PATCH /entities/:id/subscription` — `status` active/muted + `notification_level`. **Muted follows the spec exactly:** posts drop out of `/me/feed` but stay on the entity's own posts read.
- Post reads now carry `like_count`, `comment_count` (hidden excluded) and viewer's `liked`.
- Moderation: reporting a `comment` snapshots it (visibility follows the parent post); `hide_content`/`unhide_content` cover comments with faithful prior-state restore; case detail returns a comment's live state.

### Frontend (RealFeed)

- Post cards get an interaction row: like toggle (♥/♡ + count), comments toggle (count) opening an inline list + input, and a report chip — post and comment report chips are `[data-report-target]`, so the existing generic reason-picker handles them with **real object ids** now.
- Subscriptions list gets a mute toggle ("Hide from feed"/"Show in feed") with a `(hidden)` marker.

---

## Verification

Backend (curl): comment 201 on visible post / 422 link / 404 members-post for non-member / 201 for member; like idempotent, counts + `liked` exact, unlike works; mute → `/me/feed` 0 but entity read 3, unmute → back; comment report snapshot + staff hide → excluded from reads.

Real browser (demo-manager): like 0→1 with ♥ flip; comments panel correctly omits the moderation-hidden comment, adding one works (counter 1, report chip present); mute shows "(скрыто)" and the localized message; post report chip opens the reason picker and files with a real post id (snapshot verified in DB). No console errors.

---

## Feed domain status — complete for MVP

Posts + subscriptions + chronological feed (1.12.0/1.12.1) + comments/likes/mute + moderation coverage (this). Deferred by spec: reposts, media, algorithmic ranking, per-entity comment policy settings, notification delivery, user-to-user friends/follows, rate limits.

---

## Do not regress

- Comments must follow the parent post's visibility; hidden comments/posts stay out of all non-staff reads.
- Keep the link guard + audit on comment writes; sanctioned accounts cannot comment or react.
- Muted subscriptions stay out of /me/feed but keep the entity page readable.
- Report chips must carry real object ids; reactions must never count as operational acknowledgement.

---

## Next recommended work

Next Phase 4 domain: files (real storage/attachments for the documents area).
