# BandKit — Frontend Read-Only Real Entity Detail Checkpoint 1.10.24

## Status

Staging frontend/backend integration checkpoint.

This checkpoint extends the previous `/bands` real-data integration by adding a read-only detail panel for real PostgreSQL-backed entities.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS: `141.98.87.9`
- List page: `http://141.98.87.9/bands`
- Detail route pattern: `http://141.98.87.9/bands/:slug`
- Backend detail endpoint: `GET /api/v1/entities/:id-or-slug`
- Backend service: `bandkit-backend`
- Database: local PostgreSQL `bandkit`

---

## Implemented frontend behavior

The real entities panel on `/bands` already links rows to:

```text
/bands/:slug
```

This checkpoint adds a real detail panel on `/bands/:slug` for non-mock entity slugs.

The panel calls:

```text
GET /api/v1/entities/:slug
```

and renders PostgreSQL-backed fields:

- name;
- type;
- status;
- visibility;
- member count;
- slug;
- UUID;
- created date.

---

## Safety boundary

This is read-only frontend integration only.

The frontend still does not create, update, or delete entities through the UI.

No auth, registration, session, password, role, or production permission model was introduced here.

The real detail panel is intentionally mounted as an overlay/inserted read-only panel above the existing mock detail shell, so the previous MVP UI remains available as fallback while backend-driven pages are introduced gradually.

---

## Mock compatibility

The old mock band routes remain untouched:

```text
/bands/b1
/bands/b2
/bands/b3
```

For these mock IDs, the real detail integration does not run.

For real database slugs such as:

```text
smoke-api-band
```

the real detail panel is mounted and hydrated from the API.

---

## Offline behavior

If the API is unavailable, the panel shows an offline/error state and keeps the mock detail UI below intact.

This preserves local/offline frontend shell behavior.

---

## Files changed

- `src/modules/RealEntitiesPreview.ts`
  - added entity detail response typing;
  - added `/bands/:slug` detection;
  - added `GET /api/v1/entities/:slug` hydration;
  - added loading/ready/error detail render states;
  - kept list integration and mock fallback intact.

---

## Verification checklist for VPS

Run on staging:

```bash
cd /opt/Bandkitalpha
sudo bash scripts/staging-deploy.sh
bash scripts/staging-smoke-api.sh
git status --short
```

Expected:

```text
[bandkit deploy] Staging deploy completed
[bandkit smoke] Smoke API test completed
```

and:

```text
git status --short
```

must be empty.

Manual browser check:

1. Open `/bands`.
2. Click a real DB row, for example `Smoke API Band`.
3. Confirm the app opens `/bands/smoke-api-band`.
4. Confirm the real detail panel appears with `DB read-only` badge.
5. Confirm mock detail/fallback content remains below.
6. Confirm there are no UI write controls connected to backend create/update/delete.

---

## Do not regress

- Do not connect frontend writes before auth/permissions.
- Do not remove mock fallback until the full backend-driven detail page replaces it intentionally.
- Do not make mock routes `/bands/b1`, `/bands/b2`, `/bands/b3` depend on the real API.
- Do not expose secrets or `.env` values.
- Keep schema changes migration-only.

---

## Next recommended steps

1. Deploy and smoke this checkpoint on VPS.
2. If accepted, mark 1.10.24 as the current frontend real entity detail baseline.
3. Continue with the next small read-only vertical slice, likely real events detail or real entity-related members/documents preview, still without write UI until auth/permissions are designed.
