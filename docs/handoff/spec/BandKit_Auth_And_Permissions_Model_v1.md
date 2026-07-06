# BandKit — Auth & Permissions Model v1 (Phase 1a)

## Статус

Проектная спека аутентификации, сессий и авторизации. Пишется **до кода** —
хендофф прямо требует: «Do not implement full registration before the auth model
is designed» и «Do not connect frontend create/update/delete to backend until
auth/permissions are designed».

Опирается на:
- `BandKit_Foundation_Domain_Model_v1.md` — Party/Membership/permissions;
- `BandKit_Security_Engineering_Standard_v1.md` — §1 AuthN, §2 AuthZ, §12 транспорт;
- `BandKit_TZ_v1_2.md` §7 (регистрация/2FA), §15 (роли).

Текущее состояние: таблица `users` (id, display_name, handle, email, phone,
status) без пароля/verified-флагов/2FA/platform_role. Есть заготовка
`server/src/modules/permissions/`. Реального auth нет — greenfield.

## 0. Принципы

1. **Сервер — единственный источник истины для прав.** Frontend-роли
   (`localStorage['bandkit.role']`) — только UX-хинт.
2. **Secure by default** (security §0): новый эндпоинт закрыт, пока явно не открыт.
3. **Маленькими вертикальными срезами.** MVP-срез — email+password+сессия+email-verify;
   остальное (OAuth, phone/SMS, magic link, trusted devices) — швы.
4. **HTTPS/TLS на preview-VPS обязателен до первого реального логина** (security §12).

## 1. Идентичность (из TZ §2 + Foundation)

Строго разделяем:
- **Account** — логин: email/phone, пароль, 2FA, security. Таблица `users` +
  `auth_credentials`.
- **Party (individual)** — актор в доменной модели; человек = individual Party,
  привязанный к `users` (Foundation §2.1).
- **Profile** — публичный/проф. профиль (отдельно, не в auth-слое).
- **Membership** — участие в workspace с контекстной ролью (`entity_membership.role`).
- **Actor Context** — от чьего имени действие (личный профиль / entity).

**Разделение ролей (нельзя смешивать, из handoff):**
`platform_role` ≠ `entity_membership.role` ≠ `support_case_assignment` ≠
`moderation_case_assignment`.
- Platform-scoped: `super_admin, platform_admin, platform_moderator, support_agent, read_only_auditor`.
- Entity-scoped: `entity_owner, entity_admin, entity_manager, entity_moderator, entity_member, entity_guest`.

## 2. Состояния доступа (TZ §7)

`verification_only → limited_social_preview → free_basic → trusted_user`,
плюс `restricted` / `blocked`. Отражается на `users.status` и вычисляется из
`email_verified`/`phone_verified`/2FA/trust.

| Состояние | Условие | Что можно |
|---|---|---|
| verification_only | зарегистрирован, email не подтверждён | подтвердить email, выйти |
| limited_social_preview | email подтверждён, phone нет | читать публичное, ограниченно |
| free_basic | email+phone подтверждены | базовый функционал (TZ §4 Free) |
| trusted_user | + история/репутация | полный free + пониженные трения |

MVP: реализуем `verification_only → free_basic` через email (phone/trust — швы).

## 3. Методы входа

- **email + password** — MVP. Пароль: **встроенный в Node `crypto.scrypt`**
  (memory-hard, OWASP-ok, zero-deps — без native-компиляции на VPS). Хранение
  `salt$hash` + `algo='scrypt'` в `auth_credentials` (колонка `algo` даёт путь
  апгрейда на argon2 позже). Никогда не plaintext/в логах (security §1, §8, §15).
- **OAuth (Google / Apple)** — шов (`oauth_identities`), не в MVP.
- **Magic link** — шов, не в MVP.
- Ответы login не различают «нет юзера» vs «неверный пароль» (security §1).
- Rate-limit + прогрессивная задержка + captcha на подозрительный вход (security §11).

## 4. Сессии

