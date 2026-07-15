# BandKit — Next Chat Handoff After 1.15.1

## Status

Current accepted baseline:

```text
1.15.1 — real event detail page + scoped event/slot reads
```

Repository / branch / host:

```text
Dayzcoub/Bandkitalpha
main
https://bandkitdev.mywire.org   (HTTPS staging preview, NOT prod)
```

Deploy path (verified working):

```text
push main → GitHub Actions "Deploy staging" → ssh bandkit-deploy →
sudo -n /usr/local/sbin/bandkit-staging-deploy → scripts/staging-smoke-api.sh
```

Migrations `0011`–`0019` are applied on the VPS automatically by that pipeline.

---

## What is done (Phase 4)

Plan in CLAUDE.md: `reputation → link guard → moderation → feed → files → PDF → billing`.

| Domain | State | Checkpoints |
|---|---|---|
| reputation | done | 1.11.0–1.11.5 |
| link guard | done | 1.11.2 |
| moderation | done | 1.11.6–1.11.9 |
| feed | done | 1.12.0–1.12.2 |
| files | done | 1.14.0 |
| **PDF** | **skipped by decision** | see 1.15.0 |
| billing | done | 1.15.0 |
| E2EE | **removed from the roadmap** by the owner (now a future epic) | — |

Plus two organisational passes: de-mock (1.13.0), real entity detail (1.13.1), real event detail (1.15.1).

**Why PDF was skipped** (do not silently "finish" it): TZ §13 wants `PDF из конкретной версии` of a *structured* document, but `documents` hold no structured content — only a title and an uploaded file. The tools that would produce that content (rider/offer wizards, branded PDF export) are listed in the Documents policy as future paid/pro. A PDF exporter today would render a title page. Revisit only after structured documents exist.

**Billing has no payments on purpose.** The Monetization policy forbids in-platform payments at MVP ("MVP must not depend on them"), so billing = plans + enforced limits. `PUT /entities/:id/plan` is the policy's staff-only "admin override for testing/support". Do not add a Buy button; there is nothing to buy.

---

## THE NEXT TASK — align chat with the new canonical conversation model

The owner shipped `f9e4425` + `501d37d` while the last slice was in flight. They add a **mandatory spec** and change the rules:

```text
docs/handoff/spec/BandKit_Chat_and_Messaging_Security_v1.md
```

It is now #3 in CLAUDE.md's required reading and **replaces TZ §8, refines §9**. Read it before touching chat.

The model it mandates:

1. **Personal conversation** — exactly one canonical dialogue per unordered user pair; `conversation_scope = personal`, `entity_id = null`, `participant_count = 2`. "Написать" from anywhere (group, event, catalogue, comment) opens **that same** dialogue. Entities and their admins never get access to it; losing membership never moves or deletes it.
2. **Entity conversation** — a group chat belonging to exactly one entity. A group chat and an event chat are independent even with identical membership.

No `entity direct message`, no "DM inside a group/event", no intermediate types.

### The gap in the current code (measured, not guessed)

```text
chat_rooms.type CHECK allows: direct, free_group, entity, event, safety, admin
no conversation_scope column
NO uniqueness on the personal pair  -> a second dialogue for the same pair is possible today
live data: 1 free_group, 1 event, 1 direct
```

So the work is a real migration + backfill, not a rename. Chat DoD lives in the spec §11 — every chat slice must prove: no second personal dialogue per pair, no personal dialogue attached to an entity, no entity chat without an entity reference, no access after membership loss, no entity-admin access to personal dialogues, server-side authz on every read/write, Link Guard on all write paths, immutable evidence snapshots, audit for moderation access.

### Hard rule that is easy to break

> **Current chats are NOT E2EE** — they are `server_managed`, because server-side Link Guard, moderation evidence and search need the text. **Never claim E2EE in UI or docs until the full protocol exists.** E2EE is a separate future epic for personal conversations only; entity conversations stay `server_managed` by design. Do not disable existing protections for an E2EE stub.

---

## Open items the owner owns (not blocked on code)

