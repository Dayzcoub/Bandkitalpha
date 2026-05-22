# BandKit — Entity API Vertical Slice Checkpoint 1.10.21

## Status

Accepted staging backend/API checkpoint.

This checkpoint confirms that the first normal real-data entity API vertical slice is working on the staging VPS.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS: `141.98.87.9`
- Backend service: `bandkit-backend`
- Public API: `http://141.98.87.9/api/v1`
- Database: local PostgreSQL `bandkit`
- Current stage: MVP Shell + Staging Backend Foundation + Entity API vertical slice

---

## Implemented routes

Verified routes:

```text
GET  /api/v1/entities
POST /api/v1/entities
GET  /api/v1/entities/:id-or-slug
```

---

## Implemented behavior

`POST /api/v1/entities` now:

- accepts JSON body;
- uses temporary staging actor header `X-BandKit-Dev-User`, defaulting to `demo-manager`;
- validates entity name, type, visibility and slug;
- calls `PermissionService.canCreateEntity(actor)`;
- creates an entity in `entities`;
- creates owner membership in `entity_memberships`;
- writes `entity.created` to `audit_events`;
- returns created entity and owner info.

`GET /api/v1/entities/:id-or-slug` now:

- resolves entity by `id::text` or `slug`;
- calls `PermissionService.canViewEntity(...)`;
- returns a single entity with `member_count`.

---

## Verified staging test

Created test entity through public API:

```text
Real API Test Band
slug: real-api-test-band
type: band
visibility: members
```

Observed response confirmed:

```text
ok: true
entity.name: Real API Test Band
entity.slug: real-api-test-band
owner.handle: demo-manager
```

---

## Verified reads

The following returned real PostgreSQL data:

```bash
curl http://141.98.87.9/api/v1/entities
curl http://141.98.87.9/api/v1/entities/real-api-test-band
curl http://141.98.87.9/api/v1/entities/c8738ae0-4ed1-4d8c-be40-cd3a995985dc
```

Confirmed:

- list includes `Real API Test Band`;
- detail by slug works;
- detail by UUID works;
- `member_count` is `1`.

---

## Bug fixed during verification

Initial detail endpoint failed with:

```text
operator does not exist: text = uuid
```

Cause:

```sql
e.id = $1 or e.slug = $1
```

Fix:

```sql
e.id::text = $1 or e.slug = $1
```

Commit:

```text
6ed9059 — Fix entity detail lookup by slug
```

---

## Important limitations

This is still not production auth.

The actor is temporary staging/dev logic:

```text
X-BandKit-Dev-User: demo-manager
```

Do not connect real user registration or sensitive production actions to this temporary actor model.

---

## Current accepted backend path

Current verified vertical path:

```text
HTTP POST /entities
  -> JSON body parsing
  -> temporary staging actor
  -> PermissionService.canCreateEntity
  -> entities insert
  -> entity_memberships owner insert
  -> audit_events insert
  -> JSON response
```

---

## Next recommended steps

1. Add a staging smoke test script that covers health, seed, entity create/list/detail.
2. Add duplicate slug/validation tests.
3. Decide next vertical slice:
   - events create API;
   - frontend read-only entity list integration;
   - auth model design before real registration.
