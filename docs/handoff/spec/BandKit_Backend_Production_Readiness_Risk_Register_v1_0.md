# BandKit — Backend Production Readiness Risk Register v1.0

## Status

Accepted backend readiness checklist.

This document records the main backend/infrastructure risks that must be considered before moving BandKit from the current staging VPS into real production hosting.

The current VPS is a development/staging environment in near-real conditions. It is not the final production infrastructure.

---

## 1. Environments: local / staging / production

BandKit must have clearly separated environments.

Required environments:

- local development;
- staging VPS / preview;
- production.

Rules:

- each environment has its own `.env`;
- each environment has its own database;
- each environment has its own file storage area/bucket;
- OAuth/callback URLs must be environment-specific;
- frontend must not accidentally point to the wrong backend;
- production must not load mock/test fixtures;
- seed/demo data is allowed only in local/staging;
- staging data is not production truth.

Risk:

- accidentally mixing staging and production data;
- test users/messages/documents leaking into production;
- production UI calling staging API or vice versa.

Accepted rule:

> No shared database/storage/secrets between staging and production.

---

## 2. Secrets and access control

Secrets must never be committed to the repository.

Sensitive items:

- database passwords;
- JWT/session secrets;
- OAuth client secrets;
- SMTP/SMS provider keys;
- object storage keys;
- GitHub deploy keys;
- VPS SSH keys;
- backup encryption keys;
- admin bootstrap credentials.

Rules:

- secrets live in `.env` or hosting secret manager;
- GitHub Actions uses GitHub Secrets;
- `.env` files are excluded from git;
- access to VPS must be limited;
- SSH keys must be rotated if exposed;
- emergency token rotation procedure is required before production;
- production secrets are separate from staging secrets.

Risk:

- leaked token gives database/API/storage access;
- staging secret reused in production;
- forgotten admin credentials.

Accepted rule:

> Treat secrets as production-critical from the first backend commit.

---

## 3. Backup and restore drill

Backups are not valid until restore is tested.

Minimum staging requirements:

- daily PostgreSQL dump;
- keep last 7 local backups;
- document restore command;
- test restore at least once.

Production requirements later:

- off-server backups;
- encrypted backups;
- retention policy;
- restore drill schedule;
- backup failure alert;
- storage backup for files/documents;
- database and file backup consistency plan.

Risk:

- backups exist but cannot be restored;
- database restored but files are missing;
- file storage restored but database points to old/missing keys;
- VPS disk fills with backups.

Accepted rule:

> A backup is considered real only after a successful restore test.

---

## 4. Logs and monitoring

The staging VPS and future production must be observable.

Monitor at minimum:

- CPU;
- RAM;
- disk usage;
- PostgreSQL health;
- backend process health;
- Nginx errors;
- API error rate;
- backup success/failure;
- slow queries;
- file storage growth.

Logs:

- backend logs;
- Nginx access/error logs;
- PostgreSQL logs;
- migration logs;
- worker/queue logs later;
- audit logs for sensitive actions.

Risks:

- disk fills with logs or backups;
- backend dies silently;
- database slows down without visibility;
- failed backups go unnoticed.

Accepted rule:

> Before production, BandKit needs monitoring and alerting for uptime, disk, backend health and backup health.

---

## 5. Rate limits and abuse protection

Backend must enforce rate limits, not only frontend UI.

Required rate limit areas:

- login attempts;
- registration;
- password reset;
- email/phone verification;
- SMS/email code sending;
- chat messages;
- attachments/uploads;
- mentions;
- reports;
- invites;
- API requests;
- websocket events;
- search requests.

Risks:

- spam;
- brute force login;
- SMS/email cost abuse;
- VPS overload;
- message flood;
- attachment abuse;
- fake reports.

Accepted rule:

> Rate limiting is mandatory before production-scale chat and auth.

---

## 6. Auth, sessions and 2FA

BandKit auth must be treated as a core backend system.

Required concepts:

- email verification;
- phone verification where required;
- Google login;
- Apple login;
- password reset;
- refresh tokens/sessions;
- logout current device;
- logout all devices;
- session/device list;
- suspicious login detection;
- 2FA via authenticator apps;
- account recovery flow;
- admin/moderator account protection.

Risks:

- account takeover;
- weak reset flow;
- session theft;
- no way to revoke compromised sessions;
- admin account compromise.

Accepted rule:

> Admin/moderator accounts must have stronger protection than normal accounts before production.

---

## 7. Storage lifecycle

Files must not be treated as simple chat blobs.

Required file concepts:

- temporary upload file;
- message attachment;
- entity document;
- generated preview/thumbnail;
- document version;
- storage key;
- owner entity;
- access policy;
- export audit;
- retention policy.

Lifecycle rules:

- unfinished uploads should expire;
- orphan files should be cleaned;
- deleting a message does not delete an entity document;
- leaving an entity removes document access through related chats;
- production files should move to object storage;
- virus/malware scanning should be added later;
- size limits and quotas are required before production.

Risks:

- confidential documents become normal attachments;
- orphan files fill disk/storage;
- deleting chat message accidentally deletes project document;
- users keep access to documents after leaving entity.

