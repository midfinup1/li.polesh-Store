# PostgreSQL restore drill

Цель restore drill — регулярно подтверждать, что backup-файлы не просто создаются, а действительно восстанавливаются в рабочую PostgreSQL-базу.

## Периодичность

Минимум один раз в месяц и после каждого изменения backup-скриптов, схемы БД или инфраструктуры хранения.

## Проверка на локальной тестовой базе

1. Получить свежий backup:

```bash
./scripts/backup-postgres.sh
```

2. Поднять временный PostgreSQL:

```bash
docker run --rm --name artist-restore-test \
  -e POSTGRES_DB=artist_portfolio_restore \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 55432:5432 \
  -d postgres:16-alpine
```

3. Дождаться готовности:

```bash
until docker exec artist-restore-test pg_isready -U postgres -d artist_portfolio_restore; do sleep 1; done
```

4. Восстановить backup:

```bash
CONFIRM_RESTORE=yes DATABASE_URL='postgres://postgres:postgres@localhost:55432/artist_portfolio_restore?sslmode=disable' \
  ./scripts/restore-postgres.sh ./backups/latest.sql.gz
```

5. Проверить таблицы:

```bash
psql 'postgres://postgres:postgres@localhost:55432/artist_portfolio_restore?sslmode=disable' -c '\dt'
```

Ожидаемые таблицы:

```text
admins
artist
artworks
artwork_images
categories
goose_db_version
orders
```

6. Проверить базовые данные:

```bash
psql 'postgres://postgres:postgres@localhost:55432/artist_portfolio_restore?sslmode=disable' -c '
SELECT
  (SELECT count(*) FROM artist) AS artists,
  (SELECT count(*) FROM categories) AS categories,
  (SELECT count(*) FROM artworks) AS artworks,
  (SELECT count(*) FROM orders) AS orders;
'
```

7. Остановить временную БД:

```bash
docker stop artist-restore-test
```

## Критерий успеха

Restore drill считается успешным, если dump восстановился без ошибок, миграционная таблица присутствует, основные таблицы доступны, а приложение может подключиться к восстановленной базе.
