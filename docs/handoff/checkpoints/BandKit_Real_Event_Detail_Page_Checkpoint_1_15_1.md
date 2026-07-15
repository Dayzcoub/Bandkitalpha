# BandKit — Real Event Detail Page Checkpoint 1.15.1

## Status

Accepted checkpoint.

Closes the last visible "In development" stub on a surface whose backend already existed: `/events/:id` is now a real page. Building it surfaced — and fixed — the same class of access hole previously found in the documents list.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Security fixes (found while building)

Events carry **no visibility column** — there is no such thing as a public event — yet:

- `GET /events` was **unauthenticated and unscoped**: it returned every event on the platform, including **location and schedule**, to anonymous callers. Now session-required and scoped to the caller's entity memberships plus events they take part in.
- `GET /events/:id/slots` was **public by design comment**: an event's requirement slots could be enumerated by id for any private event. Slots now follow the event's own visibility.
- The smoke asserted the anonymous `200` on `/events`; it now asserts the endpoint is protected.

Shared helper `canViewEvent(client, actorId, eventId)` answers "may this actor see this event" in one place (active membership in the owning entity, or participation in the event), so detail and slots cannot drift apart.

---

## Scope of this slice

```text
server/src/modules/events/events.routes.js     (canViewEvent, scoped list, GET /events/:id)
server/src/modules/events/eventOps.routes.js   (slots follow event visibility)
server/src/index.js
scripts/staging-smoke-api.sh
src/modules/RealEventDetail.ts                 (new)
src/modules/RealDirectories.ts                 (event rows are links)
src/routes/pages.ts, src/main.ts
src/locales/en|ru/events.json
```

- `GET /api/v1/events/:id` — event core + entity + participant count, plus `can_manage` so the UI can offer manager surfaces without guessing. Unknown and invisible both return **404**: an outsider is never told an event exists.
- `RealEventDetail.ts` on `/events/:id`: title, status, time, location, participants, description, a link through to the owning entity, the requirement slots, and — for managers only — the roster (the engagements endpoint stays manager-scoped, so the UI only asks when `can_manage`).
- Event rows in the `/events` list are links (client-side `pushState` + `popstate`, since the rows are injected after the app's `[data-route]` binding).

---

## Verification

Backend (curl):

```text
anonymous GET /events            -> 401   (previously: every event on the platform)
anonymous GET /events/:id        -> 401
anonymous GET /events/:id/slots  -> 401   (previously: public)
member GET /events               -> 1 event (own entity) — previously 3 across 3 entities
member GET /events/:id           -> event + can_manage:true
event of an entity I'm not in    -> 404
its slots                        -> 404
```

Browser: clicking "Demo Rehearsal" navigates to `/events/<id>` and renders status/location/participants, description, the entity link, requirements and the roster; the entity link goes to `/bands/demo-band`; an inaccessible event id shows "Событие не найдено." rather than a blank page. No console errors.

---

## Do not regress

- Events are workspace data: no unauthenticated or unscoped event reads, and slots must follow the event.
- Unknown vs invisible must both answer 404.
- The roster stays manager-scoped on the backend; the UI must not rely on hiding it.

---

## Next recommended work

`/security-review` over the Phase 4 code (CLAUDE.md's DoD gate, still never run — it would likely have caught both list holes earlier), real notifications, or the Resend key on the VPS to finish email verification.
