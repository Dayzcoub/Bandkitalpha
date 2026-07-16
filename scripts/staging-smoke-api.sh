#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-https://bandkitdev.mywire.org/api/v1}"

# The smoke authenticates like a real client. Until 1.15.3 it created its entity
# through an x-bandkit-dev-user header backdoor, which meant the deploy gate both
# depended on and hid an unauthenticated write path.
SMOKE_EMAIL="${SMOKE_EMAIL:-user@bandkit.local}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-UserPass123}"

# Owned by the account above. The old 'smoke-api-band' rows belong to demo-manager
# (created back when anyone could impersonate them) and are correctly invisible to
# this account now, so the smoke uses its own slug rather than reusing them.
ENTITY_SLUG="smoke-auth-band"
ENTITY_NAME="Smoke Auth Band"

COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

log() {
  printf '\n[bandkit smoke] %s\n' "$*"
}

# Anonymous request. Fails the script on any 4xx/5xx.
request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [ -n "$data" ]; then
    curl -fsS -X "$method" "${API_BASE}${path}" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -fsS -X "$method" "${API_BASE}${path}"
  fi
}

# Request carrying the smoke session cookie.
auth_request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [ -n "$data" ]; then
    curl -fsS -X "$method" "${API_BASE}${path}" \
      -b "$COOKIE_JAR" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -fsS -X "$method" "${API_BASE}${path}" -b "$COOKIE_JAR"
  fi
}

auth_request_allow_error() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [ -n "$data" ]; then
    curl -sS -X "$method" "${API_BASE}${path}" \
      -b "$COOKIE_JAR" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -sS -X "$method" "${API_BASE}${path}" -b "$COOKIE_JAR"
  fi
}

request_allow_error() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [ -n "$data" ]; then
    curl -sS -X "$method" "${API_BASE}${path}" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -sS -X "$method" "${API_BASE}${path}"
  fi
}

# HTTP status of an anonymous request, for the access-control assertions.
anon_status() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [ -n "$data" ]; then
    curl -sS -o /dev/null -w '%{http_code}' -X "$method" "${API_BASE}${path}" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -sS -o /dev/null -w '%{http_code}' -X "$method" "${API_BASE}${path}"
  fi
}

expect_contains() {
  local input="$1"
  local expected="$2"
  local label="$3"

  if ! printf '%s' "$input" | grep -q "$expected"; then
    echo "Smoke check failed: ${label}" >&2
    echo "Expected to find: ${expected}" >&2
    echo "Response was:" >&2
    echo "$input" >&2
    exit 1
  fi
}

expect_missing() {
  local input="$1"
  local unexpected="$2"
  local label="$3"

  if printf '%s' "$input" | grep -q "$unexpected"; then
    echo "Smoke check failed: ${label}" >&2
    echo "Must NOT contain: ${unexpected}" >&2
    echo "Response was:" >&2
    echo "$input" >&2
    exit 1
  fi
}

expect_status() {
  local actual="$1"
  local expected="$2"
  local label="$3"

  if [ "$actual" != "$expected" ]; then
    echo "Smoke check failed: ${label}" >&2
    echo "Expected HTTP ${expected}, got ${actual}" >&2
    exit 1
  fi
}

log "API base: ${API_BASE}"

log "Checking health"
HEALTH="$(request GET /health)"
echo "$HEALTH"
expect_contains "$HEALTH" '"ok":true' 'health ok'

log "Checking database health"
DB_HEALTH="$(request GET /health/db)"
echo "$DB_HEALTH"
expect_contains "$DB_HEALTH" '"ok":true' 'database health ok'

log "Checking the dev seed endpoint is gone"
# Ничего демо-данных не сеет: `seed-demo.mjs` удалён 2026-07-16 как мёртвый и сломанный.
# Проверка остаётся в силе и проверяет ровно то, что написано в её названии: эндпоинт,
# который когда-то писал фиксированные строки без сессии на публичном хосте, не вернулся.
expect_status "$(anon_status POST /dev/seed-demo)" 404 'dev seed endpoint no longer exists'

log "Logging in as ${SMOKE_EMAIL}"
LOGIN_BODY="{\"email\":\"${SMOKE_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\"}"
LOGIN_RESPONSE="$(curl -fsS -c "$COOKIE_JAR" -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_BODY")"
echo "$LOGIN_RESPONSE"
expect_contains "$LOGIN_RESPONSE" '"ok":true' 'smoke login ok'
if ! grep -q 'bandkit_session' "$COOKIE_JAR"; then
  echo "Smoke check failed: login set no session cookie" >&2
  exit 1
