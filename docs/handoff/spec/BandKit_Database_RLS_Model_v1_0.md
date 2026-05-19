# BandKit Database & RLS Model v1.0

## 1. Назначение

Документ фиксирует предварительную модель данных, связи и принципы RLS/permission enforcement до начала кода. Это не финальная SQL-миграция, а обязательный проектный контракт.

## 2. Основные принципы

- Backend/RLS — главный источник безопасности.
- Frontend permissions нужны только для UX.
- Каждая запись должна иметь owner/workspace context, где применимо.
- Все sensitive actions должны попадать в audit log.
- Soft delete предпочтительнее физического удаления для социальных данных.
- Модерация не должна давать произвольный доступ к личной переписке без основания.

## 3. Роли верхнего уровня

```txt
guest
user
verified_user
workspace_admin
band_admin
event_admin
moderator
admin
super_admin
service_role
```

## 4. Таблицы MVP/Future-ready

### 4.1 Auth-linked profile

#### `profiles`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | equals auth user id or linked id |
| display_name | text | публичное имя |
| handle | text unique | URL handle |
| avatar_asset_id | uuid nullable | user uploaded avatar |
| cover_asset_id | uuid nullable | user uploaded cover |
| bio | text nullable | описание |
| primary_role | text | musician/teacher/studio/etc |
| city | text nullable | optional |
| country | text nullable | optional |
| locale | text nullable | preferred language |
| timezone | text nullable | IANA timezone |
| is_verified_email | boolean | denormalized/auth sync |
| is_verified_phone | boolean | denormalized/auth sync |
| is_onboarding_complete | boolean | route guard |
| reputation_score | numeric | calculated snapshot |
| status | text | active/limited/suspended/deleted |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

RLS:

- Public can read public-safe profile fields for active profiles.
- User can update own profile fields.
- Admin/moderator can read additional moderation-safe fields by role.
- Suspended/deleted profiles expose only safe placeholder.

### 4.2 User security

#### `user_security_settings`

- user_id;
- two_factor_enabled;
- authenticator_enabled;
- phone_verified_at;
- email_verified_at;
- last_password_change_at;
- risk_level;
- created_at;
- updated_at.

RLS: only owner and security admins.

#### `user_sessions`

Use auth provider if available; otherwise mirror active sessions for UI.

### 4.3 Workspaces / organizations

#### `workspaces`

Используется для организаций, студий, школ, оркестров, будущего multi-tenant режима.

Fields:

- id;
- type: organization/studio/venue/school/orchestra/system;
- name;
- slug;
- owner_profile_id;
- default_locale;
- timezone;
- visibility;
- status;
- created_at;
- updated_at.

#### `workspace_members`

- workspace_id;
- profile_id;
- role;
- status;
- invited_by;
- joined_at.

RLS:

- Members can read workspace internal data depending on role.
- Workspace admins manage members.
- Public reads only visible workspace profile.

### 4.4 Bands / projects

#### `bands`

- id;
- workspace_id nullable;
- name;
- slug;
- type: band/project/orchestra/ensemble;
- genre_tags;
- avatar_asset_id;
- cover_asset_id;
- description_i18n jsonb;
- visibility;
- owner_profile_id;
- status;
- created_at;
- updated_at.

#### `band_members`

- band_id;
- profile_id;
- role: owner/admin/member/session_member/guest;
- instrument;
- status: invited/active/left/removed;
- reliability_snapshot;
- created_at;
- updated_at.

RLS:

- Public sees public bands.
- Members see private band data.
- Band admins manage band.

### 4.5 Events

#### `events`

- id;
- owner_profile_id;
- band_id nullable;
- workspace_id nullable;
- title_i18n jsonb;
- description_i18n jsonb;
- type: rehearsal/concert/session/casting/meeting/other;
- starts_at;
- ends_at;
- timezone;
- location_text;
- visibility;
- status;
- created_at;
- updated_at.

#### `event_participants`

- event_id;
- profile_id;
- role;
- rsvp_status: invited/accepted/tentative/declined/no_show/cancelled;
- cancellation_reason;
- joined_at;
- updated_at.

RLS:

- Public sees public events.
- Participants see private event data.
- Event admins manage participants.

### 4.6 Feed

#### `posts`

- id;
- author_profile_id;
- band_id nullable;
- workspace_id nullable;
- event_id nullable;
- body_i18n jsonb or body text;
- visibility;
- status: active/hidden/removed/under_review;
- link_policy_status;
- created_at;
- updated_at.

#### `post_media`

- post_id;
- asset_id;
- sort_order;
- created_at.

#### `post_likes`

- post_id;
- profile_id;
- created_at.

#### `post_comments`

- id;
- post_id;
- author_profile_id;
- body;
- status;
- created_at;
- updated_at.

RLS:

- Read by visibility and status.
- Author can edit own active posts.
- Moderators can hide/remove through moderation actions.

### 4.7 Chats

#### `chat_rooms`

- id;
- type: dm/group/band/event/support/moderation;
- band_id nullable;
- event_id nullable;
- workspace_id nullable;
- created_by;
- status;
- created_at;
- updated_at.

