# BandKit — ТЗ v1.1


## История версии

- **v1.0** — стартовое общее ТЗ, UI Kit и asset pack.
- **v1.1** — локализация/i18n встроена в основное ТЗ, добавлены требования к языковым пакетам, locale-aware форматам, language-neutral assets и fallback-логике переводов.


## 0. Утверждённые визуальные правила

- Основной бренд для текущих макетов и asset pack: **BandKit**.
- Резервные/исторические рабочие варианты: GigKit / MusicHub.
- Названия MUSO/Muzo/MusicApp и любые случайно сгенерированные бренды не используются.
- Стиль: **dark professional theme / Professional Music Network / Social SaaS**.
- Иконки и аватары: **квадратные со скруглением**, не круглые.
- Акценты: фиолетовый / синий / циан.
- Визуальный язык: professional music SaaS / backstage / studio / workspace.

## 1. Продуктовая идея

BandKit — web-first социально-рабочая платформа для музыкальной индустрии.

Платформа совмещает:
1. социальную сеть для музыкантов;
2. CRM/ERP для музыкального коллектива;
3. marketplace сессионных музыкантов;
4. каталог студий звукозаписи;
5. планировщик репетиций, концертов, студийных сессий и проектов;
6. мастер райдеров, stage plot, офферов, сет-листов и документов;
7. систему доверия, репутации, жалоб и модерации;
8. web-first рабочий кабинет с мобильным быстрым доступом.

Главный принцип:
- Web — рабочий кабинет и центр управления.
- Mobile — быстрый доступ, коммуникация, уведомления и работа на ходу.

## 2. Пользователи, роли и сущности

Пользователь может иметь несколько контекстных ролей:
- музыкант;
- директор коллектива;
- администратор;
- дирижёр;
- менеджер / букинг;
- звукорежиссёр;
- продюсер;
- представитель студии;
- сессионный музыкант;
- приглашённый участник проекта;
- владелец или сотрудник организации;
- модератор или администратор платформы.

Обязательное разделение:
- Account — логин, email, телефон, 2FA, security;
- Profile — публичный/профессиональный профиль;
- Membership — участие в группе, проекте, студии или событии;
- Workspace — коллективная рабочая сущность;
- Actor Context — от чьего имени выполняется действие: личный профиль, группа, проект, студия, организация.

Также разделять:
- display name;
- stage name;
- legal name;
- public brand name;
- legal entity name для студий/организаций.

## 3. Workspace-модель

Все коллективные сущности строятся вокруг workspace:
- группа;
- оркестр;
- проект;
- студия;
- организация;
- агентство;
- школа / преподавательский проект.

Workspace имеет:
- владельца;
- co-owner/admin roles;
- участников;
- роли и permissions;
- тариф и лимиты;
- файлы;
- чаты;
- события;
- документы;
- audit log;
- privacy settings;
- moderation state;
- billing context.

Правила:
- нельзя удалить последнего владельца workspace без передачи прав;
- ownership transfer требует step-up authentication и audit log;
- shared login запрещён;
- workspace может быть active, pending_verification, restricted, frozen, suspended, archived, deleted;
- workspace поддерживает internal notes, templates, scoped chats, staff roles и permission presets;
- студийный workspace в будущем поддерживает rooms/resources, staff schedule, booking buffer и double booking protection.

## 4. Подписочная модель

### Free / Basic
- регистрация;
- личный профиль;
- роли, инструменты, город, жанры, доступность;
- социальная структура;
- приглашения;
- участие в группах/проектах;
- личный календарь;
- личная стена;
- базовое портфолио;
- сообщения и чаты в рамках доступов;
- базовые уведомления.

### Pro / Manager
- создание и управление группой/оркестром/проектом;
- роли и права;
- массовые приглашения;
- календарь группы;
- чаты коллектива и событий;
- файлы;
- база песен;
- сет-листы;
- райдер;
- stage plot;
- офферы;
- PDF экспорт;
- шаблоны;
- задачи;
- дедлайны;
- базовые финансы.

