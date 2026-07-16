#!/usr/bin/env bash
#
# ⚠ THIS IS NOT (YET) WHAT THE PIPELINE RUNS.
#
# GitHub Actions calls `sudo -n /usr/local/sbin/bandkit-staging-deploy` — a root-owned
# wrapper on the VPS, outside version control, which reimplements the deploy and never
# references this file. The two have silently diverged: steps added here (the seeding
# below, added in 1.15.3) have never executed on staging. Verify against the wrapper,
# not against a green deploy — a green deploy proves nothing about this script.
#
# Making the wrapper thin, so that it calls this file and the deploy lives under
# version control, is planned as its own slice.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/Bandkitalpha}"
WEB_DIR="${WEB_DIR:-/var/www/bandkit/current}"
BACKEND_SERVICE="${BACKEND_SERVICE:-bandkit-backend}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:3001/api/v1/health}"
API_DB_HEALTH_URL="${API_DB_HEALTH_URL:-http://127.0.0.1:3001/api/v1/health/db}"
PUBLIC_API_HEALTH_URL="${PUBLIC_API_HEALTH_URL:-https://bandkitdev.mywire.org/api/v1/health}"
PUBLIC_API_DB_HEALTH_URL="${PUBLIC_API_DB_HEALTH_URL:-https://bandkitdev.mywire.org/api/v1/health/db}"

log() {
  printf '\n[bandkit deploy] %s\n' "$*"
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "Required file is missing: $1" >&2
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempt

  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS "$url"; then
      printf '\n'
      return 0
    fi

    printf '\n[bandkit deploy] Waiting for %s (%s/10)\n' "$label" "$attempt"
    sleep 1
  done

  echo "Health check failed: $label $url" >&2
  return 1
}

clean_generated_worktree() {
  cd "$APP_DIR"
  git restore package-lock.json public/styles src/locales/bundles.ts server/package.json 2>/dev/null || true
  git clean -f -- public/styles server/package-lock.json 2>/dev/null || true
}

log "Starting staging deploy"
cd "$APP_DIR"

log "Pre-cleaning generated working tree files"
clean_generated_worktree

log "Fetching latest main"
git fetch origin main
git checkout main
git pull --ff-only origin main

log "Installing frontend dependencies"
npm install

log "Building frontend"
npm run build

log "Publishing frontend dist to $WEB_DIR"
mkdir -p "$WEB_DIR"
rsync -a --delete dist/ "$WEB_DIR"/

log "Installing backend dependencies"
cd "$APP_DIR/server"
require_file "$APP_DIR/server/package.json"
npm install

require_file "$APP_DIR/server/.env"

log "Running backend migrations"
set -a
. "$APP_DIR/server/.env"
set +a
node scripts/run-migrations.js

# The smoke authenticates like a real client, so its account must exist before it
# runs. --only is deliberate: seed-auth's passwords are in the repository, and this
# host is on the public internet, so the deploy creates the smoke's unprivileged
# account and nothing else. Never add the super_admin here — seeding it would put a
# repo-known password on a staff account and reset it on every deploy.
log "Seeding the smoke test account"
node scripts/seed-auth.mjs --only=user@bandkit.local

# Demo data used to be seeded by the smoke through POST /dev/seed-demo — an
# unauthenticated write endpoint on a public host. It took nothing from the request,
# so it is a script now and the endpoint is gone. Idempotent; guards itself.
log "Seeding demo data"
node scripts/seed-demo.mjs

log "Checking backend code syntax"
npm run check

log "Restarting backend service"
systemctl restart "$BACKEND_SERVICE"

log "Reloading nginx"
nginx -t
systemctl reload nginx

log "Checking local backend health"
wait_for_url "$API_HEALTH_URL" "local backend health"
wait_for_url "$API_DB_HEALTH_URL" "local database health"

log "Checking public API health"
wait_for_url "$PUBLIC_API_HEALTH_URL" "public backend health"
wait_for_url "$PUBLIC_API_DB_HEALTH_URL" "public database health"

log "Cleaning generated working tree files after deploy"
clean_generated_worktree

log "Staging deploy completed"
