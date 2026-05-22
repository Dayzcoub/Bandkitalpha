# BandKit — Staging VPS Backend + PostgreSQL Setup Runbook for Ubuntu 22.04

## Status

Accepted staging setup runbook.

This document describes how to prepare the current Ubuntu 22.04 VPS for BandKit backend staging with local PostgreSQL.

Current staging VPS:

- `http://141.98.87.9`

Important:

- current VPS is staging/preview only;
- it is not production;
- do not paste real passwords into Git or chat;
- PostgreSQL must stay local-only and must not be exposed publicly.

---

## Target staging layout

```text
Ubuntu 22.04 VPS
├─ Nginx
├─ frontend preview
├─ backend API on 127.0.0.1:3001
├─ PostgreSQL on 127.0.0.1:5432
└─ later Nginx proxy /api -> backend
```

Public API later:

```text
http://141.98.87.9/api/v1/health
http://141.98.87.9/api/v1/health/db
```

Local backend health before Nginx proxy:

```text
http://127.0.0.1:3001/api/v1/health
http://127.0.0.1:3001/api/v1/health/db
```

---

## 1. Update VPS packages

```bash
sudo apt update
sudo apt upgrade -y
```

---

## 2. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql --no-pager
```

---

## 3. Generate DB password

Run on VPS:

```bash
openssl rand -base64 32
```

Save the generated value somewhere safe.

Do not commit it to Git.

Do not paste it into chat.

---

## 4. Create database and app user

Open PostgreSQL shell:

```bash
sudo -u postgres psql
```

Inside `psql`, replace `PASTE_GENERATED_PASSWORD_HERE` with your generated password:

```sql
create database bandkit;
create user bandkit_user with encrypted password 'PASTE_GENERATED_PASSWORD_HERE';
grant all privileges on database bandkit to bandkit_user;
\c bandkit
grant all on schema public to bandkit_user;
alter default privileges in schema public grant all on tables to bandkit_user;
alter default privileges in schema public grant all on sequences to bandkit_user;
\q
```

---

## 5. Verify local DB connection

Replace password only in your terminal command.

```bash
PGPASSWORD='PASTE_GENERATED_PASSWORD_HERE' psql -h 127.0.0.1 -U bandkit_user -d bandkit -c 'select now();'
```

Expected result: one row with current timestamp.

---

## 6. Confirm PostgreSQL is not exposed publicly

Check local listen state:

```bash
sudo ss -lntp | grep 5432 || true
```

Expected safe state: PostgreSQL should listen on localhost only or protected local interfaces.

If UFW is enabled, do not allow public `5432`.

```bash
sudo ufw status
```

---

## 7. Prepare backend environment file

From repo root on VPS, create local env file:

```bash
cd /path/to/Bandkitalpha
cp server/.env.example server/.env
nano server/.env
```

Set values:

```env
NODE_ENV=staging
PORT=3001
DATABASE_URL=postgresql://bandkit_user:PASTE_GENERATED_PASSWORD_HERE@127.0.0.1:5432/bandkit
```

Important:

- `server/.env` must stay local to VPS;
- do not commit `server/.env`;
- keep real password out of Git.

---

## 8. Prepare backend package manifest

Temporary note:

- `server/backend-package.json` exists because direct creation of `server/package.json` was blocked earlier by the tool.
- Until `server/package.json` is committed, copy it manually on VPS.

```bash
cp server/backend-package.json server/package.json
```

---

## 9. Install backend dependencies

```bash
cd server
npm install
```

This installs PostgreSQL driver `pg`.

---

## 10. Run migrations

From `server/`:

```bash
set -a
. ./.env
set +a
node scripts/run-migrations.js
```

Expected result:

- migration `0001_migration_log.sql` is applied;
- table `schema_migrations` exists.

Verify:

```bash
PGPASSWORD='PASTE_GENERATED_PASSWORD_HERE' psql -h 127.0.0.1 -U bandkit_user -d bandkit -c 'select * from schema_migrations;'
```

---

## 11. Start backend locally for test

From `server/`:

```bash
set -a
. ./.env
set +a
node src/index.js
```

In another SSH session:

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/health/db
```

Expected:

- `/health` returns `ok: true`;
- `/health/db` returns `ok: true` after DB is configured.

---

## 12. Optional temporary process run

For quick staging test only:

```bash
cd /path/to/Bandkitalpha/server
set -a
. ./.env
set +a
nohup node src/index.js > backend.log 2>&1 &
```

Check:

```bash
tail -f backend.log
```

A proper `systemd` service should be added later.

---

## 13. Nginx proxy later

After local backend test passes, add Nginx proxy for `/api`.

Example block to adapt into current site config:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Public checks:

```bash
curl http://141.98.87.9/api/v1/health
curl http://141.98.87.9/api/v1/health/db
```

---

## 14. First staging acceptance checklist

Staging DB/backend is ready when:

- PostgreSQL is installed and running;
- database `bandkit` exists;
- user `bandkit_user` exists;
- `5432` is not exposed publicly;
- `server/.env` exists only on VPS;
- `npm install` completed in `server/`;
- migrations run successfully;
- local `/api/v1/health` returns OK;
- local `/api/v1/health/db` returns OK;
- Nginx proxy works if configured.

---

## Next runbooks later

To add later:

- systemd backend service;
- Nginx API/WebSocket proxy final config;
- daily PostgreSQL backup script;
- backend deploy workflow;
- staging smoke test checklist.
