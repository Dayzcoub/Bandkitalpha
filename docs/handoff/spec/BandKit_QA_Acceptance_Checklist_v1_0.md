# BandKit QA Acceptance Checklist v1.0

## 1. Цель

Чеклист нужен для приёмки первого прохода кода и последующих модулей. Проверять не “на глаз красиво/некрасиво”, а по контракту.

## 2. App startup

- [ ] App starts locally without errors.
- [ ] No console errors on initial load.
- [ ] All core routes are reachable.
- [ ] 404 page works.
- [ ] Error boundary works.
- [ ] Mock auth state can switch guest/user/admin/moderator.

## 3. Layout contract

- [ ] Desktop shell uses correct zones.
- [ ] Mobile shell uses top bar + bottom nav.
- [ ] Navigation does not jump between screens.
- [ ] Primary actions have stable placement.
- [ ] Cards use shared spacing/radius/tokens.
- [ ] Forms align labels/controls consistently.
- [ ] Modals/drawers follow common structure.
- [ ] Tables have mobile fallback.
- [ ] No visible overflow at common widths.

Test widths:

- [ ] 360px
- [ ] 390px
- [ ] 430px
- [ ] 768px
- [ ] 1024px
- [ ] 1280px
- [ ] 1440px
- [ ] 1920px

## 4. i18n

- [ ] RU locale works.
- [ ] EN locale works.
- [ ] Language switch persists.
- [ ] No hardcoded UI Russian strings in components.
- [ ] Missing key behavior is safe.
- [ ] Long translated strings do not break buttons/cards.
- [ ] Dates are locale-aware.
- [ ] Times use timezone-aware formatter.
- [ ] Numbers/currency future-ready via formatter.

## 5. Assets

- [ ] Production assets pack connected.
- [ ] Icons are sharp on desktop/mobile.
- [ ] Transparent PNG/WebP render without background boxes.
- [ ] Fallback avatars work.
- [ ] Fallback covers work.
- [ ] Empty state illustrations work.
- [ ] No text embedded in non-brand graphics.
- [ ] Asset imports use registry/component layer.

## 6. Auth / onboarding shell

- [ ] Login screen exists.
- [ ] Register screen exists.
- [ ] Email verification screen exists.
- [ ] Phone verification screen exists.
- [ ] 2FA screen exists.
- [ ] Recovery screen exists.
- [ ] Onboarding screen exists.
- [ ] Guest-only route redirect works in mock mode.
- [ ] User-required guard works in mock mode.

## 7. Roles / permissions

- [ ] Guest sees public/guest routes only.
- [ ] User sees app routes.
- [ ] Unverified user sees restricted actions.
- [ ] Moderator sees moderation shell.
- [ ] Admin sees admin shell.
- [ ] Ordinary user cannot open admin pages.
- [ ] Restricted state does not leak private data.

## 8. Feed

- [ ] Feed route renders.
- [ ] Post card renders with avatar fallback.
- [ ] Like/comment/repost actions are present as UI.
- [ ] Report action is present.
- [ ] Empty feed state exists.
- [ ] Loading state exists.
- [ ] Error state exists.
- [ ] Link-block notice exists.

## 9. Profiles / bands

- [ ] Profile page renders.
- [ ] Own profile route renders.
- [ ] Band list renders.
- [ ] Band detail renders.
- [ ] Missing avatar/cover fallback works.
- [ ] Role badges render.
- [ ] Reputation badge renders.
- [ ] Admin actions hidden for non-admin.

## 10. Events

- [ ] Events list renders.
- [ ] Event detail renders.
- [ ] Date/time block renders locale-aware.
- [ ] RSVP panel exists.
- [ ] Participants list exists.
- [ ] Empty state exists.
- [ ] Restricted/private event state exists.

## 11. Chats

- [ ] Chat list renders.
- [ ] Chat room renders.
- [ ] Message list renders.
- [ ] Message composer exists.
- [ ] Link-blocked message state exists.
- [ ] Report message action exists.
- [ ] Empty chat state exists.

## 12. Documents

- [ ] Documents list renders.
- [ ] Document detail placeholder renders.
- [ ] Version placeholder exists.
- [ ] PDF export placeholder exists.
- [ ] Permission/restricted state exists.

## 13. Moderation / admin

- [ ] Moderation queue renders.
- [ ] Complaint detail renders.
- [ ] Moderator action panel exists.
- [ ] Audit trail panel exists.
- [ ] Admin dashboard renders.
- [ ] Users table/list renders.
- [ ] Role matrix placeholder exists.
- [ ] Localization admin placeholder exists.

## 14. Security UX

- [ ] External link is blocked or warned in mock flow.
- [ ] Report button exists for user-generated content.
- [ ] Verification-required state exists.
- [ ] 2FA-required state exists for admin actions.
- [ ] Suspended/limited account state exists.

## 15. Code quality

- [ ] TypeScript strict or equivalent is enabled.
- [ ] ESLint passes.
- [ ] Formatter passes.
- [ ] No inline style layout hacks.
- [ ] No `!important` abuse.
- [ ] No duplicated nav configs.
- [ ] No direct random asset paths in domain components.
- [ ] Shared components are used consistently.

## 16. Acceptance decision

First pass is accepted only when:

- all critical shell routes exist;
- layout is stable;
- i18n works;
- assets work;
- permissions states are visible;
- the project is ready for real backend integration without redesigning the foundation.
