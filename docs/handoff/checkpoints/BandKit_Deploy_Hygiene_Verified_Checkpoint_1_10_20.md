# BandKit — Deploy Hygiene Verified Checkpoint 1.10.20

## Status

Accepted staging deploy hygiene checkpoint.

This checkpoint confirms that the staging deploy script now completes successfully and leaves the VPS Git working tree clean.

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

## Verified deploy command

The staging deploy was run through:

```bash
cd /opt/Bandkitalpha
sudo bash scripts/staging-deploy.sh
git status --short
```

The deploy completed successfully and `git status --short` produced no output.

---

## Confirmed deploy steps

The improved deploy script successfully completed:

1. pre-clean generated working tree files;
2. fetch latest `main`;
3. install frontend dependencies;
4. build frontend;
5. publish frontend `dist/` to `/var/www/bandkit/current`;
6. install backend dependencies;
7. run backend migrations;
8. run backend syntax check through `npm run check`;
9. restart `bandkit-backend`;
10. validate and reload Nginx;
11. check local backend health;
12. check local database health;
13. check public backend health;
14. check public database health;
15. post-clean generated working tree files;
16. finish with `Staging deploy completed`.

---

## Verified health checks

Local health checks returned `ok: true`:

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/health/db
```

Public health checks returned `ok: true`:

```bash
curl http://141.98.87.9/api/v1/health
curl http://141.98.87.9/api/v1/health/db
```

---

## Working tree hygiene

Before this checkpoint, build/deploy could leave generated files modified or untracked on VPS, including:

- `package-lock.json`;
- generated runtime styles in `public/styles/`;
- `src/locales/bundles.ts`;
- `server/package-lock.json`.

The improved script now cleans generated working tree changes before and after deploy.

Confirmed final state:

```text
git status --short
# no output
```

---

## Current operator command

Use this command for staging updates:

```bash
cd /opt/Bandkitalpha
sudo bash scripts/staging-deploy.sh
```

Do not rely on executable-bit presence for now. Running through `bash` avoids file mode churn on VPS.

---

## Current accepted state

BandKit staging now has:

- MVP frontend shell;
- real staging backend foundation;
- PostgreSQL schema migrations;
- MVP core DB schema;
- first real-data API slice;
- verified one-command deploy;
- clean post-deploy Git state.

---

## Do not regress

Do not remove without explicit replacement:

- pre-clean and post-clean deploy hygiene;
- backend `npm run check` in deploy;
- backend health checks;
- database health checks;
- Nginx reload validation;
- systemd restart for `bandkit-backend`.

---

## Next recommended steps

1. Add or refine staging smoke test script for real-data API endpoints.
2. Decide next vertical slice:
   - auth model design;
   - entity create/read API;
   - frontend read-only integration with real data.
3. Keep backend business logic incremental and policy-backed.
