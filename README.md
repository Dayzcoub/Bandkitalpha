# BandKit MVP Shell + Staging Backend Foundation

## Current working baseline

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Current source baseline: GitHub `main`
- First clean GitHub baseline commit: `a178eb6`
- Package version: `1.10.0`
- Local preview port: `http://127.0.0.1:5199`
- VPS staging preview: `https://bandkitdev.mywire.org`
- Current stage: MVP Shell + Staging Backend Foundation
- Current accepted staging checkpoint: `1.10.18 staging deploy script verified`

BandKit is still **not a full social network implementation**. The frontend remains an MVP shell with routing, layout shells, i18n RU/EN, production assets, basic UI components, mock permissions, role guards, moderation/security placeholders and live mock screens.

The project now also has a verified staging backend foundation:

- Node.js backend skeleton in `server/`;
- PostgreSQL on staging VPS;
- migration runner;
- MVP core database schema;
- systemd service `bandkit-backend`;
- Nginx `/api` proxy;
- verified public HTTPS health endpoints;
- wrapper-based staging deploy on VPS;
- GitHub Actions staging autodeploy prepared to SSH as `bandkit-deploy` and run `/usr/local/sbin/bandkit-staging-deploy`.

Frontend mock screens are not yet connected to real backend business APIs. Real registration, entity creation, chat messages and document actions still require API modules and frontend integration.

Older archive labels such as `v1.1` local dev kit or `v1.7` mobile stabilization pass are historical handoff notes only. New work must continue from GitHub `main` unless a newer accepted baseline is explicitly created.

## Quick start on Windows

From the project folder:

```powershell
git pull
npm install
npm run build
.\RESET_CACHE_AND_START.bat
```

Open:

```txt
http://127.0.0.1:5199
```

Alternative launchers:

```txt
START_BANDKIT_PREVIEW.bat
START_BANDKIT_DEV.bat
BUILD_BANDKIT.bat
CHECK_BANDKIT.bat
RESET_CACHE_AND_START.bat
```

PowerShell requires `./` or `.\` before local batch files, for example:

```powershell
.\START_BANDKIT_PREVIEW.bat
```

## Staging VPS operator command

For normal staging updates on VPS:

```bash
sudo /usr/local/sbin/bandkit-staging-deploy
```

This pulls latest `main`, builds frontend, publishes `dist/`, installs backend dependencies, runs migrations, restarts backend, reloads Nginx, checks local health, checks public HTTPS health and leaves the Git working tree clean.

GitHub Actions staging autodeploy is expected to:

1. SSH to `bandkitdev.mywire.org` as `bandkit-deploy`;
2. run `sudo -n /usr/local/sbin/bandkit-staging-deploy`;
3. run `scripts/staging-smoke-api.sh`.

Public API checks:

```bash
curl https://bandkitdev.mywire.org/api/v1/health
curl https://bandkitdev.mywire.org/api/v1/health/db
```

## Backend local commands

From `server/`:

```bash
npm install
npm run check
npm run migrate
npm start
```

The real VPS environment uses local `server/.env`. Do not commit secrets.

## Git hygiene

Committed to GitHub:

```txt
public/
src/
scripts/
docs/
checks/
server/
package.json
package-lock.json
tsconfig.json
README.md
*.bat
```

Ignored by `.gitignore`:

```txt
node_modules/
dist/
*.zip
*.log
.DS_Store
.env
.env.*
```

`dist/` is generated locally by:

```powershell
npm run build
```

`node_modules/` is restored locally by:

```powershell
npm install
```

## Source of truth documents

Start here:

```txt
docs/CURRENT_BASELINE.md
docs/handoff/README_START_HERE.md
docs/handoff/runbooks/BandKit_Operator_Quick_Commands.md
```

Current checkpoints:

```txt
docs/handoff/spec/BandKit_Final_Product_Policy_And_Backend_Handoff_Checkpoint_1_10_15.md
docs/handoff/checkpoints/BandKit_Staging_Backend_PostgreSQL_API_Checkpoint_1_10_16.md
docs/handoff/checkpoints/BandKit_MVP_Core_DB_Schema_Checkpoint_1_10_17.md
docs/handoff/checkpoints/BandKit_Staging_Deploy_Script_Verified_Checkpoint_1_10_18.md
```

Main specs:

```txt
docs/handoff/spec/BandKit_TZ_v1_2.md
docs/handoff/spec/BandKit_Interface_Layout_Contract_v1_0.md
docs/handoff/spec/BandKit_App_Architecture_v1_0.md
docs/handoff/spec/BandKit_Routing_Map_v1_0.md
docs/handoff/spec/BandKit_Database_RLS_Model_v1_0.md
docs/handoff/spec/BandKit_API_Backend_Contract_v1_0.md
docs/handoff/spec/BandKit_Component_Inventory_v1_0.md
docs/handoff/spec/BandKit_Security_AntiFraud_v1_0.md
docs/handoff/spec/BandKit_Development_Handoff_v1_0.md
docs/handoff/spec/BandKit_QA_Acceptance_Checklist_v1_0.md
```

## Production assets

The current production assets are stored unpacked and ready for runtime use:

```txt
public/assets/BandKit_Production_Assets_v1_3/
```

Assets must remain language-neutral. Localized text belongs in i18n files, not inside images.

## Non-negotiable development rules

- No hardcoded user-facing text in components; use i18n.
- No inline styles.
- No pixel hacks or one-off local CSS patches.
- Use shared tokens, shared components, and approved layout patterns.
- Desktop contract: `left nav → main content → right rail`.
- Mobile contract: `top bar → content → bottom nav`.
- Do not connect frontend mock flows to backend casually; use controlled vertical slices.
- Backend permissions must become the real source of truth before sensitive features rely on frontend guards.
- Database schema changes must go through migrations.
- Current VPS is staging/preview only, not production.

## Current next task

Stabilize the backend foundation and then add the first small real-data API slice. Do not jump directly into full registration, full chat backend, payments, marketplace or broad social feed.
