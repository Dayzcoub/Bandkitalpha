# BandKit — Operator Quick Commands

## Purpose

This is the short practical cheat sheet for operating the BandKit staging VPS.

It is intentionally simple. Do not try to remember the full architecture. Use this file.

Current staging VPS:

- `https://bandkitdev.mywire.org`
- repo path: `/opt/Bandkitalpha`
- frontend web root: `/var/www/bandkit/current`
- backend service: `bandkit-backend`
- backend local port: `127.0.0.1:3001`
- public API path: `/api/v1`
- database: local PostgreSQL `bandkit`

---

## 1. Main deploy command

After new commits are pushed to GitHub, run this on VPS:

```bash
cd /opt/Bandkitalpha
sudo -n /usr/local/sbin/bandkit-staging-deploy
```

This command should:

- pull latest `main`;
- install frontend dependencies;
- build frontend;
- publish frontend to `/var/www/bandkit/current`;
- install backend dependencies;
- run database migrations;
- restart backend service;
- reload Nginx;
- check local and public API health.

If this passes, staging deploy is OK.

---

## 2. Check public site

Open in browser:

```text
https://bandkitdev.mywire.org
```

---

## 3. Check public backend API

```bash
curl https://bandkitdev.mywire.org/api/v1/health
curl https://bandkitdev.mywire.org/api/v1/health/db
```

Good result:

```text
ok: true
```

---

## 4. Check local backend API on VPS

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/health/db
```

If local works but public does not, check Nginx.

---

## 5. Check backend service

```bash
sudo systemctl status bandkit-backend --no-pager
```

Good result:

```text
Active: active (running)
```

---

## 6. Restart backend service

```bash
sudo systemctl restart bandkit-backend
```

Then check:

```bash
sudo systemctl status bandkit-backend --no-pager
curl http://127.0.0.1:3001/api/v1/health
```

---

## 7. Backend logs

Latest logs:

```bash
sudo journalctl -u bandkit-backend -n 100 --no-pager
```

Live logs:

```bash
sudo journalctl -u bandkit-backend -f
```

Exit live logs with:

```text
Ctrl + C
```

---

## 8. Check Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

If public API is not working but local API works, inspect:

```bash
sudo cat /etc/nginx/sites-available/bandkit-preview
```

Expected API proxy block:

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

---

## 9. Run migrations manually

Use only if deploy script failed or manual check is needed.

```bash
cd /opt/Bandkitalpha/server
set -a
. ./.env
set +a
node scripts/run-migrations.js
```

Do not manually create/drop production-like tables outside migrations unless it is an emergency repair.

---

## 10. Check applied migrations

```bash
cd /opt/Bandkitalpha/server
set -a
. ./.env
set +a
PGPASSWORD="$(node -e "console.log(new URL(process.env.DATABASE_URL).password)")" psql -h 127.0.0.1 -U bandkit_user -d bandkit -c "select * from schema_migrations order by applied_at;"
```

Expected currently:

```text
0001_migration_log.sql
0002_mvp_core_schema.sql
```

---

## 11. Check database tables

```bash
cd /opt/Bandkitalpha/server
set -a
. ./.env
set +a
PGPASSWORD="$(node -e "console.log(new URL(process.env.DATABASE_URL).password)")" psql -h 127.0.0.1 -U bandkit_user -d bandkit -c "\dt"
```

Expected core MVP tables:

```text
users
entities
entity_memberships
events
event_participants
chat_rooms
chat_room_members
chat_messages
message_acknowledgements
documents
document_permissions
audit_events
schema_migrations
```

---

## 12. Pull latest code only

Usually use deploy script instead.

Manual code pull:

```bash
cd /opt/Bandkitalpha
git pull
```

---

## 13. If deploy script says local changes exist

Check:

```bash
cd /opt/Bandkitalpha
git status
```

Common harmless case:

```text
modified: scripts/staging-deploy.sh
```

This can happen after `chmod +x` on VPS.

If only file mode changed, it can usually be ignored for staging. Do not reset unknown changes without checking.

---

## 14. What not to put in chat or Git

Never paste or commit:

- real database password;
- `server/.env` contents;
- private SSH keys;
- GitHub tokens;
- production/staging secrets;
- personal user data.

Safe to share:

- error messages with secrets removed;
- health check output;
- service status without secrets;
- table list;
- migration list.

---

## 15. If backend API is down

Checklist:

```bash
sudo systemctl status bandkit-backend --no-pager
sudo journalctl -u bandkit-backend -n 100 --no-pager
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/health/db
```

Interpretation:

- service inactive: restart backend;
- local health fails: backend/app problem;
- local DB health fails: DB/env/migration problem;
- local OK but public fails: Nginx/proxy problem.

---

## 16. If database health fails

Check PostgreSQL:

```bash
sudo systemctl status postgresql --no-pager
```

Check local API DB health:

```bash
curl http://127.0.0.1:3001/api/v1/health/db
```

Check env exists:

```bash
sudo ls -la /opt/Bandkitalpha/server/.env
```

Do not print `.env` to chat.

---

## 17. Current accepted checkpoints

Important checkpoints:

- `1.10.15 final product policy and backend handoff`
- `1.10.16 staging backend PostgreSQL API checkpoint`
- `1.10.17 MVP core database schema checkpoint`

---

## 18. Mental model

You do not need to remember everything.

For normal work, remember only:

```bash
cd /opt/Bandkitalpha
sudo -n /usr/local/sbin/bandkit-staging-deploy
```

Then check:

```bash
curl https://bandkitdev.mywire.org/api/v1/health
curl https://bandkitdev.mywire.org/api/v1/health/db
```

If both return `ok: true`, staging is alive.
