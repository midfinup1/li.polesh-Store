import type { AdminAuditLog, AdminAuditLogFilter } from "@/types";
import { buttonClassName, secondaryButtonClassName, smallInputClassName } from "@/components/admin/forms";

const auditActionLabel: Record<string, string> = {
  "artwork.create": "Создание работы",
  "artwork.update": "Изменение работы",
  "artwork.delete": "Удаление работы",
  "category.create": "Создание категории",
  "category.update": "Изменение категории",
  "category.delete": "Удаление категории",
  "order.status_update": "Изменение статуса заявки",
  "order.delete": "Удаление заявки",
  "image.upload": "Загрузка изображения",
  "image.delete": "Удаление изображения",
  "image.alt_update": "Изменение alt-текста",
  "image.reorder": "Сортировка изображений",
  "artist.update": "Изменение профиля",
  "artist.photo_upload": "Загрузка фото профиля",
};

function formatAuditValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatAuditMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "";
  }

  const oldValue = metadata.old ?? metadata.old_value ?? metadata.before;
  const newValue = metadata.new ?? metadata.new_value ?? metadata.after;

  if (oldValue && newValue && typeof oldValue === "object" && typeof newValue === "object") {
    const oldRecord = oldValue as Record<string, unknown>;
    const newRecord = newValue as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]));
    const changes = keys
      .filter((key) => JSON.stringify(oldRecord[key]) !== JSON.stringify(newRecord[key]))
      .map((key) => `${key}: ${formatAuditValue(oldRecord[key])} → ${formatAuditValue(newRecord[key])}`);

    if (changes.length > 0) {
      return changes.join(" · ");
    }
  }

  return Object.entries(metadata)
    .map(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }

      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }

      return `${key}: ${String(value)}`;
    })
    .filter(Boolean)
    .join(" · ");
}

export function AdminAuditHistorySection({
  auditLogs,
  total,
  filters,
  loading,
  onChangeFilters,
  onApplyFilters,
}: {
  auditLogs: AdminAuditLog[];
  total: number;
  filters: AdminAuditLogFilter;
  loading: boolean;
  onChangeFilters: (filters: AdminAuditLogFilter) => void;
  onApplyFilters: (filters: AdminAuditLogFilter) => void;
}) {
  return (
    <section className="mt-6 rounded-[8px] border border-border p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
            История действий
          </h2>
          <p className="mt-2 text-[15px] font-medium leading-[150%] text-ink-light">
            Здесь сохраняются действия администраторов: работы, заявки, изображения, категории и профиль.
          </p>
        </div>
        <p className="text-[14px] font-medium leading-[150%] text-ink-light">
          Показано {auditLogs.length} из {total} записей
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApplyFilters({ ...filters, offset: 0 });
        }}
        className="mt-5 grid gap-3 md:grid-cols-6"
      >
        <input
          value={filters.action || ""}
          onChange={(event) => onChangeFilters({ ...filters, action: event.target.value })}
          placeholder="Действие"
          className={smallInputClassName}
        />
        <input
          value={filters.entity_type || ""}
          onChange={(event) => onChangeFilters({ ...filters, entity_type: event.target.value })}
          placeholder="Объект"
          className={smallInputClassName}
        />
        <input
          value={filters.admin_email || ""}
          onChange={(event) => onChangeFilters({ ...filters, admin_email: event.target.value })}
          placeholder="Email админа"
          className={smallInputClassName}
        />
        <input
          type="date"
          value={filters.date_from || ""}
          onChange={(event) => onChangeFilters({ ...filters, date_from: event.target.value })}
          className={smallInputClassName}
        />
        <input
          type="date"
          value={filters.date_to || ""}
          onChange={(event) => onChangeFilters({ ...filters, date_to: event.target.value })}
          className={smallInputClassName}
        />
        <button type="submit" disabled={loading} className={buttonClassName}>
          {loading ? "Загрузка..." : "Фильтровать"}
        </button>
      </form>

      {auditLogs.length === 0 ? (
        <p className="mt-5 rounded-[8px] bg-paper-dark p-4 text-[15px] font-medium leading-[150%] text-ink-light">
          История пока пустая.
        </p>
      ) : (
        <>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-[14px] font-medium leading-[150%]">
            <thead>
              <tr className="border-b border-border text-ink-light">
                <th className="py-3 pr-4">Дата</th>
                <th className="py-3 pr-4">Администратор</th>
                <th className="py-3 pr-4">Действие</th>
                <th className="py-3 pr-4">Объект</th>
                <th className="py-3 pr-4">Детали</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-border/70 align-top">
                  <td className="py-3 pr-4 text-ink-light">
                    {new Date(log.created_at).toLocaleString("ru-RU")}
                  </td>
                  <td className="py-3 pr-4 text-ink">
                    {log.admin_email || `ID ${log.admin_id ?? "—"}`}
                  </td>
                  <td className="py-3 pr-4 text-ink">
                    {auditActionLabel[log.action] || log.action}
                  </td>
                  <td className="py-3 pr-4 text-ink-light">
                    {log.entity_type}
                    {log.entity_id ? ` #${log.entity_id}` : ""}
                  </td>
                  <td className="py-3 pr-4 text-ink-light">
                    {formatAuditMetadata(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={loading || (filters.offset || 0) <= 0}
            onClick={() => onApplyFilters({ ...filters, offset: Math.max((filters.offset || 0) - (filters.limit || 50), 0) })}
            className={secondaryButtonClassName}
          >
            Назад
          </button>
          <p className="text-[14px] font-medium leading-[150%] text-ink-light">
            Страница {Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1}
          </p>
          <button
            type="button"
            disabled={loading || (filters.offset || 0) + auditLogs.length >= total}
            onClick={() => onApplyFilters({ ...filters, offset: (filters.offset || 0) + (filters.limit || 50) })}
            className={secondaryButtonClassName}
          >
            Вперёд
          </button>
        </div>
        </>
      )}
    </section>
  );
}