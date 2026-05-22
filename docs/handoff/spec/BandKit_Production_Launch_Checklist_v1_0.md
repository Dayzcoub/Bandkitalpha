# BandKit — Production Launch Checklist v1.0

## Status

Accepted operational checklist.

This document defines the baseline checklist required before BandKit can move from staging/preview to public production launch.

---

## Core principle

A public launch requires operational readiness, not only working UI.

Accepted rule:

> Production launch is blocked until infrastructure, data, security, moderation, legal and support basics are ready.

---

## 1. Infrastructure

Required:

- production hosting/datacenter/cloud chosen;
- staging remains separate from production;
- production backend deployed separately from staging;
- production database deployed separately from staging;
- production object storage prepared;
- domain configured;
- SSL enabled;
- Nginx/reverse proxy configured;
- `/api` routing configured;
- `/ws` routing configured if realtime enabled;
- rollback plan defined.

---

## 2. Database

Required:

- PostgreSQL production instance ready;
- migrations applied cleanly;
- production DB user with limited privileges;
- no public DB exposure unless explicitly secured;
- connection string stored only in secrets/env;
- PgBouncer/read replicas considered when needed;
- staging data not imported unless explicitly approved.

---

## 3. Backups and restore

Required:

- automated DB backups;
- off-server backup storage;
- file/object storage backup policy;
- restore drill completed;
- backup failure alert configured;
- retention policy defined;
- recovery procedure documented.

Launch blocker:

> No verified restore drill = no production launch.

---

## 4. Monitoring and logs

Required:

- backend process monitoring;
- uptime monitoring;
- CPU/RAM/disk monitoring;
- PostgreSQL health monitoring;
- Nginx error log monitoring;
- API error logs;
- slow query logging;
- backup success/failure monitoring;
- alert channel defined.

---

## 5. Security

Required:

- production secrets separated from staging;
- `.env` not committed;
- GitHub Actions secrets configured;
- SSH access restricted;
- firewall configured;
- public DB port closed;
- rate limits enabled;
- admin accounts protected;
- basic security review completed;
- dependency audit/check completed.

---

## 6. Auth and accounts

Required before public launch:

- registration/login flow stable;
- email verification or equivalent baseline;
- password reset if password auth exists;
- session/refresh behavior defined;
- logout current/all devices considered;
- admin bootstrap controlled;
- moderator/admin accounts protected with stronger requirements;
- 2FA planned or enabled for privileged accounts.

---

## 7. Data separation

Required:

- production DB clean of test fixtures;
- production storage clean of staging files;
- mock data disabled;
- demo rooms/messages disabled;
- test users removed or clearly marked internal;
- production seed minimal;
- feature flags reviewed.

---

## 8. Files and documents

Required:

- production storage configured;
- entity documents separated from chat attachments;
- upload size limits configured;
- orphan upload cleanup planned;
- document access permissions enforced;
- document export restrictions enforced or disabled until ready;
- sensitive files not exposed by direct public URL.

---

## 9. Permissions and policies

Required:

- PermissionService/PolicyResolver implemented for sensitive endpoints;
- former member access removal works;
- event participant access works;
- read-only/restricted state enforced;
- document export restrictions enforced;
- chat edit/delete rules enforced where enabled;
- HTTP and WebSocket permissions match.

---

## 10. Moderation and safety

Required:

- report action available or clear support path;
- reported content preservation implemented or safely planned;
- admin/moderator action path exists;
- basic content hide/restrict path exists;
- audit reason captured for sensitive actions;
- support contact available;
- abuse/rate limits enabled.

---

## 11. Notifications

Required if notifications are enabled:

- privacy-safe payloads;
- no sensitive document/payment details in push;
- access revocation respected;
- critical vs normal notifications defined;
- unsubscribe/mute preferences respected where applicable.

---

## 12. Legal/product pages

Required before public launch:

- Terms of Service;
- Privacy Policy;
- moderation/reporting rules;
- document/confidentiality policy;
- data retention/deletion/export policy;
- support/contact page;
- monetization/subscription terms if paid features enabled.

---

## 13. QA and release checks

Required:

- staging smoke test;
- production smoke test plan;
- migrations tested;
- rollback tested or documented;
- key flows tested:
  - register/login;
  - create entity;
  - add member/invite;
  - create event;
  - working chat;
  - upload/reference document;
  - important message/acknowledgement if enabled;
  - permissions/access revocation;
  - report/support path.

---

## 14. MVP scope lock

Before launch, verify that production feature set matches accepted MVP scope.

Launch should not wait for:

- marketplace;
- payments;
- escrow;
- broad public feed;
- advanced reputation automation;
- native mobile apps;
- full AI automation.

---

## Accepted decision

BandKit production launch requires:

- separated production environment;
- production PostgreSQL and storage;
- backups and tested restore;
- monitoring/logging;
- secrets and security baseline;
- permission enforcement;
- mock/test data disabled;
- moderation/support path;
- legal/product pages;
- key MVP flows tested.

Current VPS remains staging/preview and is not the final production environment.