- **Серверные сессии**, не JWT в localStorage (security §1).
- Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`. CSRF-токен на state-changing (security §12).
- Ротация session id при логине и при step-up.
- Таблица `sessions`: id, user_id, hashed_token, created_at, expires_at, last_seen,
  ip, user_agent, revoked_at. «Force logout all» = массовый revoke.
- Trusted devices — шов (не MVP).

## 5. Верификация email/phone

- `email_verifications` / (phone — шов): token (hashed), purpose, expires_at, used_at.
- `users.email_verified` / `phone_verified` booleans.
- Токены одноразовые, короткоживущие, хранятся в хеше.
- В production не показываем, существует ли аккаунт по email (anti-enumeration).

## 6. 2FA (TOTP) — TZ §7

- Обязательна для: владельцев workspace, entity_admin платных, платформенной
  команды (`platform_role`), super_admin, критичных действий.
- `two_factor_secrets`: user_id, secret (шифрованный), confirmed_at, disabled_at.
- **Recovery codes** (`recovery_codes`): показ один раз, хранение только в хеше,
  статусы used/unused/revoked, пересоздание — через step-up.
- **Step-up auth**: критичные действия (смена email/пароля, 2FA-reset, ownership
  transfer, опасные админ-действия) требуют повторного подтверждения.
- Реализация 2FA — после email+password-среза (шов в MVP, но таблицы закладываем).

## 7. Авторизация — серверный PermissionService

- Единая точка: `PermissionService.can(actor, action, resource)` →
  `entity_membership.role` × `platform_role` → capability (security §2).
- Каждый запрос к данным workspace **scoped по membership** актора; object-level
  проверка на каждом ресурсе. IDOR — главный класс риска (security §2).
- Capabilities из TZ §15: `can_send_messages, can_create_posts, can_comment,
  can_invite_users, can_upload_files, can_create_workspace, can_appear_in_search,
  requires_manual_review`.
- Опасные действия — two-person approval + reason + audit (TZ §15).
- Frontend-гварды остаются UX-хинтом; сервер решает.
- Критичные проверки покрываются тестами (TZ §18).

## 8. Целевая схema (Phase 1b миграция)

**Расширить `users`:** `email_verified bool`, `phone_verified bool`,
`platform_role text` (reference/enum платформенных ролей, default none),
`password_updated_at`, `last_login_at`.

**Новые таблицы:**
- `auth_credentials` (user_id, password_hash, algo, updated_at)
- `sessions` (см. §4)
- `email_verifications` (см. §5)
- `two_factor_secrets` (см. §6) — заложить, включить позже
- `recovery_codes` (см. §6) — заложить, включить позже
- `oauth_identities` (user_id, provider, provider_uid) — шов
- (уже есть) `entity_memberships` — источник entity-ролей

Все изменения — только миграцией (security §16, TZ §18).

## 9. MVP-срез Фазы 1 (порядок коммитов)

1. **Спека** (этот документ) — принять.
2. **Миграция** users-extension + `auth_credentials` + `sessions` + `email_verifications`.
3. **Register**: email+password → argon2id, создать user (status `verification_only`)
   + individual Party, выслать email-verify (в dev — лог/стаб), audit `user.registered`.
4. **Verify email**: токен → `email_verified=true`, status → `free_basic`.
5. **Login/Logout**: проверка пароля → сессия (cookie), ротация, audit `user.login`.
6. **PermissionService** (Фаза 2) — до подключения любых write-флоу.
7. **2FA (TOTP)** + recovery codes — включить на заложенных таблицах.
8. Frontend `/register`, `/login`, `/auth/verify-email`, `/settings/security` →
   реальный API вместо mock (по одному, mock-fallback снимается точечно).

Каждый шаг проходит **Security DoD-гейт** (security §16) и заканчивается чекпоинтом.

## 10. Не-цели Фазы 1

OAuth (Google/Apple), phone/SMS-верификация, magic link, trusted devices,
risk-challenge/adaptive captcha, полный trust-engine. Для них — швы в схеме, не код.
HTTPS на preview-VPS — предусловие §0, настраивается до шага 3.
