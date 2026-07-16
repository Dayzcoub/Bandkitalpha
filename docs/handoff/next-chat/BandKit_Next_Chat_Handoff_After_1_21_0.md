# BandKit — Next Chat Handoff After 1.21.0

## Status

```text
1.21.0 — friendships, and `circle` finally means friends
```

Repository / branch / host:

```text
Dayzcoub/Bandkitalpha
main
https://bandkitdev.mywire.org   (HTTPS staging, NOT prod)
```

Deploy: push `main` → GitHub Actions "Deploy staging" → `sudo -n /usr/local/sbin/bandkit-staging-deploy`
→ `scripts/staging-smoke-api.sh`. ~38s. Migrations `0020`–`0026` applied automatically.

---

## What happened in the 2026-07-16 session

Twenty commits. Three things, in order: an access-control audit, an architecture audit,
and wave 2 of the resulting debt.

### The access-control class is closed — eight holes

`/security-review` had never been run despite being required per slice. It found five
live holes on top of three fixed earlier. All eight are gone (1.15.2–1.15.4):

| Hole | Fixed |
|---|---|
| Admin console — 13 endpoints, no session resolution at all | 1.15.2 |
| `GET /entities` unscoped; all five on staging were `visibility=members` | 1.15.3 |
| `GET /entities/:id` — `canViewEntity({id:'staging-reader'}, …)`, a hardcoded actor making the check always true | 1.15.3 |
| `POST /entities` — actor taken from an `x-bandkit-dev-user` **header** | 1.15.3 |
| `GET /chat-rooms`, `POST /dev/seed-demo` — deleted, not gated: nothing called them | 1.15.4 |

**The lesson that keeps paying:** in three of the eight, a *test asserted the vulnerable
behaviour as the contract*. The admin contract smoke demanded anonymous `200`; the API
smoke created entities through the header backdoor. Green meant the hole was still there.
When fixing an access hole here, first check what asserts the current behaviour.

### Infrastructure, done by the owner