### Studio / Organization
- карточка студии/организации;
- услуги;
- календарь слотов;
- заявки на запись;
- приглашение музыкантов;
- студийные проекты;
- чаты;
- файлы;
- офферы;
- публичная страница;
- рейтинг и отзывы;
- расширенная видимость.

### Team / Workspace
- несколько администраторов;
- расширенные права;
- несколько составов;
- проекты;
- архив файлов;
- история изменений;
- аналитика;
- брендированные документы;
- экспорт;
- интеграции.

Доступ к платным функциям рассчитывается через feature limits, а не через прямые проверки `plan === pro`.

Billing должен поддерживать:
- plans;
- subscriptions;
- invoices;
- payment events;
- feature limits;
- billing customer;
- refunds/chargeback workflow;
- region-based availability;
- future legal entity profiles for studios/organizations.

## 5. Социальная стена

Стена/лента поддерживает:
- текстовые посты;
- фото;
- новости;
- объявления о поиске музыкантов;
- свободные даты;
- новости проектов;
- внутренние упоминания;
- внутренние ссылки;
- лайки;
- комментарии;
- ответы;
- репосты;
- избранное;
- жалобы.

В MVP нет внутреннего аудио/видео-хостинга на стене. Внешние ссылки запрещены по умолчанию.

Стена должна учитывать:
- privacy settings;
- moderation status;
- report flow;
- link guard;
- mention permissions;
- no-access / removed / hidden / archived states;
- SEO/OG только для публичных разрешённых страниц.

## 6. Портфолио

Портфолио — профессиональная витрина пользователя.

Разделы:
- презентационные фото;
- видео-примеры;
- аудио-примеры;
- резюме;
- биография;
- инструменты;
- жанры;
- опыт;
- образование;
- проекты;
- концертный опыт;
- студийный опыт;
- контакты, если явно открыты;
- статус доступности.

Портфолио должно учитывать:
- structured instruments / genres / skills taxonomy;
- primary/secondary instruments;
- skill level;
- stage name / display name / legal name separation;
- controlled contact reveal;
- media moderation;
- защиту от контактного обхода через картинки, QR и текст.

## 7. Регистрация, безопасность и 2FA

Способы входа:
- email + password;
- Google Account;
- Apple ID;
- magic link как дополнительный вариант.

Обязательные подтверждения:
- email_verified = true;
- phone_verified = true.

Состояния доступа:
- verification_only;
- limited_social_preview;
- free_basic;
- trusted_user.

2FA:
- TOTP;
- Google Authenticator;
- Microsoft Authenticator;
- Authy;
- 1Password;
- Bitwarden;
- любые TOTP-compatible apps.

2FA обязательна для:
- владельцев workspace;
- администраторов;
- студий/организаций;
- платных управленческих аккаунтов;
- super-admin;
- критичных действий.

Recovery codes:
- показываются один раз;
- одноразовые;
- хранятся только в хешированном виде;
- имеют статусы used/unused/revoked;
- пересоздание только через step-up authentication.

Security Center:
- email / phone verification;
- 2FA status;
- active sessions;
- trusted devices;
- recovery codes;
- recent security events;
- force logout all sessions;
- suspicious login / risk challenge flow.

## 8. Чаты и E2EE

Типы чатов:
1. личные приватные чаты — E2EE by default;
2. приватные групповые чаты — архитектурная подготовка к E2EE;
3. workspace-чаты;
4. проектные чаты;
5. event-scoped chats;
6. системные события отдельно от приватных сообщений.

E2EE:
- сервер хранит только зашифрованный payload;
- сервер не читает открытый текст;
- жалоба возможна через добровольную передачу пользователем evidence-фрагмента.

Чаты должны поддерживать:
- read status;
- delivery status;
- mute;
- quiet hours;
- scoped access;
- external link blocking;
- report message;
- system timeline events отдельно от user text;
- future push/web push delivery.

## 9. Link Guard

По умолчанию внешние ссылки запрещены в:
- личных сообщениях;
- групповых чатах;
- комментариях;
- постах;
- описаниях;
- портфолио;
- приглашениях;
- вакансиях.