Accepted rule:

> Entity documents and chat attachments must be separate concepts in backend design.

---

## 8. PermissionService / PolicyResolver

Chat and document policies are complex. They must not be implemented ad hoc in every endpoint.

Required central permission methods later:

- `canViewRoom`;
- `canWriteMessage`;
- `canEditMessage`;
- `canDeleteMessage`;
- `canHideMessage`;
- `canPinMessage`;
- `canAttachFile`;
- `canForwardDocument`;
- `canExportDocument`;
- `canMentionUser`;
- `canAcknowledgeMessage`;
- `canViewDocument`;
- `canManageMembers`.

Risks:

- one API endpoint forgets a rule;
- UI hides action but backend still allows it;
- document export bypasses chat policy;
- former project member still opens data through old link.

Accepted rule:

> Backend permissions must be enforced by a central PermissionService/PolicyResolver, not only by UI.

---

## 9. WebSocket access revocation

Realtime access can become stale.

Risk scenario:

1. User opens project chat.
2. User is removed from project or placed into read-only mode.
3. HTTP API blocks new requests.
4. Existing WebSocket still receives room events unless explicitly revoked.

Required behavior:

- membership/role/restriction changes trigger access recalculation;
- user is unsubscribed from room channels they can no longer access;
- client receives `access_revoked` or similar event;
- room disappears or becomes read-only in UI;
- future messages are not pushed to revoked clients.

Accepted rule:

> Realtime subscriptions must obey the same permissions as HTTP API.

---

## 10. Push notification privacy

Push notifications can leak confidential data.

Rules:

- direct chats may show more content depending on user settings;
- entity/project/event/document notifications should be conservative;
- sensitive documents, payments, bookings and contracts should not expose full details in push text;
- if access is revoked before delivery, push must not reveal content;
- user notification preferences must not override access restrictions.

Safer examples:

- `Новое сообщение в событии`
- `Новое важное сообщение в проекте`
- `Документ обновлён`

Avoid in sensitive contexts:

- full contract sums;
- private document names if sensitive;
- confidential logistics for users without active access.

Accepted rule:

> Push payloads must be privacy-safe by default for entity-bound contexts.

---

## 11. Production data separation

Staging data must not automatically become production data.

Rules:

- production launch starts with clean migrations or explicitly approved imported data;
- mock users/rooms/messages must not become production records;
- test fixtures must not load in production;
- production storage bucket must be separate;
- production OAuth apps/callbacks must be separate;
- production admin bootstrap must be controlled.

Risks:

- demo data leaks to users;
- test accounts become real admins;
- staging documents appear in production;
- production frontend talks to staging API.

Accepted rule:

> Production data and staging data are separate by default.

---

## 12. Legal and product policy documents

Before public launch, BandKit needs non-code policies.

Required later:

- Terms of Service;
- Privacy Policy;
- moderation rules;
- complaint/report policy;
- document/confidentiality policy;
- data retention policy;
- account deletion/export policy;
- rating/reputation policy;
- notification consent policy;
- external payments/off-platform safety policy.

Risks:

- unclear responsibility for user-generated documents;
- unclear moderation process;
- unclear retention/deletion rights;
- disputes around ratings/reliability history.

Accepted rule:

> Product/legal policies must be prepared before public launch, even if MVP staging can proceed without final legal text.

---

## 13. Mock vs production separation

BandKit currently has mock/UI-ready logic. This must be controlled before backend production.

Rules:

- mock delete/pin/edit/report is not production state;
- mock rooms/users/messages stay in dev/staging only;
- test fixtures do not load in production;
- demo stress data is guarded by environment;
- production backend must not trust frontend-only state.

Risks:

- mock fixture script loaded in production;
- UI state treated as backend truth;
- fake rooms/users leak into production.

Accepted rule:

> All mock/test behavior must be environment-gated before production.

---

## 14. Async jobs and queues

Message send should not become overloaded by doing everything synchronously.

Send-message flow should later separate:

1. validate permission;
2. save message;
3. return success;
4. async notification fanout;
5. async search indexing;
6. async audit/event processing;
7. async push delivery;
8. async attachment processing.

Future tools:

- Redis/Valkey;
- queue worker;
- background jobs;
- retry/dead-letter handling.

Risk:

- one slow notification/search/upload process makes chat send slow or unreliable.

Accepted rule:

> Chat side effects should move to async jobs as backend grows.

---

## Accepted risk priorities before backend implementation

Highest priority:

1. environment separation;
2. secret handling;
3. PostgreSQL backup/restore drill;
4. PermissionService/PolicyResolver;
5. storage model split between entity documents and chat attachments;
6. mock vs production separation;
7. WebSocket access revocation;
8. push privacy for entity contexts;
9. rate limits for auth/chat/uploads;
10. monitoring/logging.

---

## Accepted decision

Before BandKit moves toward real production, backend work must respect this risk register.

Current VPS remains staging/preview. Production requires separated environments, secrets, backups, monitoring, storage policy, permission resolver, realtime access revocation, privacy-safe notifications and strict mock/production separation.
