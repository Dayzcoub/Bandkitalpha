# BandKit — Phase 4 Billing (Plans and Limits) Checkpoint 1.15.0

## Status

Accepted checkpoint.

Billing domain, slice 1 — per Monetization and Entity Feature Policy v1.0. **No payments**: the policy is explicit that BandKit does not take money at this stage ("no in-platform payment/settlement processing at MVP stage", "MVP must not depend on them"). Monetization is "expanding platform capabilities for entities", so this slice is plans plus limits that are actually enforced.

PDF (the domain before this one in the plan) was **skipped by decision**: TZ §13 wants "PDF из конкретной версии" of *structured* documents, but `documents` carry no structured content — only a title and an uploaded file. The tools that would produce that content (rider/offer wizards, branded PDF export) are listed by the Documents policy as future paid/pro features. Building a PDF exporter now would render a title page and nothing else.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/migrations/0019_entity_plans.sql
server/src/modules/billing/plans.js               (new — plan resolution + usage)
server/src/modules/billing/plans.routes.js        (new — catalogue, entity plan, staff override)
server/src/modules/documents/files.routes.js      (upload enforces storage/version/size)
server/src/modules/entities/entities.routes.js    (add member enforces member cap)
server/src/index.js
src/modules/RealEntityDetail.ts                   (plan + usage block)
src/modules/RealDirectories.ts                    (plan errors on upload)
src/locales/en|ru/bands.json, documents.json
```

### Model

- `plans` reference table with limits as columns (every one is enforced by code): `free` / `pro` / `org`. Free is deliberately a **real starter package** (10 members, 100 MB, 3 versions, 10 MB/file) because the policy insists "the free tier is not a useless demo".
- `entity_plans` — an entity's current plan. **No row = free**, so a new entity never needs a billing write to be usable.
- `entity_billing_profile` stays unbuilt on purpose — that is the future financial module the policy gates behind legal/accounting review.

### API

```text
GET /api/v1/plans                 plan catalogue (public)
GET /api/v1/entities/:id/plan     plan + live usage (members only; 404 otherwise)
PUT /api/v1/entities/:id/plan     assign a plan — platform staff only, audited
```

Since there is no payment flow, `PUT` is the policy's "admin override for testing/support": staff-only, note recorded, `billing.plan_assigned` audited.

### Enforcement (the point of the slice)

- **file upload**: version cap, storage quota (checked before writing, then re-checked against the real size), and per-file cap as `min(plan, MAX_UPLOAD_BYTES)`.
- **add member**: member cap, checked before the user lookup so it never hints whether an account exists.
- Limit hits return `409` with a machine-readable code (`PLAN_VERSION_LIMIT`, `PLAN_STORAGE_FULL`, `PLAN_MEMBER_LIMIT`) plus the plan and limit.

### UI

Entity page shows "Plan and usage": plan badge, members X/Y, storage used/limit, version and file-size limits. Upload errors map to localized plan messages. No "Buy" button — there is nothing to buy yet, and pretending otherwise would be dishonest.

---

## Verification

Limits proven real, with before/after rather than assertions:

```text
plans catalogue           -> free/pro/org with the seeded limits
entity plan (no row)      -> free, members 1/10, storage 248 B / 100 MB
free cap = 3 versions, doc had 5   -> upload 409 PLAN_VERSION_LIMIT
staff override -> pro (25 versions) -> the SAME upload now 201
temporary 'tiny' plan (300 B, 1 member):
  upload  -> 409 PLAN_STORAGE_FULL {limit:300, used:310}
  add member -> 409 PLAN_MEMBER_LIMIT {limit:1}
back to pro -> add member 201, usage 2/50
non-staff PUT plan -> 403; unknown plan -> 400; anonymous GET plan -> 401
audit: billing.plan_assigned x3
```

Browser: entity page renders "Тариф и потребление / Pro Entity / Участники: 2 / 50 / Хранилище: 310 B / 5.0 GB". Fixed during verification: the size formatter printed "0.0 MB" for a few hundred bytes, which read like a bug — units now scale (B/KB/MB/GB). No console errors.

---

## Deferred

- payments, invoices, escrow, settlement (policy: separate future module, only after legal/accounting review);
- `entity_feature_flags` / `entity_feature_usage_events` (no feature needs a per-entity override yet);
- plan-based export permissions (external export does not exist);
- upgrade/downgrade UX (nothing to purchase).

---

## Do not regress

- No payment processing, and nothing may depend on one existing.
- No `entity_plans` row must always mean free — a new entity stays usable.
- Limits must stay enforced in the write paths, not merely displayed.
- Plan assignment stays staff-only and audited while no billing flow exists.

---

## Next recommended work

E2EE — the last Phase 4 domain. Note it conflicts with existing behaviour (link guard scans message text server-side; moderation snapshots message content as evidence), and TZ §8 scopes E2EE to personal DMs with "жалоба через добровольную передачу evidence-фрагмента". Needs a design decision before code.
