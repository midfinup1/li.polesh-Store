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
- скрытые работы не выдаются публичным API;
- SEO: ISR-страницы работ, `generateMetadata` (canonical/OpenGraph), JSON-LD (`VisualArtwork`, `Person`), `sitemap.xml`, `robots.txt`.

Админка (`/admin`, защищена `middleware.ts` + JWT на API):

- вход с серверной HttpOnly cookie, редирект на логин при 401;
- редактирование профиля художницы;
- категории: создание и удаление;
- работы: создание, полное редактирование полей, удаление, переключение статуса `available`, `sold`, `hidden`;
- изображения: загрузка JPEG/PNG/WebP до 20 MB, удаление, изменение порядка, генерация JPEG-миниатюры на загрузке;
- удаление работы с заказами блокируется (HTTP 409) во избежание потери истории — её следует скрывать;
- просмотр заявок и изменение их статуса;
- CLI-команда создания администратора.

Инфраструктура:

- development и production Docker Compose;
- Caddy reverse proxy с HTTPS и security headers;
- CI (`.github/workflows/ci.yml`): vet/build/test бэка, lint/type-check/build фронта;
- Deploy (`.github/workflows/deploy.yml`): сборка и push образов в GHCR + `docker compose pull && up -d` на VPS по SSH;
- per-IP rate limiting на `/auth/login` и `/orders` (stdlib, без внешних зависимостей);
- скрипт резервного копирования PostgreSQL с опциональной выгрузкой в S3.

> Драйвер БД — `lib/pq` (как в текущем go.sum). Миграции переведены на идиоматичный формат goose (без единого `StatementBegin/End`), поэтому переход на рекомендованный `pgx/v5` не потребует правок SQL — только смены драйвера и `go mod tidy`.
> Миниатюры генерируются стандартной библиотекой (JPEG, area-average downscale, без новых зависимостей). Кодирование WebP/AVIF потребует добавления модуля (`golang.org/x/image` или webp-энкодер) и оставлено отдельным шагом.

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
GET    /api/v1/health          # liveness
GET    /api/v1/ready           # readiness (checks DB)
GET    /api/v1/artworks
GET    /api/v1/artworks/{id}
GET    /api/v1/categories
GET    /api/v1/artist
POST   /api/v1/orders          # rate-limited (10/hour/IP)
POST   /api/v1/auth/login      # rate-limited (10/min/IP)
POST   /api/v1/auth/logout

GET    /api/v1/admin/artworks
POST   /api/v1/admin/artworks
PUT    /api/v1/admin/artworks/{id}
DELETE /api/v1/admin/artworks/{id}
POST   /api/v1/admin/artworks/{id}/images
DELETE /api/v1/admin/artworks/{id}/images/{imageId}
PATCH  /api/v1/admin/artworks/{id}/images/reorder
GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/{id}
PATCH  /api/v1/admin/orders/{id}/status
PUT    /api/v1/admin/artist
POST   /api/v1/admin/categories
PUT    /api/v1/admin/categories/{id}
DELETE /api/v1/admin/categories/{id}
```

## Production deployment

1. На VPS создать каталог (например `/opt/artist-portfolio`), положить рядом `docker-compose.prod.yml`, `Caddyfile` и `.env` по образцу `infra/.env.prod.example`.
2. В GitHub repository secrets задать `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_DIR` (путь к каталогу из п.1).
3. В GitHub repository variables задать `NEXT_PUBLIC_SITE_URL` (полный https-адрес сайта) и `NEXT_PUBLIC_IMAGE_HOST` (домен CDN/S3 без протокола) — оба вшиваются в клиентский бандл на этапе сборки образа.
4. Настроить DNS домена на VPS, при необходимости Cloudflare proxy.
5. Push в `main` запускает CI, собирает образы в GHCR и выполняет `docker compose pull && up -d` на VPS.

В production приложение не стартует без реального `JWT_SECRET` длиной не менее 32 символов и без настроенного S3 storage: изображения нельзя безопасно хранить внутри контейнера.

## Что осталось на следующий этап

- кодирование WebP/AVIF-вариантов миниатюр (нужен дополнительный Go-модуль + `go mod tidy`);
- переход с `lib/pq` на `pgx/v5` (SQL уже совместим);
- integration-тесты API через testcontainers и e2e-тесты Playwright;
- регулярная проверка восстановления из бэкапа (restore drill);
- наблюдаемость: метрики Prometheus, дашборды Grafana/Loki, алерты (Uptime Kuma) — это операционная настройка, а не код репозитория.

## Next production-hardening stage

This repository now includes the next hardening pass:

- generated files are excluded through `.gitignore`;
- GitHub Actions CI and deploy workflows are present in `.github/workflows`;
- backend database driver is `pgx/v5` through `sqlx`;
- API integration tests are placed in `backend/internal/integration` and use Testcontainers PostgreSQL;
- Playwright smoke e2e tests are placed in `frontend/e2e`;
- image processing is isolated in `backend/internal/imageprocessor`;
- uploaded artwork images get JPEG thumbnails, optional WebP thumbnails through `cwebp`, and optional AVIF thumbnails through `avifenc`;
- restore drill documentation is in `docs/ops/restore-drill.md`;
- monitoring stack is in `infra/docker-compose.monitoring.yml` with Prometheus, Grafana, Loki, Promtail and Uptime Kuma.

### Local checks

```bash
cd backend
go mod tidy
go test ./...

cd ../frontend
npm ci
npm run type-check
npm run lint
npm run build
npm run e2e
```

### Monitoring locally

```bash
docker compose --env-file infra/.env \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.monitoring.yml \
  up -d
```

Open:

```text
Prometheus:  http://localhost:9090
Grafana:     http://localhost:3001
Uptime Kuma: http://localhost:3002
```
