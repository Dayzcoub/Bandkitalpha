# BandKit — Phase 4 Moderation Restore Actions Checkpoint 1.11.9

## Status

Accepted checkpoint.

Closes out the moderation domain's sanction loop: every sanction is now reversible by staff with the same reason+audit discipline ("appeals and reversals", Platform Owner Operations spec). With this, the moderation MVP is complete: report (3 surfaces) → evidence → queue → triage → case detail → sanctions → restores.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/migrations/0015_moderation_restore.sql
server/src/modules/moderation/reports.routes.js   (restore actions; live state in detail)
src/modules/RealModerationReports.ts              (state-aware action buttons)
src/locales/en|ru/moderation.json                 (action.un* labels)
src/locales/bundles.ts                            (regenerated)
```

### Backend

- Migration `0015`: three new action types (`unhide_content`, `unrestrict_user`, `unsuspend_user`) + `metadata jsonb` on `moderation_actions`.
- **Faithful restore semantics:** sanctions now snapshot the prior status into the action's `metadata.prior_status`; a restore reads the matching sanction's snapshot back (fallback `'active'` for pre-0015 rows). Sanctions therefore layer and unwind correctly: `active → restrict → suspend → unsuspend ⇒ restricted → unrestrict ⇒ active`.
- State guards return `409 ACTION_STATE_MISMATCH` when the action doesn't fit the live state (unrestrict a non-restricted user, unhide a visible message, re-hide a hidden one, …).
- `GET /reports/:id` now returns `target_status` (live status of the accused / snapshot author) and `object_status` (live status of a reported chat message).

### Frontend

- The case-detail action row is now state-aware — only applicable actions are offered: a hidden message shows **Unhide**, a restricted user shows **Unrestrict**, a blocked user shows **Unsuspend**; otherwise the sanctions. Warning is always available. Same required-reason form.

---

## Verification

Backend (curl, staff + offender sessions):

```text
unrestrict while blocked                     -> 409 ACTION_STATE_MISMATCH
unsuspend                                    -> 200 (legacy row w/o snapshot -> 'active')
fresh cycle: restrict -> suspend -> unsuspend -> status 'restricted'  ✅ (prior restored)
             -> unrestrict                    -> status 'active'
restored offender POST message               -> 201 (write access back)
unhide_content                               -> 200, message status 'active', visible again
unhide again                                 -> 409
GET /reports/:id                             -> target_status + object_status present
```

Real browser (super_admin on /moderation):

```text
case detail offers warning/hide/restrict/suspend while target is active;
Restrict with reason -> buttons flip to Unrestrict (sanctions hidden);
Unrestrict with reason -> buttons flip back; history grows; no console errors.
```

---

## Moderation domain status

Complete for MVP: reports on chat messages / profiles / posts with preserved evidence, staff queue + triage states, case detail with action history, real sanctions (hide / restrict / suspend) and faithful restores — all reason-required and audited.

Still deferred (post-MVP by spec): temporary auto-expiring suspensions, appeals portal, entity-admin scoped moderation, evidence snapshots for future object types.

---

## Do not regress

- Sanctions must snapshot `prior_status`; restores must put it back, not blindly 'active'.
- Keep 409 state guards — no double-sanction or no-op restores.
- Restore actions carry the same required reason + audit event as sanctions.
- The action row must stay state-aware (never offer an inapplicable action).

---

## Next recommended work

Phase 4 next domain: feed (posts / subscriptions / comments) — report affordances on posts will then attach to real object ids.
