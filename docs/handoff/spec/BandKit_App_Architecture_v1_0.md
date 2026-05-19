# BandKit App Architecture v1.0

## 1. Назначение документа

Документ фиксирует модульную архитектуру BandKit до старта разработки. Цель — чтобы приложение собиралось как расширяемая система, а не как набор экранов без общей структуры.

BandKit — социальная и рабочая платформа для музыкантов, групп, оркестров, студий, площадок, организаторов, преподавателей и технических специалистов. Архитектура должна сразу учитывать мультиязычность, роли, безопасность, модерацию, чаты, уведомления и будущую монетизацию.

## 2. Базовый стек MVP

Рекомендуемый стартовый стек:

- Frontend: React + TypeScript.
- Routing: React Router / TanStack Router / Next.js App Router — выбрать один до начала кода.
- Styling: дизайн-токены + CSS variables + системные компоненты.
- State: локальный component state + query/cache layer для данных.
- Backend: Supabase или другой backend с PostgreSQL, Auth, Storage, Realtime.
- i18n: словари `/locales/{lang}/{namespace}.json`.
- Assets: production pack из `/assets/BandKit_Production_Assets_v1_3_layout_contract.zip`.

Критично: стек может быть заменён, но архитектурные слои должны остаться.

## 3. Слои приложения

```txt
src/
  app/                 # инициализация приложения, providers, routing
  routes/              # route modules / page containers
  layouts/             # app shell, auth shell, admin shell
  modules/             # бизнес-модули
  components/          # shared UI components
  features/            # кросс-модульные feature blocks
  lib/                 # общие утилиты, api clients, formatters
  locales/             # языковые пакеты
  assets/              # локальная прокладка к production assets
  styles/              # tokens, themes, globals
  tests/               # unit/integration/e2e
```

## 4. Обязательные providers

На верхнем уровне приложения должны быть:

- `ThemeProvider` — light/dark/system future-ready.
- `I18nProvider` — язык, namespace loading, fallback chain.
- `AuthProvider` — текущий пользователь, сессия, роли.
- `WorkspaceProvider` — текущая организация/группа/пространство, если применимо.
- `PermissionsProvider` — derived permissions.
- `ToastProvider` — уведомления UI.
- `QueryClientProvider` — кэш серверных данных.
- `ErrorBoundary` — user-friendly ошибки.

## 5. Модули продукта

### 5.1 Auth

Функции:

- регистрация;
- вход по email/phone;
- OAuth Google/Apple;
- подтверждение email;
- подтверждение телефона через SMS;
- 2FA через authenticator apps;
- восстановление доступа;
- управление активными сессиями;
- logout everywhere.

### 5.2 Profiles

Сущности:

- пользователь;
- музыкант;
- преподаватель;
- техспециалист;
- организатор;
- студия;
- площадка;
- организация.

Профили должны поддерживать публичную и приватную часть.

### 5.3 Bands / Projects / Orchestras

Функции:

- создание группы/проекта;
- роли внутри группы;
- приглашения участников;
- заявки на вступление;
- расписание;
- документы;
- публичная страница;
- рейтинг/репутация группы.

### 5.4 Feed / Posts

Функции:

- посты;
- репосты;
- лайки;
- комментарии;
- прикреплённые медиа;
- жалобы;
- фильтрация внешних ссылок;
- модерация контента.

### 5.5 Events

Функции:

- концерты;
- репетиции;
- кастинги;
- записи в студии;
- дедлайны;
- приглашения;
- RSVP;
- участники;
- документы события;
- уведомления.

### 5.6 Chats

Типы:

- личные сообщения;
- групповые чаты;
- чаты группы/проекта;
- чаты события;
- служебные чаты модерации.

Ограничения:

- антиспам;
- запрет внешних ссылок в MVP;
- жалобы;
- блокировки;
- безопасный audit trail для модерации.

### 5.7 Documents

Функции:

- договоры;
- райдеры;
- setlist;
- приглашения;
- технические листы;
- экспорт PDF;
- версии документов;
- права доступа.

### 5.8 Marketplace / Search

Функции:

- поиск музыкантов;
- поиск групп;
- поиск студий/площадок;
- объявления;
- фильтры по роли, инструменту, городу, доступности;
- безопасное общение через платформу.

### 5.9 Reputation / Rating

Функции:

- личный рейтинг;
- рейтинг группы/организации;
- отметки надёжности;
- история отмен/неявок;
- отзывы;
- dispute flow;
- защита от накруток.

### 5.10 Complaints / Moderation

Функции:

- жалоба на пользователя;
- жалоба на пост;
- жалоба на сообщение;
- жалоба на группу/организацию;
- очередь модерации;
- действия модератора;
- уведомления о статусе жалобы;
- аудит действий.

### 5.11 Admin

Функции:

- управление пользователями;
- управление ролями;
- системные настройки;
- справочники;
- локализации;
- security dashboard;
- контентные флаги;
- audit logs.

### 5.12 Notifications

Каналы:

- in-app notification center;
- push PWA/native future-ready;
- email;
- SMS для critical flows.

Все уведомления должны идти через локализуемые шаблоны.

### 5.13 Media / Storage

Типы файлов:

- avatars;
- covers;
- post media;
- chat attachments;
- documents;
- audio snippets future-ready;
- video future-ready.

Нужны лимиты, проверка MIME, вирус-сканирование future-ready, moderation flags.

## 6. Архитектурные правила компонентов

- Page не должен содержать низкоуровневую бизнес-логику.
- Shared UI не должен знать о конкретных сущностях BandKit.
- Business widgets могут знать о домене.
- API calls должны быть изолированы в `lib/api` или `modules/*/api`.
- Permissions проверяются на frontend для UX, но enforced на backend/RLS.
- Все строки через `t(key)`.
- Assets подключаются через manifest/asset registry, а не хаотичными путями.

## 7. Данные и realtime

Realtime нужен для:

- чатов;
- уведомлений;
- присутствия online/offline;
- статуса событий;
- модераторской очереди future-ready.

Realtime не должен заменять persistent source of truth. PostgreSQL остаётся основным источником.

## 8. Offline / PWA future-ready

На MVP допускается online-first, но архитектура должна не мешать:

- кешированию assets;
- push subscriptions;
- offline empty states;
- повторной отправке действий после восстановления сети.

## 9. Масштабирование

Система должна быть готова к:

- новым языкам;
- новым ролям;
- нескольким организациям/workspaces;
- платным тарифам;
- white-label/брендированию future-ready;
- мобильному приложению.

## 10. Definition of Done для архитектурного слоя

- Создана стабильная структура папок.
- Есть routing и layout shells.
- Есть providers.
- Есть i18n и fallback.
- Есть shared UI components.
- Есть mock data layer или backend adapter layer.
- Есть страницы-заглушки всех ключевых модулей.
- Нет хардкодных пользовательских строк.
- Нет inline layout hacks.
