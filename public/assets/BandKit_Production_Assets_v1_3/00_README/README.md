# BandKit Production Assets v1.3 — Layout Contract Integrated

Назначение архива: production-ready ассеты для внедрения в интерфейс BandKit.

Это расширенный production pack с интегрированным основным ТЗ, i18n и контрактом разметки интерфейса: внутри лежат не preview boards и не большие склеенные презентационные листы, а отдельные SVG / PNG / WebP файлы с прозрачным фоном. PNG/WebP сохранены с alpha channel.

## Что добавлено в v1.3

- `spec/BandKit_Interface_Layout_Contract_v1_0.md` — обязательный контракт разметки интерфейса: shell, сетки, зоны, карточки, модалки, mobile/desktop поведение, anti-drift правила.
- `metadata/layout_contract.json` — машиночитаемая версия ключевых layout-правил для разработки и QA.
- `spec/BandKit_TZ_v1_2.md` — единое основное ТЗ с разделом про Interface Layout Contract.
- `fallbacks/avatars/` — дефолтные аватарки пользователей и ролей.
- `fallbacks/covers/` — дефолтные широкие обложки профилей, групп, студий, площадок, событий, чатов и документов.
- `fallbacks/thumbnails/` — заглушки для постов, медиа, документов, райдеров, договоров, счетов и приватных профилей.
- `locales/ru` и `locales/en` — стартовые языковые пакеты по модулям.
- `metadata/i18n_rules.json` — правила локализации и fallback-логика.
- `metadata/localization_manifest.json` — реестр locale-файлов.
- `spec/BandKit_TZ_v1_1.md` — единое основное ТЗ с уже встроенным разделом локализации/i18n.
- `spec/CHANGELOG_TZ_v1_1.md` — краткий changelog по интеграции ТЗ.

## Брендовые правила

- Brand: **BandKit**.
- Не использовать MUSO / Muzo / случайные названия бренда.
- Стиль: dark professional theme / Professional Music Network / Social SaaS.
- Основной визуальный язык: backstage / studio / production / professional workspace.
- Иконки и аватары: rounded-square, не circular.
- Акценты: purple / blue / cyan на тёмном graphite.

## Структура

```text
brand/                  SVG/PNG/WebP логотипы, wordmark, mark, mark-tile
favicon/                favicon.ico, favicon-16.png, favicon-32.png
app-icons/              icon-180/192/512, maskable-512
navigation/             active/inactive navigation icons
roles/                  active/inactive role icons
badges/                 active/inactive trust/security badges
documents/              active/inactive document/file icons
empty-states/           transparent empty-state illustrations
feature-illustrations/  transparent feature illustrations
fallbacks/avatars/      default profile/avatar fallback art
fallbacks/covers/       default wide cover fallback art
fallbacks/thumbnails/   default post/media/document thumbnail fallback art
locales/                starter language packs: RU/EN
og/                     transparent social/OG layout assets
spec/                   integrated main TZ, layout contract and changelogs
metadata/               manifest, CSV, design tokens, QA reports, i18n rules, layout contract JSON
```

## Localization Rules

BandKit должен использовать языковые пакеты. В коде не должно быть пользовательских строк напрямую: вместо этого используются ключи `t("module.key")`.

Все production assets должны быть language-neutral: иконки без локализуемого текста, иллюстрации без русских/английских UI-надписей, empty states — отдельно картинка, отдельно текст из `/locales`. Брендовый логотип BandKit — разрешённое исключение.

Если текст в изображении неизбежен, такие файлы должны храниться отдельно в `assets/localized/{lang}/` и иметь отдельный manifest.

## Рекомендации внедрения

- В интерфейсе использовать SVG как основной источник.
- PNG/WebP использовать для raster fallback, PWA icons, OG/preview and browser-specific fallbacks.
- Default avatars/covers подключать как fallback при отсутствии пользовательской загрузки.
- Locale JSON разбиты по модулям, чтобы не держать один огромный файл переводов.
- UI должен выдерживать длинные переводы и не опираться на фиксированную ширину русского текста.

## Важное ограничение

В архиве нет больших preview boards из предыдущего пакета. Исходные boards использовались только как визуальное направление, а не как production output.


## TZ Integration Rule

После v1.2 отдельный i18n addendum не является источником истины. Все требования по локализации находятся в основном документе `spec/BandKit_TZ_v1_2.md`. Начиная с v1.3, разметка интерфейса фиксируется в `spec/BandKit_Interface_Layout_Contract_v1_0.md` и обязательна для разработки.


## Interface Layout Contract Rule

Начиная с v1.3, интерфейс BandKit нельзя собирать экран за экраном «на глаз». Любая страница должна следовать `spec/BandKit_Interface_Layout_Contract_v1_0.md`: desktop/mobile shell, left rail, top bar, main content, right rail, mobile bottom navigation, карточки, формы, модалки, drawers/sheets, empty/loading/error states и anti-drift правила.

Если для нового сценария требуется новый layout pattern, сначала обновляется Layout Contract/UI Kit, затем shared components, и только потом конкретный экран.
