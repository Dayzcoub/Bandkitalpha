# BandKit MVP Shell Pass 2 — Acceptance Notes v1.2

Baseline: `BandKit_MVP_Shell_v1_1_local_dev_kit.zip`.

## Scope

Pass 2 keeps the product in MVP Shell mode. It does not implement real social-network backend logic. The goal is a stronger shell foundation for later flows.

## Added / changed

- QA controls moved from the desktop topbar to a reusable right rail QA card.
- Mobile can reach the same QA controls because right rail collapses below page content.
- Added current route inspector with shell, access and guard result.
- Added admin route map preview for mock access-state checks.
- Added structured onboarding placeholder flow.
- Added light/dark shell variables to reduce dark leftovers in light mode.
- Fixed strict external-link and short-link policy regex.
- Added i18n keys for new QA, onboarding, shell/access and mock status labels.
- Updated local preview health/version marker to `1.2.0-shell-pass-2`.

## Explicitly not included

- Real auth, OAuth, SMS or 2FA backend.
- Supabase database integration.
- Realtime chat.
- Push notifications.
- File upload security pipeline.
- Production moderation automation.

## Checks run

```bash
npm run check
npm run build
npm run local:health
find dist/js -name '*.js' -print -exec node --check {} \;
PORT=5299 node scripts/serve-dist.mjs
curl http://127.0.0.1:5299/__bandkit_health
```

Manual route HTTP smoke via local preview server:

```txt
/                  200
/feed              200
/onboarding        200
/admin             200
/settings/security 200
/chats/c1          200
/marketplace       200
/missing           200 fallback shell
```

Link policy smoke:

```txt
hello              allowed
example.com        blocked external_url
http://example.com blocked external_url
bit.ly/x           blocked shortener
```
