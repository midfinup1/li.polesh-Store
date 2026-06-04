# Compose commands

```bash
cp infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d
docker compose --env-file infra/.env -f infra/docker-compose.yml logs -f
docker compose --env-file infra/.env -f infra/docker-compose.yml down
```

Production запуск выполняется из каталога на VPS, где рядом находятся `docker-compose.prod.yml`, `Caddyfile` и приватный `.env`:

```bash
docker compose --env-file .env -f docker-compose.prod.yml pull
docker compose --env-file .env -f docker-compose.prod.yml up -d --remove-orphans
```
