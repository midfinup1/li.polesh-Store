#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${TEST_RESTORE_CONTAINER_NAME:-li-polesh-restore-test}"
POSTGRES_IMAGE="${TEST_RESTORE_POSTGRES_IMAGE:-postgres:16-alpine}"
POSTGRES_USER="${TEST_RESTORE_POSTGRES_USER:-test_user}"
POSTGRES_PASSWORD="${TEST_RESTORE_POSTGRES_PASSWORD:-test_password}"
POSTGRES_DB="${TEST_RESTORE_POSTGRES_DB:-artist_portfolio_test}"
POSTGRES_PORT="${TEST_RESTORE_POSTGRES_PORT:-55432}"
CLEANUP="false"

usage() {
  cat <<EOF
Usage:
  $0 <dump_file> [--cleanup]

Examples:
  $0 backups/backup.dump
  $0 backups/backup.dump --cleanup

Environment overrides:
  TEST_RESTORE_CONTAINER_NAME=${CONTAINER_NAME}
  TEST_RESTORE_POSTGRES_IMAGE=${POSTGRES_IMAGE}
  TEST_RESTORE_POSTGRES_USER=${POSTGRES_USER}
  TEST_RESTORE_POSTGRES_PASSWORD=***
  TEST_RESTORE_POSTGRES_DB=${POSTGRES_DB}
  TEST_RESTORE_POSTGRES_PORT=${POSTGRES_PORT}
EOF
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

DUMP_FILE="$1"

if [[ "${2:-}" == "--cleanup" ]]; then
  CLEANUP="true"
fi

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "Dump file not found: ${DUMP_FILE}" >&2
  exit 1
fi

echo "Using dump: ${DUMP_FILE}"
echo "Test container: ${CONTAINER_NAME}"
echo "Test database: ${POSTGRES_DB}"
echo "Test port: ${POSTGRES_PORT}"

echo "Removing old test container if exists..."
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

echo "Starting temporary PostgreSQL..."
docker run \
  --name "${CONTAINER_NAME}" \
  -e POSTGRES_USER="${POSTGRES_USER}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_DB="${POSTGRES_DB}" \
  -p "${POSTGRES_PORT}:5432" \
  -d "${POSTGRES_IMAGE}" >/dev/null

echo "Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker exec "${CONTAINER_NAME}" pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
    echo "PostgreSQL is ready."
    break
  fi

  if [[ "$i" == "30" ]]; then
    echo "PostgreSQL did not become ready in time." >&2
    docker logs "${CONTAINER_NAME}" || true
    exit 1
  fi

  sleep 1
done

echo "Copying dump into test container..."
docker cp "${DUMP_FILE}" "${CONTAINER_NAME}:/tmp/restore.dump"

echo "Restoring dump into test database..."
docker exec "${CONTAINER_NAME}" pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  /tmp/restore.dump

echo "Restore completed."

echo "Checking tables..."
docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 <<'SQL'
\dt

select 'admins' as table_name, count(*) as rows_count from admins
union all
select 'artist_profiles', count(*) from artist_profiles
union all
select 'categories', count(*) from categories
union all
select 'artworks', count(*) from artworks
union all
select 'artwork_images', count(*) from artwork_images
union all
select 'orders', count(*) from orders
union all
select 'admin_audit_logs', count(*) from admin_audit_logs
union all
select 'analytics_events', count(*) from analytics_events;
SQL

echo "Test restore is OK."

echo
echo "Connection string:"
echo "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=disable"

if [[ "${CLEANUP}" == "true" ]]; then
  echo "Cleaning up test container..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
  echo "Cleanup completed."
else
  echo
  echo "Test database is still running."
  echo "Open psql:"
  echo "docker exec -it ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
  echo
  echo "Remove test database:"
  echo "docker rm -f ${CONTAINER_NAME}"
fi