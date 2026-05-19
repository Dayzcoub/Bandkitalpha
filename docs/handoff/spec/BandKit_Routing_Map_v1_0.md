# BandKit Routing Map v1.0

## 1. Назначение

Карта маршрутов фиксирует экраны, доступы, layout shell и базовые состояния. Этот документ нужен, чтобы кнопки, вкладки и переходы не додумывались во время разработки.

## 2. Layout shells

### 2.1 Public Shell

Для публичных страниц, landing, публичных профилей.

### 2.2 Auth Shell

Для входа, регистрации, подтверждения email/phone, 2FA.

### 2.3 App Shell

Основное приложение после входа:

- desktop: side navigation + content + optional right rail;
- mobile: top bar + content + bottom navigation.

### 2.4 Admin Shell

Для админки и модерации. Не смешивать с обычным App Shell.

## 3. Общие состояния для каждого route

Каждый route должен иметь:

- loading;
- empty;
- error;
- restricted/no access;
- not found;
- offline/retry future-ready;
- long text/i18n stress state.

## 4. Основные маршруты

| Route | Shell | Access | Назначение |
|---|---|---|---|
| `/` | Public/App redirect | guest/user | Landing или redirect в `/feed` |
| `/login` | Auth | guest | Вход |
| `/register` | Auth | guest | Регистрация |
| `/auth/verify-email` | Auth | pending | Подтверждение email |
| `/auth/verify-phone` | Auth | pending | Подтверждение телефона |
| `/auth/2fa` | Auth | pending | Ввод 2FA-кода |
| `/auth/recovery` | Auth | guest | Восстановление доступа |
| `/onboarding` | App minimal | user | Первичная настройка профиля |
| `/feed` | App | user | Лента |
| `/profile/me` | App | user | Мой профиль |
| `/profile/:profileId` | App/Public | user/public | Профиль пользователя/организации |
| `/bands` | App | user | Мои группы/проекты |
| `/bands/new` | App | user | Создание группы |
| `/bands/:bandId` | App/Public | member/public | Страница группы |
| `/bands/:bandId/settings` | App | band_admin | Настройки группы |
| `/events` | App | user | Список событий |
| `/events/new` | App | user | Создание события |
| `/events/:eventId` | App/Public | participant/public | Карточка события |
| `/events/:eventId/settings` | App | event_admin | Настройки события |
| `/chats` | App | user | Список чатов |
| `/chats/:chatId` | App | chat_member | Комната чата |
| `/documents` | App | user | Документы пользователя/workspace |
| `/documents/:documentId` | App | document_reader | Просмотр документа |
| `/marketplace` | App | user | Поиск людей/групп/студий |
| `/notifications` | App | user | Центр уведомлений |
| `/settings` | App | user | Настройки аккаунта |
| `/settings/security` | App | user | 2FA, сессии, безопасность |
| `/settings/i18n` | App | user | Язык и регион |
| `/complaints/new` | App | user | Создание жалобы |
| `/moderation` | Admin | moderator | Очередь модерации |
| `/moderation/complaints/:complaintId` | Admin | moderator | Карточка жалобы |
| `/admin` | Admin | admin | Системная панель |
| `/admin/users` | Admin | admin | Пользователи |
| `/admin/roles` | Admin | super_admin | Роли и доступы |
| `/admin/localization` | Admin | admin | Управление переводами future-ready |
| `/admin/audit` | Admin | admin | Аудит действий |
| `*` | Public/App | any | 404 |

## 5. Navigation map

### 5.1 Main app navigation

Основные пункты:

1. Лента
2. Профиль
3. Группы
4. События
5. Чаты
6. Документы
7. Поиск/Marketplace
8. Уведомления
9. Настройки

На desktop — left nav rail. На mobile — bottom nav только для 4–5 главных пунктов, остальные через меню.

### 5.2 Admin navigation

1. Dashboard
2. Жалобы
3. Пользователи
4. Контент
5. Роли
6. Локализация
7. Audit
8. Security

## 6. Route guards

### 6.1 Guest only

`/login`, `/register`, `/auth/recovery` должны редиректить авторизованного пользователя в `/feed`.

### 6.2 User required

Основной App Shell требует активную сессию.

### 6.3 Onboarding required

Если профиль не заполнен, пользователь после входа попадает в `/onboarding`.

### 6.4 Verification required

Действия, связанные с публикацией, чатом, событиями и marketplace, требуют подтверждённый email и phone.

### 6.5 2FA required

Для админов, модераторов и владельцев организаций 2FA обязательна.

### 6.6 Role required

Admin/moderation routes доступны только по ролям.

## 7. Экранные контракты

### `/feed`

Компоненты:

- FeedComposer;
- FeedFilters;
- PostCard;
- SuggestedConnections;
- EmptyState;
- ReportAction.

### `/profile/:profileId`

Компоненты:

- ProfileHeader;
- Avatar/Cover fallback;
- ProfileStats;
- RoleBadges;
- ReputationBadge;
- ProfileTabs;
- PublicActivityList;
- Contact/Invite actions.

### `/bands/:bandId`

Компоненты:

- BandHeader;
- MembersList;
- EventsPreview;
- DocumentsPreview;
- ChatEntry;
- AdminActionBar if permissions.

### `/events/:eventId`

Компоненты:

- EventHeader;
- DateTimeBlock;
- Participants;
- RSVPPanel;
- EventDocuments;
- EventChatPreview;
- Moderation/Report action.

### `/chats/:chatId`

Компоненты:

- ChatHeader;
- MessageList;
- MessageComposer;
- AttachmentUploader;
- ReportMessageAction;
- RestrictedLinksNotice.

### `/moderation`

Компоненты:

- ModerationQueue;
- Filters;
- PriorityBadge;
- CaseCard;
- AuditTrailPreview.

## 8. 404 / restricted поведение

- 404 не должен раскрывать приватность ресурса.
- Restricted state должен объяснять, что доступа нет, без утечки персональных данных.
- Для удалённого/заблокированного контента показывать безопасную заглушку.

## 9. Definition of Done

- Все route существуют как страницы-заглушки.
- Все route используют правильный shell.
- Route guards работают на mock permissions.
- Каждая страница имеет loading/empty/error/restricted states.
- Навигация не прыгает между экранами.
- Mobile и desktop следуют layout contract.
