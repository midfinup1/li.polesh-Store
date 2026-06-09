# Admin maintenance notes

## Что изменено в админке

Админская страница разделена на отдельные frontend-компоненты:

- `frontend/app/admin/page.tsx` теперь только подключает контейнер страницы.
- `frontend/components/admin/admin-page-container.tsx` хранит состояние страницы и связывает секции.
- `frontend/components/admin/artworks-section.tsx` отвечает за работы.
- `frontend/components/admin/categories-section.tsx` отвечает за категории.
- `frontend/components/admin/orders-section.tsx` отвечает за заявки.
- `frontend/components/admin/artist-section.tsx` отвечает за профиль художницы.
- `frontend/components/admin/analytics-section.tsx` отвечает за аналитику.
- `frontend/components/admin/audit-section.tsx` отвечает за историю действий.
- `frontend/components/admin/artwork-card.tsx` отвечает за карточку работы и изображения.
- `frontend/components/admin/forms.tsx` содержит общие UI-классы, кнопки и состояния загрузки.
- `frontend/components/admin/helpers.ts` содержит сортировку, форматирование и статусы.
- `frontend/components/admin/types.ts` содержит локальные типы админки.

Файлы `admin-components.tsx` и `admin-sections.tsx` оставлены как короткие compatibility exports, чтобы старые импорты не ломались при постепенном рефакторинге.

## Audit log

Audit log теперь хранит old/new значения для основных изменений:

- изменение работы;
- изменение категории;
- изменение профиля художницы;
- загрузка фото художницы;
- изменение статуса заявки;
- удаление заявки, категории и работы с сохранением удаляемых данных в metadata.

История действий поддерживает фильтры:

- `action`;
- `entity_type`;
- `admin_email`;
- `date_from`;
- `date_to`;
- `limit`;
- `offset`.

Ответ backend для `/api/v1/admin/audit-logs` теперь имеет вид:

```json
{
  "items": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

## Backend

Файлы `other_handlers.go` и `other_repositories.go` удалены после разделения backend-кода.

Для delete/update операций добавлен helper:

```go
ensureRowsAffected(result, "entity")
```

Он возвращает `domain.ErrNotFound`, если операция не изменила ни одной строки.

Удаление работы выполняется транзакционно вместе с неактивными заявками. Активные заявки в статусах `new` и `contacted` блокируют удаление работы.

## Безопасность

Добавлена middleware-проверка Origin/Referer для admin mutation endpoints. Это дополнительная защита к `HttpOnly`, `Secure` в production и `SameSite=Strict` cookie.

Upload изображений ограничен по размеру и реальному MIME-типу. Разрешены только JPEG, PNG и WebP.

## База данных

В миграцию добавлены индексы для audit log:

- `created_at`;
- `action`;
- `entity_type`;
- `admin_email`;
- составной индекс `(entity_type, created_at DESC)`.
