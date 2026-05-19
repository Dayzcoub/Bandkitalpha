# BandKit MVP Shell v1.10 — Mobile Reference UI Patch

Baseline: `BandKit_MVP_Shell_v1_9_runtime_css_mobile_fix.zip`.

This patch is incremental and is intended to be applied over the existing v1.9 working folder. It does not resend `node_modules` or the full asset pack.

## Scope

- Adds a dedicated mobile feed surface that follows the approved mobile reference direction:
  - BandKit top bar with search and notifications.
  - Horizontal story/action rail.
  - Upcoming event card.
  - Invitations card with accept/decline controls.
  - Compact feed post preview.
  - Bottom navigation with centered create action.
- Keeps desktop shell and routing structure intact.
- Keeps v1.9 runtime CSS synchronization rule intact: `src/styles`, `public/styles`, and `dist/styles` must stay aligned after build.
- Keeps all new user-facing strings in i18n files.
- Does not add backend logic, real authentication, database writes, or social network business logic.

## Files changed

- `src/routes/pages.ts`
- `src/components/layout/navigation.ts`
- `src/styles/global.css`
- `public/styles/global.css`
- `src/locales/ru/feed.json`
- `src/locales/en/feed.json`
- `src/locales/bundles.ts` after generation/build
- `scripts/serve-dist.mjs`
- `package.json`
- `dist/**` after build

## Verification

Expected local health version after applying and starting:

```txt
1.10.0-mobile-reference-ui
```

Run:

```bash
npm run check
npm run build
npm run local:health
```
