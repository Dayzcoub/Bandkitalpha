# BandKit — Entities Behind Real Auth Checkpoint 1.15.3

## Status

Accepted checkpoint.

Second slice of the audit that followed 1.15.1. Closes the two entity holes plus a
third found while reading the file: an **unauthenticated write path with arbitrary
user impersonation**, live on the public staging host. Also fixes the reason these
survived so long — the deploy smoke depended on them.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## The holes

### 1. The dev-header backdoor (worst of the three)

`handleCreateEntity` fell back to an actor read from a **request header** when there
was no session:

```js
let actor = await resolveSessionUser(req);
if (!actor && process.env.NODE_ENV !== 'production') {
  actor = await getDevActor(getPool(), req);   // x-bandkit-dev-user, default demo-manager
}
```

The guard was `NODE_ENV !== 'production'`, and staging reports `env=staging` on a
public HTTPS host. So anyone on the internet could `POST /entities` and have the row
created **as any user they named by handle**, with `entity.created_by_user_id`,
`owner_user_id`, the owner membership and the `entity.created` audit event all
attributed to that user. The audit trail would have recorded a lie.

The 1.15.1 handoff stated "There is no dev-header auth shortcut: `resolveSessionUser`
reads only the `bandkit_session` cookie". That was false for this route.

### 2. `GET /entities` — unauthenticated and unscoped

Returned every entity to anyone. All five entities on staging are `visibility=members`.

### 3. `GET /entities/:id` — a permission check that always passed

```js
if (!permissionService.canViewEntity({ id: 'staging-reader' }, entity)) {
```

The actor was hardcoded. `canViewEntity` ends in `Boolean(actor && actor.id)`, so
with a fabricated actor it returned `true` for every caller and every visibility.
The line reads like authorization and evaluates to `if (true)` — which is exactly
why it survived review. `staging-reader` appeared nowhere else in the codebase.

### 4. `canViewEntity` itself was wrong, even with a real actor

```js
if (entity.visibility === 'public' || entity.visibility === 'registered') return true;
return Boolean(actor && actor.id);
```

`registered` was readable by guests, and `members`/`private` by any signed-in
account without membership. Fixing the caller alone would not have been enough.

---

## Scope of this slice

```text
server/src/modules/entities/entities.routes.js      (backdoor removed, list scoped, real actor)
server/src/modules/permissions/PermissionService.js (canViewEntity semantics)
server/scripts/seed-auth.mjs                        (--only)
scripts/staging-deploy.sh                           (seed the smoke account)
scripts/staging-smoke-api.sh                        (authenticates; guards the fixes)
```

### Visibility now means what it says

Levels are the CHECK in migration `0002`; the specs list the column but never define
the levels, so this is the plain reading of the names, and it fails closed — an
unexpected value would take the strictest branch:

| visibility | who may read |
|---|---|
| `public` | anyone, including guests |
| `registered` | any signed-in account |
| `members`, `private` | active member only |

`canViewEntity(actor, entity, membership)` takes the membership rather than looking
it up, so it stays a pure decision and the route owns the query. `GET /entities`
answers guests with the public subset — a real answer, not a 401, because public
entities are meant to be discoverable — and its SQL mirrors the table above. Keep the
two in step.

`GET /entities/:id` answers **404 for unknown and invisible alike**: an outsider is
never told an entity exists (same rule as events, 1.15.1). The old `403
ENTITY_FORBIDDEN` confirmed existence.

### The smoke was the reason these survived

It created its entity through the backdoor and asserted anonymous `200` on the reads.
The deploy gate both depended on the holes and hid them — the same failure as the
admin contract test in 1.15.2. It now logs in via `POST /auth/login`, carries the
cookie, and asserts the security contract: anonymous create is `401`, a members-only
entity is absent from the anonymous directory, its detail is `404`, the admin console
is `401`.

Its entity moved to slug `smoke-auth-band`, owned by the account it logs in as. The
old `smoke-api-band*` rows belong to `demo-manager` (created back when anyone could
impersonate them) and are correctly invisible to the smoke account now; they are
leftovers, safe to delete by hand.