Блокируются:
- http/https;
- www;
- домены;
- сокращатели;
- ссылки на мессенджеры;
- облака;
- оплату;
- формы;
- обходы вида `example dot com`, `точка ру`, QR-коды и контактный обход.

Разрешены внутренние ссылки:
- профиль;
- группа;
- проект;
- студия;
- событие;
- пост;
- портфолио;
- файл внутри workspace;
- @упоминания.

Нужен internal linking picker.

Link Guard должен иметь:
- logs;
- risk type;
- action;
- repeat count;
- trust score;
- whitelist через админку;
- объяснение блокировки пользователю;
- false positive flow.

## 10. Репутация и trust

Рейтинг показывает не популярность, а рабочую надёжность.

Trust level:
- low;
- normal;
- trusted;
- verified;
- restricted;
- banned.

Метрики:
- надёжность;
- пунктуальность;
- подтверждение участия;
- неявки;
- отмены в последний момент;
- отзывы;
- завершённые проекты;
- рекомендации.

Защита:
- отзыв только после реального события;
- жалоба влияет после подтверждения;
- есть уважительная причина;
- есть апелляция;
- массовые негативные оценки не должны уничтожать рейтинг;
- лайки/подписчики/популярность не повышают reliability rating;
- отзывы от связанных/новых/подозрительных аккаунтов имеют пониженный вес или уходят на review;
- админ не меняет рейтинг вручную без moderation case, reason и audit log.

## 11. События, условия участия и календарь

Событие должно поддерживать:
- дату;
- место;
- timezone;
- роли/слоты;
- участников;
- общие условия;
- индивидуальные условия;
- гонорар;
- порядок оплаты;
- предоплату;
- условия отмены;
- райдер;
- setlist;
- stage plot;
- read receipts;
- status lifecycle;
- timeline;
- completion flow.

Кнопки:
- Принять условия;
- Отклонить;
- Запросить изменения.

Изменение существенных условий создаёт новую версию и требует повторного подтверждения.

Календарь:
- timezone;
- DST-safe recurrence;
- busy-only режим;
- personal/workspace/project/event calendars;
- conflict detection;
- future iCal/Google/Apple/Outlook sync.

Дополнительно:
- события имеют required roles/slots;
- участник назначается на конкретную роль/слот;
- double booking protection обязателен для участников, ресурсов и студийных слотов;
- timezone события, создателя и пользователя учитываются при отображении;
- recurring events нельзя считать простым добавлением 24 часов.

## 12. Replacement flow, no-show и completion flow

Replacement flow:
- участник отменил;
- указана структурированная причина;
- нужна замена;
- найден новый музыкант;
- новая роль/слот назначена;
- условия приняты;
- история сохранена.

No-show фиксируется только если:
- участие было подтверждено;
- событие состоялось;
- есть evidence или подтверждение;
- есть возможность appeal;
- есть moderation review для спорных случаев.

Completion flow:
- событие состоялось / отменено / перенесено;
- участник пришёл / не пришёл / опоздал;
- оплата выполнена / ожидается / спорная;
- отзывы и рейтинговые действия доступны только после completion flow;
- спорные случаи переводятся в moderation case.

## 13. Документы

Документы:
- rider;
- stage plot;
- offer;
- setlist;
- terms;
- PDF;
- studio booking terms;
- invoices/acts future.

Требования:
- structured documents;
- versioning;
- templates;
- immutable snapshots;
- PDF из конкретной версии;
- server-side PDF generation для рабочих/юридически значимых документов;
- watermark/metadata: document id, version, generated_at, workspace id;
- разные права на просмотр, редактирование, экспорт и удаление;
- snapshot фиксируется при принятии условий, отправке оффера, экспорте PDF и открытии dispute.

## 14. Файлы и медиа

Файлы:
- owner;
- workspace context;
- ACL;
- classification;
- audit log;
- MIME validation;
- size limits;
- antivirus/scanning future;
- signed URLs;
- upload lifecycle.

