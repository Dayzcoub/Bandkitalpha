# BandKit — Autodeploy And User Interface Debug Gate Checkpoint 1.10.26

## Status

Accepted checkpoint.

This checkpoint fixes the current working baseline after GitHub Actions staging autodeploy was verified and technical/debug UI was restricted to `super_admin`.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS preview: `http://141.98.87.9`
- App path on VPS: `/opt/Bandkitalpha`
- Backend service: `bandkit-backend`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Accepted state

GitHub Actions staging deploy is working.

Current deploy path:

```text
push to main → GitHub Actions → VPS SSH → scripts/staging-deploy.sh → scripts/staging-smoke-api.sh
```

The workflow was verified from GitHub Actions and completed successfully.

Expected successful tail markers:

```text
[bandkit deploy] Staging deploy completed
[bandkit smoke] Smoke API test completed
[bandkit actions] Staging deploy and smoke completed
```

---

## User-interface direction

The project is still pre-launch and has no real users except the owner/testing account.

From this checkpoint onward, the frontend should be polished as a real user-facing portal, not as a visible staging/debug panel collection.

Regular users should not see technical labels or backend integration markers such as:

```text
Real API
DB read-only
GET only
No auth writes
Mock fallback preserved
offline/mock/debug staging labels
```

Technical/debug surfaces are allowed only for `super_admin`.

---

## Implemented boundary

Changed:

```text
src/lib/permissions/diagnostics.ts
```

`canSeeDiagnostics(ctx)` remains restricted to:

```text
super_admin
```

`canSeeTechnicalLabels(ctx)` is now also restricted to:

```text
super_admin
```

Changed:

```text
src/modules/RealEntitiesPreview.ts
```

Real API debug panels are mounted only when:

```text
localStorage['bandkit.role'] === 'super_admin'
```

For normal users, these panels are unmounted and not visible.

---

## Real entity detail status

The real entity detail integration exists and works for super admin diagnostics.

Example route:

```text
/bands/smoke-api-band
```

For `super_admin`, diagnostic detail can show PostgreSQL-backed entity data.

For normal user-facing UI, technical DB/read-only panels are hidden.

---

## Autodeploy status

GitHub Actions workflow:

```text
.github/workflows/staging-deploy.yml
```

is configured for:

```text
push to main
workflow_dispatch
```

Required GitHub Secrets:

```text
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
STAGING_PORT
```

A dedicated VPS deploy user is configured:

```text
bandkit-deploy
```

with passwordless sudo limited to:

```text
/bin/bash /opt/Bandkitalpha/scripts/staging-deploy.sh
```

---

## Do not regress

- Do not show technical/debug/staging labels to regular users.
- Keep debug/backend integration panels available only for `super_admin`.
- Do not connect frontend create/update/delete to backend until auth/permissions are designed.
- Do not expose `.env`, SSH keys, DB passwords, tokens, or real secrets.
- Keep schema changes migration-only.
- Keep GitHub Actions autodeploy working.
- Keep manual VPS deploy as fallback:

```bash
cd /opt/Bandkitalpha
sudo bash scripts/staging-deploy.sh
bash scripts/staging-smoke-api.sh
git status --short
```

---

## Next recommended work

Continue polishing the normal user-facing portal UI.

Recommended next small slice:

1. Replace mock-looking group detail fallback with a product-grade public group page layout.
2. Keep super admin diagnostics hidden behind role checks.
3. Move toward real backend-driven display gradually without exposing technical labels to users.