- **Old VPS `141.98.87.9` decommissioned** (BandKit only; its Amnezia VPN deliberately
  left running — do not touch that box's nginx/docker). It had been serving every hole
  over plain HTTP on pre-1.14.0 code.
- **`owner@bandkit.local` deleted** from staging — a `super_admin` whose password is in
  the repo, which walked straight through the console gate.
- Demo duplicates cleaned: 212 events → 1.

### Three new documents

- `BandKit_Communication_Domain_v1` — maps 11 chat documents into one domain, names the
  open decisions. **Not a source of truth**; the Foundation model and the two mandatory
  chat specs outrank it.
- `BandKit_Specification_Gap_Audit_v1` — where no logic is described at all.
- `BandKit_Architecture_Review_v1` — 34 domain cards, completeness matrix,
  contradictions, priority. **P0 is empty**: both blocking contradictions were decided.

### Two owner decisions that unblocked everything

**Realtime is out of MVP** (Lifecycle §5.1). Chat is REST with explicit refresh or
polling. Revoke requirements were *not weakened* — restated for transports that exist
(REST, files, server caches). WS/SSE/presence/typing → post-MVP slice and a future
`BandKit_Realtime_Domain_v1`. **Do not build a `RealtimeProvider` or a transport
abstraction before a second transport exists.**

**Anonymization only; no hard delete** (1.18.0). The `users` row and a stable `user_id`
always survive. And the review's "nine states, zero transitions" turned out to be three
state machines in one column — now `status` (active|deactivated|anonymized),
`email_verified`, `sanction`, plus `account_termination_reason`/`terminated_at`.

### Chat: mandatory slices 1 and 2 (mostly)

- **1.16.0–1.16.2** — canonical personal dialogue. The pair lives on `chat_rooms`
  (`user_low_id < user_high_id`, partial unique index), atomic open-or-create, one chat
  per entity, ownership User XOR Entity. All enforced by the database.
- **1.17.0** — message requests + incoming privacy (`dm_policies`, `users.dm_policy`).
- **1.21.0** — friendships, so `circle` exists. **All five §2 policies now real.**

### Wave 2

- **1.19.0 Invitations** — not a domain: `entity_memberships.status` has had `'invited'`
  since `0002`. The flow was missing, and its absence was **a live privacy bypass** —
  adding someone as `active` gave you shared context, hence the right to message them
  past their own `dm_policy`. Two API calls. Closed.
- **1.20.0 Notifications** — references, never text. §10 forbids revealing a closed
  entity's name without access, so nothing is frozen: the subject resolves at read time.
- **1.21.0 Friends** — the personal graph; `circle` reads it and nothing else.

---

## THE NEXT TASK — anti-spam limits

`Lifecycle §2` requires limits "по actor, IP/device/risk context и временному окну".
Built: one starter message per request. Missing: everything else.

**Why it is next, not later.** §23 says slice 2 cannot be called done without it, and
this session added two new unbounded write paths that each notify a stranger:

```text
POST /me/friends/:userId      -> raises friend_request for the target
POST /chat-rooms/:id/messages -> first message raises conversation_request
POST /entities/:id/members    -> raises entity_invitation for anyone, from any entity you manage
```

None is a permission hole — each grants nothing without consent. All three are
unsolicited mail, and nothing bounds the rate.

**Decide first (§23 requires it implemented *or explicitly agreed*):** are IP/device/risk
in MVP? The platform models none of them. Recommendation: per-actor + time window now,
IP/device/risk explicitly deferred and recorded in `§2` — otherwise slice 2 stays open
forever on infrastructure that is not planned.

---

## Then, in order

1. **SharedContext as a service.** It is a private function inside the chat module
   (`hasSharedContext`), and `Communication_Domain §5` names six sources of context —
   two are implemented. Consumers will be invitations, privacy, recommendations, search.
   Currently one consumer, so it is cheap; every week it is less so. This is a debt I
   created on 2026-07-16 and named in the same breath.
2. **Chat slice 3 — personal block.** Its substrate is a *new table*, not a friendship
   status: blocking is asymmetric and orthogonal (see 1.21.0). It must reach every
   REST/write path.
3. **Chat slices 4–9** in the mandatory order (`CLAUDE.md`). Slice 4 is now walkable —
   history policy + revoke on REST/files/caches.
4. **Event invitations.** `event_participants` has the same shape entity memberships had:
   defaults to `'invited'`, nothing writes it, no accept/decline. Not a bypass today
   (shared context needs `'confirmed'` there), but slice 5 needs the flow.
5. **The pool-ordering fix.** 26+ handlers take a pooled connection and then call
   `resolveSessionUser`, which takes a second — with `max: 5` that deadlocks. Measured:
   20 parallel `GET /entities/demo-band` → 14×500. Raising `max` cannot fix it.

---

## Do not regress

Everything below is enforced somewhere and was expensive to learn.

- **Server is the source of truth for permissions.** Frontend roles are a UX hint.
- **A test may assert a hole.** Check what asserts current behaviour before you fix it.
- **One axis per column.** `users.status` cost a day. Sanctions, verification and
  lifecycle are separate; so are friendship state and blocking.
- **Status describes state, never the reason.** Reasons get their own field, and are
  derived server-side, never sent by the client.
- **Take the pooled connection last.** Anything calling `resolveSessionUser` while
  holding one deadlocks the pool.
- **Membership is consent.** Only entity creation and an accepted invitation may write
  `'active'` into `entity_memberships`. Any new path that does is a privacy decision.
- **Notifications hold references, never rendered text.**
- **`circle` is the personal graph; `shared_context` is the working one.** Never alias.
- **Rejection is invisible to the sender** — message requests answer `409
  CONVERSATION_REQUEST_PENDING` whether pending or rejected. Do not "improve" it.
- **Canonical pairs**: personal dialogues and friendships both use
  `user_low_id < user_high_id`. That is what makes the pair unordered.
- Chats are `server_managed`, never E2EE in UI or docs.
- Reference tables, not enums. Schema changes only via migrations. i18n keys only.

---

## Useful facts

- **I have SSH to the staging VPS** from this Mac: `ssh bandkit@194.87.105.244`
  (= `bandkitdev.mywire.org`, hostname `r1223947`). Standing rule from the owner: **read
  freely; anything irreversible needs their explicit yes for that specific action.**
- **`scripts/staging-deploy.sh` in the repo DOES NOT RUN.** The pipeline calls a
  root-owned wrapper on the VPS, outside version control, which reimplements the deploy
  and has no seed step. A green deploy proves nothing about that file. The smoke, by
  contrast, does run from the repo. Verify against `sudo -n cat
  /usr/local/sbin/bandkit-staging-deploy`.
- **Accounts on staging:** only `user@bandkit.local` / `UserPass123` can log in (the
  deploy seeds it via `seed-auth.mjs --only=`). `demo-manager@bandkit.local` has **no
  password there** — it exists only in local dev DBs. Do not trust the old handoff on
  this.
- Local dev: `PORT=3001 node src/index.js` from `server/`, env not auto-loaded
  (`set -a; . ./.env; set +a`). **Test migrations on a clone**, never the working DB:
  `createdb x && pg_dump $DATABASE_URL | psql -d x`. Migration `0020` refuses to run
  while a `free_group` room exists — there is one in the local dev DB (`Dev Team Room`,
  14 messages, not mine to delete).
- `/dev/tcp` does not work in this shell: it reports every port closed, including live
  ones. Use `nc -z -w 4 host port`, and validate a probe against a known-good target
  before trusting a red result.
- Uncommitted `public/styles/*.css` + `package-lock.json` churn is build output the
  deploy wrapper restores. Leave it alone.

---

## Starter prompt for the new chat

```text
Продолжаем BandKit.
Repo: Dayzcoub/Bandkitalpha, ветка main.
Staging: https://bandkitdev.mywire.org (HTTPS, автодеплой по push в main).
Чекпоинт: 1.21.0. Хендофф: docs/handoff/next-chat/BandKit_Next_Chat_Handoff_After_1_21_0.md

За 16.07 закрыт класс дыр доступа (8 штук), проведён архитектурный аудит
(docs/handoff/spec/BandKit_Architecture_Review_v1.md — P0 пуст), и приняты два решения:
realtime вне MVP (Lifecycle §5.1) и только анонимизация без хард-делита (1.18.0).
Чат: обязательные срезы 1 и 2 сделаны, кроме анти-спама. Волна 2: приглашения,
уведомления, друзья — готовы, circle работает.

Следующая задача: анти-спам лимиты (Lifecycle §2). Сделан только лимит одного
стартового сообщения. Нужны лимиты по actor и временному окну на три новых
неограниченных write-пути, каждый из которых шлёт уведомление незнакомцу:
POST /me/friends/:id, первое сообщение в личный диалог, POST /entities/:id/members.
Перед кодом нужно решение: входят ли IP/device/risk в MVP (§23 требует «реализовать
или явно утвердить»). Моделей IP/device/risk в платформе нет — предлагаю
per-actor + окно сейчас, IP/device/risk отложить явно.

Работать маленькими вертикальными срезами, каждый через Security DoD (§16 Standard +
§11 chat-спеки), /security-review без high/critical, чекпоинт-док после верификации.
Проверять миграции на копии БД, а не на рабочей.
```
