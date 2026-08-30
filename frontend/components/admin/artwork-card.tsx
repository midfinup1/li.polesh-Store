/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
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
  "inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-border/80 bg-paper text-[19px] font-semibold leading-none text-ink transition-colors hover:border-ink/40";
const dangerIconButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-red-200 bg-paper text-[22px] font-semibold leading-none text-red-600 transition-opacity hover:opacity-70";

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
  collapsed,
  draggedArtworkId,
  onToggleCollapsed,
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
  exhibitions: Exhibition[];
  categoryName: string;
  exhibitionName: string;
  viewMode: "grid" | "list";
  collapsed?: boolean;
  draggedArtworkId: number | null;
  onToggleCollapsed: () => void;
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
  const isCollapsed = collapsed === true && draft === null;
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
      {isCollapsed && artwork.images.length > 0 && (
        <span>{artwork.images.length} фото</span>
      )}
    </>
  );

  return (
    <article
      draggable={!draft}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={[
        "rounded-[8px] bg-white p-3 shadow-sm transition-opacity dark:bg-paper",
        isGrid && !isCollapsed ? "2xl:col-span-3" : "",
        isCollapsed ? "cursor-grab active:cursor-grabbing" : "",
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
        <div className={isGrid && isCollapsed ? "flex h-full flex-col gap-3" : "flex flex-col justify-between gap-3 md:flex-row md:items-start"}>
          <div className={isGrid && isCollapsed ? "min-w-0" : "flex min-w-0 items-start gap-3"}>
            {isCollapsed && (
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
            )}

            <div className={isGrid && isCollapsed ? "mt-1 min-w-0" : "min-w-0"}>
              <p className="break-words text-[17px] font-semibold leading-[125%] text-ink">
                {artwork.title || `Работа #${artwork.id}`}
              </p>

              {!isCollapsed && (
                <p className="mt-1 text-[14px] font-medium leading-[150%] text-ink-light">
                  EN: {artwork.title_en || "не заполнено"}
                </p>
              )}

              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium leading-[145%] text-ink-light">
                {details}
              </p>
            </div>
          </div>

          <div className={isGrid && isCollapsed ? "mt-auto flex shrink-0 flex-wrap items-center gap-2" : "flex shrink-0 flex-wrap items-center gap-2"}>
            <IconButton
              onClick={onToggleCollapsed}
              title={isCollapsed ? "Развернуть" : "Свернуть"}
            >
              {isCollapsed ? "⤢" : "−"}
            </IconButton>

            <IconLink href={`/artwork/${artwork.id}`} title="Превью">
              ↗
            </IconLink>

            {!isCollapsed && (
              <select
                value={artwork.status}
                onChange={(event) =>
                  onStatusChange(event.target.value as ArtworkStatus)
                }
                className="h-[42px] rounded-[8px] border border-border bg-paper px-3 text-[15px] font-medium leading-[150%] text-ink outline-none focus:border-ink/40"
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
            )}

            <button
              type="button"
              onClick={onStartEdit}
              className={iconButtonClassName}
              title="Редактировать"
              aria-label="Редактировать"
            >
              ✎
            </button>

            {!isCollapsed && (
              <button
                type="button"
                onClick={onDelete}
                className={dangerIconButtonClassName}
                title="Удалить"
                aria-label="Удалить"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {draft === null && !isCollapsed && (
        <div className="mt-4 pt-2">
          {artwork.images.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      "rounded-[8px] bg-paper-dark/45 p-2 transition-opacity",
                      draggedImageId === image.id
                        ? "opacity-40"
                        : "opacity-100",
                    ].join(" ")}
                  >
                    <div className="aspect-square overflow-hidden rounded-[6px] bg-paper-dark">
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
                      Alt text
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
                      className="mt-2 w-full text-[13px] font-medium text-red-600 hover:opacity-70"
                    >
                      Удалить
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <label className="mt-3 inline-flex cursor-pointer rounded-[8px] border border-border/80 px-4 py-2 text-[14px] font-medium transition-colors hover:border-ink/40">
            Добавить изображение
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onUploadImage(event.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>
      )}
    </article>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={iconButtonClassName}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
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
