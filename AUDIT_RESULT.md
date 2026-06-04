# Результат первого технического аудита

## Исправлено

- очищен состав проекта от `.git`, `.DS_Store`, `__MACOSX` и пустого приватного `.env`;
- исправлены module path Go и ошибочный вызов `goose.Up(db.DB, ...)`;
- исправлены Docker Compose build contexts из каталога `infra`;
- добавлены environment templates, `.gitignore` и `.dockerignore`;
- добавлены публичные маршруты frontend и рабочая админка;
- добавлены корректная фильтрация скрытых работ и отображение проданных;
- добавлены валидация заказов, статусов, файлов и конфигурации production;
- JWT больше не хранится в LocalStorage, применяется HttpOnly Strict cookie;
- добавлена локальная загрузка файлов для development и требование S3 в production;
- добавлено удаление сохранённых объектов при удалении изображения или работы;
- добавлены CI, deploy workflow, Caddy security headers и backup script;
- Next.js переведён с 14.2.3 на security-patched 14.2.35, runtime images переведены на Go 1.26 и Node.js 24 LTS.

## Не подтверждено исполнением в текущей среде

- `go test ./...`, так как исходный архив не содержал `go.sum`, а среда аудита не может скачать зависимости с `proxy.golang.org`;
- `npm run lint`, `npm run type-check`, `npm run build`, так как исходный архив не содержал `package-lock.json` и зависимости не загружены;
- `docker compose up`, так как Docker CLI отсутствует в среде аудита.

## Требуемые lock-файлы перед первым CI

```bash
cd backend
go mod tidy
cd ../frontend
npm install
cd ..
git add backend/go.sum frontend/package-lock.json
git commit -m "Add dependency lock files"
```

## Оставшийся следующий production-блок

- генерация оптимизированных thumbnails и форматов WebP или AVIF;
- rate limiting и anti-spam защита заявок;
- integration и e2e tests;
- передача backup архивов в S3 и тест восстановления;
- metrics, logs aggregation и alerts;
- SEO assets и structured data.
