#!/bin/sh
set -eu
: "${POSTGRES_DB:?required}"
: "${POSTGRES_USER:?required}"
: "${BACKUP_DIR:=/var/backups/artist-portfolio}"
mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/${POSTGRES_DB}_$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose --env-file .env -f docker-compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$file"
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +7 -delete
printf '%s\n' "$file"
