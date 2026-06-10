# Памятка по эксплуатации

Краткая памятка по управлению production-проектом lipolesh.art.

## Основные адреса

```text
Сайт:    https://lipolesh.art
Админка: https://lipolesh.art/admin/login
API:     https://lipolesh.art/api/v1
Health:  https://lipolesh.art/api/health
Ready:   https://lipolesh.art/api/v1/ready
```

## Где что лежит

На сервере проект лежит здесь:

```bash
/opt/li-polesh-store
```

Основные файлы:

```text
infra/.env.prod                   production-переменные
infra/docker-compose.prod.yml     production Docker Compose
infra/Caddyfile                   reverse proxy и HTTPS
scripts/backup-postgres.sh        backup PostgreSQL
scripts/restore-postgres.sh       restore PostgreSQL в указанную БД
scripts/test-restore-postgres.sh  проверка backup на тестовой БД
backups/                          локальные backup-файлы на VPS
```

## Production-команды

Перейти в проект:

```bash
cd /opt/li-polesh-store
```

Посмотреть контейнеры:

```bash
make prod-ps
```

Посмотреть логи:

```bash
make prod-logs
```

Создать администратора:

```bash
set -a
source infra/.env.prod
set +a

make admin-prod
```

Production compose вручную:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs -f --tail=100
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --remove-orphans
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml down
```

Полностью удалить production volumes, включая базу:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml down -v
```

Эту команду использовать только когда точно нужно удалить текущую БД.

## Деплой

Деплой выполняется через GitHub Actions.

При push в `main`:

```text
1. запускаются проверки;
2. собираются backend/frontend Docker images;
3. images публикуются в GHCR;
4. сервер автоматически не обновляется.
```

Запустить deploy:

```text
GitHub -> Actions -> Deploy -> Run workflow
action = deploy
rollback_sha = пусто
```

Что делает deploy:

```text
1. заходит на VPS;
2. обновляет код из main;
3. делает backup PostgreSQL;
4. скачивает latest Docker images;
5. перезапускает production-контейнеры.
```

## Rollback

Rollback выполняется вручную через GitHub Actions:

```text
GitHub -> Actions -> Deploy -> Run workflow
action = rollback
rollback_sha = полный SHA коммита
```

Rollback откатывает backend/frontend Docker images.

База данных автоматически назад не откатывается. Перед rollback создаётся backup текущей БД.

Полный SHA можно посмотреть:

```text
GitHub -> Actions -> нужный build -> Commit
или
GitHub -> Code -> Commits
```

## PostgreSQL backup

Backup-скрипт:

```bash
./scripts/backup-postgres.sh
```

Локальные backup-файлы:

```text
/opt/li-polesh-store/backups/
```

Логи backup:

```bash
tail -100 /opt/li-polesh-store/backups/backup.log
```

Cron backup включается переменной:

```env
ENABLE_BACKUP_CRON=true
```

Off-site backup в S3 включается переменными:

```env
BACKUP_S3_ENABLED=true
BACKUP_S3_BUCKET=...
BACKUP_S3_PREFIX=backups/postgres
BACKUP_RETENTION_DAYS=30
```

Рекомендуемая схема:

```text
локально на VPS: последние 3-7 дней
в S3: последние 30 дней
```

Если `BACKUP_S3_ENABLED=false`, backup создаётся только локально на сервере.

## Restore текущей БД

Restore-скрипт:

```bash
./scripts/restore-postgres.sh <dump_file> [database_url]
```

Пример восстановления в production-БД:

```bash
set -a
source infra/.env.prod
set +a

CONFIRM_RESTORE=yes ./scripts/restore-postgres.sh backups/ИМЯ_БЭКАПА.dump "$DATABASE_URL"
```

Важно: если передать production `DATABASE_URL`, текущая production-БД будет перезаписана.

Без `CONFIRM_RESTORE=yes` restore не запустится.

## Restore drill

Цель restore drill — проверить, что backup не только создаётся, но и реально восстанавливается.

Периодичность:

```text
минимум 1 раз в месяц
после изменения backup-скриптов
после изменения миграций
после изменения инфраструктуры хранения
```

Проверить backup на отдельной тестовой БД:

```bash
./scripts/test-restore-postgres.sh backups/ИМЯ_БЭКАПА.dump
```

