# BandKit — Staging Backend PostgreSQL API Checkpoint 1.10.16

## Status

Accepted staging infrastructure checkpoint.

This checkpoint confirms that the first BandKit backend skeleton, PostgreSQL connection, migration foundation, systemd service and Nginx `/api` proxy are working on the staging VPS.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS: `141.98.87.9`
- OS: Ubuntu 22.04
- Runtime: Node.js 20.20.2 / npm 10.8.2
- Database: PostgreSQL 14 on local VPS
- Backend local bind: `127.0.0.1:3001`
- Public API path: `/api/v1`

---

## Implemented backend files

Backend skeleton files added earlier:

- `server/README.md`
- `server/.env.example`
- `server/backend-package.json`
- `server/src/index.js`
- `server/src/config/env.js`
- `server/src/db/client.js`
- `server/src/shared/http.js`
- `server/src/shared/logger.js`
- `server/src/modules/health/health.routes.js`
- `server/src/modules/permissions/PermissionService.js`
- `server/migrations/0001_migration_log.sql`
- `server/scripts/run-migrations.js`

Known temporary note:

- `server/backend-package.json` is currently copied manually to `server/package.json` on VPS because direct creation of `server/package.json` was blocked by the tool earlier.

---

## VPS setup completed

Completed on staging VPS:

- PostgreSQL installed and running;
- database `bandkit` created;
- user `bandkit_user` created;
- `bandkit_user` can connect to `bandkit`;
- `bandkit_user` can create/drop tables;
- Node.js 20 installed;
- repo cloned to `/opt/Bandkitalpha`;
- backend dependencies installed in `/opt/Bandkitalpha/server`;
- local `server/.env` created on VPS;
- migration runner executed successfully;
- systemd service `bandkit-backend.service` created and enabled;
- Nginx config updated to proxy `/api/` to `127.0.0.1:3001/api/`.

---

## Migration verification

Migration runner output confirmed:

```text
Migration applied: 0001_migration_log.sql
```

The migration created the `schema_migrations` table.

---

## Local backend checks

Local checks confirmed on VPS:

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/health/db
```

Results:

- `/api/v1/health` returns `ok: true`;
- `/api/v1/health/db` returns `ok: true` and database timestamp.

---

## systemd verification

Created service:

```text
/etc/systemd/system/bandkit-backend.service
```

Status confirmed:

```text
bandkit-backend.service - BandKit Backend API
Active: active (running)
```

Journal confirmed backend start:

```json
{"level":"info","message":"BandKit backend listening","meta":{"port":3001,"apiPrefix":"/api/v1","env":"staging"}}
```

---

## Public Nginx `/api` verification

Public checks confirmed:

```bash
curl http://141.98.87.9/api/v1/health
curl http://141.98.87.9/api/v1/health/db
```

Results:

- public `/api/v1/health` returns `ok: true`;
- public `/api/v1/health/db` returns `ok: true` and database timestamp.

---

## Current accepted state

BandKit staging backend baseline is now active:

```text
Browser / curl
   ↓
Nginx :80
   ↓ /api/
BandKit backend 127.0.0.1:3001
   ↓
PostgreSQL 127.0.0.1:5432 / bandkit
```

This is still staging/preview infrastructure only, not production.

---

## Do not regress

Do not change these without explicit task:

- backend binds to `127.0.0.1`, not public interface;
- PostgreSQL remains local-only;
- real database password stays only in `/opt/Bandkitalpha/server/.env` on VPS;
- public access goes through Nginx `/api` proxy;
- migrations are run from repo scripts, not manual schema edits;
- current VPS remains staging/preview only.

---

## Next recommended steps

1. Commit a normal `server/package.json` when tool path allows it, removing the manual copy workaround.
2. Add backend deployment/runbook updates for systemd and Nginx.
3. Add first real schema migrations for MVP core objects:
   - users;
   - entities;
   - entity memberships;
   - events;
   - chat rooms;
   - chat messages;
   - documents.
4. Add PermissionService skeleton tests/policy stubs.
5. Add staging deploy/update script.
