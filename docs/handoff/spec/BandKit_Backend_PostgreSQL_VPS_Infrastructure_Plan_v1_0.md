# BandKit — Backend PostgreSQL VPS Infrastructure Plan v1.0

## Status

Accepted infrastructure direction.

This document fixes the current backend/database plan for BandKit based on the existing VPS preview infrastructure.

Current VPS preview:

- `http://141.98.87.9`

---

## Core decision

For the MVP stage, BandKit should use the current VPS for frontend, backend and PostgreSQL.

Accepted MVP stack:

```text
VPS
├─ Nginx
├─ BandKit frontend static build
├─ Backend API service
├─ PostgreSQL
├─ Redis/Valkey later if needed
└─ local backup scripts
```

PostgreSQL is the accepted primary database for MVP and early production.

Reasons:

- strong relational model fits users, roles, projects, events, chats, documents and permissions;
- ACID transactions are important for chat policies, entity membership and audit trails;
- PostgreSQL is easy to run on a VPS for MVP;
- can later move to managed PostgreSQL or a separate DB server by changing `DATABASE_URL`;
- future distributed SQL migration remains possible if the project becomes global.

---

## Stage 1 — MVP on current VPS

### Goal

Run everything on the existing VPS to keep cost and complexity low.

### Services

- frontend: static files served by Nginx;
- backend: Node.js API service;
- database: PostgreSQL on the same VPS;
- realtime: WebSocket endpoint later;
- Redis/Valkey: optional later for rate limits, queues, sessions or realtime fanout;
- files: local storage only for temporary MVP assets, but entity files should move to object storage later.

### Network model

PostgreSQL should not be open to the public internet.

Recommended connection:

```env
DATABASE_URL=postgresql://bandkit_user:strong_password@127.0.0.1:5432/bandkit
```

Rules:

- close public access to port `5432`;
- backend connects to PostgreSQL through `127.0.0.1`;
- only Nginx exposes public HTTP/HTTPS;
- backend is exposed through Nginx proxy, for example `/api` and later `/ws`.

Recommended routing:

```text
https://domain.example/      -> frontend
https://domain.example/api   -> backend API
https://domain.example/ws    -> websocket/realtime
```

For current IP preview:

```text
http://141.98.87.9/      -> frontend
http://141.98.87.9/api   -> backend API later
http://141.98.87.9/ws    -> websocket later
```

---

## Stage 1 cost

If PostgreSQL runs on the current VPS, additional database cost is:

```text
0 extra monthly cost
```

Only the existing VPS cost remains.

This is the accepted start because BandKit is still in MVP/prototype stage.

---

## Stage 1 required setup

### PostgreSQL

- install PostgreSQL on VPS;
- create database `bandkit`;
- create application DB user `bandkit_user`;
- use strong password stored only in backend `.env`;
- restrict database to local connections;
- enable automatic service restart;
- configure basic logs.

### Backend

- create backend service directory;
- add `.env` with `DATABASE_URL` and other secrets;
- add migration tool;
- add health endpoint, for example `/api/health`;
- run backend with PM2, systemd or Docker Compose;
- do not commit secrets to repo.

### Nginx

- keep frontend static serving;
- add reverse proxy for `/api`;
- later add `/ws` websocket proxy;
- later add SSL/domain when domain is ready.

### Backups

Minimum MVP backup requirements:

- daily PostgreSQL dump;
- keep last 7 daily backups locally;
- optionally copy backups off-server later;
- test restore procedure at least once;
- document restore command.

Recommended MVP backup pattern:

```text
/var/backups/bandkit/postgres/YYYY-MM-DD_bandkit.sql.gz
```

### Migrations

Use a migration tool from the beginning.

Allowed options:

- Prisma migrations;
- Drizzle migrations;
- Knex migrations;
- plain SQL migration runner.

Accepted rule:

> Never change production schema manually without migration tracking.

---

## Stage 2 — Early production split

When real users and persistent data appear, PostgreSQL can be moved out of the app VPS.

Options:

1. separate DB VPS;
2. managed PostgreSQL;
3. serverless PostgreSQL such as Neon for suitable workloads.

Recommended next step:

```text
VPS
├─ frontend
├─ backend API
└─ connects to external PostgreSQL

External PostgreSQL
└─ database, backups, monitoring
```

Expected monthly cost examples:

- current VPS + local PostgreSQL: no extra DB cost;
- managed PostgreSQL small tier: roughly 15–30 USD/month;
- managed PostgreSQL medium tier: roughly 60–120 USD/month;
- larger production stack with Redis/object storage/search/monitoring: 100–300+ USD/month depending on provider and load.

This document does not lock BandKit to any single provider.

---

## Stage 3 — Scaling PostgreSQL

Before replacing PostgreSQL, scale it properly.

PostgreSQL scaling tools:

