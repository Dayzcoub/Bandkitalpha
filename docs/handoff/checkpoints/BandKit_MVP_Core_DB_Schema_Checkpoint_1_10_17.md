# BandKit — MVP Core Database Schema Checkpoint 1.10.17

## Status

Accepted staging database schema checkpoint.

This checkpoint confirms that the first real MVP core database schema migration was applied successfully on the staging VPS PostgreSQL database.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS: `141.98.87.9`
- Database: PostgreSQL local on VPS
- Database name: `bandkit`
- App user: `bandkit_user`
- Backend API: `127.0.0.1:3001`
- Public API proxy: `http://141.98.87.9/api/v1`

---

## Applied migrations

Confirmed in `schema_migrations`:

```text
0001_migration_log.sql
0002_mvp_core_schema.sql
```

Migration timestamps observed on staging:

```text
0001_migration_log.sql   2026-05-22 15:20:09 UTC
0002_mvp_core_schema.sql 2026-05-22 15:33:49 UTC
```

---

## Created tables

Confirmed PostgreSQL tables:

```text
audit_events
chat_messages
chat_room_members
chat_rooms
document_permissions
documents
entities
entity_memberships
event_participants
events
message_acknowledgements
schema_migrations
users
```

Total: 13 tables.

---

## MVP schema coverage

The first MVP schema now covers:

- users;
- entities;
- entity memberships;
- events;
- event participants;
- chat rooms;
- chat room members;
- chat messages;
- message acknowledgements;
- documents;
- document permissions;
- audit events;
- schema migrations.

---

## Important architecture notes

This is still a database foundation, not full business logic.

The schema is intended to support the accepted MVP workflow:

```text
entity + team + event + document + working chat + acknowledgement
```

The backend still needs API modules and PermissionService logic before frontend should depend on these tables.

---

## Do not regress

Do not manually edit production/staging schema outside migrations unless explicitly required for emergency repair.

Accepted rules:

- schema changes must be committed as SQL migrations;
- migrations must be tracked through `schema_migrations`;
- app user remains `bandkit_user`;
- PostgreSQL remains local-only on staging VPS;
- backend keeps using `DATABASE_URL` from local `server/.env`;
- staging data is not production truth.

---

## Next recommended steps

1. Add a normal `server/package.json` when tool path allows it and remove the manual `backend-package.json` copy workaround.
2. Add API modules for the first MVP object reads/writes:
   - users;
   - entities;
   - entity memberships;
   - events;
   - chat rooms/messages;
   - documents.
3. Add seed/dev-only script for a minimal staging test entity.
4. Add PermissionService methods backed by DB context.
5. Add backend smoke test command/checklist.
