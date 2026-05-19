# BandKit API / Backend Contract v1.0

## 1. Назначение

Документ фиксирует контракты действий между frontend и backend. Если используется Supabase, многие операции могут быть прямыми queries/RPC, но frontend всё равно должен работать через typed adapter layer, а не напрямую размазывать backend по компонентам.

## 2. Общие правила API

- Все ответы имеют предсказуемый формат.
- Ошибки возвращают code, messageKey, details для dev.
- UI показывает локализованный текст через `messageKey`.
- Все write actions требуют auth.
- Sensitive actions требуют verified phone/email и/или 2FA.
- Rate limits enforced на backend.

## 3. Response envelopes

### Success

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "req_..."
  }
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "messageKey": "errors.permissionDenied",
    "details": {}
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

## 4. Auth contracts

### `POST /auth/register`

Input:

```json
{
  "email": "user@example.com",
  "phone": "+0000000000",
  "password": "***",
  "displayName": "Name",
  "locale": "ru"
}
```

Output:

```json
{
  "userId": "uuid",
  "requiresEmailVerification": true,
  "requiresPhoneVerification": true
}
```

### `POST /auth/oauth/start`

Providers: Google, Apple.

### `POST /auth/verify-phone`

Input: code + session.

### `POST /auth/verify-email`

Input: token.

### `POST /auth/2fa/setup`

Returns QR/secret for authenticator app.

### `POST /auth/2fa/verify`

Verifies TOTP code.

### `POST /auth/logout-all`

Requires current password or 2FA for high-risk accounts.

## 5. Profile contracts

### `GET /profiles/me`

Returns current profile with private fields.

### `PATCH /profiles/me`

Updates safe own fields. Cannot update role/admin/security fields.

### `GET /profiles/:id`

Returns public-safe profile.

### `POST /profiles/me/avatar`

Uploads avatar or returns signed upload URL.

### `POST /profiles/me/cover`

Uploads cover or returns signed upload URL.

## 6. Bands contracts

### `GET /bands`

Returns bands where current user is member/admin.

### `POST /bands`

Creates band/project/orchestra.

### `GET /bands/:id`

Returns public/private fields depending on access.

### `PATCH /bands/:id`

Requires band_admin.

### `POST /bands/:id/invitations`

Invite member by profile/email/phone.

### `POST /bands/:id/join-requests`

Creates join request.

### `POST /bands/:id/members/:profileId/role`

Updates member role, admin only.

## 7. Feed contracts

### `GET /feed`

Query:

- cursor;
- filter;
- scope;
- locale.

Returns post cards.

### `POST /posts`

Creates post. Backend validates link policy and content limits.

### `PATCH /posts/:id`

Author only within allowed policy.

### `POST /posts/:id/like`

Idempotent like.

### `DELETE /posts/:id/like`

Unlike.

### `POST /posts/:id/comments`

Creates comment.

### `POST /posts/:id/repost`

Creates repost.

## 8. Events contracts

### `GET /events`

Filters:

- mine;
- bandId;
- type;
- date range.

### `POST /events`

Creates event.

### `GET /events/:id`

Returns event details by access.

### `PATCH /events/:id`

Requires event_admin.

### `POST /events/:id/invitations`

Invite participants.

### `POST /events/:id/rsvp`

Input:

```json
{ "status": "accepted" }
```

### `POST /events/:id/cancel-participation`

Requires reason. May affect reputation according to rules.

## 9. Chats contracts

### `GET /chats`

Returns rooms for current user.

### `POST /chats/dm`

Creates or returns DM room. Backend checks block/safety rules.

### `GET /chats/:roomId/messages`

Cursor pagination.

### `POST /chats/:roomId/messages`

Backend blocks external links in MVP and flags suspicious patterns.

### `POST /chats/:roomId/read`

Updates last_read_at.

### Realtime channels

- `chat_room:{roomId}` for messages;
- `notifications:{profileId}` for notification updates.

## 10. Documents contracts

### `GET /documents`

Returns accessible documents.

### `POST /documents`

Creates document shell.

### `GET /documents/:id`

Returns current version and permissions.

### `POST /documents/:id/versions`

Creates new version.

### `POST /documents/:id/export-pdf`

Returns PDF asset or async job future-ready.

## 11. Complaints / moderation contracts

### `POST /complaints`

Input:

```json
{
  "targetType": "profile|post|comment|message|band|event",
  "targetId": "uuid",
  "category": "spam|fraud|abuse|harassment|copyright|other",
  "description": "text"
}
```

Output: complaint id and status.

### `GET /moderation/complaints`

Moderator only. Filters by status/priority/category.

### `GET /moderation/complaints/:id`

Returns case details according to moderation access policy.

### `POST /moderation/complaints/:id/actions`

Applies action:

- dismiss;
- warn;
- hide_content;
- remove_content;
- limit_account;
- suspend_account;
- escalate.

Always creates audit log.

## 12. Reputation contracts

### `GET /reputation/:targetType/:targetId`

Returns aggregate public reputation.

### `POST /reviews`

Creates review if relation allows it.

### `POST /reputation-events`

Internal/admin only. Prefer backend functions.

## 13. Notifications contracts

### `GET /notifications`

Returns in-app notifications.

### `POST /notifications/:id/read`

Marks read.

### `POST /push/subscribe`

Stores push subscription.

### `POST /push/unsubscribe`

Disables subscription.

## 14. Media contracts

### `POST /assets/upload-url`

Input:

```json
{
  "purpose": "avatar|cover|post_media|document|chat_attachment",
  "mimeType": "image/png",
  "sizeBytes": 12345
}
```

Output: signed upload URL + asset id.

### `POST /assets/:id/confirm-upload`

Confirms upload, starts validation/moderation pipeline.

## 15. Localization contracts

MVP can be static JSON. Future admin API:

- `GET /localization/keys`;
- `PATCH /localization/:locale/:key`;
- `POST /localization/import`;
- `GET /localization/export`.

## 16. Error codes

Minimum codes:

```txt
AUTH_REQUIRED
VERIFICATION_REQUIRED
TWO_FACTOR_REQUIRED
PERMISSION_DENIED
NOT_FOUND
VALIDATION_ERROR
RATE_LIMITED
CONTENT_BLOCKED
LINKS_NOT_ALLOWED
ACCOUNT_LIMITED
ACCOUNT_SUSPENDED
RESOURCE_LOCKED
CONFLICT
SERVER_ERROR
```

## 17. Definition of Done

- Typed API adapter exists.
- UI never calls backend directly from deeply nested components.
- Errors map to localization keys.
- Write actions have optimistic/rollback strategy where appropriate.
- API mocks exist for MVP shell.
