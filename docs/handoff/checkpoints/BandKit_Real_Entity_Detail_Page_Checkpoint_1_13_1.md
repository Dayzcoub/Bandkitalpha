# BandKit — Real Entity Detail Page Checkpoint 1.13.1

## Status

Accepted checkpoint.

Follow-up to the de-mock pass: clicking an entity in the directory now opens a real detail page instead of an "In development" stub. Closes the visible gap a user hits right after creating a group.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## What changed

```text
src/modules/RealEntityDetail.ts   (new — entity detail page)
src/modules/RealDirectories.ts    (entity rows are now clickable links)
src/routes/pages.ts               (renderBandDetail → real mount)
src/main.ts                       (init)
src/locales/en|ru/bands.json      (entityDetail.*)
src/locales/bundles.ts            (regenerated)
```

- **Clickable directory rows**: entity names in `/bands` are links to `/bands/<slug|id>`. Because these rows are injected asynchronously (after the app's one-time `[data-route]` binding), navigation is done client-side via `pushState` + a dispatched `popstate` (the SPA re-renders on popstate).
- **`/bands/:bandId` detail** (`RealEntityDetail.ts`): fetches `GET /entities/:id` (accepts slug or uuid) and `GET /entities/:id/posts`. Shows the name, type, member count, visibility; a subscribe/unsubscribe button (`PUT/DELETE /entities/:id/subscription`); a report chip (`entity`); and the entity's visibility-filtered posts feed. Unknown entity → "Entity not found". Localized (`entityDetail.*`), shared classes only.

---

## Verification

Real browser (demo-manager):

```text
/bands rows are links with slugs -> click "Demo Band" navigates to /bands/demo-band
detail renders: title, "Группа · 1 участник(ов) · Участники", 4 posts (member
  sees all layers), Subscribe + Report;
Subscribe -> "Вы подписаны.", button flips to Unsubscribe;
/bands/no-such-band -> "Сущность не найдена.";
no console errors.
```

---

## Do not regress

- Directory rows must navigate to the real detail route (not the in-dev stub).
- Detail page reads only from GET /entities/:id and its posts; subscribe uses the entity uuid.
- Unknown entity shows a clear not-found state.

---

## Next recommended work

Resume Phase 4 domains (files), or continue polishing real surfaces (event detail backed by GET /events/:id, real notifications).