Скрипт:

```text
1. поднимает отдельный временный PostgreSQL-контейнер;
2. восстанавливает dump туда;
3. проверяет основные таблицы;
4. показывает количество строк;
5. production-БД не трогает.
```

Удалить тестовую БД после проверки:

```bash
docker rm -f li-polesh-restore-test
```

Запустить проверку и сразу удалить тестовый контейнер:

```bash
./scripts/test-restore-postgres.sh backups/ИМЯ_БЭКАПА.dump --cleanup
```

## Локальная работа с backup

Скачать backup с сервера:

```bash
scp deploy@SERVER_IP:/opt/li-polesh-store/backups/ИМЯ_БЭКАПА.dump .
```

Скачать backup из S3:

```bash
aws s3 cp s3://BUCKET/backups/postgres/ИМЯ_БЭКАПА.dump . \
  --endpoint-url https://s3.twcstorage.ru
```

Локально восстановить backup и поднять проект:

```bash
./scripts/local-restore-and-up.sh backups/ИМЯ_БЭКАПА.dump
```

После этого локальный проект работает на базе из backup.

Если потом выполнить:

```bash
make up
```

поднимется эта же локальная БД, восстановленная из backup.

Чтобы удалить локальную БД полностью:

```bash
make destroy
```

## S3

В production изображения хранятся в S3-compatible storage.

Основные переменные:

```env
S3_ENDPOINT=s3.twcstorage.ru
S3_REGION=ru-1
S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_PUBLIC_URL=...
```

В базе хранятся URL и метаданные изображений. Сами файлы лежат в S3.

Backend создаёт:

```text
original
JPEG thumbnail
WebP thumbnail
AVIF thumbnail
```

## Telegram-уведомления

Настройки:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
TELEGRAM_NOTIFICATIONS_ENABLED=true
PUBLIC_SITE_URL=https://lipolesh.art
```

Получить `chat_id`:

```text
1. написать сообщение боту;
2. открыть https://api.telegram.org/botТОКЕН_БОТА/getUpdates;
3. взять chat.id.
```

Если token/chat id пустые или `TELEGRAM_NOTIFICATIONS_ENABLED=false`, уведомления отключены.

## UptimeRobot

Для внешнего мониторинга используется UptimeRobot.

Рекомендуемые HTTP monitors:

```text
https://lipolesh.art
https://lipolesh.art/admin/login
https://lipolesh.art/api/health
https://lipolesh.art/api/v1/health
https://lipolesh.art/api/v1/ready
https://lipolesh.art/order
```

Рекомендуемый интервал:

```text
5 минут
```

Что проверяют endpoints:

```text
/api/health
проверяет доступность frontend/Caddy route.

/api/v1/health
проверяет, что backend-процесс жив.

/api/v1/ready
проверяет, что backend жив и может подключиться к PostgreSQL.
```

## Админка

В админке доступны:

```text
работы
категории
заявки
профиль художницы
аналитика
история действий
```

Работы:

```text
создание
редактирование
удаление
загрузка изображений
изменение порядка работ
изменение порядка изображений
статусы: доступна, продана, скрыта
комментарий к покупке RU/EN
описание RU/EN
```

Заявки:

```text
просмотр
смена статуса
удаление
Telegram-уведомление о новой заявке
```

Audit log сохраняет:

```text
кто сделал действие
тип действия
тип объекта
id объекта
old value
new value
metadata
дату
```

## Проверки после деплоя

После production deploy проверить:

```text
1. сайт открывается;
2. /admin/login открывается;
3. вход в админку работает;
4. создание/редактирование работы работает;
5. загрузка изображения работает;
6. заявка отправляется;
7. Telegram-уведомление приходит;
8. audit log пополняется;
9. backup перед deploy создался;
10. UptimeRobot не показывает ошибку.
```

## Аварийные действия

Посмотреть контейнеры:

```bash
make prod-ps
```

Посмотреть логи:

```bash
make prod-logs
```

Перезапустить production:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --remove-orphans
```

Остановить production:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml down
```

Проверить backup-файлы:

```bash
ls -lah /opt/li-polesh-store/backups
```

Проверить последние ошибки backup:

```bash
tail -100 /opt/li-polesh-store/backups/backup.log
```
