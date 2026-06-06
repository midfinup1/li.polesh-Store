#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/infra/.env.prod"
PROD_COMPOSE_FILE="${PROJECT_DIR}/infra/docker-compose.prod.yml"
CADDYFILE="${PROJECT_DIR}/infra/Caddyfile"

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
  openssl rand -base64 48 | tr -d '\n'
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

  chmod 600 "${ENV_FILE}"
}

validate_env() {
  [[ -n "${DOMAIN:-}" ]] || fail "DOMAIN пустой в infra/.env.prod"
  [[ -n "${POSTGRES_DB:-}" ]] || fail "POSTGRES_DB пустой в infra/.env.prod"
  [[ -n "${POSTGRES_USER:-}" ]] || fail "POSTGRES_USER пустой в infra/.env.prod"
  [[ -n "${ADMIN_EMAIL:-}" ]] || fail "ADMIN_EMAIL пустой в infra/.env.prod"
  [[ -n "${ADMIN_PASSWORD:-}" ]] || fail "ADMIN_PASSWORD пустой в infra/.env.prod"
  [[ "${#ADMIN_PASSWORD}" -ge 12 ]] || fail "ADMIN_PASSWORD должен быть минимум 12 символов"

  [[ -n "${STORAGE_TYPE:-}" ]] || fail "STORAGE_TYPE пустой в infra/.env.prod"

  if [[ "${STORAGE_TYPE}" == "s3" ]]; then
    [[ -n "${S3_ENDPOINT:-}" ]] || fail "S3_ENDPOINT пустой"
    [[ -n "${S3_REGION:-}" ]] || fail "S3_REGION пустой"
    [[ -n "${S3_BUCKET:-}" ]] || fail "S3_BUCKET пустой"
    [[ -n "${S3_ACCESS_KEY:-}" ]] || fail "S3_ACCESS_KEY пустой"
    [[ -n "${S3_SECRET_KEY:-}" ]] || fail "S3_SECRET_KEY пустой"
    [[ -n "${S3_PUBLIC_URL:-}" ]] || fail "S3_PUBLIC_URL пустой"
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

write_caddyfile() {
  log "Создание infra/Caddyfile"

  cat > "${CADDYFILE}" <<'EOF'
{$DOMAIN} {
	encode zstd gzip

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		Permissions-Policy "camera=(), microphone=(), geolocation=()"
	}

	handle /api/v1/* {
		reverse_proxy backend:8080
	}

	handle /uploads/* {
		reverse_proxy backend:8080
	}

	handle {
		reverse_proxy frontend:3000
	}
}

www.{$DOMAIN} {
	redir https://{$DOMAIN}{uri} permanent
}
EOF
}

write_prod_compose() {
  log "Создание infra/docker-compose.prod.yml"

  cat > "${PROD_COMPOSE_FILE}" <<'EOF'
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    env_file:
      - .env.prod
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - app

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: /api/v1
        NEXT_PUBLIC_SITE_URL: ${FRONTEND_URL}
    restart: unless-stopped
    env_file:
      - .env.prod
    environment:
      API_INTERNAL_URL: http://backend:8080/api/v1
      NEXT_PUBLIC_API_URL: /api/v1
      NEXT_PUBLIC_SITE_URL: ${FRONTEND_URL}
    depends_on:
      - backend
    networks:
      - app

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - .env.prod
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - app

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file:
      - .env.prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - app

volumes:
  postgres_data:
  backend_uploads:
  caddy_data:
  caddy_config:

networks:
  app:
    driver: bridge
EOF
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

set -a
source "$ENV_FILE"
set +a

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.dump"

docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/infra/docker-compose.prod.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$BACKUP_FILE"

find "$BACKUP_DIR" -type f -name "*.dump" -mtime +14 -delete

echo "Backup created: $BACKUP_FILE"
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
  log "Сборка и запуск production stack"

  cd "${PROJECT_DIR}"

  docker compose \
    --env-file infra/.env.prod \
    -f infra/docker-compose.prod.yml \
    up --build -d

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

Backup:
  cd ${PROJECT_DIR}
  ./scripts/backup-postgres.sh
  ./scripts/restore-postgres.sh

Важно:
  DNS A-записи для ${DOMAIN} и www.${DOMAIN} должны указывать на IP сервера.
  Для первого выпуска HTTPS Cloudflare лучше держать в режиме DNS only.

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
  write_caddyfile
  write_prod_compose
  write_backup_scripts
  setup_backup_cron
  deploy_app
  create_admin
  run_initial_backup
  print_summary
}

main "$@"