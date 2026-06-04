# Портфолио художницы

Production-oriented monorepo для сайта художницы: публичная галерея, описание работ, заявки на приобретение и защищённая админка.

## Принятый стек

- Backend: Go 1.26, chi, sqlx, PostgreSQL, goose, JWT-сессия в HttpOnly cookie, S3-compatible storage, Resend.
- Frontend: Next.js 14.2.35 App Router, React, TypeScript, Tailwind CSS.
- Infrastructure: Docker Compose, Caddy, GitHub Actions, GHCR, VPS, S3 storage.
- Development: локальные изображения сохраняются в volume `/app/uploads`; в production backend требует S3-конфигурацию.

Next.js зафиксирован на `14.2.35`: это исправленная версия ветки 14.x для уязвимостей React Server Components, опубликованных Vercel в декабре 2025 года. Node.js образ переведён на ветку 24 LTS, Go — на ветку 1.26.

## Реализовано

Публичная часть:

- главная страница;
- галерея с фильтрацией по категориям;
- страница работы с описанием и формой заявки;
- страницы «О художнице» и «Контакты»;
- скрытые работы не выдаются публичным API.

Админка:

- вход с серверной HttpOnly cookie;
- редактирование профиля художницы;
- добавление категорий;
- добавление работ и переключение статуса `available`, `sold`, `hidden`;
- загрузка JPEG, PNG и WebP до 20 MB;
- просмотр заявок и изменение их статуса;
- CLI-команда создания администратора.

Инфраструктура:

- development и production Docker Compose;
- Caddy reverse proxy с HTTPS и security headers;
- CI и deployment workflows GitHub Actions;
- скрипт локального резервного копирования PostgreSQL.

## Первый запуск локально

Предварительно должны быть доступны Docker, Go 1.26 и Node.js 24. Проекту нужно один раз скачать зависимости и создать lock-файлы:

```bash
cp infra/.env.example infra/.env
cd backend
go mod tidy
cd ../frontend
npm install
cd ..
```

После выполнения необходимо закоммитить созданные `backend/go.sum` и `frontend/package-lock.json`. Они обязательны для воспроизводимых CI и production-сборок.

Запуск контейнеров:

```bash
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d
```

Адреса:

```text
Сайт:     http://localhost:3000
API:      http://localhost:8080/api/v1
Adminer:  http://localhost:8081
```

## Создание администратора

После запуска backend:

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="very-long-local-password-2026" make admin
```

Вход в интерфейс:

```text
http://localhost:3000/admin/login
```

## Основные API endpoints

```text
GET    /api/v1/health
GET    /api/v1/artworks
GET    /api/v1/artworks/{id}
GET    /api/v1/categories
GET    /api/v1/artist
POST   /api/v1/orders
POST   /api/v1/auth/login
POST   /api/v1/auth/logout

GET    /api/v1/admin/artworks
POST   /api/v1/admin/artworks
PUT    /api/v1/admin/artworks/{id}
POST   /api/v1/admin/artworks/{id}/images
PATCH  /api/v1/admin/artworks/{id}/images/reorder
GET    /api/v1/admin/orders
PATCH  /api/v1/admin/orders/{id}/status
PUT    /api/v1/admin/artist
POST   /api/v1/admin/categories
```

## Production deployment

1. На VPS создать каталог `/opt/artist-portfolio` и файл `.env` по образцу `infra/.env.prod.example`.
2. В GitHub repository secrets задать `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
3. В GitHub repository variable задать `NEXT_PUBLIC_IMAGE_HOST`, то есть домен CDN или S3 public URL без протокола.
4. Настроить DNS домена на VPS и Cloudflare proxy при необходимости.
5. Push в `main` собирает images в GHCR и выполняет `docker compose pull` и `up -d` на VPS.

В production приложение не стартует без реального `JWT_SECRET` длиной не менее 32 символов и без настроенного S3 storage: изображения нельзя безопасно хранить внутри контейнера.

## Что следует реализовать следующим этапом

- генерацию thumbnails и WebP/AVIF при загрузке изображения;
- удаление объектов из S3 при удалении изображения или работы;
- rate limiting и CAPTCHA на публичной форме заявки;
- integration tests API через testcontainers и e2e tests Playwright;
- загрузку резервных копий PostgreSQL в S3 с проверкой восстановления;
- метрики Prometheus, Grafana и алерты доступности;
- SEO: sitemap, robots, Open Graph изображение и schema.org для работ.
