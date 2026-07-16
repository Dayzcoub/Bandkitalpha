# BandKit — Delete The Leaky Endpoints Checkpoint 1.15.4

## Status

Accepted checkpoint.

Last slice of the 2026-07-15 audit. Closes the final two holes — and both turned out
to need **deleting**, not gating: neither endpoint had a caller. Net −54 lines of
server code, one module gone.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## `GET /chat-rooms` — deleted, not scoped

Unauthenticated and unscoped: id, title, entity name, event title and message count
for every room on the platform. The obvious fix was to scope it by membership — but
that endpoint already exists (`GET /me/chat-rooms`), and grepping showed **nothing
called the global list**. The UI uses `/me/chat-rooms` for the list and
`/chat-rooms/:id` + `/chat-rooms/:id/messages` for a room, all membership-gated via
`requireRoomAccess`. Only the smoke ever called it, and only to assert it returned
`200`.

So it existed for no reason except to leak. It is gone; `chats.routes.js` carries a
comment saying why it must not come back. This matters for the next task: under the
canonical conversation model a personal dialogue is a room too, so a global room list
could only ever leak participants' private conversations (chat spec §11).

## `POST /dev/seed-demo` — deleted, became a script

Gated only on `NODE_ENV in (staging, development)`, and staging reports
`env=staging` on a public host: an unauthenticated write open to the internet.

The tell was in the signature — `handleDevSeedDemo(req, res, env)` never touched
`req`. It read nothing from the request and only ever wrote fixed rows: a script
wearing an HTTP costume. It is now `server/scripts/seed-demo.mjs`, mirroring
`seed-auth.mjs` (same env guard, same idempotent find-or-create), and the whole
`modules/dev/` module is deleted. Verified idempotent: two consecutive runs leave one
`Demo Rehearsal`.

---

## Scope of this slice

```text
server/src/modules/chats/chats.routes.js  (handleListChatRooms deleted)
server/src/modules/dev/dev.routes.js      (deleted entirely)
server/src/index.js                       (both routes and imports removed)
server/scripts/seed-demo.mjs              (new)
server/package.json                       (seed-demo.mjs added to the check gate)
scripts/staging-deploy.sh                 (seed step + an honest warning header)
scripts/staging-smoke-api.sh              (asserts both endpoints are gone)
docs/.../Checkpoint_1_15_3.md             (correction, see below)
```

---

## The deploy script in this repo does not run — correction to 1.15.3

Found while wiring the seed step: GitHub Actions calls
`sudo -n /usr/local/sbin/bandkit-staging-deploy`, a **root-owned wrapper on the VPS,
outside version control**, which reimplements the deploy (its own `npm run check`,
`npm run build`, `run-migrations.js`, `systemctl restart`). It never references
`scripts/staging-deploy.sh` and contains no `seed` step.

Consequences, now corrected in the 1.15.3 checkpoint:

- The `seed-auth.mjs --only=user@bandkit.local` line added in 1.15.3 **has never
  executed**. The smoke logged in because that account already existed on staging from
  an earlier manual run. **The green deploy proved nothing** — I took it as evidence
  that the line ran.
- The MEDIUM that `/security-review` raised against 1.15.3 was therefore never live:
  "guaranteed on every deploy, reset every time" needed the script to run. The real
  exposure was the manually seeded `owner@bandkit.local` with a repo-known password;
  deleting that account is what fixed it.
- Demo data on staging came from the smoke's `POST /dev/seed-demo` — hence the
  endpoint, and hence exactly one duplicate set per deploy before `34a5b38`.

The seed steps in `scripts/staging-deploy.sh` stay, and stay **inert**, until the
wrapper is made thin (agreed as the next slice). Demo data and the smoke account are
already present on staging, and the smoke no longer asserts demo data, so nothing
depends on them in the meantime. The file now opens with a warning so the next reader
is not misled the way I was.

---

## Verification

Local backend, both endpoints after restart:

```text
GET  /chat-rooms         -> 404   (previously: every room on the platform)
POST /dev/seed-demo      -> 404   (previously: 201, unauthenticated write)
GET  /me/chat-rooms      -> 401 anonymous, 200 for a member
```

Smoke: green end to end, now asserting both are `404` and that `/me/chat-rooms` needs
a session.

Browser, logged in as `demo-manager`: `/chats` lists "Demo Band Working Chat", opening
it renders the pinned message and history. Network shows `/me/chat-rooms`,
`/chat-rooms/:id`, `/chat-rooms/:id/messages` — all `200`, and **no request to the
deleted routes**. No console errors.

`seed-demo.mjs`: seeds on a fresh run, second run is a no-op (one `Demo Rehearsal`).

---

## Do not regress

- There is no global room list, and there must not be one. `/me/chat-rooms` is the
  list; a personal dialogue is a room too.
- Seeding is deploy/CLI work, not an API. Never reintroduce a write endpoint that
  takes nothing from the request — that shape is a script, and shipping it as HTTP is
  how it became a hole.
- Do not trust a green deploy as evidence that a change to `scripts/staging-deploy.sh`
  took effect. The wrapper is authoritative until that is fixed.

---

## The audit is closed — all eight holes

| Hole | Fixed in |
|---|---|
| `GET /documents` unauthenticated | 1.14.0 |
| `GET /events`, `GET /events/:id/slots` unauthenticated | 1.15.1 |
| Admin console — 13 endpoints, no session at all | 1.15.2 |
| `GET /entities` unscoped | 1.15.3 |
| `GET /entities/:id` — `staging-reader`, a check that always passed | 1.15.3 |
| `POST /entities` — actor from an HTTP header | 1.15.3 |
| `GET /chat-rooms` unauthenticated | 1.15.4 |
| `POST /dev/seed-demo` unauthenticated write | 1.15.4 |

Plus, outside the code: the old VPS `141.98.87.9` — which served every one of these
over plain HTTP on pre-1.14.0 code — had BandKit decommissioned on 2026-07-15
(`bandkit-backend` disabled, nginx site unlinked; its Amnezia VPN deliberately left
running). And `owner@bandkit.local`, a `super_admin` whose password is in the
repository, was deleted from staging.

**The pattern worth remembering:** in three of the eight, a test asserted the
vulnerable behaviour as the expected contract — the admin contract smoke wanted
anonymous `200`, and the API smoke created entities through a dev-header backdoor and
demanded `200` on the open reads. The gate depended on the hole and hid it, so green
meant the hole was still there. When fixing an access hole here, check what asserts
the current behaviour first.

**Structural work still open:** `index.js` still lets a route exist without stating
its access rule — that is what produced eight of one class. Making the route table
declarative with a mandatory access field (`public` / `authed` / `staff`), so an
unstated rule fails to register, is the fix that ends the category. Public would be
exactly `/taxonomy`, `/plans`, the report and reliability catalogues, and health.

---

## Next

1. **Make the deploy wrapper thin** (agreed): it keeps root checks and calls
   `scripts/staging-deploy.sh`, so deploy logic returns to version control. Back the
   wrapper up first — a mistake here breaks staging deploys. Note while doing it that
   the `bandkit` user has `NOPASSWD: ALL`, so the wrapper's privilege separation
   (running app steps as `bandkit`) is weaker than it looks.
2. The chat migration to the canonical conversation model — the actual goal, now
   unblocked: no global room list stands in its way.
