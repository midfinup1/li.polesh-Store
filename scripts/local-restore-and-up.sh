#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose --env-file infra/.env -f infra/docker-compose.yml"
DUMP_FILE="${1:-}"

if [[ -z "${DUMP_FILE}" ]]; then
  echo "Usage: $0 <dump_file>" >&2
  echo "Example: $0 backups/postgres-2026-06-10.dump" >&2
  exit 1
fi

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "Dump file not found: ${DUMP_FILE}" >&2
  exit 1
fi

if [[ ! -f "infra/.env" ]]; then
  echo "infra/.env not found. Creating from infra/.env.example..."
  cp infra/.env.example infra/.env
fi

set -a
source infra/.env
set +a

POSTGRES_DB="${POSTGRES_DB:-artist_portfolio}"
POSTGRES_USER="${POSTGRES_USER:-artist_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-artist_password}"

echo "Using dump: ${DUMP_FILE}"
echo "Local database: ${POSTGRES_DB}"
echo "Local postgres user: ${POSTGRES_USER}"

echo "Stopping local project..."
$COMPOSE down

echo "Starting local postgres..."
$COMPOSE up -d postgres

echo "Waiting for postgres..."
for i in {1..60}; do
  if $COMPOSE exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi

  if [[ "$i" == "60" ]]; then
    echo "Postgres did not become ready in time." >&2
    $COMPOSE logs postgres --tail=100
    exit 1
  fi

  sleep 1
done

echo "Copying dump into postgres container..."
POSTGRES_CONTAINER="$($COMPOSE ps -q postgres)"

if [[ -z "${POSTGRES_CONTAINER}" ]]; then
  echo "Postgres container not found." >&2
  exit 1
fi

docker cp "${DUMP_FILE}" "${POSTGRES_CONTAINER}:/tmp/local-restore.dump"

echo "Restoring dump into local database..."
$COMPOSE exec -T postgres pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  /tmp/local-restore.dump

echo "Starting full local project..."
$COMPOSE up -d --build

echo "Local project is running."
$COMPOSE ps

echo
echo "Useful commands:"
echo "$COMPOSE logs -f --tail=100"
echo "$COMPOSE exec postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}"