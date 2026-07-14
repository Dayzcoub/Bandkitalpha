# BandKit — Phase 4 Feed UI Checkpoint 1.12.1

## Status

Accepted checkpoint.

Second slice of the feed domain: the user-facing surface for 1.12.0. The /feed page gets a live panel with the real chronological feed, subscription toggles, and an entity post composer for managers.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/src/modules/feed/feed.routes.js   (added GET /me/subscriptions)
server/src/index.js                      (route wiring)
src/modules/RealFeed.ts                  (new)
src/routes/pages.ts                      (mount on /feed)
src/main.ts                              (init)
src/locales/en|ru/feed.json              (feed.real.*)
src/locales/bundles.ts                   (regenerated)
```

- `GET /api/v1/me/subscriptions` — the caller's active subscriptions; drives the UI's subscribe/unsubscribe toggle state.
- `RealFeed.ts` mounts on `/feed` (logged-in only), three sections in one card:
  - **Live feed** — `GET /me/feed`, chronological post cards (entity, author, time, visibility marker for non-public layers);
  - **Subscriptions** — real entities with a Subscribe/Unsubscribe toggle (`PUT`/`DELETE /entities/:id/subscription`); toggling reloads the feed;
  - **Publish as entity** — entity + visibility (public/subscribers/members) + text → `POST /entities/:id/posts`; maps 422 to the localized link-blocked message and 403 to a forbidden message.
- Localized via `feed.real.*` (en/ru); shared classes only, no new CSS. The mock social cards below stay untouched.

---

## Verification

Real browser (serve-dist proxy → backend, logged in as demo-manager):

```text
- panel renders: 3 real posts (member sees all visibility layers), 5 entities
  with subscribe buttons, composer present;
- publish via composer -> "Пост опубликован.", feed grows to 4;
- post with a bit.ly link -> "Внешние ссылки в постах запрещены.";
- subscribe to a non-member entity -> "Вы подписаны.", button flips to
  "Отписаться" (state from /me/subscriptions);
- no console errors.
```

---

## Deferred

- comments / reactions / reposts UI, mute + notification level controls,
  entity-page feed tab, replacing the mock social cards entirely.

---

## Do not regress

- The panel must only render for logged-in users; guests keep the mock shell.
- Keep the 422 link-blocked and 403 forbidden mappings localized.
- Subscription toggles must reflect /me/subscriptions, not local guesses.

---

## Next recommended work

Next Phase 4 domain (files), or feed polish: comments per Feed Rules, entity-page Activity tab, mute/notification controls.
