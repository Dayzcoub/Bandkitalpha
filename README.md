# BandKit MVP Shell

Version: v1.7.0 mobile stabilization pass

Рабочая база: `BandKit_MVP_Shell_v1_3_visual_alignment.zip`.

Это всё ещё **не полная соцсеть**, а стабильный MVP shell-фундамент перед началом настоящей бизнес-логики: архитектура, routing map, layout shells, i18n RU/EN, production assets, базовые UI-компоненты, mock permissions, role guards, moderation/security placeholders и живые mock-экраны.

## Что добавлено в v1.4

- Главная `/feed` стала похожа на рабочий dashboard: workspace hero, quick actions, KPI, composer, фильтры и лента.
- Mock-контент переведён в i18n-ключи, чтобы не плодить хардкод пользовательских текстов.
- Усилены разделы профиля, групп, событий, чатов, документов, marketplace, настроек и админки.
- Добавлены trust checks, permission matrix, audit rows, safer chat policy block и moderation queue summary.
- Добавлены richer cards: quick action, compact profile, offer, timeline, document status, audit event.
- Сохранены правила: без inline styles, без pixel hacks, без backend, без тяжёлой соцсетевой логики.
- Local dev kit сохранён: фиксированный порт `127.0.0.1:5199`, bat-запускалки, health endpoint.

## Самый простой запуск на Windows

1. Распаковать архив.
2. Открыть папку проекта.
3. Дважды кликнуть:

```txt
START_BANDKIT_PREVIEW.bat
```

4. Открыть:

```txt
http://127.0.0.1:5199
```

Если браузер показывает старый/чужой проект, запустить:

```txt
RESET_CACHE_AND_START.bat
```

Подробная инструкция:

```txt
docs/local/LOCAL_PREVIEW_WINDOWS.md
```

## Ручной запуск через терминал

```bash
npm install
npm run build
npm run serve
```

## Проверки

```bash
npm run check
npm run build
npm run local:health
find dist/js -name '*.js' -print -exec node --check {} \;
unzip -t BandKit_MVP_Shell_v1_4_content_flow.zip
```

## Главные входные источники

- `docs/handoff/README_START_HERE.md`
- `docs/handoff/spec/BandKit_TZ_v1_2.md`
- `docs/handoff/spec/BandKit_Interface_Layout_Contract_v1_0.md`
- `docs/handoff/spec/BandKit_App_Architecture_v1_0.md`
- `docs/handoff/spec/BandKit_Routing_Map_v1_0.md`
- `docs/handoff/spec/BandKit_Database_RLS_Model_v1_0.md`
- `docs/handoff/spec/BandKit_API_Backend_Contract_v1_0.md`
- `docs/handoff/spec/BandKit_Component_Inventory_v1_0.md`
- `docs/handoff/spec/BandKit_Security_AntiFraud_v1_0.md`
- `docs/handoff/spec/BandKit_Development_Handoff_v1_0.md`
- `docs/handoff/spec/BandKit_QA_Acceptance_Checklist_v1_0.md`
- `docs/handoff/prompts/Codex_MVP_Shell_Prompt_v1_0.md`

Production assets:

```txt
public/assets/BandKit_Production_Assets_v1_3/
```


## v1.5 visual bugfix

- Normalized typography to avoid accidental italic rendering from local fonts.
- Made quick-create cards compact and aligned.
- Reduced oversized restricted/error illustrations.
- Tightened profile cover/header spacing and right rail inspector density.
- Kept i18n, routing, permissions, local preview kit, and mock-shell architecture unchanged.


## v1.9 Runtime CSS / Mobile Contract Fix

Исправлена причина, из-за которой mobile-проходы v1.7/v1.8 не отображались в локальном preview: build pipeline показывал старые runtime CSS из `public/styles`. Теперь canonical CSS синхронизируется из `src/styles` в `public/styles` и `dist/styles`.
