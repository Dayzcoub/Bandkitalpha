# BandKit MVP Shell v1.9 — Runtime CSS / Mobile Contract Fix

## Причина фикса

v1.7/v1.8 меняли `src/styles/global.css`, но preview-сервер показывал сборку из `dist`, а build pipeline копировал runtime CSS из `public/styles`. Из-за этого пользователь видел старую мобильную сетку: desktop right rail продолжал попадать в mobile viewport.

## Что исправлено

- `src/styles/*.css`, `public/styles/*.css` и `dist/styles/*.css` синхронизированы.
- `scripts/copy-static.mjs` теперь после копирования public assets принудительно кладёт canonical styles из `src/styles` в `dist/styles` и `public/styles`.
- Health/version обновлены до `1.9.0-mobile-runtime-css-fix`.
- На `<=767px` runtime CSS содержит hard mobile contract:
  - desktop side nav hidden;
  - desktop top bar hidden;
  - mobile top bar visible;
  - bottom nav fixed;
  - content grid one-column/block;
  - right rail hidden from normal mobile flow;
  - QA card hidden from mobile user flow.

## Manual check targets

- `/feed` at 425 px width: no profile/reliability/security right rail overlay over main feed.
- `/bands` at 425 px width: no right rail overlay, one-column content.
- `/login` at 390–499 px width: auth grid one column, no horizontal overflow.
- `/marketplace` at 390–499 px width: cards stack in one column.

## Commands

```bash
npm run check
npm run build
npm run local:health
node --check dist/js/*.js
unzip -t BandKit_MVP_Shell_v1_9_runtime_css_mobile_fix.zip
```
