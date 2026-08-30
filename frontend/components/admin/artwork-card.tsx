/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, type ReactNode } from "react";
import type { Artwork, ArtworkImage, ArtworkStatus, Category, Exhibition } from "@/types";
import {
  buttonClassName,
  secondaryButtonClassName,
  smallInputClassName,
} from "@/components/admin/forms";
import { formatPrice, statusDotClassName, statusLabel } from "@/components/admin/helpers";

const selectClassName = `${smallInputClassName} bg-paper text-ink`;
const optionClassName = "bg-white text-black dark:bg-[#111111] dark:text-white";
const iconButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border/80 bg-paper text-ink transition-colors hover:border-ink/40";
const dangerIconButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-red-200 bg-paper text-[20px] font-semibold leading-none text-red-600 transition-opacity hover:opacity-70";

function getArtworkImageUrl(image: ArtworkImage) {
  return (
    image.thumb_url ||
    image.thumb_webp_url ||
    image.thumb_avif_url ||
    image.display_url ||
    image.original_url ||
    ""
  );
}

export function ArtworkAdminCard({
  artwork,
  draft,
  categories,
  exhibitions,
  categoryName,
  exhibitionName,
  viewMode,
  draggedArtworkId,
  saving,
  onDragStart,
  onDragEnd,
  onDrop,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDraftChange,
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
  exhibitions: Exhibition[];
  categoryName: string;
  exhibitionName: string;
  viewMode: "grid" | "list";
  draggedArtworkId: number | null;
  saving: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: (draft: Artwork) => void;
  onDelete: () => void;
  onUploadImage: (file: File | undefined) => void;
  onImageDelete: (image: ArtworkImage) => void;
  onImageAltTextSave: (image: ArtworkImage, altText: string) => void;
  draggedImageId: number | null;
  onImageDragStart: (imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: (imageId: number) => void;
}) {
  const modalTitleId = useId();
  const isGrid = viewMode === "grid";
  const coverImage = artwork.images[0];
  const coverUrl = coverImage ? getArtworkImageUrl(coverImage) : "";
  const details = (
    <>
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDotClassName[artwork.status]}`}
        aria-hidden
      />
      <span>{statusLabel[artwork.status]}</span>
      {artwork.price != null && <span>{formatPrice(artwork.price)}</span>}
      <span>{categoryName}</span>
      <span>{exhibitionName}</span>
      <span>#{artwork.sort_order}</span>
      {artwork.images.length > 0 && (
        <span>{artwork.images.length} фото</span>
      )}
    </>
  );

  useEffect(() => {
    if (!draft) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onCancelEdit();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [draft, onCancelEdit, saving]);

  return (
    <article
      draggable={!draft}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onClick={draft && !saving ? onCancelEdit : undefined}
      className={
        draft
          ? "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/35 px-4 py-6 backdrop-blur-sm"
          : [
              "rounded-[8px] bg-white p-3 shadow-sm transition-opacity dark:bg-paper",
              "cursor-grab active:cursor-grabbing",
              draggedArtworkId === artwork.id ? "opacity-40" : "opacity-100",
            ].join(" ")
      }
    >
      {draft ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          onClick={(event) => event.stopPropagation()}
          className="grid max-h-[calc(100vh-3rem)] w-full max-w-[920px] gap-3 overflow-y-auto rounded-[8px] bg-paper p-5 shadow-xl md:grid-cols-2 md:p-6"
        >
          <div className="mb-1 flex items-center justify-between gap-4 md:col-span-2">
            <h2
              id={modalTitleId}
              className="min-w-0 break-words text-[22px] font-semibold leading-[120%] text-ink"
            >
              Редактировать «{artwork.title || `Работа #${artwork.id}`}»
            </h2>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={saving}
              className={iconButtonClassName}
              aria-label="Закрыть окно"
              title="Закрыть"
            >
              ×
            </button>
          </div>
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
            className={selectClassName}
            required
          >
            <option value="" className={optionClassName}>
              Выберите категорию
            </option>
            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
                className={optionClassName}
              >
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={draft.exhibition_id ?? ""}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                exhibition_id:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
            className={selectClassName}
          >
            <option value="" className={optionClassName}>
              Без выставки
            </option>
            {exhibitions.map((exhibition) => (
              <option
                key={exhibition.id}
                value={exhibition.id}
                className={optionClassName}
              >
                {exhibition.name}
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
            className={selectClassName}
          >
            {(Object.keys(statusLabel) as ArtworkStatus[]).map((status) => (
              <option
                key={status}
                value={status}
                className={optionClassName}
              >
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
            rows={5}
            className={`${smallInputClassName} md:col-span-2`}
          />
          <textarea
            value={draft.description_en}
            onChange={(event) =>
              onDraftChange({ ...draft, description_en: event.target.value })
            }
            placeholder="Описание EN"
            rows={5}
            className={`${smallInputClassName} md:col-span-2`}
          />
          <textarea
            value={draft.purchase_comment}
            onChange={(event) =>
              onDraftChange({ ...draft, purchase_comment: event.target.value })
            }
            placeholder="Комментарий к покупке RU"
            rows={4}
            className={`${smallInputClassName} md:col-span-2`}
          />
          <textarea
            value={draft.purchase_comment_en}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                purchase_comment_en: event.target.value,
              })
            }
            placeholder="Комментарий к покупке EN"
            rows={4}
            className={`${smallInputClassName} md:col-span-2`}
          />

          <ArtworkImagesEditor
            artwork={artwork}
            draggedImageId={draggedImageId}
            onUploadImage={onUploadImage}
            onImageDelete={onImageDelete}
            onImageAltTextSave={onImageAltTextSave}
            onImageDragStart={onImageDragStart}
            onImageDragEnd={onImageDragEnd}
            onImageDrop={onImageDrop}
          />

          <div className="flex gap-2 md:col-span-2">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={saving}
              className={buttonClassName}
            >
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={saving}
              className={secondaryButtonClassName}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className={isGrid ? "flex h-full flex-col gap-3" : "flex flex-col justify-between gap-3 md:flex-row md:items-start"}>
          <div className={isGrid ? "min-w-0" : "flex min-w-0 items-start gap-3"}>
              <div className={isGrid ? "aspect-[4/3] w-full overflow-hidden rounded-[6px] bg-paper-dark" : "h-[72px] w-[96px] shrink-0 overflow-hidden rounded-[6px] bg-paper-dark"}>
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={coverImage?.alt_text || artwork.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-light">
                    Нет фото
                  </div>
                )}
              </div>

            <div className={isGrid ? "mt-1 min-w-0" : "min-w-0"}>
              <p className="break-words text-[17px] font-semibold leading-[125%] text-ink">
                {artwork.title || `Работа #${artwork.id}`}
              </p>

              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium leading-[145%] text-ink-light">
                {details}
              </p>
            </div>
          </div>

          <div className={isGrid ? "mt-auto flex shrink-0 flex-wrap items-center gap-2" : "flex shrink-0 flex-wrap items-center gap-2"}>
            <IconLink href={`/artwork/${artwork.id}`} title="Превью">
              <EyeIcon />
            </IconLink>

            <button
              type="button"
              onClick={onStartEdit}
              className={iconButtonClassName}
              title="Редактировать"
              aria-label="Редактировать"
            >
              <PencilIcon />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className={dangerIconButtonClassName}
              title="Удалить"
              aria-label="Удалить"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-none stroke-current stroke-2"
    >
      <path
        d="M2.1 12s3.6-6 9.9-6 9.9 6 9.9 6-3.6 6-9.9 6-9.9-6-9.9-6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px] fill-none stroke-current stroke-2"
    >
      <path
        d="m4 20 4.2-1 10.6-10.6-3.2-3.2L5 15.8 4 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m13.8 7 3.2 3.2" strokeLinecap="round" />
    </svg>
  );
}

function ArtworkImagesEditor({
  artwork,
  draggedImageId,
  onUploadImage,
  onImageDelete,
  onImageAltTextSave,
  onImageDragStart,
  onImageDragEnd,
  onImageDrop,
}: {
  artwork: Artwork;
  draggedImageId: number | null;
  onUploadImage: (file: File | undefined) => void;
  onImageDelete: (image: ArtworkImage) => void;
  onImageAltTextSave: (image: ArtworkImage, altText: string) => void;
  onImageDragStart: (imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: (imageId: number) => void;
}) {
  return (
    <div className="rounded-[8px] bg-paper-dark/35 p-3 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-semibold leading-[150%] text-ink">
          Фотографии
        </p>
        <label className="inline-flex cursor-pointer rounded-[8px] border border-border/80 bg-paper px-3 py-2 text-[14px] font-medium transition-colors hover:border-ink/40">
          Добавить фото
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              onUploadImage(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>

      {artwork.images.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artwork.images.map((image) => {
            const imageUrl = getArtworkImageUrl(image);

            return (
              <div
                key={image.id}
                draggable
                onDragStart={() => onImageDragStart(image.id)}
                onDragEnd={onImageDragEnd}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onImageDrop(image.id)}
                className={[
                  "rounded-[8px] bg-paper p-2 transition-opacity",
                  draggedImageId === image.id ? "opacity-40" : "opacity-100",
                ].join(" ")}
              >
                <div className="aspect-[4/3] overflow-hidden rounded-[6px] bg-paper-dark">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={image.alt_text || artwork.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-light">
                      Нет фото
                    </div>
                  )}
                </div>

                <label className="mt-2 block text-[12px] font-semibold leading-[150%] text-ink-light">
                  Описание фото
                  <input
                    defaultValue={image.alt_text || artwork.title}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value !== image.alt_text) {
                        onImageAltTextSave(image, value);
                      }
                    }}
                    className="mt-1 w-full rounded-[6px] border border-border/80 bg-white/40 px-2 py-2 text-[14px] font-medium leading-[150%] text-ink outline-none focus:border-ink/40 dark:bg-transparent"
                    placeholder="Описание изображения"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onImageDelete(image)}
                  className="mt-2 text-[13px] font-medium text-red-600 hover:opacity-70"
                >
                  Удалить фото
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[14px] font-medium text-ink-light">
          Фотографии ещё не добавлены.
        </p>
      )}
    </div>
  );
}

function IconLink({
  children,
  href,
  title,
}: {
  children: ReactNode;
  href: string;
  title: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={iconButtonClassName}
      title={title}
      aria-label={title}
    >
      {children}
    </a>
  );
}
