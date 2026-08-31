#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/infra/.env.prod"
BACKUP_DIR="$ROOT_DIR/backups"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ "${ENABLE_BACKUP_CRON:-true}" != "true" ]]; then
  echo "Backup cron is disabled"
  exit 0
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

CURRENT_CRON="$(mktemp)"
UPDATED_CRON="$(mktemp)"
trap 'rm -f "$CURRENT_CRON" "$UPDATED_CRON"' EXIT

crontab -l > "$CURRENT_CRON" 2>/dev/null || true
grep -v "scripts/backup-postgres.sh" "$CURRENT_CRON" > "$UPDATED_CRON" || true
printf '30 3 * * * cd %q && /bin/bash scripts/backup-postgres.sh >> %q 2>&1\n' \
  "$ROOT_DIR" "$BACKUP_DIR/backup.log" >> "$UPDATED_CRON"

crontab "$UPDATED_CRON"
echo "Backup cron installed for $(id -un): 30 3 * * *"
