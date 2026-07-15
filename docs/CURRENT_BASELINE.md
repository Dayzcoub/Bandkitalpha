# BandKit Current Baseline

## Current working baseline

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Current source baseline: GitHub `main`
- First clean GitHub baseline commit: `a178eb6`
- Package version: `1.10.0`
- Local preview: `http://127.0.0.1:5199`
- Staging preview: `https://bandkitdev.mywire.org`
- Current stage: MVP Shell + Staging Backend Foundation
- Current accepted staging checkpoint: `1.10.18 staging deploy script verified`

## What is fixed at this stage

The project has moved from archive/patch exchange to GitHub-based development and now has both a frontend MVP shell and a verified staging backend foundation.

Current stable frontend baseline includes:

- MVP Shell architecture;
- routing map implementation with mock screens;
- desktop and mobile layout shell;
- RU/EN i18n foundation;
- production assets unpacked in `public/assets/BandKit_Production_Assets_v1_3/`;
- local Windows launch scripts;
- fixed local preview port `127.0.0.1:5199`;
- runtime CSS synchronization from `src/styles` to `public/styles` and `dist/styles` during build;
- mock permissions, role guards, moderation/security placeholders;
- mobile reference UI pass applied to the feed shell.

Current stable staging backend foundation includes:

- Node.js backend skeleton in `server/`;
- PostgreSQL installed locally on the staging VPS;
- database `bandkit` and app user `bandkit_user`;
- migration runner and `schema_migrations` tracking;
- MVP core schema migration applied;
- tables for users, entities, memberships, events, chat rooms/messages, documents, acknowledgements and audit events;
- backend health endpoints `/api/v1/health` and `/api/v1/health/db`;
- systemd service `bandkit-backend`;
- Nginx `/api/` proxy;
- verified public HTTPS API health;
- root-owned wrapper `/usr/local/sbin/bandkit-staging-deploy` for controlled staging deploy;
- dedicated autodeploy SSH user `bandkit-deploy` for GitHub Actions.

Frontend mock screens are not yet connected to real backend business APIs. Real registration, entity creation, chat messages and document actions still require API modules and frontend integration.

Historical archive labels such as `BandKit_MVP_Shell_v1_1_local_dev_kit.zip` and notes from the `v1.7` mobile stabilization pass are retained only as history. They are not the current working baseline.

## Local workflow

```powershell
git pull
npm install
npm run build
.\RESET_CACHE_AND_START.bat
```

If only preview is needed:

```powershell
.\START_BANDKIT_PREVIEW.bat
```

## Staging VPS workflow

Normal staging deploy:

```bash
sudo /usr/local/sbin/bandkit-staging-deploy
```

Wrapper-only preflight:

```bash
sudo /usr/local/sbin/bandkit-staging-deploy --check
```

Public API checks:

```bash
curl https://bandkitdev.mywire.org/api/v1/health
curl https://bandkitdev.mywire.org/api/v1/health/db
```

Backend service checks:

```bash
sudo systemctl status bandkit-backend --no-pager
sudo journalctl -u bandkit-backend -n 100 --no-pager
```

## Git rules

Do not commit:

```txt
node_modules/
dist/
*.zip
*.log
.env
.env.*
```

Commit source/runtime inputs:

```txt
public/
src/
server/
scripts/
docs/
checks/
package.json
package-lock.json
tsconfig.json
README.md
*.bat
```

## Main source-of-truth documents

```txt
docs/CURRENT_BASELINE.md
docs/handoff/README_START_HERE.md
docs/handoff/runbooks/BandKit_Operator_Quick_Commands.md
docs/handoff/spec/BandKit_Final_Product_Policy_And_Backend_Handoff_Checkpoint_1_10_15.md
docs/handoff/checkpoints/BandKit_Staging_Backend_PostgreSQL_API_Checkpoint_1_10_16.md
docs/handoff/checkpoints/BandKit_MVP_Core_DB_Schema_Checkpoint_1_10_17.md
docs/handoff/checkpoints/BandKit_Staging_Deploy_Script_Verified_Checkpoint_1_10_18.md
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
docs/handoff/prompts/Codex_MVP_Shell_Prompt_v1_0.md
```

## Development constraints

- No inline styles.
- No pixel hacks.
- No one-off layout fixes under a single screen.
- User-facing texts go through i18n.
- Assets stay language-neutral.
- Desktop layout contract: `left nav → main content → right rail`.
- Mobile layout contract: `top bar → content → bottom nav`.
- Database schema changes must go through migrations.
- Current VPS is staging/preview only, not production.
- Heavy backend/social-network logic must be introduced as controlled vertical slices.
- Frontend permission guards are mock placeholders until backend PermissionService/policy checks become source of truth.

## Next work item

Stabilize the backend foundation, keep documentation/checkpoints current, then add the first small real-data API slice. Do not jump directly into full registration, full chat backend, payments, marketplace or broad social feed.
