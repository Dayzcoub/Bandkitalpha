# BandKit — Project Instructions

BandKit — операционная сеть всей event / live-production индустрии (не только
музыканты): событие — центральный узел, связывающий band, звук/свет, фотографов,
видеографов, диджеев, ведущих, организаторов, продакшн-компании, прокатчиков,
площадки, студии, агентства. Стартовый клин — музыканты.

Текущее состояние: MVP-оболочка (frontend mock-экраны + i18n RU/EN) + staging
backend foundation (Node + PostgreSQL). Реальный write-слайс пока один (entities).
`http://141.98.87.9` — личный preview-VPS под визуалку, НЕ прод.

## Обязательно к прочтению ПЕРЕД написанием любого кода

1. `docs/handoff/spec/BandKit_Foundation_Domain_Model_v1.md` — обобщённое ядро
   (6 примитивов: Party, Profession, Workspace/Entity, Event, Engagement, Resource).
   Приоритетнее ТЗ v1.2 там, где расходится.
2. `docs/handoff/spec/BandKit_Security_Engineering_Standard_v1.md` — правила кода
   по всем классам атак + Security Definition of Done (§16).
3. `docs/handoff/spec/BandKit_Interface_Layout_Contract_v1_0.md` — разметка/шеллы.
4. `docs/handoff/next-chat/BandKit_Next_Chat_Handoff_After_1_10_26.md` — где остановились.

Полное ТЗ: `docs/handoff/spec/BandKit_TZ_v1_2.md`.

## Non-negotiable правила разработки

- **Сервер — источник истины для прав.** Frontend-роли (`localStorage['bandkit.role']`)
  — только UX-хинт, никогда не проверка доступа.
- **Каждый вертикальный срез проходит Security DoD-гейт** (Security Standard §16)
  до чекпоинта, включая прогон `/security-review` без high/critical.
- **Изоляция арендаторов:** любой запрос к данным workspace scoped по membership;
  object-level authz через серверный PermissionService. IDOR — главный класс риска.
- **Модель данных generic:** типы/роли/статусы — reference-таблицы, не enum;
  individual и org — единый Party; вертикально-специфичные поля — extension (JSONB),
  не ALTER под каждую вертикаль. Не хардкодить под «музыкантов».
- **Никаких хардкод пользовательских строк** — только i18n-ключи `t("module.key")`.
- **Никаких inline styles и одноразовых CSS-костылей** — design tokens + shared
  компоненты + утверждённые layout patterns.
- **Изменения схемы БД — только через миграции** (`server/migrations/`).
- **Работа маленькими вертикальными срезами**, чекпоинт-док после верификации.
- **Не подключать frontend create/update/delete к backend, пока не спроектированы
  auth и permission service.**
- Модули общаются через публичный API; прямые импорты внутренних файлов чужого
  модуля запрещены.

## План разработки (фазы)

0. `/admin` Platform Owner Console shell (read-only, super_admin, mock-safe).
1. Auth & Session (спека → миграции → email+password/сессия → email verify → 2FA).
   HTTPS/TLS на preview-VPS обязателен до этой фазы.
2. Серверный PermissionService (источник истины).
3. Реальные write-слайсы за auth (membership → events → chat → documents).
4+. Домены по приоритету: reputation → link guard → moderation → feed → files →
   PDF → billing → E2EE.

## Стек

Frontend: TypeScript, static (без bundler/runtime-deps), HTML через template-строки
(⚠️ XSS — экранировать любой пользовательский вывод, см. Security Standard §5).
Backend: Node + `pg` + PostgreSQL, миграции через `server/scripts/run-migrations.js`.
Деплой: push main → GitHub Actions → VPS → `scripts/staging-deploy.sh` + smoke.
