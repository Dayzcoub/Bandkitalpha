# BandKit Development Handoff v1.0

## 1. Цель первого прохода разработки

Первый проход — собрать не всю соцсеть, а правильный **BandKit MVP Shell**: архитектуру, layout, роутинг, i18n, компоненты, assets, states и mock data layer. Это фундамент, на который потом безопасно ставится backend и бизнес-логика.

## 2. Входные материалы

Обязательные документы:

- `BandKit_TZ_v1_2.md`
- `BandKit_Interface_Layout_Contract_v1_0.md`
- `BandKit_App_Architecture_v1_0.md`
- `BandKit_Routing_Map_v1_0.md`
- `BandKit_Database_RLS_Model_v1_0.md`
- `BandKit_API_Backend_Contract_v1_0.md`
- `BandKit_Component_Inventory_v1_0.md`
- `BandKit_Security_AntiFraud_v1_0.md`
- `BandKit_QA_Acceptance_Checklist_v1_0.md`

Assets:

- `assets/BandKit_Production_Assets_v1_3_layout_contract.zip`

## 3. Recommended project setup

```txt
bandkit/
  package.json
  src/
    app/
    routes/
    layouts/
    components/
    modules/
    lib/
    locales/
    assets/
    styles/
    mocks/
    tests/
  public/
    assets/
  docs/
```

## 4. First pass scope

### Must build

- App bootstrap.
- Routing map pages.
- Auth shell screens.
- Main app shell.
- Admin shell.
- Theme tokens.
- i18n provider with RU/EN.
- Asset registry.
- Shared UI components.
- Domain placeholder components.
- Mock API layer.
- Empty/loading/error/restricted states.
- Mobile/desktop responsive behavior according to Layout Contract.

### Must not build yet

- real payments;
- real SMS provider;
- real email provider;
- production moderation automation;
- full chat backend;
- full reputation scoring;
- full document editor;
- AI features;
- marketplace matching algorithm.

## 5. Required folder structure

```txt
src/app
  App.tsx
  providers.tsx
  router.tsx

src/layouts
  AuthShell.tsx
  AppShell.tsx
  AdminShell.tsx
  PublicShell.tsx

src/components/ui
  Button.tsx
  Input.tsx
  Textarea.tsx
  Select.tsx
  Checkbox.tsx
  Switch.tsx
  Card.tsx
  Avatar.tsx
  Badge.tsx
  Modal.tsx
  Drawer.tsx
  Tabs.tsx
  EmptyState.tsx
  ErrorState.tsx
  LoadingState.tsx
  RestrictedState.tsx

src/components/layout
  TopBar.tsx
  SideNav.tsx
  BottomNav.tsx
  PageHeader.tsx
  ContentGrid.tsx

src/modules
  auth/
  profile/
  bands/
  feed/
  events/
  chats/
  documents/
  marketplace/
  notifications/
  moderation/
  admin/
  settings/

src/lib
  api/
  auth/
  permissions/
  i18n/
  assets/
  format/
  validation/
  security/

src/locales
  ru/common.json
  ru/auth.json
  ru/navigation.json
  ru/feed.json
  ru/profile.json
  ru/events.json
  ru/chats.json
  ru/documents.json
  ru/moderation.json
  ru/admin.json
  ru/errors.json
  en/common.json
  en/auth.json
  en/navigation.json
  en/feed.json
  en/profile.json
  en/events.json
  en/chats.json
  en/documents.json
  en/moderation.json
  en/admin.json
  en/errors.json
```

## 6. Required screens in MVP Shell

Implement placeholders with real layout and mock data:

- `/login`
- `/register`
- `/auth/verify-email`
- `/auth/verify-phone`
- `/auth/2fa`
- `/onboarding`
- `/feed`
- `/profile/me`
- `/profile/:profileId`
- `/bands`
- `/bands/:bandId`
- `/events`
- `/events/:eventId`
- `/chats`
- `/chats/:chatId`
- `/documents`
- `/marketplace`
- `/notifications`
- `/settings`
- `/settings/security`
- `/settings/i18n`
- `/moderation`
- `/moderation/complaints/:complaintId`
- `/admin`
- `/admin/users`
- `/admin/roles`
- `/admin/localization`
- `*` 404

## 7. i18n implementation rules

- No user-facing hardcoded strings in components.
- Use `t("namespace.key")` or equivalent.
- RU and EN must be present.
- Missing keys in dev can show technical key.
- Production should fallback to EN/RU and never show raw key.
- Dates/numbers/time use locale-aware formatters.

## 8. Asset implementation rules

- Unpack production assets into public/static assets folder.
- Build `assetRegistry.ts` from manifest or manually from metadata.
- Use `AssetIcon`, `Illustration`, `FallbackAvatar`, `FallbackCover` components.
- Do not embed UI text in images.
- Do not stretch SVG/PNG incorrectly.

## 9. Permission model in MVP Shell

Create mock permissions:

```ts
can(action, resource, context)
hasRole(role)
requiresVerification(action)
```

Use these guards on route/page level:

- user required;
- verified required;
- admin required;
- moderator required;
- band admin required;
- event admin required.

## 10. Mock data requirements

Create mock entities:

- current user;
- several profiles;
- bands;
- events;
- chat rooms;
- messages;
- documents;
- complaints;
- notifications;
- ratings.

Mocks should include:

- empty cases;
- long RU text;
- long EN text;
- missing avatar/cover for fallback testing;
- restricted resource;
- suspicious message with blocked link.

## 11. Layout acceptance

- Desktop follows left nav + content + optional right rail.
- Mobile follows top bar + content + bottom nav.
- Primary action placement stable.
- No jumping buttons between pages.
- Long translated labels do not break layout.
- Modals/drawers are consistent.
- Tables degrade into lists/cards on mobile.

## 12. Anti-drift rules

Strictly forbidden:

- one-off inline widths/heights for layout repair;
- arbitrary `margin-left: 13px` fixes;
- hardcoded Russian text;
- duplicated nav definitions;
- direct image path imports everywhere;
- mixing admin UI into user shell;
- changing layout contract silently.

## 13. First pass deliverables

A successful first code pass must include:

- runnable app;
- all routes reachable;
- basic navigation;
- RU/EN language switch;
- assets visible;
- fallback avatars/covers visible;
- role/restricted states visible;
- mock feed/chats/events/documents/moderation/admin;
- README with local run steps;
- checklist of completed items.

## 14. Suggested implementation order

1. Create project skeleton.
2. Add tokens/global styles.
3. Add i18n provider and locales.
4. Add asset registry.
5. Add shared UI primitives.
6. Add layout shells.
7. Add router and route guards.
8. Add mock API/data layer.
9. Add domain placeholder components.
10. Add screens.
11. Add QA states.
12. Run responsive/i18n checks.

## 15. Done means

The app may not yet have real backend logic, but it must look and behave like a stable product shell that can accept real modules without re-layout and without rewriting foundations.