#### `chat_room_members`

- room_id;
- profile_id;
- role;
- status;
- last_read_at;
- muted_until;
- joined_at.

#### `chat_messages`

- id;
- room_id;
- sender_profile_id;
- body;
- has_blocked_link boolean;
- status: active/hidden/removed/flagged;
- created_at;
- updated_at.

RLS:

- Only room members can read messages.
- Sender can edit/delete within time window if allowed.
- Moderators cannot read all private chats by default; access only through complaint escalation policy.

### 4.8 Documents

#### `documents`

- id;
- owner_profile_id;
- band_id nullable;
- event_id nullable;
- workspace_id nullable;
- type: contract/rider/setlist/invite/tech_sheet/other;
- title_i18n jsonb;
- status;
- current_version_id;
- visibility;
- created_at;
- updated_at.

#### `document_versions`

- id;
- document_id;
- version_number;
- content_json;
- pdf_asset_id nullable;
- created_by;
- created_at.

#### `document_permissions`

- document_id;
- profile_id or role;
- permission: read/comment/edit/admin;
- created_at.

### 4.9 Assets / media

#### `assets`

- id;
- owner_profile_id;
- workspace_id nullable;
- storage_bucket;
- storage_path;
- mime_type;
- size_bytes;
- width;
- height;
- alpha_channel boolean nullable;
- moderation_status;
- created_at.

RLS:

- Read based on parent object visibility.
- Write by owner/allowed context.
- Never expose raw private storage path without signed URL.

### 4.10 Complaints / moderation

#### `complaints`

- id;
- reporter_profile_id;
- target_type;
- target_id;
- category;
- description;
- status: new/in_review/action_taken/rejected/closed;
- priority;
- assigned_moderator_id;
- created_at;
- updated_at.

#### `moderation_actions`

- id;
- moderator_profile_id;
- complaint_id nullable;
- target_type;
- target_id;
- action_type;
- reason_code;
- note;
- created_at.

#### `audit_logs`

- id;
- actor_profile_id nullable;
- actor_role;
- action;
- entity_type;
- entity_id;
- metadata jsonb;
- ip_hash nullable;
- user_agent_hash nullable;
- created_at.

### 4.11 Reputation

#### `reputation_events`

- id;
- profile_id or band_id;
- source_type: event/no_show/review/cancellation/dispute/moderation;
- score_delta;
- reason;
- related_entity_type;
- related_entity_id;
- created_at.

#### `reviews`

- id;
- reviewer_profile_id;
- target_type;
- target_id;
- rating;
- text;
- status;
- created_at.

RLS:

- Prevent self-review.
- Prevent review spam.
- Public sees approved aggregate.

### 4.12 Notifications

#### `notification_events`

- id;
- recipient_profile_id;
- type;
- payload jsonb;
- locale_snapshot;
- read_at;
- created_at.

#### `push_subscriptions`

- id;
- profile_id;
- endpoint_hash;
- subscription_json encrypted/secured;
- device_label;
- status;
- created_at;
- updated_at.

### 4.13 Localization

#### `localization_keys` future-ready

- key;
- namespace;
- description;
- status.

#### `localization_values` future-ready

- key;
- locale;
- value;
- status: draft/reviewed/approved;
- updated_by;
- updated_at.

MVP может использовать JSON-файлы, но структура должна позволять перейти к админке переводов.

## 5. RLS policy principles

### 5.1 Read policies

- Public content читается всеми.
- Private content читается только участниками/владельцами.
- Hidden/removed content не читается обычными пользователями.
- Moderation read access ограничен очередью/назначением/ролью.

### 5.2 Write policies

- Пользователь создаёт записи только от своего имени.
- Нельзя подставить чужой `profile_id`.
- Админ группы управляет только своей группой.
- Event admin управляет только своим event.
- Moderator actions идут через отдельные функции, не прямым update user content.

### 5.3 Update policies

- Owner может редактировать свои записи до блокировки/архивации.
- Модератор не редактирует пользовательский текст, а скрывает/помечает/удаляет через moderation action.
- Audit log immutable.

### 5.4 Delete policies

- Soft delete для user-generated content.
- Hard delete только для service/admin maintenance и юридических требований.

## 6. Индексы

Обязательные индексы:

- `profiles(handle)` unique;
- `bands(slug)` unique;
- `events(starts_at)`;
- `posts(created_at desc)`;
- `chat_messages(room_id, created_at desc)`;
- `chat_room_members(profile_id, room_id)`;
- `complaints(status, priority, created_at)`;
- `notification_events(recipient_profile_id, read_at, created_at desc)`;
- full-text/search indexes future-ready.

## 7. Функции/security definer

Часть операций лучше делать через backend functions:

- create complaint;
- apply moderation action;
- calculate reputation snapshot;
- invite member;
- accept invitation;
- create DM safely;
- send notification event;
- update read receipts;
- validate link policy.

## 8. Definition of Done

Перед реальным backend кодом должны быть подготовлены:

- SQL schema draft;
- RLS draft;
- seed roles;
- test users;
- RLS test cases;
- migration naming convention;
- local development setup.
