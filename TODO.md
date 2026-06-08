Ниже полный чек-лист по всем 15 пунктам сразу. Выполняй по порядку из корня проекта:

cd ~/li.polesh-Store

Проверь, что ты в корне:

ls

Должно быть:

backend
frontend
infra
scripts
docs
Makefile

1. Прогнать go test ./...

cd backend
go mod tidy
go test ./...
cd ..

Если будет ошибка версии Go, проверь:

go version

Если локальная версия Go ниже той, что указана в backend/go.mod, запускай через Docker после поднятия контейнеров:

cp infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d postgres backend
docker compose --env-file infra/.env -f infra/docker-compose.yml exec backend go test ./...

2. Прогнать npm run build

cd frontend
npm ci
npm run type-check
npm run lint
npm run build
cd ..

Если будет ошибка по Google Fonts, это обычно сеть или VPN. Тогда временно проверь без Docker через нормальный интернет либо позже перейдём на локальные шрифты.

3. Поднять Docker Compose локально

cp infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d

Проверить контейнеры:

docker compose --env-file infra/.env -f infra/docker-compose.yml ps

Проверить логи:

docker compose --env-file infra/.env -f infra/docker-compose.yml logs backend --tail=100
docker compose --env-file infra/.env -f infra/docker-compose.yml logs frontend --tail=100

Проверить API:

curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/ready
curl http://localhost:8080/metrics

Открыть сайт:

http://localhost:3000

4. Создать админа

ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="password1234" make admin

Если make admin не сработает, выполни напрямую:

docker compose --env-file infra/.env -f infra/docker-compose.yml exec backend \
go run ./cmd/create-admin -email "admin@example.com" -password "password1234"

Войти в админку:

http://localhost:3000/admin/login

Данные:

Email: admin@example.com
Password: password1234

5. Добавить категорию

Через сайт:

http://localhost:3000/admin

В блоке категорий добавь:

Название: Живопись
slug: painting

Проверить через API:

curl http://localhost:8080/api/v1/categories

Проверить в базе через Adminer:

http://localhost:8081

Данные для входа в Adminer:

Движок: PostgreSQL
Сервер: postgres
Имя пользователя: postgres
Пароль: postgres
База данных: artist_portfolio

SQL-проверка:

SELECT * FROM categories;

6. Добавить работу

В админке:

http://localhost:3000/admin

В блоке добавления работы заполни:

Название: Тестовая работа
Цена: 15000
Категория: Живопись
Год: 2026
Размер: 60x80
Материалы: Холст, масло
Описание: Тестовое описание работы.

Проверить API:

curl http://localhost:8080/api/v1/artworks

Проверить в базе:

SELECT id, title, price, status, category_id FROM artworks;

7. Загрузить изображение

В админке в списке работ выбери созданную работу и загрузи изображение .jpg, .png или .webp.

Потом проверь логи backend:

docker compose --env-file infra/.env -f infra/docker-compose.yml logs backend --tail=100

Проверить файлы локально:

find backend/uploads -maxdepth 5 -type f

Если storage внутри контейнера пишет в volume, проверь так:

docker compose --env-file infra/.env -f infra/docker-compose.yml exec backend find /app/uploads -maxdepth 5 -type f

8. Проверить JPEG/WebP/AVIF thumbnail

Сначала проверь наличие кодеков внутри backend-контейнера:

docker compose --env-file infra/.env -f infra/docker-compose.yml exec backend which cwebp
docker compose --env-file infra/.env -f infra/docker-compose.yml exec backend which avifenc

Ожидаемо:

/usr/bin/cwebp
/usr/bin/avifenc

Проверь записи в базе:

docker compose --env-file infra/.env -f infra/docker-compose.yml exec postgres \
psql -U postgres -d artist_portfolio -c "SELECT original_url, thumb_url, thumb_webp_url, thumb_avif_url FROM artwork_images;"

Должно быть примерно:

/uploads/artworks/1/xxx_original.jpg
/uploads/artworks/1/xxx_thumb.jpg
/uploads/artworks/1/xxx_thumb.webp
/uploads/artworks/1/xxx_thumb.avif

Проверь физические файлы:

docker compose --env-file infra/.env -f infra/docker-compose.yml exec backend \
find /app/uploads -type f | sort

Проверь доступность через HTTP:

curl -I http://localhost:8080/uploads/artworks/1/

Если прямой URL из базы выглядит, например:

/uploads/artworks/1/123_thumb.webp

проверь:

curl -I http://localhost:8080/uploads/artworks/1/123_thumb.webp
curl -I http://localhost:8080/uploads/artworks/1/123_thumb.avif
curl -I http://localhost:8080/uploads/artworks/1/123_thumb.jpg

Должно быть:

HTTP/1.1 200 OK

9. Отправить заявку с публичной страницы

Открой галерею:

http://localhost:3000/gallery

Открой созданную работу.

Заполни форму заявки:

Имя: Тестовый покупатель
Email: buyer@example.com
Телефон: +79990000000
Сообщение: Хочу уточнить детали покупки.

Отправь форму.

Проверить в базе:

docker compose --env-file infra/.env -f infra/docker-compose.yml exec postgres \
psql -U postgres -d artist_portfolio -c "SELECT id, artwork_id, name, email, phone, status, created_at FROM orders ORDER BY id DESC;"

Ожидаемо:

status = new

10. Проверить админку заявок

Открой:

http://localhost:3000/admin

В блоке заявок должна появиться заявка от:

Тестовый покупатель
buyer@example.com

Поменяй статус:

Новая -> Связались

Проверь в базе:

