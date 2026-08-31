# lipolesh Art Catalog

A public catalog of works by the artist [lipolesh.art](https://lipolesh.art).

The application includes a responsive public website, a protected administration panel, image uploads, feedback requests, Telegram notifications, internal analytics, and audit logging.

## Features

* Public catalog of artworks
* Filtering by series and artwork category
* Russian and English localization
* Light and dark themes
* Responsive public website and administration panel
* Protected administrator authentication
* Image upload with 1200px thumbnails and 2400px display variants
* Feedback request form
* Telegram notifications for new requests
* SEO metadata, Open Graph, sitemap, and robots.txt
* Internal view and click analytics
* Administrator audit log

## Technology Stack

### Backend

* Go
* chi
* sqlx
* PostgreSQL
* goose migrations
* JWT authentication using HttpOnly cookies
* S3-compatible object storage
* Telegram Bot API
* Health and readiness endpoints

Image processing:

* Original image storage
* JPEG thumbnails
* WebP thumbnails using `cwebp`
* AVIF thumbnails using `avifenc`
* High-quality Catmull-Rom downscaling
* JPEG and WebP display variants for retina screens

### Frontend

* Next.js App Router
* React
* TypeScript
* Tailwind CSS

### Infrastructure

* Docker Compose
* Caddy
* GitHub Actions
* GitHub Container Registry
* S3-compatible object storage
* PostgreSQL backups

## Project Structure

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
  install-backup-cron.sh
  backup-postgres.sh
  restore-postgres.sh
  test-restore-postgres.sh
  local-restore-and-up.sh

docs/
  operations.md

.github/
  workflows/
    ci.yml
    build-images.yml
    deploy.yml
```

## Local Development

### Requirements

* Docker
* Go
* Node.js
* npm

### Initial Setup

```bash
make init
```

### Start the Application

```bash
make up
```

The following services will be available:

```text
Website:  http://localhost:3000
API:      http://localhost:8080/api/v1
Adminer:  http://localhost:8081
```

### View Logs

```bash
make logs
```

### Run Tests

```bash
make test
```

### Stop the Application

```bash
make down
```

## Create a Local Administrator

```bash
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="password123456" \
make admin
```

The administration panel is available at:

```text
http://localhost:3000/admin/login
```

## Restore a Local Database from a Backup

Place the PostgreSQL dump in the `backups/` directory and run:

```bash
./scripts/local-restore-and-up.sh backups/backup.dump
```

The script restores the dump into the local PostgreSQL database and starts the application using the local Docker Compose configuration.

## Operations

Production deployment, rollback, backups, restore procedures, S3 configuration, Telegram notifications, uptime monitoring, and incident recovery are documented in:

```text
docs/operations.md
```
