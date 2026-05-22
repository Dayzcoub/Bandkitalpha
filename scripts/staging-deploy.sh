#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/Bandkitalpha}"
WEB_DIR="${WEB_DIR:-/var/www/bandkit/current}"
BACKEND_SERVICE="${BACKEND_SERVICE:-bandkit-backend}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:3001/api/v1/health}"
API_DB_HEALTH_URL="${API_DB_HEALTH_URL:-http://127.0.0.1:3001/api/v1/health/db}"
PUBLIC_API_HEALTH_URL="${PUBLIC_API_HEALTH_URL:-http://141.98.87.9/api/v1/health}"
PUBLIC_API_DB_HEALTH_URL="${PUBLIC_API_DB_HEALTH_URL:-http://141.98.87.9/api/v1/health/db}"

log() {
  printf '\n[bandkit deploy] %s\n' "$*"
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "Required file is missing: $1" >&2
    exit 1
  fi
}

log "Starting staging deploy"
cd "$APP_DIR"

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

log "Preparing backend package manifest"
if [ ! -f server/package.json ]; then
  cp server/backend-package.json server/package.json
fi

log "Installing backend dependencies"
cd "$APP_DIR/server"
npm install

require_file "$APP_DIR/server/.env"

log "Running backend migrations"
set -a
. "$APP_DIR/server/.env"
set +a
node scripts/run-migrations.js

log "Restarting backend service"
systemctl restart "$BACKEND_SERVICE"

log "Reloading nginx"
nginx -t
systemctl reload nginx

log "Checking local backend health"
curl -fsS "$API_HEALTH_URL"
printf '\n'
curl -fsS "$API_DB_HEALTH_URL"
printf '\n'

log "Checking public API health"
curl -fsS "$PUBLIC_API_HEALTH_URL"
printf '\n'
curl -fsS "$PUBLIC_API_DB_HEALTH_URL"
printf '\n'

log "Staging deploy completed"
