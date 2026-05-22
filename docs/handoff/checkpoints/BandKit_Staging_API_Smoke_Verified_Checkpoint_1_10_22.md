# BandKit — Staging API Smoke Verified Checkpoint 1.10.22

## Status

Accepted staging API smoke-test checkpoint.

This checkpoint confirms that the staging API smoke test script completed successfully on the VPS.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS: `141.98.87.9`
- Public API: `http://141.98.87.9/api/v1`
- Backend service: `bandkit-backend`
- Database: local PostgreSQL `bandkit`

---

## Verified command

The smoke test was run on VPS after deploy:

```bash
cd /opt/Bandkitalpha
bash scripts/staging-smoke-api.sh
```

Confirmed successful final output:

```text
[bandkit smoke] Smoke API test completed
```

---

## Smoke coverage

The script verifies:

- `GET /api/v1/health`;
- `GET /api/v1/health/db`;
- `POST /api/v1/dev/seed-demo`;
- `POST /api/v1/entities`;
- `GET /api/v1/entities`;
- `GET /api/v1/entities/:slug`;
- `GET /api/v1/events`;
- `GET /api/v1/chat-rooms`;
- `GET /api/v1/documents`.

---

## Confirmed backend path

The verified path now includes:

```text
HTTP API
  -> Node backend route
  -> PostgreSQL write/read
  -> JSON response
  -> public Nginx /api proxy
```

---

## Current accepted state

BandKit staging now has:

- clean staging deploy script;
- backend syntax check during deploy;
- backend and DB health checks;
- MVP core schema;
- first real-data API slice;
- entity create/list/detail vertical slice;
- staging smoke test script.

---

## Important limitations

This is still staging/development API validation.

The project does not yet have production auth, real user registration, sessions, password hashing, or frontend forms connected to backend writes.

---

## Next recommended steps

1. Decide next vertical slice:
   - events create/detail API;
   - frontend read-only entity list integration;
   - auth model design before real registration.
2. Keep changes small and checkpoint every verified working stage.
