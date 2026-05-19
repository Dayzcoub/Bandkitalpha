# BandKit MVP Shell Acceptance Notes v1.0

## Completed

- [x] Runnable static app shell generated.
- [x] TypeScript strict check passes.
- [x] Build generates `dist/`.
- [x] Public/Auth/App/Admin shells exist.
- [x] Core routes from routing map exist as mock pages.
- [x] Desktop shell uses left nav + content + right rail.
- [x] Mobile shell CSS uses top bar + bottom nav.
- [x] RU/EN i18n present with persisted language switch.
- [x] Production assets v1.3 copied and used through asset registry.
- [x] Empty/loading/error/restricted states implemented.
- [x] Mock role/verification/state switchers implemented.
- [x] Link policy helper blocks URL-like text in mock cards/messages.
- [x] Report actions and moderation/admin placeholders are visible by permission.

## Intentionally not implemented in this pass

- [ ] Real backend/Supabase connection.
- [ ] Real RLS migrations.
- [ ] Real OAuth/SMS/email providers.
- [ ] Realtime chats and push subscriptions.
- [ ] Full reputation algorithm.
- [ ] Full document editor/PDF generation.
- [ ] Production moderation automation.

## Next pass recommendation

Start with backend adapter interfaces and Supabase schema/RLS migrations, while preserving the current shell and route contracts.
