# BandKit — Next Chat Handoff After 1.10.26

## Current accepted checkpoint

Current accepted baseline:

```text
1.10.26 — Autodeploy and user interface debug gate accepted
```

Repository:

```text
Dayzcoub/Bandkitalpha
```

Branch:

```text
main
```

VPS preview:

```text
http://141.98.87.9
```

Backend:

```text
systemd service: bandkit-backend
local backend: 127.0.0.1:3001
public API through nginx: /api/
PostgreSQL database: bandkit
real secrets only on VPS: /opt/Bandkitalpha/server/.env
```

---

## Accepted operational state

GitHub Actions staging autodeploy works.

Deploy path:

```text
push to main → GitHub Actions → VPS SSH → scripts/staging-deploy.sh → scripts/staging-smoke-api.sh
```

Workflow:

```text
.github/workflows/staging-deploy.yml
```

Expected successful markers:

```text
[bandkit deploy] Staging deploy completed
[bandkit smoke] Smoke API test completed
[bandkit actions] Staging deploy and smoke completed
```

Manual fallback still works:

```bash
cd /opt/Bandkitalpha
sudo bash scripts/staging-deploy.sh
bash scripts/staging-smoke-api.sh
git status --short
```

After deploy/smoke:

```text
git status --short
```

must be empty.

---

## Accepted frontend/backend state

Working frontend MVP shell is deployed to VPS.

Backend has working health and real-data API slices:

```text
GET /api/v1/health
GET /api/v1/health/db
POST /api/v1/dev/seed-demo
GET /api/v1/entities
POST /api/v1/entities
GET /api/v1/entities/:id-or-slug
GET /api/v1/events
GET /api/v1/chat-rooms
GET /api/v1/documents
```

Entity API vertical slice works:

- create entity;
- list entities;
- get by slug/UUID;
- owner membership created;
- audit event `entity.created` written.

Smoke script uses deterministic entity:

```text
name: Smoke API Band
slug: smoke-api-band
```

Real entity detail diagnostic exists for super admin only.

---

## Important accepted UI direction

The platform is pre-launch. There are no real users except the owner/testing account.

From this checkpoint onward, polish BandKit as a real user-facing portal.

Regular users must not see technical/debug/staging labels:

```text
Real API
DB read-only
GET only
No auth writes
Mock fallback preserved
mock
offline
staging/debug labels
```

Technical panels and diagnostics are allowed only for:

```text
super_admin
```

Relevant files:

```text
src/lib/permissions/diagnostics.ts
src/modules/RealEntitiesPreview.ts
```

`RealEntitiesPreview.ts` mounts real API debug panels only when:

```text
localStorage['bandkit.role'] === 'super_admin'
```

---

## Latest platform operations spec work

Added and expanded:

```text
docs/handoff/spec/BandKit_Platform_Owner_Operations_Console_v1_0.md
```

This spec defines the internal platform-owner side:

- Platform Owner / Super Admin;
- Platform Admin;
- Platform Moderator;
- Support Agent;
- Read-only Auditor;
- owner dashboard;
- user management;
- entity oversight;
- moderation center;
- support desk;
- trust and safety rules;
- platform settings;
- staff management;
- audit log;
- system health/deploy status;
- billing/subscriptions later;
- localization/content operations;
- legal/data requests.

Important additions already added:

- strict separation: platform admin ≠ entity admin;
- entity admin roles are scoped to one entity;
- platform admin does not become day-to-day admin of every entity;
- break-glass emergency access;
- support view / controlled impersonation;
- dual approval for dangerous actions;
- appeals and reversals;
- support SLA priorities P0/P1/P2/P3;
- incident management;
- backups/retention/recovery;
- internal runbooks;
- staff notifications/escalations.

---

## Critical role separation to preserve

Do not mix these concepts:

```text
platform_role
entity_membership.role
support_case_assignment
moderation_case_assignment
```

Entity-scoped roles:

```text
entity_owner
entity_admin
entity_manager
entity_moderator
entity_member
entity_guest
```

Platform-scoped roles:

```text
super_admin
platform_admin
platform_moderator
support_agent
read_only_auditor
```

Example:

```text
A user can be entity_admin of Northern Lights Band
without being platform_admin of BandKit.
```

