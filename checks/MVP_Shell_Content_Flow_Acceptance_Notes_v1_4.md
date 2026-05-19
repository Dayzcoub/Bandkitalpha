# BandKit MVP Shell v1.4 — Content & Flow Acceptance Notes

## Scope

This pass continues from v1.3 visual alignment and keeps the project in MVP shell mode. It does not implement backend, real auth, real messaging, real uploads, payments or social graph logic.

## Added

- Workspace dashboard composition on `/feed`.
- Localized mock content for feed, chats, documents, marketplace and moderation.
- Quick action cards for post, band, event and document creation.
- Trust checks and security rail blocks.
- Permission matrix placeholders for future RLS-backed permissions.
- Timeline event layout, chat policy block, document hub and admin/audit refinements.

## Guardrails preserved

- No inline styles.
- No pixel hacks.
- No backend calls.
- Texts are routed through i18n keys.
- Assets remain language-neutral.
- Layout follows desktop left rail / content / right rail and mobile top bar / content / bottom nav.
