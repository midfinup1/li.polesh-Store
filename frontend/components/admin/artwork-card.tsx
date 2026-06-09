/* eslint-disable @next/next/no-img-element */

import type { Artwork, ArtworkImage, ArtworkStatus, Category } from "@/types";
import { buttonClassName, dangerButtonClassName, secondaryButtonClassName, smallInputClassName } from "@/components/admin/forms";
import { formatPrice, statusLabel } from "@/components/admin/helpers";

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