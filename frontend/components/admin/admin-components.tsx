/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
import type {
  AnalyticsSummary,
  Artwork,
  ArtworkImage,
  ArtworkStatus,
  Category,
  Order,
} from "@/types";

export type DeleteTarget =
  | { type: "category"; category: Category }
  | { type: "artwork"; artwork: Artwork }
  | { type: "image"; artworkId: number; image: ArtworkImage }
  | { type: "order"; order: Order };

export const statusLabel: Record<ArtworkStatus, string> = {
  available: "В наличии",
  sold: "Продано",
  hidden: "Скрыто",
};

export const orderStatusLabel: Record<Order["status"], string> = {
  new: "Новая",
  contacted: "Связались",
  completed: "Завершена",
  cancelled: "Отменена",
};

export const orderStatusClassName: Record<Order["status"], string> = {
  new: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export const inputClassName =
  "w-full rounded-[8px] border border-border bg-transparent px-4 py-3 text-[16px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

export const smallInputClassName =
  "w-full rounded-[8px] border border-border bg-transparent px-3 py-2 text-[15px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonClassName =
  "inline-flex h-[42px] items-center justify-center rounded-[8px] bg-ink px-4 text-[15px] font-medium leading-[150%] text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClassName =
  "inline-flex h-[42px] items-center justify-center rounded-[8px] border border-border px-4 text-[15px] font-medium leading-[150%] transition-colors hover:border-ink/40";

export const dangerButtonClassName =
  "inline-flex h-[42px] items-center justify-center rounded-[8px] border border-red-600 px-4 text-[15px] font-medium leading-[150%] text-red-600 transition-opacity hover:opacity-70";

export function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return "";
  }

  return `${price.toLocaleString("ru-RU")} ₽`;
}

export function sortedCategories(categories: Category[]) {
  return [...categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
}

export function sortedArtworks(artworks: Artwork[]) {
  return [...artworks].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
}

export function moveInArray<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }

  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[8px] px-4 py-2 text-[15px] font-semibold leading-[150%] transition-colors",
        active ? "bg-ink text-paper" : "bg-paper-dark text-ink hover:bg-border",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function PhotoUploadCard({
  title,
  imageUrl,
  loading,
  onChange,
}: {
  title: string;
  imageUrl: string;
  loading: boolean;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-[8px] border border-border p-3">
      <p className="text-[15px] font-semibold leading-[150%] text-ink">
        {title}
      </p>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="mt-3 h-40 w-full rounded-[8px] object-cover"
        />
      ) : (
        <div className="mt-3 flex h-40 items-center justify-center rounded-[8px] bg-paper-dark text-[14px] text-ink-light">
          Фото не загружено
        </div>
      )}
      <label className="mt-3 inline-flex cursor-pointer rounded-[8px] border border-border px-4 py-2 text-[14px] font-medium transition-colors hover:border-ink/40">
        {loading ? "Загрузка..." : "Загрузить файл"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={(event) => onChange(event.target.files?.[0])}
          className="hidden"
        />
      </label>
    </div>
  );
}

