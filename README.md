# Каталог работ lipolesh

Публичный каталог работ художницы lipolesh.art с заявками на обратную связь, защищённой админкой, загрузкой изображений, Telegram-уведомлениями и production-деплоем через Docker Compose.

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
- Telegram-уведомления о новых заявках
- внутренние health/readiness endpoints
- внутренняя аналитика просмотров и кликов по категориям
- автоматическая очистка старых analytics events

### Frontend

- Next.js 14 App Router
- React
- TypeScript
- Tailwind CSS
- SEO metadata, OpenGraph, sitemap, robots
- RU/EN-переключение
- светлая/тёмная тема

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
- внешний uptime-monitoring через UptimeRobot

## Структура проекта

```text
backend/
  cmd/
  internal/
  migrations/

frontend/
  app/
  components/
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

docs/
  monitoring-and-telegram.md

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

## Production

Основной production compose:

```text
infra/docker-compose.prod.yml
```

Основной env-файл:

```text
infra/.env.prod
```

Пример env-файла:

```text
infra/.env.prod.example
```

Production health endpoints:

```text
https://lipolesh.art/api/health
https://lipolesh.art/api/v1/health
https://lipolesh.art/api/v1/ready
```

Внешний uptime-monitoring настроен через UptimeRobot.

## Что уже сделано

- backend/frontend production compose;
- Caddy reverse proxy;
- backend/frontend healthcheck;
- readiness endpoint с проверкой БД;
- автоматический migrate service;
- CI для backend и frontend;
- deploy workflow в GitHub Actions;
- Telegram-уведомления о новых заявках;
- favicon;
- OpenGraph metadata и fallback OG image;
- загрузка изображений в S3/local storage;
- ограничение размера загружаемых изображений;
- JPEG/WebP/AVIF thumbnails;
- автоматический и ручной `alt_text`;
- фото художницы отдельно для главной и страницы «Об авторе»;
- внутренняя аналитика просмотров и кликов;
- политики обработки персональных данных;
- PostgreSQL backup и restore-скрипты;
- удаление заявок из админки;
- ограниченные `remotePatterns` для изображений Next.js;
- админка разнесена на отдельные секции-компоненты.

## Что осталось проверить вручную

- мобильную версию: главная, каталог, карточка, форма, меню, админка;
- OpenGraph preview в Telegram/VK после деплоя;
- отправку заявки на production;
- получение Telegram-уведомления на production;
- загрузку изображения на production;
- backup/restore drill на тестовой базе;
- SSH hardening на VPS.
