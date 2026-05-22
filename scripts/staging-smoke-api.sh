#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://141.98.87.9/api/v1}"
RUN_ID="$(date +%s)"
ENTITY_SLUG="smoke-api-band-${RUN_ID}"
ENTITY_NAME="Smoke API Band ${RUN_ID}"

log() {
  printf '\n[bandkit smoke] %s\n' "$*"
}

request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [ -n "$data" ]; then
    curl -fsS -X "$method" "${API_BASE}${path}" \
      -H "Content-Type: application/json" \
      -H "X-BandKit-Dev-User: demo-manager" \
      -d "$data"
  else
    curl -fsS -X "$method" "${API_BASE}${path}"
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

log "API base: ${API_BASE}"

log "Checking health"
HEALTH="$(request GET /health)"
echo "$HEALTH"
expect_contains "$HEALTH" '"ok":true' 'health ok'

log "Checking database health"
DB_HEALTH="$(request GET /health/db)"
echo "$DB_HEALTH"
expect_contains "$DB_HEALTH" '"ok":true' 'database health ok'

log "Seeding demo data"
SEED="$(request POST /dev/seed-demo)"
echo "$SEED"
expect_contains "$SEED" '"ok":true' 'seed demo ok'
expect_contains "$SEED" 'Demo Band' 'seed demo entity exists'

log "Creating smoke entity"
CREATE_BODY="{\"name\":\"${ENTITY_NAME}\",\"type\":\"band\",\"slug\":\"${ENTITY_SLUG}\",\"visibility\":\"members\"}"
CREATE_RESPONSE="$(request POST /entities "$CREATE_BODY")"
echo "$CREATE_RESPONSE"
expect_contains "$CREATE_RESPONSE" '"ok":true' 'entity create ok'
expect_contains "$CREATE_RESPONSE" "$ENTITY_SLUG" 'created entity slug present'

log "Listing entities"
LIST_RESPONSE="$(request GET /entities)"
echo "$LIST_RESPONSE"
expect_contains "$LIST_RESPONSE" "$ENTITY_SLUG" 'entity list contains created entity'

log "Getting entity by slug"
DETAIL_BY_SLUG="$(request GET "/entities/${ENTITY_SLUG}")"
echo "$DETAIL_BY_SLUG"
expect_contains "$DETAIL_BY_SLUG" '"ok":true' 'entity detail by slug ok'
expect_contains "$DETAIL_BY_SLUG" "$ENTITY_SLUG" 'detail by slug contains slug'
expect_contains "$DETAIL_BY_SLUG" '"member_count":1' 'detail by slug member count'

log "Checking events read API"
EVENTS_RESPONSE="$(request GET /events)"
echo "$EVENTS_RESPONSE"
expect_contains "$EVENTS_RESPONSE" '"ok":true' 'events list ok'

log "Checking chat rooms read API"
ROOMS_RESPONSE="$(request GET /chat-rooms)"
echo "$ROOMS_RESPONSE"
expect_contains "$ROOMS_RESPONSE" '"ok":true' 'chat rooms list ok'

log "Checking documents read API"
DOCUMENTS_RESPONSE="$(request GET /documents)"
echo "$DOCUMENTS_RESPONSE"
expect_contains "$DOCUMENTS_RESPONSE" '"ok":true' 'documents list ok'

log "Smoke API test completed"
