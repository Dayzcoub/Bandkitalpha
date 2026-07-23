# BandKit — Next Chat Handoff After 1.28.1

## Status

```text
1.28.1 — reputation foundation kept, reputation aggregate (F5) deferred out of MVP,
         and the sanctioned-manager reputation-write hole closed
```

Repository / branch / host:

```text
Dayzcoub/Bandkitalpha
main   (pushed — origin/main == HEAD)
https://bandkitdev.mywire.org   (HTTPS staging, NOT prod)
```

Deploy: push `main` → GitHub Actions "Deploy staging" → `sudo -n /usr/local/sbin/bandkit-staging-deploy`
→ `scripts/staging-smoke-api.sh`. Latest migration on disk is `0030`; the 1.28.x work
added **zero** migrations.

This handoff supersedes `After_1_21_0` (which was 7 checkpoints stale).

---

## Where the project is

**Phase 4 (domains) is closed.** reputation → link guard → moderation → feed → files →
billing all shipped; PDF skipped by decision; E2EE removed from roadmap to a future epic.
Detail lives in the checkpoint docs, not here.

**Architecture Freeze: F1–F6 closed** (F1 event visibility 1.24.0 / F2 privacy 1.25.0 /
F3 entity termination 1.26.0 / F4 party status 1.27.0 / F5 reputation 1.28.0 /
F6 declarative router 1.22.0). The router (F6, `server/src/router.js`) is the structural
fix for the access-control class: every route MUST declare `access` (`public`/`authed`/
`staff`) and a `limit` policy, or the server refuses to start.

**Communication spine: chat slices 1–2 done** (incl. anti-spam, 1.23.0). Canonical
personal dialogue, message requests + incoming privacy, account lifecycle, entity
invitations, notifications, friendships + `circle`. Migrations `0020`–`0026`.

**Social UI live in the portal** (2026-07-23): people search, friends, 4s chat poll,
notifications center, email confirmation flow — all on the Chats screen + the bell.
Mail is live on Resend/dayzcoub.com.

---

## What happened in the 2026-07-23 (F5) session

Two commits, both pushed.

### `docs(reputation)` — F5 deferred out of MVP, foundation kept (1.28.0)

F5 (reputation aggregate formula, recency, visibility) closed by **owner decision "not in
MVP"**, not by resolution. Like F1/F2/F4, the predicted Freeze cost ("Документ → пересчёт
истории") did not materialise:

- **No scalar rating.** The reputation spec's MVP-excludes forbid `public rating
  algorithm`/`complex scoring`/`marketplace ranking`. The aggregate is the structured
  verified-context summary already built (`handlePartyReliabilitySummary`).
- **Recency not baked.** If needed later, exposed as data (`first_at`/`last_at`, windows),
  never a decay index — so there is nothing to recompute.
- **No public layer.** Summary stays verified-context gated.

Foundation retained: `0011`/`0012`, record path, dispute flow (open→resolve), summary,
`/me/reliability`, roster panel. Extendable later without recomputing history.
See `checkpoints/BandKit_Reputation_Aggregate_Deferred_Checkpoint_1_28_0.md`.

### `fix(reliability)` — sanctioned managers can no longer write reputation (1.28.1)

Audit ("check the foundation for leaks / unauthorized use") found the **9th instance of
the recurring class**: `canRecordReliabilityEvent` and the dispute-resolve path fell back
to bare `canManageEntity`, which skips `isBarred`. A moderation-`restricted`/`blocked`
entity manager could still record reliability events and resolve disputes — the reliability
slices (1.11.x) predate `isBarred`/SANCTIONED (1.11.6+) and were never retrofitted. Same
"route older than the rule that guards it" as F2 (friend requests) and F4 (engagement).

Fix (zero migrations): record + dispute-resolve now `!isBarred && canManageEntity`;
opening a dispute about oneself is a defensive affordance gated `!isDenied` only (restricted
keeps it, like `canFileReport`); the shared `requireEngagementManager` doorway stays
unbarred (`canViewReliabilityEvents`) so restricted keeps READ; write-bar applied in the
POST handler. No data leak found. See `checkpoints/..._Sanction_Gate_Checkpoint_1_28_1.md`.

**Security gate:** DoD §16.12 was run **manually** on this slice (diff-level review, PASS,
no high/critical, access only narrows). The automated `/security-review` command could not
run — its cwd is the parent `BandKit/`, not the `Bandkitalpha/` git repo. Run it once from
an interactive session inside `Bandkitalpha/` to close the gate formally.

---

## What's next (choose one)

**Communication spine — the MVP backbone. Chat slices 3–9 remain:**

1. ~~atomic personal conversation~~ done
2. ~~message requests / incoming privacy / anti-spam~~ done
3. **personal block across ALL write/read paths** (+ its own table — blocking is
   asymmetric and orthogonal, NOT a friendship status). *Recommended next: no block
   exists in any path today, and the lifecycle spec makes it mandatory.*
4. entity history policy + immediate revoke over REST/files/caches
5. formal event-chat access lifecycle
6. forwarding / internal-link / file ACL, no auto-inheritance
7. edit/delete/moderation/evidence lifecycle
8. archive/delete/retention/legal-hold
9. abuse/security test matrix from the lifecycle spec

**Architecture Freeze — open decisions (mostly document-shaped, not big builds):**

| # | Decision | Blocks |
|---|---|---|
| F7 | Marketplace: money, moderation, lifecycle (no payments ⇒ classifieds board) | Marketplace |
| F8 | Shared context: full source list + staleness. *Cheapest today; touches 4 domains* | Communication, Privacy, Search, recommendations |
| F9 | Mandatory audit-action list + "audit ≠ analytics source" | Audit, Moderation, Analytics |
| F10 | Search over messages? (§14 forbids arbitrary reading; flagged "could become the project's main hole") | Search |
| F11 | Portfolio carrier: Party or User? | Portfolio, Marketplace, Media |
| F12 | `message_acknowledgements`: describe or delete | nothing |

**Future epics (explicitly post-MVP):** Realtime (D4), E2EE for personal chats.

---

## Debt to keep visible

- **`/security-review` gate** — DoD §16.12 requires it per slice; only ever run manually.
  Run the real command from inside `Bandkitalpha/`.
- **No `PermissionService` unit harness** — today's sanction bar has no automated test;
  the shell smoke can't seed a restricted user + engagement. Right home when a harness lands.
- **LOW (open):** `handleListReliabilityEvents` returns `moderation`/`hidden` layers to
  entity managers, while the summary keeps `moderation` staff-only. Not a cross-tenant leak
  (records belong to the manager's own engagement); a visibility-model inconsistency.
- **Reputation public layer** — explicitly deferred with F5; revisit only as an
  anti-abuse-gated slice if a public surface is ever wanted.
