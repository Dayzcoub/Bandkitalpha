# BandKit Security & Anti-Fraud Spec v1.0

## 1. Назначение

BandKit — социальная платформа с личными сообщениями, событиями, рейтингами и документами. Поэтому безопасность, антифрод и модерация должны быть заложены до кода, а не добавлены после проблем.

## 2. Auth security

Обязательно:

- email verification;
- phone verification through SMS;
- OAuth Google/Apple;
- 2FA через authenticator app;
- mandatory 2FA for admins/moderators/workspace owners;
- session management;
- logout all sessions;
- password reset throttling;
- rate limits for login/register/OTP.

## 3. Verification levels

```txt
L0 guest
L1 registered email pending
L2 email verified
L3 phone verified
L4 2FA enabled
L5 trusted/account aged
```

Ограничения новых аккаунтов:

- нельзя массово писать незнакомым пользователям;
- нельзя отправлять много приглашений;
- нельзя публиковать много постов за короткое время;
- нельзя добавлять внешние ссылки;
- нельзя оставлять рейтинг без реального взаимодействия.

## 4. Link policy

Для MVP фиксируется строгий режим:

- внешние ссылки в личных сообщениях и комментариях запрещены или автоматически блокируются;
- ссылки в публичных профилях проходят allowlist/moderation;
- URL-подобные строки нормализуются и проверяются;
- короткие ссылки запрещены;
- подозрительные unicode/punycode домены блокируются;
- пользователю показывается локализованное предупреждение.

Reason: защита от вымогателей, социальной инженерии, фишинга и scam-схем.

## 5. Messaging anti-fraud

Сигналы риска:

- массовая рассылка;
- одинаковые сообщения;
- попытки увести в сторонний мессенджер;
- просьбы перевести деньги;
- подозрительные вложения;
- жалобы от нескольких пользователей;
- новые аккаунты с высоким outreach.

Actions:

- rate limit;
- require verification;
- soft block;
- shadow review future-ready;
- warn recipient;
- create moderation signal.

## 6. Content moderation

Targets:

- profile;
- band;
- event;
- post;
- comment;
- message;
- document;
- media asset;
- review/rating.

Complaint categories:

- spam;
- scam/fraud;
- harassment;
- hate/abuse;
- impersonation;
- inappropriate content;
- copyright;
- no-show/reliability dispute;
- other.

Moderation statuses:

- new;
- in_review;
- waiting_for_user;
- action_taken;
- dismissed;
- escalated;
- closed.

## 7. Moderator permissions

Moderator can:

- view complaint queue;
- view target content attached to complaint;
- hide/remove content;
- warn user;
- limit account;
- escalate.

Moderator cannot by default:

- browse all private chats;
- edit user content silently;
- delete audit logs;
- access security secrets;
- change super admin roles.

## 8. Admin intervention logic

Все действия модераторов должны быть auditable:

- кто сделал;
- когда;
- что изменил;
- причина;
- связанная жалоба;
- old/new status.

Для серьёзных действий желательно 2-person review future-ready:

- permanent suspension;
- массовое удаление контента;
- доступ к приватному чату по жалобе;
- изменение reputation вручную.

## 9. Reputation safety

Рейтинг нельзя делать простым средним без защиты.

Правила:

- нельзя оценивать себя;
- нельзя оценивать без общего события/проекта/контракта future-ready;
- новые аккаунты имеют меньший вес;
- спорные отзывы могут быть hidden until resolved;
- отмены/неявки должны учитывать контекст и подтверждения;
- пользователь должен видеть причину существенного изменения рейтинга.

## 10. File upload security

- MIME validation;
- file size limits;
- extension allowlist;
- image metadata stripping future-ready;
- virus scan future-ready;
- signed URLs;
- private/public buckets separated;
- no executable uploads;
- documents access by permission.

## 11. Rate limits

Minimum rate-limited actions:

- login;
- register;
- phone OTP;
- email verification resend;
- message send;
- post create;
- comment create;
- complaint create;
- invitation create;
- file upload;
- password reset.

## 12. Privacy

- Минимизировать публичные данные.
- Не раскрывать телефон/email без разрешения.
- 404/restricted не должны подтверждать наличие приватного объекта.
- Deleted/suspended profile shows safe placeholder.
- Logs should avoid raw sensitive data.

## 13. Notifications safety

Push/email/SMS не должны раскрывать лишнее на lock screen:

- можно: "Новое сообщение в BandKit";
- осторожно: текст сообщения;
- нельзя: приватные детали жалобы/модерации в открытом виде.

## 14. Security checklist for MVP shell

Даже на mock этапе должны быть заложены:

- role guard abstraction;
- permissions helper;
- verification badges/statuses;
- safe link renderer;
- complaint action entry points;
- restricted states;
- no raw HTML rendering;
- audit log model in spec.

## 15. Definition of Done

Перед production backend:

- threat model reviewed;
- RLS test cases written;
- admin/moderator roles separated;
- rate limits planned;
- audit log immutable;
- file upload policy implemented;
- link policy implemented;
- complaint flow implemented;
- 2FA mandatory for elevated roles.