Example:

```text
A support_agent can help with a ticket
without becoming entity_admin of the user's band.
```

---

## Current important checkpoint docs

Recent checkpoint/spec docs:

```text
docs/handoff/checkpoints/BandKit_Frontend_Readonly_Real_Entities_Checkpoint_1_10_23.md
docs/handoff/checkpoints/BandKit_Frontend_Readonly_Real_Entity_Detail_Checkpoint_1_10_24.md
docs/handoff/checkpoints/BandKit_GitHub_Actions_Staging_Deploy_Checkpoint_1_10_25.md
docs/handoff/checkpoints/BandKit_Autodeploy_And_User_Interface_Debug_Gate_Checkpoint_1_10_26.md
docs/handoff/spec/BandKit_Platform_Owner_Operations_Console_v1_0.md
```

---

## Hard rules for next work

- Do not expose technical/debug/staging labels to regular users.
- Keep technical panels behind `super_admin` gates.
- Do not connect frontend create/update/delete to backend until auth/permissions are designed.
- Do not implement full registration before auth model is designed.
- Do not expose `.env`, passwords, DB secrets, SSH keys, tokens.
- All schema changes through migrations only.
- VPS is staging/preview, not production.
- Backend permission service must become final source of truth later.
- Frontend role placeholders are not security.
- Work in small vertical slices.
- After accepted verification, write checkpoint docs.

---

## Recommended next task by TZ/spec

Next task:

```text
Design and implement the first product-grade Platform Owner Operations Console shell.
```

Goal:

Create the platform-owner/admin area foundation without mixing it with entity admin UI.

Suggested route structure:

```text
/admin
/admin/users
/admin/entities
/admin/support
/admin/moderation
/admin/settings
/admin/audit
/admin/system
```

First slice should be UI shell/read-only/mock-safe only:

- no destructive actions;
- no real user management writes;
- no real support ticket writes;
- no real role assignment writes;
- no secrets;
- no backend schema changes unless explicitly planned.

Recommended first implementation step:

```text
Build /admin as Platform Owner dashboard shell visible only to super_admin/platform staff mock roles, with cards for users, entities, moderation, support, audit, system health, settings, and staff.
```

Keep entity admin UI separate:

```text
/bands/:id/settings
/events/:id/settings
```

Do not put platform operations inside normal band/entity pages.

---

## Suggested acceptance criteria for next slice

1. Regular user does not see `/admin` navigation.
2. Entity admin does not see platform owner navigation unless also platform staff.
3. Super admin sees a clean product-grade operations dashboard, not debug labels.
4. Dashboard sections clearly separate:
   - platform users;
   - platform entities oversight;
   - support desk;
   - moderation;
   - audit;
   - system health;
   - platform settings;
   - staff management.
5. All actions are read-only placeholders unless explicitly approved.
6. GitHub Actions autodeploy succeeds.
7. Smoke API succeeds.
8. New checkpoint doc is created after acceptance.

---

## Starter prompt for next chat

Use this as the first message in the new chat:

```text
Продолжаем BandKit.
Repo: Dayzcoub/Bandkitalpha
Branch: main
VPS preview: http://141.98.87.9
Current accepted checkpoint: 1.10.26 — Autodeploy and user interface debug gate accepted

Autodeploy from GitHub Actions to VPS works.
Technical Real API/DB/read-only/mock/offline panels are hidden from normal users and available only to super_admin.
Latest platform operations spec: docs/handoff/spec/BandKit_Platform_Owner_Operations_Console_v1_0.md
Important principle: platform admin ≠ entity admin. Entity admin is scoped to one entity; platform admin/staff operate the BandKit platform through separate /admin operations console.

Next task by TZ/spec:
Design and implement the first product-grade Platform Owner Operations Console shell.
Start with /admin dashboard shell and route/navigation structure for /admin/users, /admin/entities, /admin/support, /admin/moderation, /admin/settings, /admin/audit, /admin/system.
Read-only/mock-safe UI only, no destructive writes, no auth/permissions backend yet, no secrets, no schema changes unless explicitly needed.
Keep entity admin UI separate under /bands/:id/settings and similar entity context pages.
Work in small vertical slices and checkpoint after verification.
```
