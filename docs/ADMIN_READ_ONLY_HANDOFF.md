# BandKit `/admin` read-only handoff

## Текущая точка

Первый платформенный `/admin` read-only контур закрыт и принят визуально.

`/admin` — отдельная операционная консоль владельца платформы. Не смешивать её с админками сущностей:

- `/band/:id/admin`
- `/studio/:id/admin`
- `/org/:id/admin`
- `/event/:id/admin`

`/admin` управляет только платформенным уровнем.

## Принятые страницы

- `/admin`
- `/admin/users`
- `/admin/entities`
- `/admin/reports`
- `/admin/moderation`
- `/admin/trust`
- `/admin/billing`
- `/admin/content`
- `/admin/localization`
- `/admin/notifications`
- `/admin/roles`
- `/admin/settings`
- `/admin/audit`

## Принятые API endpoints

- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/entities`
- `GET /api/v1/admin/reports`
- `GET /api/v1/admin/moderation`
- `GET /api/v1/admin/trust`
- `GET /api/v1/admin/billing`
- `GET /api/v1/admin/content`
- `GET /api/v1/admin/localization`
- `GET /api/v1/admin/notifications`
- `GET /api/v1/admin/roles`
- `GET /api/v1/admin/settings`
- `GET /api/v1/admin/audit`

## Главное правило

Все `/admin` endpoints и экраны сейчас строго read-only.

Нельзя добавлять реальные write-actions без отдельной backend permissions/audit модели.

Запрещены реальные действия:

- блокировки
- возвраты
- смены ролей
- отправки рассылок
- изменения настроек
- включение maintenance
- изменение тарифов
- удаление/скрытие контента
- изменение рейтингов
- доступ к приватным сообщениям

## Frontend архитектура

Основной shell и mock-структуру страниц даёт:

```txt
src/modules/PlatformAdminConsole.ts
```

API-гидрация поверх shell вынесена в bridge-модули:

```txt
src/modules/PlatformAdminReadOnlyDataBridge.ts
src/modules/PlatformAdminBillingReadOnlyBridge.ts
src/modules/PlatformAdminContentReadOnlyBridge.ts
src/modules/PlatformAdminLocalizationReadOnlyBridge.ts
src/modules/PlatformAdminNotificationsReadOnlyBridge.ts
src/modules/PlatformAdminRolesReadOnlyBridge.ts
src/modules/PlatformAdminSettingsReadOnlyBridge.ts
```

Все bridge подключены в:

```txt
src/main.ts
```

## Backend архитектура

Основные admin read-only routes:

```txt
server/src/modules/admin/admin.routes.js
```

Дополнительные read-only routes:

```txt
server/src/modules/admin/billing.routes.js
server/src/modules/admin/content.routes.js
server/src/modules/admin/localization.routes.js
server/src/modules/admin/notifications.routes.js
server/src/modules/admin/settings.routes.js
server/src/modules/admin/staff.routes.js
```

Роутинг подключён в:

```txt
server/src/index.js
```

Backend syntax check обновлён в:

```txt
server/package.json
```

## UX/security правила

Подключённые страницы `/admin` должны показывать бейдж:

```txt
данные из API
```

Если источник ещё не подключён к базе, показывать честное состояние:

```txt
источник не подключён
0 объектов
только чтение
```

Запрещено оставлять кнопки с опасными формулировками:

```txt
Назначить роль
Снять роль
Включить регистрацию
Обязать телефон
Обязать 2FA
Создать черновик
Тестовая отправка
Запланировать
Остановить кампанию
Скрыть
Удалить
Вернуть деньги
```

Вместо этого использовать read-only формулировки:

```txt
Проверить…
Открыть аудит…
Просмотреть…
Предпросмотр…
Экспорт…
Проверить статус…
```

## Последние зафиксированные страницы

### `/admin/roles`

- бейдж `данные из API` есть
- KPI из API
- список ролей строится из API
- `повышенный доступ` русифицирован
- матрица действий безопасная
- опасных `назначить/снять роль` нет

### `/admin/settings`

- бейдж `данные из API` есть
- KPI идут из API
- основной список настроек строится из API
- `Критичные настройки` заменены на read-only операции
- `Безопасные действия` read-only
- нет включения регистрации
- нет переключения maintenance
- нет изменения 2FA
- нет изменения провайдеров
- нет записи конфигурации

## Деплой / проверка на VPS

```bash
cd /opt/Bandkitalpha
sudo scripts/staging-deploy.sh
```

Главный адрес:

```txt
http://141.98.87.9/admin
```

Примеры API-проверок:

```txt
http://141.98.87.9/api/v1/admin/settings
http://141.98.87.9/api/v1/admin/roles
```

## Следующий логичный этап

1. Аккуратная уборка `/admin` после накопления bridge-модулей:
   - проверить дублирующиеся helper-функции
   - возможно вынести общие `escapeHtml`, `kpi`, `badge`, `listRow` в общий util
   - не ломать уже принятый визуал

2. Добавить smoke/API contract checks:
   - все `/api/v1/admin/*` отвечают 200
   - у всех есть `ok: true`, `mode: read_only`, `guardrails`
   - dangerous guardrails остаются `false`

3. Потом переходить к реальным read-only источникам:
   - reports
   - moderation
   - trust
   - notifications
   - content

Сначала только read-only подключение. Без действий записи.

## Стартовая фраза для нового чата

```txt
Продолжаем BandKit. Текущая точка: первый платформенный /admin read-only контур закрыт и принят. /admin — отдельная операционная консоль владельца платформы, не смешиваем с админками сущностей. Все страницы /admin, /admin/users, /admin/entities, /admin/reports, /admin/moderation, /admin/trust, /admin/billing, /admin/content, /admin/localization, /admin/notifications, /admin/roles, /admin/settings, /admin/audit подключены к read-only API или безопасной API-гидрации. Нельзя добавлять реальные write-actions. Начни с аккуратной уборки/рефакторинга bridge-модулей и contract checks, не ломая принятый визуал.
```