export function ArtworkAdminCard({
  artwork,
  draft,
  categories,
  categoryName,
  draggedArtworkId,
  onDragStart,
  onDragEnd,
  onDrop,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDraftChange,
  onStatusChange,
  onDelete,
  onUploadImage,
  onImageDelete,
  onImageAltTextSave,
  draggedImageId,
  onImageDragStart,
  onImageDragEnd,
  onImageDrop,
}: {
  artwork: Artwork;
  draft: Artwork | null;
  categories: Category[];
  categoryName: string;
  draggedArtworkId: number | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: (draft: Artwork) => void;
  onStatusChange: (status: ArtworkStatus) => void;
  onDelete: () => void;
  onUploadImage: (file: File | undefined) => void;
  onImageDelete: (image: ArtworkImage) => void;
  onImageAltTextSave: (image: ArtworkImage, altText: string) => void;
  draggedImageId: number | null;
  onImageDragStart: (imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: (imageId: number) => void;
}) {
  return (
    <article
      draggable={!draft}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={[
        "rounded-[8px] border border-border p-4 transition-opacity",
        draggedArtworkId === artwork.id ? "opacity-40" : "opacity-100",
      ].join(" ")}
    >
      {draft ? (
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={draft.title}
            onChange={(event) =>
              onDraftChange({ ...draft, title: event.target.value })
            }
            placeholder="Название RU"
            className={smallInputClassName}
          />
          <input
            value={draft.title_en}
            onChange={(event) =>
              onDraftChange({ ...draft, title_en: event.target.value })
            }
            placeholder="Название EN"
            className={smallInputClassName}
          />
          <input
            type="number"
            min="0"
            value={draft.price ?? ""}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                price:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
            placeholder="Цена"
            className={smallInputClassName}
          />
          <select
            value={draft.category_id ?? ""}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                category_id:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
            className={smallInputClassName}
            required
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1000"
            max="9999"
            value={draft.year ?? ""}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                year:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
            placeholder="Год"
            className={smallInputClassName}
          />
          <input
            value={draft.size}
            onChange={(event) =>
              onDraftChange({ ...draft, size: event.target.value })
            }
            placeholder="Размер RU"
            className={smallInputClassName}
          />
          <input
            value={draft.size_en}
            onChange={(event) =>
              onDraftChange({ ...draft, size_en: event.target.value })
            }
            placeholder="Размер EN"
            className={smallInputClassName}
          />
          <input
            value={draft.materials}
            onChange={(event) =>
              onDraftChange({ ...draft, materials: event.target.value })
            }
            placeholder="Материалы RU"
            className={smallInputClassName}
          />
          <input
            value={draft.materials_en}
            onChange={(event) =>
              onDraftChange({ ...draft, materials_en: event.target.value })
            }
            placeholder="Материалы EN"
            className={smallInputClassName}
          />
          <select
            value={draft.status}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                status: event.target.value as ArtworkStatus,
              })
            }
            className={smallInputClassName}
          >
            {(Object.keys(statusLabel) as ArtworkStatus[]).map((status) => (
              <option key={status} value={status}>
                {statusLabel[status]}
              </option>
            ))}
          </select>
          <textarea
            value={draft.description}
            onChange={(event) =>
              onDraftChange({ ...draft, description: event.target.value })
            }
            placeholder="Описание RU"
            rows={3}
            className={`${smallInputClassName} md:col-span-2`}
          />
          <textarea
            value={draft.description_en}
            onChange={(event) =>
              onDraftChange({ ...draft, description_en: event.target.value })
            }
            placeholder="Описание EN"
            rows={3}
            className={`${smallInputClassName} md:col-span-2`}
          />
          <div className="flex gap-2 md:col-span-2">
            <button
              type="button"
              onClick={onSaveEdit}
              className={buttonClassName}
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className={secondaryButtonClassName}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <p className="text-[18px] font-semibold leading-[120%] text-ink">
              {artwork.title}
            </p>
            <p className="mt-1 text-[14px] font-medium leading-[150%] text-ink-light">
              EN: {artwork.title_en || "не заполнено"}
            </p>
            <p className="mt-1 text-[14px] font-medium leading-[150%] text-ink-light">
              {statusLabel[artwork.status]}
              {artwork.price != null &&
                ` · ${formatPrice(artwork.price)}`} · {categoryName} · порядок:{" "}
              {artwork.sort_order}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/artwork/${artwork.id}`}
              target="_blank"
              rel="noreferrer"
              className={secondaryButtonClassName}
            >
              Превью
            </a>
            <select
              value={artwork.status}
              onChange={(event) =>
                onStatusChange(event.target.value as ArtworkStatus)
              }
              className="h-[42px] rounded-[8px] border border-border bg-paper px-3 text-[15px] font-medium leading-[150%] text-ink outline-none focus:border-ink/40"
            >
              {(Object.keys(statusLabel) as ArtworkStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onStartEdit}
              className={secondaryButtonClassName}
            >
              Редактировать
            </button>
            <button
              type="button"
              onClick={onDelete}
              className={dangerButtonClassName}
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4">
        {artwork.images.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {artwork.images.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => onImageDragStart(image.id)}
                onDragEnd={onImageDragEnd}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onImageDrop(image.id)}
                className={[
                  "rounded-[8px] border border-border p-2 transition-opacity",
                  draggedImageId === image.id ? "opacity-40" : "opacity-100",
                ].join(" ")}
              >
                <div className="aspect-square overflow-hidden rounded-[6px] bg-paper-dark">
                  <img
                    src={
                      image.thumb_webp_url ||
                      image.thumb_avif_url ||
                      image.thumb_url ||
                      image.original_url
                    }
                    alt={image.alt_text || artwork.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <label className="mt-2 block text-[12px] font-semibold leading-[150%] text-ink-light">
                  Alt text
                  <input
                    defaultValue={image.alt_text || artwork.title}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value !== image.alt_text) {
                        onImageAltTextSave(image, value);
                      }
                    }}
                    className="mt-1 w-full rounded-[6px] border border-border bg-transparent px-2 py-1 text-[13px] font-medium leading-[150%] text-ink outline-none focus:border-ink/40"
                    placeholder="Описание изображения"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onImageDelete(image)}
                  className="mt-2 w-full text-[13px] font-medium text-red-600 hover:opacity-70"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="mt-3 inline-flex cursor-pointer rounded-[8px] border border-border px-4 py-2 text-[14px] font-medium transition-colors hover:border-ink/40">
          Добавить изображение
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => onUploadImage(event.target.files?.[0])}
            className="hidden"
          />
        </label>
      </div>
    </article>
  );
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function AnalyticsAdminSection({
  analytics,
  ordersCount,
}: {
  analytics: AnalyticsSummary | null;
  ordersCount: number;
}) {
  if (!analytics) {
    return (
      <section className="mt-6 rounded-[8px] border border-border p-4">
        <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
          Статистика
        </h2>
        <p className="mt-4 text-[15px] font-medium leading-[150%] text-ink-light">
          Статистика пока недоступна. Проверь backend endpoint /admin/analytics.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-[8px] border border-border p-4">
        <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
          Статистика
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <AnalyticsCard
            title="Просмотры за 7 дней"
            value={analytics.views_7_days}
          />
          <AnalyticsCard
            title="Просмотры за 30 дней"
            value={analytics.views_30_days}
          />
          <AnalyticsCard
            title="Просмотры работ за 30 дней"
            value={analytics.artwork_views_30_days}
          />
          <AnalyticsCard
            title="Заявки за 30 дней"
            value={analytics.orders_30_days}
            note={`Всего в админке: ${ordersCount}`}
          />
          <AnalyticsCard
            title="Конверсия за 30 дней"
            value={formatPercent(analytics.conversion_30_days)}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <AnalyticsList
          title="Топ работ за 30 дней"
          emptyText="Просмотров работ пока нет."
          items={analytics.top_artworks.map((item) => ({
            label: item.title,
            value: item.views,
            href: `/artwork/${item.artwork_id}`,
          }))}
        />
        <AnalyticsList
          title="Топ страниц за 30 дней"
          emptyText="Просмотров страниц пока нет."
          items={analytics.top_pages.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
        />
        <AnalyticsList
          title="Клики по категориям за 30 дней"
          emptyText="Кликов по категориям пока нет."
          items={analytics.category_clicks.map((item) => ({
            label: item.label.replace(/^\/category\//, ""),
            value: item.value,
          }))}
        />
      </div>
    </section>
  );
}

function AnalyticsCard({
  title,
  value,
  note,
}: {
  title: string;
  value: number | string;
  note?: string;
}) {
  return (
    <div className="rounded-[8px] border border-border bg-paper-dark/40 p-4">
      <p className="text-[13px] font-semibold leading-[150%] text-ink-light">
        {title}
      </p>
      <p className="mt-2 text-[28px] font-semibold leading-[120%] text-ink">
        {value}
      </p>
      {note && (
        <p className="mt-2 text-[13px] font-medium leading-[150%] text-ink-light">
          {note}
        </p>
      )}
    </div>
  );
}

function AnalyticsList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: { label: string; value: number; href?: string }[];
}) {
  return (
    <div className="rounded-[8px] border border-border p-4">
      <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-[15px] font-medium leading-[150%] text-ink-light">
          {emptyText}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 text-[15px] font-medium leading-[150%]"
            >
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  {item.label}
                </a>
              ) : (
                <span className="min-w-0 truncate text-ink">{item.label}</span>
              )}
              <span className="shrink-0 rounded-full bg-paper-dark px-3 py-1 text-[13px] text-ink-light">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConfirmDeleteModal({
  target,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title =
    target.type === "category"
      ? `Удалить категорию «${target.category.name}»?`
      : target.type === "artwork"
        ? `Удалить работу «${target.artwork.title}»?`
        : target.type === "order"
          ? `Удалить заявку #${target.order.id}?`
          : "Удалить изображение?";

  const description =
    target.type === "category"
      ? "Работы из этой категории останутся в системе, но потеряют привязку к категории."
      : target.type === "artwork"
        ? "Если по работе есть активные заявки в статусе «Новая» или «Связались», удалить работу нельзя. Сначала завершите или отмените эти заявки. Если по работе есть только завершённые или отменённые заявки, они будут удалены вместе с работой."
        : target.type === "order"
          ? "Заявка будет удалена из админки и базы данных. Это действие нельзя отменить."
          : "Изображение будет удалено из работы. Это действие нельзя отменить.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-[12px] border border-border bg-paper p-6 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[22px] font-semibold leading-[120%] text-ink">
          {title}
        </h2>

        <p className="mt-3 whitespace-pre-line text-[15px] font-medium leading-[150%] text-ink-light">
          {description}
        </p>

        {target.type === "artwork" && (
          <div className="mt-4 rounded-[8px] border border-border bg-paper-dark/40 p-3 text-[14px] font-medium leading-[150%] text-ink-light">
            <p>Удаление разрешено только если у работы нет активных заявок.</p>
            <p className="mt-2">Активные заявки: «Новая» и «Связались».</p>
            <p className="mt-2">Неактивные заявки: «Завершена» и «Отменена».</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={secondaryButtonClassName}
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-red-600 px-4 text-[15px] font-medium leading-[150%] text-white transition-opacity hover:opacity-80"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
