# BandKit MVP Shell v1.6 — Reference Alignment Pass

Цель прохода: приблизить реальный MVP Shell к утверждённому dark backstage SaaS reference, не ломая архитектуру, routing map, i18n, local dev kit и mock-режим.

## Исправлено

- Главный app dashboard `/feed` больше не выглядит как технический page-header: добавлен greeting-блок, KPI-панель и более плотная структура рабочего dashboard.
- Right rail очищен от визуального ощущения debug-панели: профиль, надёжность, безопасность и ближайшие события вынесены в продуктовые карточки; QA-переключатели спрятаны в раскрываемый блок.
- Экран входа/публичный landing перестал разваливаться на узких desktop/tablet ширинах: public/auth сетка получила отдельные правила до 980px.
- Карточки quick create больше не зажимают текст в узкие колонки: для mobile landing включается одна колонка, для app dashboard — компактные 2 колонки.
- Обновлены i18n-ключи RU/EN для новых dashboard/right-rail/security подписей.
- Сохранены базовые ограничения ТЗ: без inline styles, без pixel hacks, без backend, без бизнес-логики соцсети.

## Проверено

- `npm run check`
- `npm run build`
- `npm run local:health`
- `find dist/js -name '*.js' -print -exec node --check {} \;`
- CSS brace sanity for `global.css` and `tokens.css`
- Smoke routes: `/`, `/feed`, `/login`, `/register`, `/profile/me`, `/marketplace`, `/settings/security`, `/admin`, `/missing`, `/__bandkit_health` → `200`

## Ограничение прохода

Это всё ещё shell/mock-first версия. Pixel-perfect совпадение с high-fidelity preview не должно достигаться через локальные костыли: дальнейшее сближение нужно делать через общие layout tokens, карточки и reusable dashboard blocks.
