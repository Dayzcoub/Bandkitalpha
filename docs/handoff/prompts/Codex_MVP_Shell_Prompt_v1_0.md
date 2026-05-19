# Codex Prompt — BandKit MVP Shell v1.0

Используй этот prompt как стартовую задачу для первого прохода разработки.

---

Ты работаешь над BandKit — социальной и рабочей платформой для музыкантов, групп, оркестров, студий, площадок, организаторов, преподавателей и технических специалистов.

Нужно собрать **MVP Shell**, а не полную бизнес-логику. Перед началом изучи документы:

- `spec/BandKit_TZ_v1_2.md`
- `spec/BandKit_Interface_Layout_Contract_v1_0.md`
- `spec/BandKit_App_Architecture_v1_0.md`
- `spec/BandKit_Routing_Map_v1_0.md`
- `spec/BandKit_Component_Inventory_v1_0.md`
- `spec/BandKit_Development_Handoff_v1_0.md`
- `spec/BandKit_QA_Acceptance_Checklist_v1_0.md`
- `spec/BandKit_Security_AntiFraud_v1_0.md`

Assets лежат в:

- `assets/BandKit_Production_Assets_v1_3_layout_contract.zip`

## Задача первого прохода

Собери runnable BandKit app shell:

1. Создай структуру проекта.
2. Подключи theme tokens/global styles.
3. Подключи i18n RU/EN, без hardcoded UI strings.
4. Подключи production assets через asset registry/components.
5. Создай shared UI components.
6. Создай AuthShell, AppShell, AdminShell, PublicShell.
7. Создай routing согласно Routing Map.
8. Создай mock auth/permissions layer.
9. Создай mock data layer.
10. Собери placeholders всех ключевых экранов:
    - auth;
    - onboarding;
    - feed;
    - profile;
    - bands;
    - events;
    - chats;
    - documents;
    - marketplace;
    - notifications;
    - settings;
    - moderation;
    - admin;
    - 404.
11. Для каждого ключевого модуля добавь loading/empty/error/restricted states.
12. Проверь responsive по Layout Contract.

## Строгие запреты

- Не делай полную backend-логику в первом проходе.
- Не хардкодь пользовательские строки в компонентах.
- Не используй inline style/pixel hacks для раскладки.
- Не импортируй assets хаотично по прямым путям.
- Не смешивай admin shell с user shell.
- Не удаляй/не игнорируй layout contract.
- Не делай внешние ссылки свободно кликабельными в user-generated content.

## Definition of Done

Первый проход считается готовым, если приложение запускается локально, все route доступны, layout стабилен, i18n переключается RU/EN, production assets видны, fallback avatars/covers работают, роли/ограничения имитируются mock permissions, а QA checklist можно начать проходить без переписывания основы.
