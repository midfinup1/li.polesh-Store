#!/bin/sh
# PostgreSQL backup for the production stack.
# Dumps the DB, compresses it, rotates local copies older than 7 days, and —
# if BACKUP_S3_BUCKET and the aws CLI are available — uploads off-site.
#
# Run from the directory holding docker-compose.prod.yml and .env, e.g. via cron:
#   0 3 * * * cd /opt/artist-portfolio && ./backup-postgres.sh >> backup.log 2>&1
set -eu

: "${POSTGRES_DB:?required}"
: "${POSTGRES_USER:?required}"
: "${BACKUP_DIR:=/var/backups/artist-portfolio}"

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/${POSTGRES_DB}_$(date -u +%Y%m%dT%H%M%SZ).sql.gz"

docker compose --env-file .env -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$file"

# Local retention: keep the last 7 days.
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +7 -delete

# Off-site copy (optional). Set BACKUP_S3_BUCKET and provide AWS creds (env or
# the aws CLI's config) to enable. Tested separately from restore drills.
if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
    aws s3 cp "$file" "s3://${BACKUP_S3_BUCKET}/postgres/$(basename "$file")"
fi

printf '%s\n' "$file"