fi

log "Checking entity writes reject anonymous callers"
# Regression guard for the x-bandkit-dev-user backdoor: creating an entity without
# a session must be impossible, on staging as much as in production.
CREATE_BODY="{\"name\":\"${ENTITY_NAME}\",\"type\":\"band\",\"slug\":\"${ENTITY_SLUG}\",\"visibility\":\"members\"}"
expect_status "$(anon_status POST /entities "$CREATE_BODY")" 401 'anonymous entity create is rejected'

log "Ensuring deterministic smoke entity"
CREATE_RESPONSE="$(auth_request_allow_error POST /entities "$CREATE_BODY")"
echo "$CREATE_RESPONSE"
if printf '%s' "$CREATE_RESPONSE" | grep -q '"ok":true'; then
  expect_contains "$CREATE_RESPONSE" "$ENTITY_SLUG" 'created entity slug present'
elif printf '%s' "$CREATE_RESPONSE" | grep -q 'ENTITY_CONFLICT'; then
  echo "[bandkit smoke] Smoke entity already exists, reusing it"
else
  echo "Smoke check failed: entity create/reuse" >&2
  echo "$CREATE_RESPONSE" >&2
  exit 1
fi

log "Checking the entity directory is scoped"
# The directory answers guests — public entities are meant to be found — but a
# members-only entity must never appear in an anonymous listing.
ANON_LIST="$(request GET /entities)"
echo "$ANON_LIST"
expect_missing "$ANON_LIST" "$ENTITY_SLUG" 'members-only entity is absent from the anonymous directory'

log "Checking members-only entity detail is not readable anonymously"
# 404, not 403: an outsider is never told the entity exists.
expect_status "$(anon_status GET "/entities/${ENTITY_SLUG}")" 404 'anonymous entity detail is 404'

log "Listing entities as a member"
LIST_RESPONSE="$(auth_request GET /entities)"
echo "$LIST_RESPONSE"
expect_contains "$LIST_RESPONSE" "$ENTITY_SLUG" 'entity list contains smoke entity'

log "Getting entity by slug as a member"
DETAIL_BY_SLUG="$(auth_request GET "/entities/${ENTITY_SLUG}")"
echo "$DETAIL_BY_SLUG"
expect_contains "$DETAIL_BY_SLUG" '"ok":true' 'entity detail by slug ok'
expect_contains "$DETAIL_BY_SLUG" "$ENTITY_SLUG" 'detail by slug contains slug'
expect_contains "$DETAIL_BY_SLUG" '"member_count":1' 'detail by slug member count'

log "Checking events read API requires auth"
# Events carry location and schedule and have no public visibility level:
# anonymous callers must be rejected, not served.
EVENTS_RESPONSE="$(request_allow_error GET /events)"
echo "$EVENTS_RESPONSE"
expect_contains "$EVENTS_RESPONSE" 'AUTH_REQUIRED' 'events list is protected'

log "Checking admin console requires staff"
# The owner console exposes the user registry and the audit log.
expect_status "$(anon_status GET /admin/overview)" 401 'admin console is protected'

log "Checking chat rooms are member-scoped"
# There is no global room list any more: it was unauthenticated and unscoped, and
# only this smoke ever called it. Rooms are reachable only through /me/chat-rooms,
# which needs a session — a personal dialogue is a room too (chat spec §11).
expect_status "$(anon_status GET /chat-rooms)" 404 'the global room list is gone'
expect_status "$(anon_status GET /me/chat-rooms)" 401 'my rooms need a session'
MY_ROOMS="$(auth_request GET /me/chat-rooms)"
echo "$MY_ROOMS"
expect_contains "$MY_ROOMS" '"ok":true' 'my rooms ok for a member'

log "Checking documents read API requires auth"
# Documents are workspace data: anonymous callers must be rejected, not served.
DOCUMENTS_RESPONSE="$(request_allow_error GET /documents)"
echo "$DOCUMENTS_RESPONSE"
expect_contains "$DOCUMENTS_RESPONSE" 'AUTH_REQUIRED' 'documents list is protected'

log "Smoke API test completed"
