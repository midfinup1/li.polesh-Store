# Каталог работ lipolesh

Публичный каталог работ художницы lipolesh.art с заявками на обратную связь, защищённой админкой, загрузкой изображений, Telegram-уведомлениями, PostgreSQL backup и production-деплоем через Docker Compose.

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
  - WebP thumbnail через cwebp
  - AVIF thumbnail через avifenc
- Telegram-уведомления о новых заявках
- health/readiness endpoints
- внутренняя аналитика просмотров и кликов
- audit log действий админов с old/new значениями
- автоматическая очистка старых analytics events

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- SEO metadata, OpenGraph, sitemap, robots
- RU/EN-переключение
- светлая/тёмная тема
- адаптивная публичная часть и админка

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

text backend/   cmd/   internal/   migrations/  frontend/   app/   components/   lib/   public/   types/  infra/   Caddyfile   docker-compose.yml   docker-compose.prod.yml   .env.example   .env.prod.example  scripts/   install-vps.sh   backup-postgres.sh   restore-postgres.sh   test-restore-postgres.sh   local-restore-and-up.sh  docs/   operations.md  .github/   workflows/     ci.yml     deploy.yml 

## Локальный запуск

Требуется:

text Docker Go Node.js npm 

Подготовка:

bash make init 

Запуск:

bash make up 

Адреса:

text Сайт:     http://localhost:3000 API:      http://localhost:8080/api/v1 Adminer:  http://localhost:8081 

Логи:

bash make logs 

Остановка:

bash make down 

Проверки:

bash make test 

Создать администратора локально:

bash ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="password123456" make admin 

Вход в админку:

text http://localhost:3000/admin/login 

## Локальный запуск на базе из backup

Скачать dump с сервера или из S3, положить его в папку backups/, затем выполнить:

bash ./scripts/local-restore-and-up.sh backups/ИМЯ_БЭКАПА.dump 

Скрипт восстановит dump в локальную PostgreSQL-базу и поднимет проект через local Docker Compose.

## Production

Production compose:

text infra/docker-compose.prod.yml 

Production env:

text infra/.env.prod 

Основные production endpoints:

text https://lipolesh.art https://lipolesh.art/admin/login https://lipolesh.art/api/health https://lipolesh.art/api/v1/health https://lipolesh.art/api/v1/ready 

Деплой и rollback выполняются через GitHub Actions:

text GitHub -> Actions -> Deploy -> Run workflow 

При push в main собираются и публикуются Docker images. На сервер они не выкатываются автоматически.

Ручной deploy:

text action = deploy rollback_sha = пусто 

Rollback:

text action = rollback rollback_sha = полный SHA коммита 

## Документация по эксплуатации

Краткая памятка по управлению production, backup, restore, S3, Telegram, UptimeRobot и аварийным действиям находится здесь:

text docs/operations.md 