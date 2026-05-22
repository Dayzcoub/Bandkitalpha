# BandKit — Frontend Read-Only Real Entities Checkpoint 1.10.23

## Status

Accepted staging frontend/backend integration checkpoint.

This checkpoint confirms that the `/bands` frontend page now reads real entity data from the backend API and renders PostgreSQL-backed entities in the UI.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS: `141.98.87.9`
- Public page: `http://141.98.87.9/bands`
- Public API: `http://141.98.87.9/api/v1/entities`
- Backend service: `bandkit-backend`
- Database: local PostgreSQL `bandkit`

---

## Implemented frontend behavior

The `/bands` page now includes a read-only panel:

```text
Real API
Сущности из PostgreSQL
```

The panel calls:

```text
GET /api/v1/entities
```

and renders real entities stored in PostgreSQL.

Observed UI values included:

```text
Demo Band
Real API Test Band
Smoke API Band
```

---

## Safety boundary

This is read-only frontend integration only.

The UI does not yet write entities to the backend.

No auth, registration, password/session logic, or production permission model was introduced here.

If API is unavailable in a local/offline environment, the panel shows an offline state and the mock UI below continues working.

---

## Polish completed

The real entities preview rows were polished so entity title and metadata do not visually concatenate.

Added frontend row structure:

```text
bk-real-entity-main
bk-real-entity-meta
```

---

## Smoke test cleanup

The staging smoke test was changed from timestamped entity creation to deterministic entity reuse.

Current smoke entity:

```text
name: Smoke API Band
slug: smoke-api-band
```

If the smoke entity already exists, the script now accepts the `ENTITY_CONFLICT` response and reuses the existing entity instead of failing.

Bug fixed:

- `curl -f` suppressed the JSON response body on HTTP 409;
- the script could not see `ENTITY_CONFLICT`;
- fixed by using a non-failing request helper for this specific create/reuse check.

---

## Verified commands

The following staging flow completed successfully after the fix:

```bash
cd /opt/Bandkitalpha
git pull
sudo bash scripts/staging-deploy.sh
bash scripts/staging-smoke-api.sh
git status --short
```

Confirmed smoke final output:

```text
[bandkit smoke] Smoke API test completed
```

---

## Current accepted state

BandKit now has:

- clean staging deploy;
- backend health and DB health checks;
- first real-data API slice;
- entity create/list/detail API;
- deterministic staging smoke test;
- `/bands` read-only UI integration with real PostgreSQL data.

---

## Do not regress

Do not connect create/update/delete UI actions to backend until auth and permission model are designed.

Do not remove the real entities preview without replacing it with a proper backend-driven entity list.

Do not allow smoke tests to create unlimited timestamped entities again.

---

## Next recommended steps
n1. Decide next safe vertical slice:
   - events create/detail API;
   - real entity detail page read-only integration;
   - auth model design before real registration.
2. Keep frontend writes disabled until auth model is ready.
3. Keep checkpointing every verified staging milestone.
