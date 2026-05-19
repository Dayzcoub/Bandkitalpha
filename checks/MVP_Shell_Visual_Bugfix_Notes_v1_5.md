# BandKit MVP Shell v1.5 — Visual Bugfix Notes

Source baseline: `BandKit_MVP_Shell_v1_4_content_flow.zip`.

Scope: fix screenshot-reported visual inconsistencies without changing shell architecture, routing, permissions, backend placeholders, i18n approach, or local dev kit.

## Fixed

- Normalized typography to prevent accidental italic rendering from locally installed Inter/Manrope variants on Windows.
- Switched the default UI font priority to Segoe UI before optional Inter/Manrope while preserving system UI fallback.
- Tightened quick-create cards: compact two-column layout, horizontal icon/content rhythm, removed excessive vertical card height.
- Reduced oversized restricted/error/empty illustrations so state cards do not dominate the page.
- Tightened right rail route inspector KPI density so App/User/Guard cards no longer look oversized.
- Adjusted profile cover/header proportions, max cover height, and avatar overlap to reduce visual jump after the cover image.
- Localized Russian `super_admin` access/role/restricted copy into user-facing Russian labels.

## Preserved

- No inline styles.
- No pixel-position hacks.
- No backend or business-social logic added.
- Existing routing map and guard model preserved.
- Existing local preview kit preserved: `START_BANDKIT_PREVIEW.bat`, fixed port `127.0.0.1:5199`, health endpoint.
- Assets remain language-neutral.