Upload lifecycle:
- initiated;
- uploaded;
- scanning;
- ready;
- rejected;
- deleted;
- orphaned.

Медиа:
- moderation status;
- thumbnail;
- preview;
- optimized format;
- CDN;
- lazy loading;
- future OCR/QR/contact bypass detection.

Правила:
- исполняемые и опасные типы файлов запрещены;
- имена файлов нормализуются;
- приватные файлы выдаются только через signed URLs или proxy с permission check;
- orphaned uploads очищаются background job.

## 15. Модерация и админка

Уровни:
- Super Admin;
- Platform Moderator;
- Trust & Safety Moderator;
- Billing Admin;
- Support Agent;
- Workspace Owner;
- Workspace Admin;
- Group/Project Moderator;
- Studio/Organization Admin.

Admin Console:
- Dashboard;
- Users;
- Profiles;
- Groups;
- Projects;
- Studios;
- Organizations;
- Events;
- Posts;
- Comments;
- Chat Reports;
- Files;
- Complaints;
- Moderation Cases;
- Link Guard Logs;
- Trust & Reputation;
- Verification;
- Payments;
- Subscriptions;
- Audit Log;
- Admin Actions;
- Appeals;
- System Settings.

Модерация работает через moderation cases:
- complaints;
- evidence;
- admin notes;
- related events;
- related users/workspaces;
- decision;
- appeal;
- audit trail.

Granular restrictions:
- can_send_messages;
- can_create_posts;
- can_comment;
- can_invite_users;
- can_upload_files;
- can_create_workspace;
- can_appear_in_search;
- requires_manual_review.

Two-person approval:
- permanent ban;
- ownership transfer;
- trust reset;
- large refund;
- mass delete;
- studio verification revoke;
- super admin role grant.

Дополнительно:
- admin reason обязателен для опасных действий;
- просмотр sensitive/moderation/payment данных логируется;
- break-glass доступ только временно, с причиной и review;
- support view-as-user только read-only;
- conflict-of-interest блокирует рассмотрение кейса связанным модератором.

## 16. Audit log

Логировать:
- создание события;
- изменение времени/места/условий;
- приглашения;
- принятие/отклонение;
- отмены;
- загрузки файлов;
- изменение прав;
- подтверждение условий;
- админские действия;
- просмотр sensitive/moderation/payment данных админами;
- security events;
- billing events.

Audit/evidence/payment/terms acceptance — append-only/immutable.

Audit log содержит:
- actor;
- target;
- action;
- reason;
- before/after;
- timestamp;
- IP/device;
- linked complaint/case;
- duration;
- internal comment для опасных действий.

## 17. Локализация, i18n и языковые пакеты

BandKit должен проектироваться как мультиязычная система, а не как приложение с русскими строками, которые потом вручную заменяются. Все пользовательские, системные, административные и уведомительные тексты должны храниться через ключи локализации.

### 17.1. MVP-языки

Базовые языки MVP:
- **RU** — основной стартовый язык;
- **EN** — обязательный второй язык для масштабирования.

Архитектура должна позволять добавлять **FI / DE / ES / FR / IT / PL / UK / KK** и другие языки без переписывания интерфейса, backend-логики и шаблонов уведомлений.

### 17.2. Главное правило разработки

Запрещено жёстко зашивать пользовательские строки в:
- UI;
- backend;
- push;
- email;
- SMS;
- PDF-экспорты;
- шаблоны документов;
- модераторские и админские действия.

В коде используются ключи вида:

```ts
t("module.key")
```

Переводы хранятся в структуре:

```text
/locales
  /ru
    common.json
    auth.json
    profile.json
    feed.json
    events.json
    chats.json
    documents.json
    marketplace.json
    admin.json
    errors.json
  /en
    common.json
    auth.json
    profile.json
    feed.json
    events.json
    chats.json
    documents.json
    marketplace.json
    admin.json
    errors.json
```

### 17.3. Обязательные зоны локализации