- indexes;
- query optimization;
- PgBouncer connection pooling;
- read replicas;
- partitioning large append-only tables;
- separate DB server;
- managed PostgreSQL;
- object storage for files;
- Redis/Valkey for sessions, rate limits, queues and realtime fanout;
- separate search engine for full-text search if needed.

Large tables should be designed with future partitioning in mind:

- `chat_messages`;
- `chat_message_audit_events`;
- `chat_message_reports`;
- `notification_events`;
- `system_events`;
- `read_receipts`;
- `acknowledgements`.

Possible partition keys later:

- `workspace_id`;
- `room_id`;
- `parent_entity_id`;
- `created_at` month/quarter.

---

## Stage 4 — Global scale options

If BandKit becomes a global-scale product, consider distributed SQL or advanced PostgreSQL scaling.

Future candidates:

- PostgreSQL with Citus for horizontal scaling inside the PostgreSQL ecosystem;
- CockroachDB for distributed SQL and multi-region resilience;
- YugabyteDB for distributed SQL with PostgreSQL-compatible API;
- Google Cloud Spanner for high-budget managed global SQL;
- other distributed SQL systems only after real requirements are known.

Accepted rule:

> Do not start MVP with distributed SQL. Start with PostgreSQL and design the data layer so migration remains possible.

---

## Data architecture rules to avoid lock-in

Backend must not spread raw database logic everywhere.

Recommended structure:

```text
services/
  ChatService
  ProjectService
  EventService
  PermissionService
  DocumentService

repositories/
  ChatRepository
  UserRepository
  EventRepository
  ProjectRepository
  DocumentRepository
```

Rules:

- business logic lives in services;
- database access is isolated in repositories/data-access layer;
- permissions are computed by a dedicated resolver;
- files are stored outside DB;
- realtime delivery is not based on database polling;
- search can be moved to a separate search engine later.

---

## File storage rule

Do not store real files inside PostgreSQL.

PostgreSQL stores metadata only:

- file ID;
- owner entity;
- storage key;
- MIME type;
- size;
- permissions;
- audit/export flags;
- created/updated timestamps.

Files should move to object storage later:

- S3-compatible storage;
- MinIO;
- cloud object storage.

For MVP, local storage can be used temporarily, but the code should be written as if storage can be swapped later.

---

## Realtime rule

PostgreSQL stores the source of truth.

Realtime should use backend/WebSocket layer and later Redis/Valkey or queue.

Do not build chat realtime by polling PostgreSQL directly from clients.

Recommended model:

```text
Client -> WebSocket -> Backend -> PostgreSQL
                         └-> Redis/queue later
```

---

## Search rule

Start with simple database-backed search only if needed.

Later, if message/document search grows, use a dedicated search engine:

- OpenSearch;
- Meilisearch;
- Typesense;
- PostgreSQL full-text search as intermediate step.

Search must respect chat/document access permissions.

---

## Security baseline

MVP security requirements:

- no public PostgreSQL port;
- secrets in `.env`, not repo;
- strong DB password;
- DB user with only required privileges;
- backups protected by file permissions;
- Nginx reverse proxy only exposes frontend/API/ws;
- future SSL/domain setup;
- firewall rules;
- migration logs;
- audit tables for sensitive chat/document actions later.

---

## Migration path from local VPS PostgreSQL to managed PostgreSQL

The migration should be straightforward if `DATABASE_URL` is the only connection source.

Steps later:

1. create external PostgreSQL instance;
2. stop backend writes briefly or enter maintenance mode;
3. dump local DB;
4. restore dump into external DB;
5. update backend `DATABASE_URL`;
6. run migrations/checks;
7. restart backend;
8. verify `/api/health` and key flows;
9. keep old DB snapshot until migration is confirmed.

---

## Accepted implementation plan

### Now

- keep current VPS;
- plan backend API on same VPS;
- plan PostgreSQL on same VPS;
- plan local-only DB access;
- plan migration tool from day one;
- plan daily backups;
- keep DB files separate from uploaded files.

### Soon

- add backend skeleton;
- add `/api/health`;
- add PostgreSQL install/setup instructions;
- add database schema/migration plan;
- add Nginx `/api` proxy;
- add deploy workflow for backend service.

### Later

- add Redis/Valkey;
- move files to object storage;
- move PostgreSQL to managed/external DB when real users/data justify it;
- add monitoring and off-server backups;
- add search engine if message/document search grows;
- consider distributed SQL only after real global-scale requirements.

---

## Accepted decision

BandKit backend/database direction:

- MVP uses PostgreSQL on the current VPS;
- additional DB cost at MVP stage is zero beyond VPS cost;
- PostgreSQL is suitable for BandKit through MVP and early production;
- architecture must avoid hard lock-in;
- large chat/audit/notification tables must be designed with partitioning in mind;
- files must not be stored directly in PostgreSQL;
- realtime must use backend/WebSocket layer, not client DB polling;
- future scaling path: external/managed PostgreSQL, Redis/Valkey, object storage, search engine, then distributed SQL only if needed.
