# Каталог работ lipolesh

Публичная галерея работ художницы, заявки на приобретение и защищённая админка.

## Стек

### Backend

- Go
- chi
- sqlx
- PostgreSQL
- goose migrations
- JWT в HttpOnly cookie
- S3-compatible storage
- обработка изображений:
  - original
  - JPEG thumbnail
  - WebP thumbnail через `cwebp`
  - AVIF thumbnail через `avifenc`

### Frontend

- Next.js 14 App Router
- React
- TypeScript
- Tailwind CSS
- SEO metadata, OpenGraph, sitemap, robots

### Infrastructure

- Docker Compose
- Caddy
- GitHub Actions
- GitHub Container Registry
- VPS
- S3-compatible object storage
- PostgreSQL backup:
  - локальный dump на VPS
  - off-site dump в S3
  - restore drill
  - cron backup


### Админка

Админка доступна по адресу:

```text
/admin
```

## Структура проекта

```text
backend/
  cmd/
  internal/
  migrations/

frontend/
  app/
  components/
  e2e/
  lib/
  public/
  types/

infra/
  Caddyfile
  docker-compose.yml
  docker-compose.prod.yml
  .env.example
  .env.prod.example

scripts/
  install-vps.sh
  backup-postgres.sh
  restore-postgres.sh

.github/
  workflows/
    ci.yml
    deploy.yml
```

## Локальный запуск

Требуется:

```text
Docker
Go
Node.js
npm
```

Подготовка:

```bash
make init
```

Запуск:

```bash
make up
```

Адреса:

```text
Сайт:     http://localhost:3000
API:      http://localhost:8080/api/v1
Adminer:  http://localhost:8081
```

Логи:

```bash
make logs
```

Остановка:

```bash
make down
```

Проверки:

```bash
make test
```

Создать администратора локально:

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="password" make admin
```

Вход:

```text
http://localhost:3000/admin/login
```

## Что осталось

- внешний uptime-monitoring;
- Telegram-уведомления о новых заявках;
- Playwright e2e job в CI;
- healthcheck для backend/frontend в production compose;
- SSH hardening;
- favicon;
- заполнение `alt_text`;
- проверка OpenGraph preview.