Локализации подлежат:
- весь интерфейс: кнопки, заголовки, меню, вкладки, подсказки;
- onboarding;
- регистрация и авторизация;
- подтверждение email и телефона;
- 2FA;
- роли пользователей и workspace-роли;
- статусы заявок, событий, участников и документов;
- уведомления внутри приложения;
- push, email и SMS;
- ошибки и предупреждения;
- empty states;
- tooltips;
- модерация;
- жалобы;
- причины блокировок и ограничений;
- админка и модераторская панель;
- PDF-экспорты;
- документы, райдеры, договоры, приглашения;
- marketplace и поиск.

### 17.4. Fallback-логика языка

Приоритет языка:
1. язык, выбранный пользователем вручную;
2. язык устройства или браузера;
3. язык workspace / организации;
4. **EN**;
5. **RU**.

В production запрещено показывать пользователю технические ключи локализации. В dev-режиме технический ключ допустим как диагностика отсутствующего перевода.

### 17.5. Дизайн-ограничения для мультиязычного UI

Интерфейс должен выдерживать длинные строки на других языках. Запрещено проектировать кнопки, табы, карточки и модалки только под русскую длину текста.

UI должен учитывать:
- разную длину строк в разных языках;
- переносы и адаптивную ширину;
- tooltip для безопасного сокращения;
- отсутствие текста внутри иконок;
- отсутствие критичных слов внутри растровых картинок;
- корректную работу с длинными названиями групп, событий, площадок и организаций.

### 17.6. Правила для production assets

Production assets должны быть **language-neutral**:
- иконки без локализуемого текста;
- иллюстрации без русских/английских UI-надписей;
- empty states — отдельно картинка, отдельно текст из `/locales`;
- статусы и объяснения выводятся интерфейсом через языковые пакеты;
- SVG/PNG/WebP не должны содержать видимых слов, кроме утверждённого брендового логотипа BandKit.

Если текст внутри изображения неизбежен, такой ассет кладётся отдельно:

```text
/assets/localized/{lang}/...
```

И фиксируется в отдельном localized manifest.

### 17.7. Региональные форматы

Система должна поддерживать locale-aware форматирование:
- дат;
- времени;
- 12/24-часового режима;
- чисел;
- валют;
- часовых поясов;
- единиц измерения.

Для событий, концертов, репетиций, дедлайнов, платежей, бронирований и расписаний это критическая часть бизнес-логики.

### 17.8. Workspace-level язык

Workspace должен иметь собственный язык по умолчанию. Пользователь может видеть интерфейс на одном языке, а workspace, документы, уведомления и публичные страницы могут использовать другой язык.

Пример:
- пользовательский UI — RU;
- международный проект — EN;
- студия в Финляндии — FI/EN;
- публичная страница события — RU + EN.

### 17.9. Мультиязычные публичные сущности

Для публичных профилей и сущностей нужно предусмотреть мультиязычные поля или расширяемую структуру переводов:

```json
{
  "title": {
    "ru": "Репетиция перед концертом",
    "en": "Concert rehearsal"
  },
  "description": {
    "ru": "Описание на русском",
    "en": "English description"
  }
}
```

Это применяется к:
- публичным профилям музыкантов;
- группам и проектам;
- событиям;
- объявлениям;
- вакансиям;
- карточкам студий;
- площадкам;
- райдерам и публичным документам.

### 17.10. Push, email и SMS

Все уведомления должны собираться через шаблоны локализации, а не через статичные строки в backend.

Пример:

```json
{
  "notifications": {
    "event_invite": "{{sender}} invited you to {{event}}",
    "chat_message": "New message from {{sender}}",
    "complaint_status_changed": "Your complaint status has changed"
  }
}
```

Push может приходить вне активного интерфейса, поэтому язык уведомления должен определяться сервером с учётом user locale и fallback-правил.

### 17.11. Админка переводов, future stage

На следующем этапе заложить админский инструмент переводов:
- поиск ключей;
- список отсутствующих переводов;
- статус `draft / reviewed / approved`;
- импорт/экспорт JSON;
- история изменений;
- кто изменил перевод;
- дата изменения;
- защита системных ключей от случайного удаления.

