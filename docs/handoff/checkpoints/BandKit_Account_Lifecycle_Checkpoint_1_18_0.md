# BandKit — Account Lifecycle Checkpoint 1.18.0

## Status

Accepted checkpoint. **Closes C1** — the last P0 of the architecture review. Migration
`0023`.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Spec: `Account_Data_Privacy_Deletion_Export_Rules_v1_0` §Account states

---

## The finding behind the decision

The review reported "nine account states, zero described transitions" and called it a
missing state machine. It was not missing. **`users.status` held three independent
machines in one column**, and three machines have no shared diagram — which is why
nobody could ever draw one:

```text
онбординг : registered → active            written by register/verify
санкции   : read_only, restricted, blocked read by SANCTIONED_STATUSES, written by nobody
уход      : deactivated, deleted, anonymized  barely read, written by nobody
```

Of nine values the code wrote two, read four, and never touched `verified`, `read_only`
or `anonymized`. And `registered` was pure duplication: it was always written together
with `email_verified = false`, and `active` with `email_verified = true`.

## The decision (owner, 2026-07-16)

**Anonymization only; no hard delete as a business state.** The users row and a stable
`user_id` always survive, for referential integrity, message history, moderation,
reputation and audit. Physical row deletion, if ever needed for test data or an
administrative operation, is a technical procedure — not a state of the business model.

**Status describes state, never the reason for it.** Otherwise every new reason for
leaving grows a new status.

## What the schema looks like now

| Ось | Колонка | Значения |
|---|---|---|
| Жизненный цикл | `status` | `active` · `deactivated` · `anonymized` |
| Подтверждение | `email_verified` | boolean (уже существовал) |
| Санкция | `sanction` | `null` · `read_only` · `restricted` · `blocked` |
| Причина ухода | `account_termination_reason` | `SELF_REQUEST` · `MODERATION` · `LEGAL` · `SECURITY` · `OTHER` |
| Когда и кем | `terminated_at`, `terminated_by` | |

`anonymized` is terminal: no login, no recovery, personal data cleared or irreversibly
de-identified. `deactivated` is reversible — **the account can still sign in**, which is
how it comes back; every permission check bars it until then. `deleted` is gone from the
CHECK entirely.

A shape constraint ties termination together in both directions: an anonymized account
without a reason and a live account carrying a termination date are equally impossible.
Without it the field would fill with "anonymized, cause unknown" — the exact hole the
reason field exists to close.

## Two permission predicates, not one set

`SANCTIONED_STATUSES` read a column that meant three things. It is replaced by:

- `isDenied(actor)` — gone, switched off, or blocked. Nothing is available.
- `isBarred(actor)` — the above plus the softer sanctions. Cannot write; **keeps reading
  and keeps the safety affordances.**

A `restricted` account can still file a report. That is deliberate: taking safety tools
from a sanctioned user punishes them for being sanctioned and silences a possible victim.

---

## Three regressions this created and caught

The axis split broke three checks that read `status` directly, bypassing the constant.
All three would have failed **open**:

```text
canManageOwnParty  status !== 'blocked' && status !== 'deleted'   -> always true after the split
canFileReport      same
canSubscribe       same
handleLogin        status === 'blocked' || status === 'deleted'   -> anonymized could sign in
```

`blocked` had moved to `sanction`, `deleted` no longer existed — so every one of those
comparisons silently became true. Caught by grepping for direct status comparisons after
replacing the constant, not by tests. Anything that reads an axis directly is where the
next split will break too.

**And an older bug fell out of it:** `read_only` was never in `SANCTIONED_STATUSES`, so a
read-only account could write. Nothing ever set that status, so it never bit. It is in
`WRITE_BLOCKING_SANCTIONS` now.

## The C1 bug

```sql
reports.reporter_user_id uuid not null references users(id) on delete set null
```

The only NOT NULL + SET NULL pair in the database: the FK had to write NULL into a column
forbidding it, so any user who had ever filed a report could not be deleted even by a
technical procedure. The other 21 SET NULL columns are all nullable — the intent (keep
the case, anonymize the reporter) was unambiguous. `drop not null`.

Note that hard delete stays impossible for anyone with reputation, and now by design:
`parties_link_matches_kind` requires an individual Party to have a `user_id`, and
`reliability_events.subject_party_id` RESTRICTs parties. That is a guard, not a defect —
the business path is anonymization.

---

## Verification

On a clone of the real database. Backfill: `registered=4, active=11` → `active=15`, no
data lost, `reports.reporter_user_id` nullable.

Every invariant attacked in SQL, each rejected:

```text
status = 'registered' | 'deleted' | 'blocked'   -> users_status_check
anonymized without a reason                     -> users_termination_shape
anonymized with reason but no date              -> users_termination_shape
live account carrying terminated_at             -> users_termination_shape
unknown termination reason                      -> users_account_termination_reason_check
unknown sanction                                -> users_sanction_check
correct anonymization / sanction on live account-> accepted
```

Behaviour, against a running backend:

```text
login: active 200 · sanction=blocked 403 · anonymized 403 · deactivated 200 (it is the way back)
restricted: read 200 · write 403 · file a report — passes permission (400 on payload, not 403)
read_only: write 403 (previously would have written)
no sanction: write 201
registration -> status=active, email_verified=false
```

Gates: `npm run check`, `tsc --noEmit`, API smoke, `seed-auth` — all green.

---

## Do not regress

- One axis per column. Reading `status` to answer "is this account sanctioned" is what
  produced this whole mess.
- Never encode the reason for a state in the state.
- `anonymized` is terminal and login is closed there; `deactivated` must keep login open,
  or there is no way back.
- Any actor loaded for a permission decision must select `sanction` — without it
  `isBarred` silently passes. `resolveSessionUser`, login, and the two chat lookups do.

---

## Still open, and now visible

- **Nothing writes a sanction.** `moderation_actions` exists; applying a sanction is the
  moderation domain's job and has no code. The axis is ready and unused.
- **Nothing anonymizes.** No endpoint, no admin action, no self-service. The states and
  their invariants exist; the transitions do not. That is the next slice of this domain.
- **Party lifecycle** (review 4.1) is still underived: Party has no status and its state
  is inferred from `users`/`entities` by nobody in particular. An anonymized user's Party
  still looks alive to every query that does not join.
- Re-registration on a released email (`§22.19`) — undecided: the anonymized row keeps its
  email, so today the address stays taken forever.
