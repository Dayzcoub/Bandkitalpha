# BandKit — Staging Deploy Script Verified Checkpoint 1.10.18

## Status

Accepted staging deploy checkpoint.

This checkpoint confirms that the unified staging deploy script successfully completed a full deploy cycle on the BandKit staging VPS.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS: `141.98.87.9`
- Repo path on VPS: `/opt/Bandkitalpha`
- Frontend web root: `/var/www/bandkit/current`
- Backend service: `bandkit-backend`
- Backend local API: `127.0.0.1:3001`
- Public API: `http://141.98.87.9/api/v1`
- Database: local PostgreSQL `bandkit`

---

## Verified command

The staging deploy now works through one operator command:

```bash
cd /opt/Bandkitalpha
sudo scripts/staging-deploy.sh
```

---

## Confirmed deploy steps

The script successfully completed:

1. fetched latest `main` from GitHub;
2. installed frontend dependencies;
3. built frontend;
4. published frontend `dist/` to `/var/www/bandkit/current`;
5. prepared backend package manifest;
6. installed backend dependencies;
7. ran backend migrations;
8. restarted `bandkit-backend` systemd service;
9. validated Nginx config;
10. reloaded Nginx;
11. checked local backend health;
12. checked local DB health;
13. checked public backend health;
14. checked public DB health;
15. completed with `Staging deploy completed`.

---

## Important fix during verification

The first deploy attempt failed because `package-lock.json` pointed to an internal OpenAI npm registry URL:

```text
packages.applied-caas-gateway1.internal.api.openai.org
```

This was fixed by commit:

```text
0c239a5 — Use public npm registry in package lock
```

The lock now points to the public npm registry, allowing VPS `npm install` to succeed.

---

## Health checks confirmed

Local checks passed:

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/health/db
```

Public checks passed:

```bash
curl http://141.98.87.9/api/v1/health
curl http://141.98.87.9/api/v1/health/db
```

Expected result confirmed:

```text
ok: true
```

---

## Current operator model

For normal staging updates, the operator only needs:

```bash
cd /opt/Bandkitalpha
sudo scripts/staging-deploy.sh
```

Then confirm the script ends with:

```text
[bandkit deploy] Staging deploy completed
```

---

## Known minor note

The deploy output may show:

```text
M scripts/staging-deploy.sh
```

This is caused by executable-bit/file-mode change after `chmod +x` on VPS. It did not block deploy.

Later, executable-bit handling can be cleaned up in Git if needed.

---

## Do not regress

Do not remove these working pieces without explicit task:

- `scripts/staging-deploy.sh`;
- backend `systemd` service `bandkit-backend`;
- local `server/.env` on VPS;
- Nginx `/api/` proxy;
- PostgreSQL local-only setup;
- migration runner;
- health checks at the end of deploy.

---

## Next recommended steps

1. Add first real API module for MVP data write/read.
2. Decide whether to start with auth/register or entity creation API.
3. Add dev/staging seed script after API shape is stable.
4. Later connect GitHub Actions to call this deploy script automatically.

Current suggested next product/backend step:

```text
Add real auth/register API or minimal entities API, then connect frontend gradually.
```
