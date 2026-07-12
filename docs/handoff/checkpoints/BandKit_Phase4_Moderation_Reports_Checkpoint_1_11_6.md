# BandKit — Phase 4 Moderation Reports Checkpoint 1.11.6

## Status

Accepted checkpoint.

First slice of the Phase 4 **moderation** domain (third domain after reputation and link guard). Implements the report-ready data model, report submission with evidence preservation, and a staff triage queue — the MVP core from Platform Moderation and Safety Rules v1.0. Full dashboard, ML moderation, appeal portal and legal workflow are out of scope.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/migrations/0013_moderation_reports.sql
server/src/modules/moderation/reports.routes.js       (new)
server/src/modules/permissions/PermissionService.js   (canFileReport / canModeratePlatform)
server/src/index.js                                   (route wiring)
```

Schema (`0013`):

- reference tables `report_object_types` (13), `report_reasons` (14), `moderation_case_states` (13, with `is_terminal`) — all seeded from the spec.
- `reports` — a report is also the moderation case (one evolving row). `object_id` is polymorphic text; `context` (jsonb) holds an evidence snapshot taken at report time; `accused_user_id` / `accused_entity_id` are optional structured links; state/resolution/assignment columns for triage.

API:

```text
GET   /api/v1/moderation/report-catalogue     (object types + reasons + states)
POST  /api/v1/reports                          (any active user files a report)
GET   /api/v1/reports                          (staff triage queue; ?state= filter)
GET   /api/v1/reports/:id                       (staff case detail incl. evidence)
PATCH /api/v1/reports/:id                       (staff advances state / resolution)
```

- **Submission** (`canFileReport` — any active account): validates object type + reason. For a `chat_message` it snapshots the message (body, author, room, timestamps) into `context` — but only via a membership-joined lookup, so a non-member gets no snapshot and cannot use reporting to probe message existence (IDOR-safe). Audit `moderation.report.created`.
- **Triage** (`canModeratePlatform` — super_admin / platform_admin / platform_moderator; a read-only auditor cannot act): list open cases first, view full detail with preserved evidence, and advance the case state. Terminal states stamp `resolution` / `resolved_by` / `resolved_at`. Audit `moderation.report.updated`.

---

## Verification

Local, curl, with a reporter session (demo-manager) and a staff session (super_admin):

```text
report-catalogue                               -> 13 / 14 / 13
POST report on a chat_message                  -> 201, evidence snapshot stored
POST missing reason / bad object_type          -> 400
reporter (non-staff) GET /reports              -> 403
staff GET /reports                             -> 200, labels + reporter name
staff GET /reports/:id                         -> context.body = the message text
DELETE the reported message, re-GET report     -> context.body still preserved  ✅
staff PATCH in_review -> closed                 -> 200, resolved_at set on terminal
non-staff PATCH                                 -> 403
```

Evidence preservation (the spec's core rule — safety content is not destroyed by normal user actions) is proven: deleting the reported chat message leaves the report's snapshot intact.

---

## Deferred (next slices)

- frontend: a "Report" affordance on chat messages / profiles / posts, and a staff review UI (the admin console currently has only mock moderation bridges);
- evidence snapshots for other object types (post/comment/document) as those backends land;
- a hard guarantee that reported objects cannot be hard-deleted (today evidence is preserved by snapshot at report time);
- appeals portal, moderation actions beyond state changes (hide/restrict/suspend), entity-admin moderation scope.

---

## Do not regress

- Keep evidence snapshotting at report time; never let a normal delete/edit destroy a report's `context`.
- Keep the chat-message snapshot behind a membership join (no existence probing).
- Filing is any-active-user; triage is platform moderation staff only (not read-only auditor, not entity admin by default).
- Keep object types / reasons / states as reference tables, not enums; sensitive updates write an audit event.

---

## Next recommended work

Wire the frontend: a real "Report" action (chat message → POST /reports) with the spec's confirmation copy, and a staff review surface in the admin console backed by GET/PATCH /reports.
