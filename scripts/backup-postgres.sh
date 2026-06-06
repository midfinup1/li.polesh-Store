#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/infra/.env.prod"
BACKUP_DIR="$ROOT_DIR/backups"

mkdir -p "$BACKUP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_NAME="${POSTGRES_DB}_${TIMESTAMP}.dump"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME"

echo "Creating PostgreSQL backup: $BACKUP_FILE"

docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/infra/docker-compose.prod.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "Backup file is empty: $BACKUP_FILE" >&2
  exit 1
fi

echo "Local backup created: $BACKUP_FILE"

LOCAL_RETENTION_DAYS="${LOCAL_BACKUP_RETENTION_DAYS:-14}"
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +"$LOCAL_RETENTION_DAYS" -delete

if [[ "${BACKUP_S3_ENABLED:-false}" == "true" ]]; then
  BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-${S3_BUCKET:-}}"
  BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-backups/postgres}"
  BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
  S3_SCHEME="${S3_SCHEME:-https}"

  if [[ -z "${BACKUP_S3_BUCKET}" ]]; then
    echo "BACKUP_S3_ENABLED=true, but BACKUP_S3_BUCKET is empty" >&2
    exit 1
  fi

  if [[ -z "${S3_ENDPOINT:-}" || -z "${S3_ACCESS_KEY:-}" || -z "${S3_SECRET_KEY:-}" ]]; then
    echo "S3_ENDPOINT, S3_ACCESS_KEY or S3_SECRET_KEY is empty" >&2
    exit 1
  fi

  if [[ "${S3_ENDPOINT}" == http://* || "${S3_ENDPOINT}" == https://* ]]; then
    echo "S3_ENDPOINT must be without scheme. Example: s3.twcstorage.ru" >&2
    exit 1
  fi

  BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX#/}"
  BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX%/}"

  echo "Uploading backup to S3: s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX}/${BACKUP_NAME}"

  docker run --rm \
    -v "$BACKUP_DIR:/backup:ro" \
    -e S3_SCHEME="$S3_SCHEME" \
    -e S3_ENDPOINT="$S3_ENDPOINT" \
    -e S3_ACCESS_KEY="$S3_ACCESS_KEY" \
    -e S3_SECRET_KEY="$S3_SECRET_KEY" \
    -e BACKUP_S3_BUCKET="$BACKUP_S3_BUCKET" \
    -e BACKUP_S3_PREFIX="$BACKUP_S3_PREFIX" \
    -e BACKUP_NAME="$BACKUP_NAME" \
    -e BACKUP_RETENTION_DAYS="$BACKUP_RETENTION_DAYS" \
    minio/mc:latest sh -lc '
      set -e

      mc alias set backup-s3 "${S3_SCHEME}://${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" --api S3v4

      mc cp "/backup/${BACKUP_NAME}" "backup-s3/${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX}/${BACKUP_NAME}"

      if [ "${BACKUP_RETENTION_DAYS}" -gt 0 ]; then
        mc find "backup-s3/${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX}" \
          --name "*.dump" \
          --older-than "${BACKUP_RETENTION_DAYS}d" \
          --exec "mc rm {}"
      fi
    '

  echo "S3 backup uploaded successfully"
fi

echo "Backup completed: $BACKUP_FILE"