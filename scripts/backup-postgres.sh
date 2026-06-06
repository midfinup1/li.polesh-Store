#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
INFRA_DIR="${INFRA_DIR:-${PROJECT_ROOT}/infra}"
ENV_FILE="${ENV_FILE:-${INFRA_DIR}/.env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-${INFRA_DIR}/docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

: "${POSTGRES_DB:?required}"
: "${POSTGRES_USER:?required}"

mkdir -p "${BACKUP_DIR}"
file="${BACKUP_DIR}/${POSTGRES_DB}_$(date -u +%Y%m%dT%H%M%SZ).sql.gz"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${file}"

ln -sf "$(basename "${file}")" "${BACKUP_DIR}/latest.sql.gz"
find "${BACKUP_DIR}" -type f -name '*.sql.gz' -mtime +7 ! -name 'latest.sql.gz' -delete

if [[ -n "${BACKUP_S3_BUCKET:-}" ]] && command -v aws >/dev/null 2>&1; then
  aws s3 cp "${file}" "s3://${BACKUP_S3_BUCKET}/postgres/$(basename "${file}")"
fi

printf '%s\n' "${file}"
