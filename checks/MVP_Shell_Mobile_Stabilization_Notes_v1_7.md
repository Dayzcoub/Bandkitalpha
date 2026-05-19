# BandKit MVP Shell v1.7 — Mobile Stabilization Pass

## Цель

Исправить мобильный режим после reference alignment: на ширинах до 767 px shell должен строго следовать Interface Layout Contract:

- top bar → page content → bottom nav;
- одна колонка контента;
- без desktop rails, фиксированных внутренних ширин и горизонтального разъезда;
- QA/debug блок не участвует в обычном мобильном потоке;
- quick-create и landing/auth карточки не сжимаются в узкие столбики.

## Что исправлено

- Повторно зафиксирован `.bk-content-grid` на mobile как `1fr` после всех desktop/reference overrides.
- Right rail на mobile превращён в stacked sections внутри основного потока, без sticky/desktop-позиционирования.
- QA-card скрыта на mobile, чтобы не ломать пользовательский экран.
- Уплотнены dashboard greeting, KPI, rail cards, action cards и landing preview.
- Quick action cards получили явное распределение иконки/текста/CTA на mobile.
- Public/auth экраны ограничены стабильной mobile шириной и больше не разъезжаются в responsive viewport.
- Убран лишний CSS brace из предыдущего слоя.

## Не менялось

- Роутинг.
- Permissions/guards.
- i18n-подход.
- Assets registry.
- Local dev kit, preview server, fixed port `127.0.0.1:5199`.
- Backend/business logic не добавлялись.