1. **Resend API key is not on the VPS.** Email verification code is deployed and works, but the live host still returns `email_sent=false` and falls back to the dev token. To finish: set `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MAIL_FROM` in `/opt/Bandkitalpha/server/.env`, restart `bandkit-backend`. Deliverability caveat: `bandkitdev.mywire.org` is dynamic DNS — without SPF/DKIM/DMARC mail will land in spam; verify a real domain in Resend, or use `onboarding@resend.dev` (delivers only to the account owner).
2. **The old VPS `141.98.87.9` was still live** at the host move — a second, non-HTTPS copy of staging with its own DB that will drift. Decommission or keep deliberately.
3. **~50 duplicate demo rows on the VPS.** The cause is fixed (seed-demo is idempotent since `34a5b38`), but the accumulated copies remain. Clean with, on the VPS:
   ```bash
   cd /opt/Bandkitalpha/server
   node --env-file=.env scripts/cleanup-demo-duplicates.mjs          # dry run
   node --env-file=.env scripts/cleanup-demo-duplicates.mjs --apply
   ```

---

## Debt worth raising early

**`/security-review` has never been run**, although CLAUDE.md's DoD §16.12 requires it per slice ("без high/critical"). The §16 items were held manually, and that manual pass found **three holes of the same class**:

```text
GET /documents        unauthenticated + unscoped -> every document on the platform   (fixed 1.14.0)
GET /events           unauthenticated + unscoped -> every event, with location/time  (fixed 1.15.1)
GET /events/:id/slots public "by design comment" -> private event plans by id        (fixed 1.15.1)
```

Three of a kind means the class is likely not exhausted. Audit the remaining unauthenticated reads (`/chat-rooms`, `/taxonomy`, `/plans`, admin bridges) and run the gate.

---

## Do not regress

- Server is the source of truth for permissions; frontend roles are a UX hint.
- No session = guest. The mock session user was deleted in 1.13.0 — never resurrect it.
- Everything visible is real API data or an explicit "In development" state (`inDevelopment()` in `src/routes/pages.ts`). No plausible mock content.
- Files never in PostgreSQL, never served from the web root; trust magic bytes, not extensions; keep `attachment` + `nosniff`.
- Plan limits stay enforced in the write paths, not merely displayed; no `entity_plans` row must always mean free.
- Reference tables, not enums. Schema changes only via migrations.
- i18n keys only; no inline styles.
- The dev verification token is returned **only** when no mail went out and we are non-production.

---

## Useful facts for the next session

- Local dev: backend `PORT=3001 node src/index.js` from `server/` (env is NOT auto-loaded: `set -a; . ./.env; set +a`). Preview proxies `/api` to **3001** — watch for a stale backend already on that port; a fresh one loses the EADDRINUSE race and you keep hitting old code (symptom: new routes 404).
- There is no dev-header auth shortcut: `resolveSessionUser` reads only the `bandkit_session` cookie. Either log in through the UI (`demo-manager@bandkit.local` / `DemoPass123`, or `owner@bandkit.local` / `OwnerPass123` for staff) or insert a `sessions` row and use `curl -b bandkit_session=<token>`.
- `preview_click` can fire before an async `mount()` attaches its listener; verify with a programmatic `btn.click()` when a click seems dead.
- Rows injected after render need `pushState` + a dispatched `popstate` to navigate (the app binds `[data-route]` only at render time).
- Uncommitted `public/styles/*.css` + `package-lock.json` churn is pre-existing build output from earlier sessions — not part of any slice; leave it alone.

---

## Starter prompt for the new chat

```text
Продолжаем BandKit.
Repo: Dayzcoub/Bandkitalpha, branch main.
Staging: https://bandkitdev.mywire.org (HTTPS, автодеплой по push в main).
Текущий чекпоинт: 1.15.1. Хендофф: docs/handoff/next-chat/BandKit_Next_Chat_Handoff_After_1_15_1.md

Фаза 4 закрыта: reputation, link guard, moderation, feed, files, billing.
PDF пропущен осознанно (нет структурных документов), E2EE выведен в отдельный
будущий epic — оба решения зафиксированы в чекпоинтах 1.15.0 и в CLAUDE.md.

Следующая задача: привести chat к канонической модели из новой обязательной спеки
docs/handoff/spec/BandKit_Chat_and_Messaging_Security_v1.md (заменяет ТЗ §8):
один канонический личный диалог на пару пользователей (conversation_scope=personal,
entity_id=null) и отдельные чаты сущностей. Сегодня в схеме этого нет: типы комнат
direct/free_group/entity/event/safety/admin, нет conversation_scope, нет уникальности
личной пары — нужна миграция с backfill.

Чаты остаются server_managed (не E2EE) — Link Guard, evidence и модерация требуют
текста. Не заявлять E2EE в UI.

Работать маленькими вертикальными срезами, каждый — через Security DoD (§16 Standard
+ §11 chat-спеки), чекпоинт-док после верификации.
```
