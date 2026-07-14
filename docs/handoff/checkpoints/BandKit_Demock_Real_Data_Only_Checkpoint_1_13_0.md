# BandKit — De-mock: Real Data Only Checkpoint 1.13.0

## Status

Accepted checkpoint.

Organizational pass: every visible surface is now either backed by the real API or honestly labeled "In development". The app no longer pretends — no fake logged-in user, no fake numbers, no plausible-looking mock content next to real panels. A new user can register, verify, log in and use the product end-to-end.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## What changed

### Identity is real (the root fix)

- `src/lib/auth/session.ts`: removed the mock session fallback that invented a logged-in "Alex Rhythm" from localStorage. **No session = guest.** Guests get the landing page and honest "login required" gates; the mock `createCurrentUser` is gone.
- Right rail (`commonBlocks.ts`): profile card now shows the real session user (name, handle, email-verified badge) and renders nothing for guests; the fake "Reliability 4.8 / 37 events / 96%" card and the mock "upcoming" card are removed; the security card only states what the session actually knows; role/verification/uiState QA switchers are super_admin-only (everyone else gets locale/theme).
- The fake "3 unread" notification badge in the top bar is removed.

### Pages: real data or honest "In development"

- **/feed** — quick actions + the live RealFeed panel only. Mock posts, fake KPI greeting, mock composer and filter chips are gone. Subtitle no longer says "on mock data".
- **/bands** — new real entities directory (`RealDirectories.ts`): the list from `GET /entities` plus a create form (`POST /entities`, all entity types). Mock band cards gone.
- **/events** — real events list from `GET /events` + the existing real create/slots/engagements panels. Mock timeline gone.
- **/documents** — real records from `GET /documents` + an honest note that file storage is a later phase. Mock riders/contracts gone.
- **/profile/me** — real session user header + real professions and reliability panels. Mock "Alex Rhythm / Helsinki / activity" gone. Other profiles → "In development".
- **/moderation** — real reports queue only (fake queue KPIs and mock complaint cards removed).
- **/settings/security** — real 2FA panel + logout (mock trust checks removed).
- **In development** (new honest state): /marketplace, /notifications, /bands/:id, /events/:id, /bands/new, /events/new, /documents/:id, /complaints/new, other users' profiles. Copy says explicitly: this section is not wired yet; everything else is live data.
- Quick-create cards now route to the real surfaces (/bands, /events) instead of the removed mock wizards.

### Registration works for real names

- Backend fix: a Cyrillic entity name slugified to an empty string and was rejected (`ENTITY_SLUG_INVALID`). Non-latin names now fall back to a generated slug.

---

## Verified end-to-end in a real browser (fresh account)

```text
guest на /feed                      -> "Доступ ограничен / Нужно войти" (не фейковый юзер)
/register форма                     -> 201, dev-токен показан в сообщении
/auth/verify-email форма            -> "Email подтверждён"
/login форма                        -> редирект на /feed, rail показывает реальное имя
/bands: создать "Моя первая группа" -> появляется в реальном списке (после slug-фикса)
/events                             -> реальные события, mock-timeline нет
/documents                          -> реальные записи, mock-файлов нет
/profile/me                         -> реальное имя, панели professions/reliability
/chats                              -> честное "вы не состоите ни в одной комнате"
/marketplace                        -> "В разработке"
консоль без ошибок
```

---

## Do not regress

- No session = guest. Never resurrect the localStorage mock user.
- Every number/name/card shown to a normal user must come from the API or be an explicit "In development" state — no plausible mock content.
- QA switchers stay behind super_admin diagnostics.
- Keep the dev verify token out of production responses (already env-gated).

---

## Next recommended work

Resume Phase 4 domains (files), or polish the real surfaces (entity detail pages backed by GET /entities/:id, real notifications).