### Seeding is deliberate, not automatic

The deploy needs the smoke's account to exist, so it runs `seed-auth.mjs`. The first
version of this slice ran it unfiltered — `/security-review` caught that as MEDIUM
**against this diff**: it would have guaranteed `owner@bandkit.local` /
`OwnerPass123` (a repo-known password, `super_admin`) on a public host, and reset
that password on every deploy, letting anyone who reads the repo walk straight
through the console gate added in 1.15.2. `seed-auth.mjs` now takes `--only`, and the
deploy seeds `user@bandkit.local` and nothing else.

---

## Verification

Visibility matrix, local, four entities and three callers, all sessions real:

```text
                    guest   signed-in non-member   member
vis-public          200     200                    200
vis-registered      404     200                    200
vis-members         404     404                    200
vis-private         404     404                    200
```

Directory scoping:

```text
guest                     -> vis-public only
signed-in non-member      -> public + registered + entities they belong to
member                    -> the above + their own
```

The backdoor, every way it was reachable:

```text
POST /entities  no session, header demo-manager -> 401
POST /entities  no session, header owner        -> 401
POST /entities  no session, no header           -> 401
the probe entity was not created
```

Smoke: passes end to end against a local backend, including the four new
access-control assertions. `seed-auth --only` seeds one account; an unknown email
exits non-zero, so a typo fails the deploy instead of silently seeding nothing.

Browser: a member opens `/bands/vis-members` and sees the full card (plan, usage,
posts); a signed-in non-member sees "Сущность не найдена." — the frontend already
handled 404 (`state.notFound`), so the 403→404 change reads better than before. No
console errors. Guests never fetch entity detail at all: the `Real*` modules mount
only when `bandkitAuthed === 'true'`.

---

## Do not regress

- The actor comes from the session and only from the session. No header, env or
  hostname may substitute for it — "not production" is not a safe place.
- `canViewEntity` and the `GET /entities` SQL encode the same table. Change both.
- Unknown vs invisible must both answer 404 for entities, as for events.
- The smoke authenticates. If a change makes it need a backdoor, the change is wrong.
- `seed-auth.mjs` in automation stays `--only` and never seeds a staff account.

---

## Still open from the same audit

1. **The old VPS `141.98.87.9` is live and serves everything.** Measured today,
   anonymous: `admin/*`, `entities`, `chat-rooms`, `events`, `documents` all `200`,
   over plain HTTP. It runs code older than 1.14.0, so every hole this project has
   fixed — including 1.14.0, 1.15.1, 1.15.2 and this slice — is still open there, on
   a drifted copy of the data (1 user / 5 entities / 209 events vs 5 / 5 / 1 on the
   new host). Deploys never reach it (`STAGING_HOST` points at the new host). While
   it is up, the fixes are cosmetic: the data leaks from there. **Highest-value
   action left, and it is infrastructure, not code.**
2. `owner@bandkit.local` already exists on staging with the repo-known password.
   This slice stops the deploy from re-creating it, but does not change what is
   already there — change the password or drop the account.
3. `GET /chat-rooms` — unauthenticated, unscoped room metadata. **Fix before the chat
   migration**, or the canonical personal-conversation model inherits the leak
   (chat spec §11). The smoke still asserts its anonymous `200`; that assertion is
   the next thing to invert.
4. `POST /dev/seed-demo` — unauthenticated write. Idempotent, so it causes no growth
   (see the correction in the 1.15.2 checkpoint), but it is still a write path open
   to the internet.

---

## Housekeeping done

`cleanup-demo-duplicates.mjs` ran on the new VPS: 211 duplicate events deleted, 1
real event left, rooms/messages/docs down from 212/212/212 to 1/1/1. All 212 were
copies of one 22 May `Demo Rehearsal`, accumulated one per deploy before `34a5b38`
made the seed idempotent. Three orphan entities (`smoke-api-band`,
`smoke-api-band-1779470611`, `smoke-api-band-1779470299`) plus `real-api-test-band`
remain; the script does not touch entities by design.