docker compose --env-file infra/.env -f infra/docker-compose.yml exec postgres \
psql -U postgres -d artist_portfolio -c "SELECT id, status FROM orders ORDER BY id DESC LIMIT 5;"

Ожидаемо:

contacted

11. Подготовить production .env

Создай production env из примера:

cp infra/.env.prod.example infra/.env.prod

Открой:

nano infra/.env.prod

Минимально заполни:

APP_ENV=production
APP_PORT=8080
DOMAIN=example.com
PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_API_URL=/api/v1
POSTGRES_DB=artist_portfolio
POSTGRES_USER=artist_user
POSTGRES_PASSWORD=CHANGE_ME_LONG_RANDOM_DB_PASSWORD
DATABASE_URL=postgres://artist_user:CHANGE_ME_LONG_RANDOM_DB_PASSWORD@postgres:5432/artist_portfolio?sslmode=disable
JWT_SECRET=CHANGE_ME_LONG_RANDOM_JWT_SECRET_AT_LEAST_64_CHARS
S3_ENDPOINT=CHANGE_ME
S3_REGION=auto
S3_BUCKET=li-polesh-store
S3_ACCESS_KEY=CHANGE_ME
S3_SECRET_KEY=CHANGE_ME
S3_PUBLIC_URL=https://CHANGE_ME
TELEGRAM_BOT_TOKEN=CHANGE_ME
TELEGRAM_CHAT_ID=CHANGE_ME
TELEGRAM_NOTIFICATIONS_ENABLED=true
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=CHANGE_ME_LONG_RANDOM_GRAFANA_PASSWORD

Сгенерировать секреты можно так:

openssl rand -base64 48
openssl rand -base64 32
openssl rand -base64 24

Проверь, что production env не попадёт в Git:

git status --ignored | grep infra/.env.prod

12. Поднять на VPS

На VPS установи Docker:

sudo apt update
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

Создай директорию проекта:

sudo mkdir -p /opt/li-polesh-store
sudo chown -R $USER:$USER /opt/li-polesh-store
cd /opt/li-polesh-store

Склонируй репозиторий:

git clone git@github.com:midfinup1/li.polesh-Store.git .

Создай env:

nano infra/.env.prod

Запусти production compose:

docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up --build -d

Проверь:

docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs caddy --tail=100
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs backend --tail=100

Создай production-админа:

ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="CHANGE_ME_LONG_ADMIN_PASSWORD" make admin-prod

13. Настроить домен и Cloudflare

В Cloudflare добавь сайт и замени NS у регистратора на nameservers Cloudflare.

DNS-записи:

A     @      VPS_IP      Proxied
CNAME www    @           Proxied

SSL/TLS в Cloudflare:

SSL/TLS mode: Full strict
Always Use HTTPS: On
Automatic HTTPS Rewrites: On
Brotli: On
HTTP/3: On

Если Caddy сам выпускает сертификат Let’s Encrypt, иногда для первого выпуска сертификата проще временно поставить DNS record как:

DNS only

После успешного выпуска сертификата можно снова включить:

Proxied

Проверка:

curl -I https://example.com
curl -I https://example.com/api/v1/ready

14. Настроить backup и restore drill

На VPS сделай директорию для бэкапов:

sudo mkdir -p /opt/li-polesh-store/backups
sudo chown -R $USER:$USER /opt/li-polesh-store/backups

Проверь backup:

cd /opt/li-polesh-store
chmod +x scripts/backup-postgres.sh
./scripts/backup-postgres.sh
ls -lah backups

Проверь restore drill на тестовой базе:

chmod +x scripts/restore-postgres.sh
./scripts/restore-postgres.sh

Если скрипт требует аргументы, посмотри:

sed -n '1,200p' scripts/restore-postgres.sh

Добавь cron:

crontab -e

Вставь ежедневный backup в 03:30:

30 3 * * * cd /opt/li-polesh-store && /bin/bash scripts/backup-postgres.sh >> /opt/li-polesh-store/backups/backup.log 2>&1

Проверить cron:

crontab -l

Периодически вручную делай restore drill:

cd /opt/li-polesh-store
./scripts/backup-postgres.sh
./scripts/restore-postgres.sh

15. Настроить Uptime Kuma и алерты

Подними мониторинг:

docker compose --env-file infra/.env.prod \
  -f infra/docker-compose.prod.yml \
  -f infra/docker-compose.monitoring.yml \
  up -d

Открой Uptime Kuma:

http://VPS_IP:3002

Лучше закрыть доступ к портам мониторинга через firewall и открыть их только для своего IP, либо проксировать через защищённый путь.

В Uptime Kuma создай monitors:

Frontend:
https://example.com
Backend ready:
https://example.com/api/v1/ready
Backend health:
https://example.com/api/v1/health

Настрой Telegram alert:

1. В Telegram создай бота через @BotFather.
2. Получи bot token.
3. Получи chat id.
4. В Uptime Kuma открой Notifications.
5. Выбери Telegram.
6. Вставь token и chat id.
7. Нажми Test.

Prometheus:

http://VPS_IP:9090

Grafana:

http://VPS_IP:3001

Данные входа берутся из:

GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=...

Проверить метрики:

curl https://example.com/metrics

Если /metrics не должен быть публичным, лучше закрыть его Caddy basic auth или доступом только из Docker-сети для Prometheus.

Финальный контрольный прогон

После всех шагов должны пройти эти проверки:

curl -I https://example.com
curl -I https://example.com/api/v1/ready
curl https://example.com/api/v1/categories

На VPS:

docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs backend --tail=100
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs frontend --tail=100
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs caddy --tail=100

В Git после локальных проверок:

git status
git add -A
git commit -m "Verify production deployment setup"
git push