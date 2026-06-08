#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/infra/.env.prod"

log() {
  printf "\n\033[1;32m[INFO]\033[0m %s\n" "$*"
}

warn() {
  printf "\n\033[1;33m[WARN]\033[0m %s\n" "$*"
}

fail() {
  printf "\n\033[1;31m[ERROR]\033[0m %s\n" "$*" >&2
  exit 1
}

need_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    fail "Запусти от root: sudo bash scripts/install-vps.sh"
  fi
}

load_env() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    fail "Не найден ${ENV_FILE}. Создай его: cp infra/.env.prod.example infra/.env.prod"
  fi

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
}

save_env_value() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "${ENV_FILE}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
  else
    printf "\n%s=%s\n" "${key}" "${value}" >> "${ENV_FILE}"
  fi
}

generate_secret() {
  openssl rand -hex 32 | tr -d '\n'
}

generate_secret_if_empty() {
  local key="$1"
  local value="${!key:-}"

  if [[ -z "${value}" ]]; then
    local generated
    generated="$(generate_secret)"
    save_env_value "${key}" "${generated}"
    printf -v "${key}" "%s" "${generated}"
    export "${key}"
    log "Сгенерирован ${key} и записан в infra/.env.prod"
  fi
}

normalize_env() {
  generate_secret_if_empty POSTGRES_PASSWORD
  generate_secret_if_empty JWT_SECRET

  if [[ -z "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable"
    save_env_value "DATABASE_URL" "${DATABASE_URL}"
    export DATABASE_URL
    log "Сформирован DATABASE_URL"
  fi

  if [[ -z "${FRONTEND_URL:-}" ]]; then
    FRONTEND_URL="https://${DOMAIN}"
    save_env_value "FRONTEND_URL" "${FRONTEND_URL}"
    export FRONTEND_URL
  fi

  if [[ -z "${NEXT_PUBLIC_SITE_URL:-}" ]]; then
    NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
    save_env_value "NEXT_PUBLIC_SITE_URL" "${NEXT_PUBLIC_SITE_URL}"
    export NEXT_PUBLIC_SITE_URL
  fi

  if [[ -z "${NEXT_PUBLIC_API_URL:-}" ]]; then
    NEXT_PUBLIC_API_URL="/api/v1"
    save_env_value "NEXT_PUBLIC_API_URL" "${NEXT_PUBLIC_API_URL}"
    export NEXT_PUBLIC_API_URL
  fi

  if [[ -z "${API_INTERNAL_URL:-}" ]]; then
    API_INTERNAL_URL="http://backend:8080/api/v1"
    save_env_value "API_INTERNAL_URL" "${API_INTERNAL_URL}"
    export API_INTERNAL_URL
  fi

  if [[ -z "${WWW_DOMAIN:-}" ]]; then
    WWW_DOMAIN="www.${DOMAIN}"
    save_env_value "WWW_DOMAIN" "${WWW_DOMAIN}"
    export WWW_DOMAIN
  fi

  if [[ -z "${BACKUP_S3_ENABLED:-}" ]]; then
    BACKUP_S3_ENABLED="false"
    save_env_value "BACKUP_S3_ENABLED" "${BACKUP_S3_ENABLED}"
    export BACKUP_S3_ENABLED
  fi

  if [[ -z "${BACKUP_S3_BUCKET:-}" && -n "${S3_BUCKET:-}" ]]; then
    BACKUP_S3_BUCKET="${S3_BUCKET}"
    save_env_value "BACKUP_S3_BUCKET" "${BACKUP_S3_BUCKET}"
    export BACKUP_S3_BUCKET
  fi

  if [[ -z "${BACKUP_S3_PREFIX:-}" ]]; then
    BACKUP_S3_PREFIX="backups/postgres"
    save_env_value "BACKUP_S3_PREFIX" "${BACKUP_S3_PREFIX}"
    export BACKUP_S3_PREFIX
  fi

  if [[ -z "${BACKUP_RETENTION_DAYS:-}" ]]; then
    BACKUP_RETENTION_DAYS="30"
    save_env_value "BACKUP_RETENTION_DAYS" "${BACKUP_RETENTION_DAYS}"
    export BACKUP_RETENTION_DAYS
  fi

  if [[ -z "${LOCAL_BACKUP_RETENTION_DAYS:-}" ]]; then
    LOCAL_BACKUP_RETENTION_DAYS="14"
    save_env_value "LOCAL_BACKUP_RETENTION_DAYS" "${LOCAL_BACKUP_RETENTION_DAYS}"
    export LOCAL_BACKUP_RETENTION_DAYS
  fi

  if [[ -z "${S3_SCHEME:-}" ]]; then
    S3_SCHEME="https"
    save_env_value "S3_SCHEME" "${S3_SCHEME}"
    export S3_SCHEME
  fi

  chmod 600 "${ENV_FILE}"
}

validate_env() {
  [[ -n "${DOMAIN:-}" ]] || fail "DOMAIN пустой в infra/.env.prod"
  [[ -n "${POSTGRES_DB:-}" ]] || fail "POSTGRES_DB пустой в infra/.env.prod"
  [[ -n "${POSTGRES_USER:-}" ]] || fail "POSTGRES_USER пустой в infra/.env.prod"
  [[ -n "${ADMIN_EMAIL:-}" ]] || fail "ADMIN_EMAIL пустой в infra/.env.prod"
  [[ -n "${ADMIN_PASSWORD:-}" ]] || fail "ADMIN_PASSWORD пустой в infra/.env.prod"
  [[ "${#ADMIN_PASSWORD}" -ge 12 ]] || fail "ADMIN_PASSWORD должен быть минимум 12 символов"

  [[ -n "${S3_ENDPOINT:-}" ]] || fail "S3_ENDPOINT пустой"
  [[ -n "${S3_REGION:-}" ]] || fail "S3_REGION пустой"
  [[ -n "${S3_BUCKET:-}" ]] || fail "S3_BUCKET пустой"
  [[ -n "${S3_ACCESS_KEY:-}" ]] || fail "S3_ACCESS_KEY пустой"
  [[ -n "${S3_SECRET_KEY:-}" ]] || fail "S3_SECRET_KEY пустой"
  [[ -n "${S3_PUBLIC_URL:-}" ]] || fail "S3_PUBLIC_URL пустой"

  if [[ "${S3_ENDPOINT}" == http://* || "${S3_ENDPOINT}" == https://* ]]; then
    fail "S3_ENDPOINT должен быть без схемы. Правильно: S3_ENDPOINT=s3.twcstorage.ru"
  fi

  if [[ "${S3_ENDPOINT}" == */* ]]; then
    fail "S3_ENDPOINT должен быть без пути и без bucket. Правильно: S3_ENDPOINT=s3.twcstorage.ru"
  fi

  if [[ "${BACKUP_S3_ENABLED:-false}" == "true" ]]; then
    [[ -n "${BACKUP_S3_BUCKET:-${S3_BUCKET:-}}" ]] || fail "BACKUP_S3_ENABLED=true, но BACKUP_S3_BUCKET и S3_BUCKET пустые"
    [[ -n "${BACKUP_S3_PREFIX:-}" ]] || fail "BACKUP_S3_PREFIX пустой"
    [[ -n "${BACKUP_RETENTION_DAYS:-}" ]] || fail "BACKUP_RETENTION_DAYS пустой"
    [[ "${BACKUP_RETENTION_DAYS}" =~ ^[0-9]+$ ]] || fail "BACKUP_RETENTION_DAYS должен быть числом"
    [[ -n "${S3_ENDPOINT:-}" ]] || fail "S3_ENDPOINT пустой для S3 backup"
    [[ -n "${S3_ACCESS_KEY:-}" ]] || fail "S3_ACCESS_KEY пустой для S3 backup"
    [[ -n "${S3_SECRET_KEY:-}" ]] || fail "S3_SECRET_KEY пустой для S3 backup"

    if [[ "${S3_ENDPOINT}" == http://* || "${S3_ENDPOINT}" == https://* ]]; then
      fail "S3_ENDPOINT должен быть без схемы. Правильно: S3_ENDPOINT=s3.twcstorage.ru"
    fi

    if [[ "${S3_ENDPOINT}" == */* ]]; then
      fail "S3_ENDPOINT должен быть без пути и без bucket. Правильно: S3_ENDPOINT=s3.twcstorage.ru"
    fi
  fi

  if [[ ! -f "${PROJECT_DIR}/infra/docker-compose.prod.yml" ]]; then
    fail "Не найден infra/docker-compose.prod.yml"
  fi

  if [[ ! -f "${PROJECT_DIR}/infra/Caddyfile" ]]; then
    fail "Не найден infra/Caddyfile"
  fi
}

install_base_packages() {
  log "Установка базовых пакетов"

  apt-get update
  apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    git \
    openssl \
    ufw \
    cron \
    jq \
    nano \
    htop \
    unzip
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker уже установлен: $(docker --version)"
  else
    log "Установка Docker"

    install -m 0755 -d /etc/apt/keyrings

    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    chmod a+r /etc/apt/keyrings/docker.gpg

    . /etc/os-release

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
      > /etc/apt/sources.list.d/docker.list

    apt-get update
    apt-get install -y \
      docker-ce \
      docker-ce-cli \
      containerd.io \
      docker-buildx-plugin \
      docker-compose-plugin
  fi

  systemctl enable docker
  systemctl start docker

  log "Docker: $(docker --version)"
  log "Docker Compose: $(docker compose version)"
}

setup_swap() {
  if [[ "${ENABLE_SWAP:-true}" != "true" ]]; then
    log "Swap отключён"
    return
  fi

  if swapon --show | grep -q "/swapfile"; then
    log "Swap уже есть"
    free -h
    return
  fi

  local size="${SWAP_SIZE:-2G}"

  log "Создание swap ${size}"

  fallocate -l "${size}" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile

  if ! grep -q "^/swapfile " /etc/fstab; then
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
  fi

  free -h
}

setup_firewall() {
  log "Настройка firewall"

  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 443/udp
  ufw --force enable
  ufw status verbose
}

write_backup_scripts() {
  log "Создание backup/restore scripts"

  mkdir -p "${PROJECT_DIR}/scripts"
  mkdir -p "${PROJECT_DIR}/backups"

  cat > "${PROJECT_DIR}/scripts/backup-postgres.sh" <<'EOF'
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

  if [[ "${S3_ENDPOINT}" == */* ]]; then
    echo "S3_ENDPOINT must be without path and without bucket. Example: s3.twcstorage.ru" >&2
    exit 1
  fi

  BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX#/}"
  BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX%/}"

  echo "Uploading backup to S3: s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX}/${BACKUP_NAME}"

  docker run --rm \
    --entrypoint /bin/sh \
    -v "$BACKUP_DIR:/backup:ro" \
    -e S3_SCHEME="$S3_SCHEME" \
    -e S3_ENDPOINT="$S3_ENDPOINT" \
    -e S3_ACCESS_KEY="$S3_ACCESS_KEY" \
    -e S3_SECRET_KEY="$S3_SECRET_KEY" \
    -e BACKUP_S3_BUCKET="$BACKUP_S3_BUCKET" \
    -e BACKUP_S3_PREFIX="$BACKUP_S3_PREFIX" \
    -e BACKUP_NAME="$BACKUP_NAME" \
    -e BACKUP_RETENTION_DAYS="$BACKUP_RETENTION_DAYS" \
    minio/mc:latest -lc '
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
EOF

  cat > "${PROJECT_DIR}/scripts/restore-postgres.sh" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/infra/.env.prod"
BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  BACKUP_FILE="$(ls -t "$ROOT_DIR"/backups/*.dump | head -n 1)"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

TEST_DB="${POSTGRES_DB}_restore_test"

docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/infra/docker-compose.prod.yml" exec -T postgres \
  psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};"

docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/infra/docker-compose.prod.yml" exec -T postgres \
  psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE ${TEST_DB};"

cat "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/infra/docker-compose.prod.yml" exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$TEST_DB" --clean --if-exists

docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/infra/docker-compose.prod.yml" exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$TEST_DB" -c "\dt"

echo "Restore drill completed into database: $TEST_DB"
EOF

  chmod +x "${PROJECT_DIR}/scripts/backup-postgres.sh"
  chmod +x "${PROJECT_DIR}/scripts/restore-postgres.sh"
}

setup_backup_cron() {
  if [[ "${ENABLE_BACKUP_CRON:-true}" != "true" ]]; then
    log "Backup cron отключён"
    return
  fi

  log "Настройка backup cron"

  local cron_line
  cron_line="30 3 * * * cd ${PROJECT_DIR} && /bin/bash scripts/backup-postgres.sh >> ${PROJECT_DIR}/backups/backup.log 2>&1"

  crontab -l 2>/dev/null | grep -v "scripts/backup-postgres.sh" > /tmp/current-cron || true
  echo "${cron_line}" >> /tmp/current-cron
  crontab /tmp/current-cron
  rm -f /tmp/current-cron

  systemctl enable cron
  systemctl start cron
}

deploy_app() {
  log "Pull и запуск production stack"

  cd "${PROJECT_DIR}"

  docker compose \
    --env-file infra/.env.prod \
    -f infra/docker-compose.prod.yml \
    pull

  docker compose \
    --env-file infra/.env.prod \
    -f infra/docker-compose.prod.yml \
    up -d --remove-orphans

  docker compose \
    --env-file infra/.env.prod \
    -f infra/docker-compose.prod.yml \
    ps
}

create_admin() {
  log "Создание администратора"

  cd "${PROJECT_DIR}"

  set +e
  docker compose \
    --env-file infra/.env.prod \
    -f infra/docker-compose.prod.yml \
    exec -T backend \
    /app/create-admin -email "${ADMIN_EMAIL}" -password "${ADMIN_PASSWORD}"
  local code=$?
  set -e

  if [[ "${code}" -ne 0 ]]; then
    warn "Админ не создан автоматически. Возможно, он уже существует или create-admin недоступен."
    warn "Проверь вручную: docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs backend --tail=100"
  fi
}

run_initial_backup() {
  log "Первичный backup"

  cd "${PROJECT_DIR}"

  set +e
  ./scripts/backup-postgres.sh
  local code=$?
  set -e

  if [[ "${code}" -ne 0 ]]; then
    warn "Первичный backup не прошёл. Проверь позже после полного старта контейнеров."
  fi
}

print_summary() {
  log "Готово"

  cat <<EOF

Сайт:
  https://${DOMAIN}

Админка:
  https://${DOMAIN}/admin/login

API:
  https://${DOMAIN}/api/v1/health
  https://${DOMAIN}/api/v1/ready

Проект:
  ${PROJECT_DIR}

Проверка:
  cd ${PROJECT_DIR}
  docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps

Логи:
  docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs caddy --tail=100
  docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs backend --tail=100
  docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs frontend --tail=100

Обновление production:
  cd ${PROJECT_DIR}
  docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml pull
  docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --remove-orphans

Backup:
  cd ${PROJECT_DIR}
  ./scripts/backup-postgres.sh
  ./scripts/restore-postgres.sh

Важно:
  DNS A-записи для ${DOMAIN} и www.${DOMAIN} должны указывать на IP сервера.
  S3_ENDPOINT должен быть без https:// и без bucket, например: s3.twcstorage.ru.
  Если BACKUP_S3_ENABLED=true, dump базы дополнительно выгружается в S3.

EOF
}

main() {
  need_root
  load_env
  validate_env
  normalize_env
  install_base_packages
  install_docker
  setup_swap
  setup_firewall
  write_backup_scripts
  setup_backup_cron
  deploy_app
  create_admin
  run_initial_backup
  print_summary
}

main "$@"