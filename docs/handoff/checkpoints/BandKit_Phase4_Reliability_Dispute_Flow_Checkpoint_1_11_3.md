# BandKit — Phase 4 Reliability Dispute Flow Checkpoint 1.11.3

## Status

Accepted checkpoint.

Third reputation-domain slice (Phase 4). Turns the `disputed` seam from 1.11.0 into a real dispute lifecycle — the spec makes a dispute flow mandatory for serious negative reliability events, and requires that a disputed record not count as final negative reputation until resolved (Reputation Rules v1.0).

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend service: `bandkit-backend`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/migrations/0012_reliability_disputes.sql
server/src/modules/reliability/reliability.routes.js   (open/resolve + summary/list)
server/src/index.js                                    (route wiring)
```

Schema (`0012`):

- `reliability_dispute_states` reference table: `open` (non-terminal), `upheld`, `retracted` (terminal).
- `reliability_events` gains dispute columns: `dispute_state`, `dispute_opened_by`, `dispute_reason_key`, `dispute_note`, `dispute_opened_at`, `dispute_resolved_by`, `dispute_resolution`, `dispute_resolved_at`. `dispute_state = null` means no dispute.

API:

```text
POST  /api/v1/reliability-events/:id/dispute   (open — subject only)
PATCH /api/v1/reliability-events/:id/dispute   (resolve — organizer side / staff)
```

- **Open** (`handleOpenDispute`): only the record's subject may contest it — the subject party's user owner, or a manager of the subject party's owning entity. One dispute per record. Opening sets `dispute_state = open`, `disputed = true`, so the record drops out of reputation totals until resolved.
- **Resolve** (`handleResolveDispute`): a manager of the event's owning entity, or platform staff (`super_admin` / `platform_admin` / `platform_moderator`; a read-only auditor is deliberately excluded). `resolution` is `upheld` (record stands and resumes counting) or `retracted` (record excluded from reputation). Both clear `disputed`.
- Summary now excludes `retracted` records; `open` disputes remain held out via `disputed`. The engagement list surfaces `dispute_state`.

---

## Verification

Local, end-to-end, with a subject session and an unrelated (outsider) session:

```text
baseline summary totals                        -> positive:2, disputed:1
outsider opens dispute                         -> 403 DISPUTE_FORBIDDEN
subject opens dispute (confirmed_attendance)   -> 201 state=open;  totals positive:1, disputed:2
open again                                      -> 409 DISPUTE_EXISTS
outsider resolves                               -> 403 DISPUTE_RESOLVE_FORBIDDEN
manager resolves upheld                         -> 200 state=upheld; totals positive:2, disputed:1
resolve again                                   -> 409 DISPUTE_NOT_OPEN
dispute + resolve retracted (completed_partic.) -> record excluded; totals positive:1, disputed:1
resolve with bad value on an open dispute       -> 400 DISPUTE_RESOLUTION_INVALID
dispute unknown record                          -> 404 RELIABILITY_NOT_FOUND
audit                                           -> reliability.dispute.opened x3, resolved x2
```

---

## Deferred (next slices)

- frontend UI for opening/resolving disputes (roster + a subject-facing surface);
- free-text feedback model;
- public / cross-entity reputation exposure (still gated on anti-abuse maturity).

---

## Do not regress

- Only the subject may open a dispute; only the organizer side or platform staff may resolve. A read-only auditor cannot resolve.
- One dispute per record; resolve only an `open` dispute.
- Keep disputed (open) records out of polarity totals and `retracted` records out of the summary entirely.
- Keep dispute states as a reference table, not an enum.

---

## Next recommended work

Add the dispute UI to the reputation surfaces, or continue the link guard domain onto feed/comments.
