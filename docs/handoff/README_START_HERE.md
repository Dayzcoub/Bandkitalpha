# BandKit Pre-Code Handoff v1.0

Дата сборки: 2026-05-18 17:23

Этот архив — единый пакет перед началом написания кода BandKit. Он фиксирует не только внешний вид, но и инженерные правила, архитектуру, маршруты, базу данных, RLS, API-контракт, безопасность, компоненты, QA и первый development handoff для Codex/разработчика.

## Что внутри

```txt
/spec
  BandKit_TZ_v1_2.md
  BandKit_User_Model_Profile_Tiers_v1_0.md
  BandKit_Interface_Layout_Contract_v1_0.md
  BandKit_App_Architecture_v1_0.md
  BandKit_Routing_Map_v1_0.md
  BandKit_Database_RLS_Model_v1_0.md
  BandKit_API_Backend_Contract_v1_0.md
  BandKit_Component_Inventory_v1_0.md
  BandKit_Security_AntiFraud_v1_0.md
  BandKit_Development_Handoff_v1_0.md
  BandKit_QA_Acceptance_Checklist_v1_0.md
/assets
  BandKit_Production_Assets_v1_3_layout_contract.zip
/prompts
  Codex_MVP_Shell_Prompt_v1_0.md
/checks
  PreCode_Readiness_Checklist_v1_0.md
/metadata
  handoff_manifest.json
  handoff_manifest.csv
```

## Источник истины

1. `spec/BandKit_TZ_v1_2.md` — продуктовая основа.
2. `spec/BandKit_User_Model_Profile_Tiers_v1_0.md` — обязательное дополнение по типам пользователей, сольным исполнителям, premium/pro статусам и entitlements до полной интеграции в основное ТЗ.
3. `spec/BandKit_Interface_Layout_Contract_v1_0.md` — контракт раскладки интерфейса, обязателен для всех экранов.
4. `spec/BandKit_Development_Handoff_v1_0.md` — первый проход разработки.
5. `assets/BandKit_Production_Assets_v1_3_layout_contract.zip` — актуальный production assets pack.

## Главный принцип первого прохода

Не начинать с полной бизнес-логики соцсети. Первый проход должен собрать стабильный MVP shell:

- routing;
- layout shell;
- i18n;
- theme tokens;
- базовые компоненты;
- подключение assets;
- пустые состояния;
- auth/onboarding/profile/feed/events/chats/documents/moderation/admin placeholders;
- архитектура папок и правила расширения.

После этого поверх каркаса добавляются реальные backend-модули, Supabase/Firebase/API, чаты, события, документы, рейтинг, модерация и уведомления.

## Запреты

- Не хардкодить UI-тексты в компонентах.
- Не вставлять текст в картинки, кроме утверждённого логотипа.
- Не делать inline style и пиксельные костыли под один экран.
- Не делать бизнес-логику до фикса permission model/RLS.
- Не смешивать admin/moderation/user роли в одном неразделённом UI.
- Не хранить security/anti-fraud правила только на frontend.
- Не смешивать profile type, workspace role, premium status, verification, trust и moderation state в одну роль.