## 18. Архитектура кода

Проект строится по feature-based/domain-based архитектуре.

Основные домены:
- auth;
- profiles;
- social-feed;
- portfolio;
- groups;
- projects;
- studios;
- calendar;
- events;
- invitations;
- chats;
- notifications;
- reputation;
- moderation;
- billing;
- files;
- riders;
- offers;
- admin.

Правила:
- UI Kit отделён от бизнес-логики;
- все стили через design tokens;
- inline styles запрещены;
- уникальные костыли запрещены;
- бизнес-логика не хранится в React-компонентах;
- права проверяются на сервере;
- все формы валидируются через схемы;
- API имеет единый формат ответа и error codes;
- модули общаются через публичный API, events или backend;
- прямые импорты внутренних файлов чужого модуля запрещены;
- каждый модуль имеет публичный index.ts;
- shared/ui не знает о бизнес-доменах;
- pages остаются тонкими;
- notifications, audit, reputation, billing, link guard и moderation — отдельные модули;
- все изменения БД только через миграции;
- критичные permissions/RLS/flows покрываются тестами;
- Storybook/UI sandbox обязателен.

## 19. UI Kit v1.0

Утверждено:
- Brand / App Identity v1.0;
- Navigation Icon Set v1.0;
- Role Icon Set v1.0;
- Trust / Security Badges v1.0;
- Empty States & Feature Illustrations v1.0;
- Document / File Icons v1.0.

Desktop:
- left sidebar;
- main workspace;
- right context panel.

Mobile:
- bottom navigation;
- cards;
- bottom sheets;
- sticky action bar.

## 20. Платформенные предохранители

Обязательные меры:
- multi-tenant isolation;
- data classification;
- data minimization;
- PII protection;
- legal/moderation hold;
- identity history;
- trusted devices;
- step-up authentication;
- session hijacking protection;
- scoped permissions;
- financial privacy;
- confidential/NDA projects;
- immutable snapshots;
- outbox pattern;
- idempotent jobs;
- dead letter queue;
- API versioning;
- feature rollout;
- kill switch;
- maintenance mode;
- graceful degradation;
- SMS pumping protection;
- email deliverability tracking;
- phone/email normalization;
- search privacy;
- DTO separation for public/private/admin;
- logging redaction;
- secrets rotation;
- encryption at rest;
- adaptive captcha/risk challenges;
- signed URLs;
- pagination/limit caps;
- event timeline;
- completion flow;
- security center;
- anti-scraping protection;
- safe deep links / universal links future;
- file security and upload lifecycle;
- rate limits by user/IP/device/workspace/trust level;
- admin break-glass access with audit;
- support read-only view-as-user mode.

## 21. Public / Private / Admin разделение

Архитектурно разделить:
- public marketing site;
- public profiles/pages;
- authenticated app;
- admin console.

Правила:
- public API не отдаёт private/admin поля;
- authenticated app не использует admin DTO;
- admin console имеет отдельные permissions, audit log и reason-required действия;
- sensitive поля проходят redaction в логах.

Public pages:
- SEO/meta/OG;
- noindex для приватных/restricted страниц;
- claim ownership;
- reserved names и reclaim;
- anti-scraping limits;
- privacy-aware search indexing.

## 22. Asset Pack и UI Kit

Визуальное правило:
- бренд на макетах: BandKit;
- стиль: dark professional theme;
- иконки: rounded-square, линейные, не круглые;
- акцент: фиолетовый / синий / циан;
- визуальный язык: professional music SaaS / backstage / studio / workspace.

Утверждённые наборы:
1. Brand / App Identity.
2. Navigation Icon Set.
3. Role Icon Set.
4. Trust / Security Badges.
5. Empty States & Feature Illustrations.
6. Document / File Icons.


## 23. Interface Layout Contract / контракт разметки интерфейса

Для BandKit фиксируется отдельный обязательный документ `spec/BandKit_Interface_Layout_Contract_v1_0.md`.

