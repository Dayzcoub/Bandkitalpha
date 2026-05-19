# BandKit Current Baseline

## Current working baseline

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Current source baseline: GitHub `main`
- First clean GitHub baseline commit: `a178eb6`
- Package version: `1.10.0`
- Local preview: `http://127.0.0.1:5199`

## What is fixed at this stage

The project has moved from archive/patch exchange to GitHub-based development.

Current stable baseline includes:

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
- Heavy backend/social-network logic starts only after backend/RLS/permission model implementation.
- Frontend permission guards are mock placeholders until backend/RLS becomes source of truth.

## Next work item

Continue UI/reference alignment and bug fixing from the GitHub repository, not from ZIP archives.
