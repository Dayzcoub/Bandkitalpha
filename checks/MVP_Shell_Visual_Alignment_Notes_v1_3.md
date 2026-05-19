# BandKit MVP Shell v1.3 — Visual Alignment Pass

## Цель прохода

Привести runnable MVP Shell ближе к утверждённому preview-направлению **Dark backstage SaaS / Professional Music Network**, не ломая архитектуру v1.1/v1.2 и не добавляя тяжёлую бизнес-логику социальной сети.

## Что изменено

- Усилен dark SaaS shell: deep graphite background, soft blue/cyan/violet glows, panel glass, backstage grid texture.
- Desktop оставлен строго по contract: left navigation rail / top bar / main content / right context rail.
- Mobile оставлен строго по contract: top bar / one-column content / bottom navigation.
- Left rail получил более близкий к preview вид: raised brand block, active item with accent rail, workspace card.
- Page headers стали визуально похожи на dashboard/workspace preview: larger panel, gradient surface, stable primary CTA zone.
- Feed/composer/cards получили более социальный вид: composer with avatar row, social card footer rhythm, stronger card depth.
- Right rail cards визуально отделены от main content, QA controls остались вторичными.
- Все новые UI labels заведены через i18n (`common.i18nReady`, `common.rlsReady`).
- Hardcoded `i18n`/`RLS-ready` в page header заменены на locale keys.
- Shell/access labels в route inspector локализованы.

## Что намеренно не делалось

- Не подключался backend.
- Не писалась полноценная логика социальной сети.
- Не добавлялись inline styles, pixel hacks или одноразовые локальные костыли.
- Не менялись маршруты и permission model.
- Не менялся assets pack; все assets остаются language-neutral.

## Проверки

```bash
npm run check
npm run build
find dist/js -name '*.js' -print -exec node --check {} \;
npm run local:health
```

Smoke test routes:

```text
/                  200
/feed              200
/onboarding        200
/admin             200
/settings/security 200
/chats/c1          200
/marketplace       200
/missing           200
```
