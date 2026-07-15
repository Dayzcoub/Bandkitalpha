# BandKit — Admin Console Staff Gate Checkpoint 1.15.2

## Status

Accepted checkpoint.

Closes the worst hole of the access-control class this project keeps producing: the
entire Platform Owner Console answered **anonymous** callers with `200`. First slice
of the audit that followed 1.15.1 — the audit found five live holes, this fixes one.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## The hole

All thirteen `/api/v1/admin/*` endpoints resolved no session at all — not a weak
check, no check. `index.js` dispatched straight into handlers that query
platform-wide tables. Confirmed live on staging before the fix:

```text
GET /api/v1/admin/overview  -> 200  platform-wide counters
GET /api/v1/admin/users     -> 200  the whole user registry (status, verification, 2FA)
GET /api/v1/admin/entities  -> 200  every entity, including visibility=members
GET /api/v1/admin/audit     -> 200  the audit log with actor identities
```

No raw emails or secrets leaked (the `email` keys under `/admin/settings` and
`/admin/notifications` are channel config, not addresses), but the user registry,
private entities and the audit trail were world-readable. Violates Security DoD
§16.1 and §16.2.

---

## Scope of this slice

```text
server/src/index.js                                (one gate at the admin dispatch)
server/src/modules/permissions/PermissionService.js (canReadAdminConsole)
server/scripts/check-admin-contracts.js            (smoke asserted the hole; now guards it)
```

The gate sits at the **dispatch point**, not in thirteen handlers. `adminGetRoutes`
was already a declarative array, so one guard covers the console and — this is the
point — a newly added admin route cannot ship unguarded by forgetting a line.

`canReadAdminConsole(actor)` allows any of the five platform staff roles from the
`users.platform_role` CHECK in migration `0003`, and no one else. The console is
read-only, and `read_only_auditor` exists for exactly this, so gating reads on
`super_admin` alone would contradict the Owner Console spec's "Access model".
Sanctioned accounts (`restricted`/`blocked`/`deleted`) are excluded like everywhere.

### The smoke encoded the vulnerability

`check-admin-contracts.js` fetched every admin endpoint with no cookie and asserted
`200`. It was opt-in (`ADMIN_CONTRACT_BASE_URL`, unset in CI) so it never ran, but it
stated the hole as the expected contract. Inverted: a guest **must** get `401`, always
checked; the payload contract now needs `ADMIN_CONTRACT_COOKIE=bandkit_session=<token>`
and is skipped without it.

---

## Verification

Backend, local, all three actors real (sessions minted through `POST /auth/login`):

```text
guest (no cookie)                -> 401 AUTH_REQUIRED     (previously: 200 + data)
user@bandkit.local  (role null)  -> 403 ADMIN_FORBIDDEN
owner@bandkit.local (super_admin)-> 200 on all 13 endpoints
```

The regression guard was proven to guard, not merely to pass — pointed at the
still-unpatched staging host it fails with:

```text
[admin-contract] /api/v1/admin/overview must answer 401 without a session, got 200
```

Browser: `/admin` as guest shows "Доступ ограничен / Нужна роль администратора"
(the frontend guard already existed); as `super_admin` the console renders real data
(15 users, 6 entities, 183 audit events). No console errors, no extra requests — the
one `403` seen during verification came from a stale non-staff `demo-manager` session
cookie left in the browser from earlier local dev, which is the gate working.

---

## Do not regress

- The admin gate stays at the dispatch point. Do not move it into handlers: the whole
  value is that forgetting it is impossible.
- The console is staff-only and read-only. A guest gets `401`, a non-staff account
  `403`, and neither ever gets a payload.
- The contract smoke asserts the `401` first and always. Never "fix" it by removing
  the guest check.

---

## Still open from the same audit (in priority order)

1. `GET /entities` — unauthenticated and unscoped; returns every entity, all of them
   `visibility=members` on staging today.
2. `GET /entities/:id` — calls `permissionService.canViewEntity({ id: 'staging-reader' }, entity)`.
   The actor is **hardcoded**, so the check reads like authorization and evaluates to
   `true` for everyone. Worst of the five: it survives review by looking correct.
   `staging-reader` appears nowhere else in the codebase.
3. `GET /chat-rooms` — unauthenticated and unscoped room metadata. **Fix before the
   chat migration**, or the canonical personal-conversation model inherits the leak
   (chat spec §11).
4. `POST /dev/seed-demo` — gated only on `NODE_ENV in (staging, development)`, and
   staging reports `env=staging`: an unauthenticated write endpoint open to the
   internet. Likely the real source of the demo-row duplication blamed on
   non-idempotency.

Eight holes of one class now (three fixed in 1.14.0/1.15.1, five found here). The
cause is structural: `index.js` lets a route exist without stating its access rule.
Recommended follow-up once the list above is closed — make the route table
declarative with a mandatory access field (`public` / `authed` / `staff`) so an
unstated rule fails to register. Public would be exactly `/taxonomy`, `/plans`, the
report and reliability catalogues, and health.
