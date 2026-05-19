# BandKit MVP Shell

## Current working baseline

- GitHub repo: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Baseline commit: `a178eb6`
- Package version: `1.10.0`
- Local preview port: `http://127.0.0.1:5199`
- Current stage: MVP Shell / stable frontend skeleton before real social-network business logic

BandKit is currently **not a full social network implementation**. This repository contains the stable MVP shell foundation: architecture, routing, layout shells, i18n RU/EN, production assets, basic UI components, mock permissions, role guards, moderation/security placeholders, and live mock screens.

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

## Git hygiene

Committed to GitHub:

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
docs/handoff/README_START_HERE.md
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

MVP shell prompt:

```txt
docs/handoff/prompts/Codex_MVP_Shell_Prompt_v1_0.md
```

Current baseline note:

```txt
docs/CURRENT_BASELINE.md
```

## Production assets

The original pre-code handoff referenced a ZIP asset pack. In this repo, the current production assets are stored unpacked and ready for runtime use:

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
- Do not add heavy social-network business logic before permission/RLS/backend contracts are implemented.
- Frontend guards are placeholders only; backend/RLS must become the real source of truth later.

## Current next task

Continue visual alignment of the shell against the approved dark professional backstage SaaS reference, while preserving the architecture, routing, i18n, security/moderation placeholders, and local launch flow.
