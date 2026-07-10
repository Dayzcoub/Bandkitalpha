# BandKit — Phase 4 Reliability Records Checkpoint 1.11.0

## Status

Accepted checkpoint.

First slice of Phase 4 (domains by priority: reputation → link guard → moderation → feed → files → PDF → billing → E2EE). This slice implements the reputation domain's baseline data structure: structured reliability records anchored to verified collaboration context, per `docs/handoff/spec/BandKit_Reputation_And_Reliability_Rules_v1_0.md`.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS preview: `http://141.98.87.9`
- Backend service: `bandkit-backend`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

Per the spec's MVP scope ("lightweight reliability-ready structure"; "store participation context before exposing broad public ratings"), this slice stores structured reliability records and deliberately does not expose any public rating.

Implemented:

```text
server/migrations/0011_reliability.sql
server/src/modules/reliability/reliability.routes.js
server/src/modules/permissions/PermissionService.js   (added canRecordReliabilityEvent / canViewReliabilityEvents)
server/src/index.js                                    (route wiring)
```

Schema (migration `0011_reliability.sql`):

- `reliability_event_types` — reference table (12 rows), each with `polarity` in (`positive`, `neutral`, `negative`). Types are lookups, not enums (CLAUDE.md).
- `reliability_reasons` — reference table (8 rows): illness, emergency, force_majeure, organizer_changed_conditions, event_rescheduled, unsafe_conditions, documented_conflict, other.
- `reliability_events` — a structured record about a party, always anchored to an `engagements` row (the verified collaboration context). `subject_party_id` and `event_id` are denormalised from the engagement (for a future party-level summary); `visibility` defaults to `organizers` (conservative, anti-shaming); `disputed` is the dispute-ready seam.

API:

```text
GET  /api/v1/reliability/event-types
POST /api/v1/events/:eventId/engagements/:engagementId/reliability
GET  /api/v1/events/:eventId/engagements/:engagementId/reliability
```

---

## Authorization

Recording and listing reliability records is manager-scoped: the actor must hold an owner/admin/manager membership in the event's owning entity (`PermissionService.canRecordReliabilityEvent` / `canViewReliabilityEvents`, both delegating to `canManageEntity`). This matches the spec: records come from the organizer/participant collaboration relationship, not arbitrary profile visitors.

The subject party and event are derived server-side from the engagement, never taken from the request body. An engagement is resolved only when it belongs to the URL's `:eventId`, so a record cannot be attached across events (IDOR guard, Security Standard §2).

Every recorded event writes an audit row `reliability.event.recorded` (with `reliability_id`, `engagement_id`, `type`).

---

## Verification

Verified locally end-to-end against Postgres (migrated through `0011`), authenticating with a real `sessions` cookie for the seeded demo manager:

```text
POST reliability (completed_participation)                 -> 201
POST reliability (late_cancellation + reason + disputed
                  + visibility=moderation)                 -> 201, fields honoured
POST reliability (unknown type_key)                        -> 400 REFERENCE_UNKNOWN
POST reliability (missing type_key)                        -> 400 RELIABILITY_TYPE_REQUIRED
GET  reliability list                                      -> 200, joined type/reason labels + polarity
GET  reliability (no session cookie)                       -> 401 AUTH_REQUIRED
GET  reliability (engagement under a different event)      -> 404 ENGAGEMENT_NOT_FOUND
audit_events 'reliability.event.recorded'                  -> 2 rows written
```

---

## Deliberately deferred (next slices)

- party-level reputation summary / aggregation (the anti-abuse-sensitive read side);
- free-text feedback model;
- full dispute state machine (only the `disputed` seam exists now);
- frontend UI for recording/viewing reliability on the event working roster.

Rationale (spec): anti-abuse protections are mandatory before public ratings; MVP stores participation context first.

---

## Do not regress

- Keep reliability records anchored to an engagement; never take subject party / event from the request body.
- Keep write/read manager-scoped through `PermissionService`; frontend roles are not security.
- Do not expose a public rating number or party-level reputation until anti-abuse (dispute + weighting) is designed.
- Keep schema changes migration-only.
- Keep types/reasons as reference tables, not enums.

---

## Next recommended work

Either continue the reputation domain (party-level summary behind visibility/anti-abuse rules, or the event-roster UI to record reliability), or start the next Phase 4 domain (link guard).