Назначение документа: описать утверждённую разметку интерфейса, расположение основных зон, поведение desktop/mobile shell, карточек, списков, таблиц, модалок, drawers/sheets, sticky actions, right rail, bottom navigation, empty/loading/error states и anti-drift правила разработки.

Цель: при реализации экраны должны вставать в утверждённую сетку сразу, без серии мелких правок вида «подровнять», «сдвинуть на пару пикселей», «кнопка прыгает», «блок не той ширины».

Обязательные требования:

1. Все экраны собираются из утверждённых layout patterns, а не верстаются заново на глаз.
2. Основные зоны приложения фиксированы: app shell, left nav rail, top bar, main content, right context rail, mobile bottom navigation.
3. Primary actions должны находиться в стандартных местах и не прыгать между похожими экранами.
4. Mobile layout проектируется как отдельная одно-колоночная структура, а не как сжатый desktop.
5. Все формы, wizard flows, модалки, drawers и sheets используют единый footer/header/action pattern.
6. Все loading/empty/error/no-access/restricted states должны повторять реальную структуру экрана и не ломать layout.
7. Запрещены inline styles, одноразовые CSS-костыли, уникальные pixel shifts и layout fixes под отдельный экран.
8. Если требуется новое расположение или новый pattern, сначала обновляется Layout Contract/UI Kit, затем компонентная система, и только после этого экран.

Машиночитаемая версия базовых правил хранится в `metadata/layout_contract.json`.


## 24. Production asset archive

Production archive должен содержать не большие preview boards, а отдельные файлы, готовые к внедрению:
- SVG как основной source для UI;
- PNG/WebP raster fallback;
- прозрачный фон и alpha channel для PNG/WebP, где это применимо;
- favicon и PWA app icons;
- brand assets;
- navigation icons;
- role icons;
- trust/security badges;
- document/file icons;
- empty states;
- feature illustrations;
- default avatars;
- default covers;
- fallback thumbnails;
- manifests;
- QA reports;
- README;
- design tokens;
- starter locale packs.

Обязательное правило: production assets должны быть language-neutral. Все локализуемые подписи и объяснения должны выводиться интерфейсом через `/locales`, а не быть встроенными в картинки.

Текущая production-структура:

```text
brand/
favicon/
app-icons/
navigation/
roles/
badges/
documents/
empty-states/
feature-illustrations/
fallbacks/avatars/
fallbacks/covers/
fallbacks/thumbnails/
locales/
og/
spec/
metadata/
```

Основное ТЗ хранится в `spec/BandKit_TZ_v1_2.md`. Контракт разметки хранится в `spec/BandKit_Interface_Layout_Contract_v1_0.md`. Отдельные addendum-файлы не должны использоваться как источник истины после интеграции в основной документ.


## 25. Правила разработки без костылей

1. Сначала design tokens, потом компоненты, потом layout patterns, потом экраны.
2. Никаких inline styles.
3. Никаких уникальных CSS-костылей под один экран.
4. Одинаковые действия используют одинаковые компоненты.
5. Mobile layout проектируется отдельно, а не как сжатый desktop.
6. Business logic не хранится в UI-компонентах.
7. Любой временный workaround должен иметь TODO-ID и задачу.
8. Новый UI-компонент добавляется только через UI Kit.
9. Нельзя напрямую импортировать внутренние файлы чужого модуля.
10. Frontend не является источником истины для прав доступа.
11. UI должен поддерживать loading, empty, error, no-access, restricted и archived states.
12. Accessibility: contrast, focus states, keyboard navigation, aria-labels, touch targets.

## 26. Финальная фиксация v1.2

BandKit v1.2 фиксируется как стартовая база для дальнейшей разработки и подготовки первого технического прототипа.

Всё, что попадает в разработку, должно соответствовать:
- утверждённой визуальной системе;
- модульной архитектуре;
- security-first подходу;
- workspace/actor-context модели;
- строгой системе прав;
- требованиям модерации и audit log;
- подготовленному production asset pack;
- встроенной системе локализации и языковых пакетов;
- обязательному Interface Layout Contract.
