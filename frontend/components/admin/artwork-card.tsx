/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import type { Artwork, ArtworkImage, ArtworkStatus, Category, Series } from "@/types";
import {
  buttonClassName,
  dangerIconButtonClassName,
  iconButtonClassName,
  secondaryButtonClassName,
  smallInputClassName,
} from "@/components/admin/forms";
import { formatPrice, statusDotClassName, statusLabel } from "@/components/admin/helpers";

const selectClassName = `${smallInputClassName} bg-paper text-ink`;
const optionClassName = "bg-white text-black dark:bg-[#111111] dark:text-white";

function getArtworkImageUrl(image: ArtworkImage) {
  return image.thumb_url || image.thumb_webp_url || image.thumb_avif_url || image.display_url || image.original_url || "";
}

export function ArtworkAdminCard({
  artwork,
  draft,
  categories,
  series,
  categoryName,
  seriesName,
  viewMode,
  draggedArtworkId,
  saving,
  onDragStart,
  onDragEnter,
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
  onImageDragEnter,
  onImageDragEnd,
  onImageDrop,
}: {
  artwork: Artwork;
  draft: Artwork | null;
  categories: Category[];
  series: Series[];
  categoryName: string;
  seriesName: string;
  viewMode: "grid" | "list";
  draggedArtworkId: number | null;
  saving: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
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
  onImageDragEnter: (imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: () => void;
}) {
  const modalTitleId = useId();
  const dragged = useRef(false);
  const isGrid = viewMode === "grid";
  const coverImage = artwork.images[0];
  const coverUrl = coverImage ? getArtworkImageUrl(coverImage) : "";

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

  function stopCardClick(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <article
      draggable={!draft}
      onDragStart={(event) => {
        dragged.current = true;
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnter={onDragEnter}
      onDragEnd={() => {
        onDragEnd();
        window.setTimeout(() => {
          dragged.current = false;
        }, 0);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onClick={draft ? (!saving ? onCancelEdit : undefined) : () => {
        if (!dragged.current) {
          onStartEdit();
        }
      }}
      className={draft ? "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/35 px-3 py-5 backdrop-blur-sm" : [
        "rounded-[8px] bg-paper-dark/45 p-2.5 transition-[opacity,transform] duration-150",
        "cursor-grab active:cursor-grabbing",
        draggedArtworkId === artwork.id ? "opacity-40" : "opacity-100",
      ].join(" ")}
    >
      {draft ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          onClick={(event) => event.stopPropagation()}
          className="max-h-[calc(100vh-2.5rem)] w-full max-w-[980px] overflow-y-auto rounded-[8px] bg-paper p-4 shadow-xl md:p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id={modalTitleId} className="min-w-0 break-words text-[22px] font-semibold leading-[120%] text-ink">
              {artwork.title || `Работа #${artwork.id}`}
            </h2>
            <button type="button" onClick={onCancelEdit} disabled={saving} className={iconButtonClassName} aria-label="Закрыть окно" title="Закрыть">
              <CloseIcon />
            </button>
          </div>

          <ArtworkImagesEditor
            artwork={artwork}
            draggedImageId={draggedImageId}
            onUploadImage={onUploadImage}
            onImageDelete={onImageDelete}
            onImageAltTextSave={onImageAltTextSave}
            onImageDragStart={onImageDragStart}
            onImageDragEnter={onImageDragEnter}
            onImageDragEnd={onImageDragEnd}
            onImageDrop={onImageDrop}
          />

          <div className="mt-5 space-y-5">
            <EditGroup title="Основное">
              <Field label="Название RU">
                <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} className={smallInputClassName} />
              </Field>
              <Field label="Название EN">
                <input value={draft.title_en} onChange={(event) => onDraftChange({ ...draft, title_en: event.target.value })} className={smallInputClassName} />
              </Field>
              <Field label="Категория">
                <select
                  value={draft.category_id ?? ""}
                  onChange={(event) => onDraftChange({ ...draft, category_id: event.target.value === "" ? null : Number(event.target.value) })}
                  className={selectClassName}
                  required
                >
                  <option value="" className={optionClassName}>Выберите категорию</option>
                  {categories.map((category) => <option key={category.id} value={category.id} className={optionClassName}>{category.name}</option>)}
                </select>
              </Field>
              <Field label="Серия">
                <select
                  value={draft.exhibition_id ?? ""}
                  onChange={(event) => onDraftChange({ ...draft, exhibition_id: event.target.value === "" ? null : Number(event.target.value) })}
                  className={selectClassName}
                >
                  <option value="" className={optionClassName}>Без серии</option>
                  {series.map((item) => <option key={item.id} value={item.id} className={optionClassName}>{item.name}</option>)}
                </select>
              </Field>
            </EditGroup>

            <EditGroup title="Параметры">
              <Field label="Цена, руб.">
                <input type="number" min="0" value={draft.price ?? ""} onChange={(event) => onDraftChange({ ...draft, price: event.target.value === "" ? null : Number(event.target.value) })} className={smallInputClassName} />
              </Field>
              <Field label="Год">
                <input type="number" min="1000" max="9999" value={draft.year ?? ""} onChange={(event) => onDraftChange({ ...draft, year: event.target.value === "" ? null : Number(event.target.value) })} className={smallInputClassName} />
              </Field>
              <Field label="Статус">
                <select value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value as ArtworkStatus })} className={selectClassName}>
                  {(Object.keys(statusLabel) as ArtworkStatus[]).map((status) => <option key={status} value={status} className={optionClassName}>{statusLabel[status]}</option>)}
                </select>
              </Field>
              <div className="hidden md:block" />
              <Field label="Размер RU">
                <input value={draft.size} onChange={(event) => onDraftChange({ ...draft, size: event.target.value })} className={smallInputClassName} />
              </Field>
              <Field label="Размер EN">
                <input value={draft.size_en} onChange={(event) => onDraftChange({ ...draft, size_en: event.target.value })} className={smallInputClassName} />
              </Field>
              <Field label="Материалы RU">
                <input value={draft.materials} onChange={(event) => onDraftChange({ ...draft, materials: event.target.value })} className={smallInputClassName} />
              </Field>
              <Field label="Материалы EN">
                <input value={draft.materials_en} onChange={(event) => onDraftChange({ ...draft, materials_en: event.target.value })} className={smallInputClassName} />
              </Field>
            </EditGroup>

            <EditGroup title="Описание">
              <Field label="Описание RU">
                <textarea value={draft.description} onChange={(event) => onDraftChange({ ...draft, description: event.target.value })} rows={5} className={smallInputClassName} />
              </Field>
              <Field label="Описание EN">
                <textarea value={draft.description_en} onChange={(event) => onDraftChange({ ...draft, description_en: event.target.value })} rows={5} className={smallInputClassName} />
              </Field>
              <Field label="Комментарий к покупке RU">
                <textarea value={draft.purchase_comment} onChange={(event) => onDraftChange({ ...draft, purchase_comment: event.target.value })} rows={3} className={smallInputClassName} />
              </Field>
              <Field label="Комментарий к покупке EN">
                <textarea value={draft.purchase_comment_en} onChange={(event) => onDraftChange({ ...draft, purchase_comment_en: event.target.value })} rows={3} className={smallInputClassName} />
              </Field>
            </EditGroup>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onCancelEdit} disabled={saving} className={secondaryButtonClassName}>Отмена</button>
            <button type="button" onClick={onSaveEdit} disabled={saving} className={buttonClassName}>{saving ? "Сохраняем..." : "Сохранить"}</button>
          </div>
        </div>
      ) : (
        <div className={isGrid ? "flex h-full flex-col gap-2.5" : "flex flex-col justify-between gap-3 sm:flex-row sm:items-center"}>
          <div className={isGrid ? "min-w-0" : "flex min-w-0 items-center gap-3"}>
            <div className={isGrid ? "aspect-[4/3] w-full overflow-hidden rounded-[6px] bg-paper-dark" : "h-[64px] w-[86px] shrink-0 overflow-hidden rounded-[6px] bg-paper-dark"}>
              {coverUrl ? <img src={coverUrl} alt={coverImage?.alt_text || artwork.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[12px] text-ink-light">Нет фото</div>}
            </div>
            <div className={isGrid ? "mt-0.5 min-w-0" : "min-w-0"}>
              <p className="line-clamp-2 break-words text-[15px] font-semibold leading-[125%] text-ink">{artwork.title || `Работа #${artwork.id}`}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] font-medium leading-[140%] text-ink-light">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClassName[artwork.status]}`} aria-hidden />
                <span>{statusLabel[artwork.status]}</span>
                {artwork.price != null && <span>{formatPrice(artwork.price)}</span>}
                <span>{categoryName}</span>
                {artwork.exhibition_id !== null && <span>{seriesName}</span>}
                {artwork.images.length > 0 && <span>{artwork.images.length} фото</span>}
              </div>
            </div>
          </div>

          <div className={isGrid ? "mt-auto flex gap-1.5" : "flex shrink-0 gap-1.5"} onClick={stopCardClick}>
            <IconLink href={`/artwork/${artwork.id}`} title="Открыть на сайте"><EyeIcon /></IconLink>
            <button type="button" onClick={onStartEdit} className={iconButtonClassName} title="Редактировать" aria-label="Редактировать"><PencilIcon /></button>
            <button type="button" onClick={onDelete} className={dangerIconButtonClassName} title="Удалить" aria-label="Удалить"><CloseIcon /></button>
          </div>
        </div>
      )}
    </article>
  );
}

function EditGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-[8px] bg-paper-dark/35 p-3">
      <legend className="px-1 text-[14px] font-semibold text-ink">{title}</legend>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold leading-[150%] text-ink-light">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function ArtworkImagesEditor({
  artwork,
  draggedImageId,
  onUploadImage,
  onImageDelete,
  onImageAltTextSave,
  onImageDragStart,
  onImageDragEnter,
  onImageDragEnd,
  onImageDrop,
}: {
  artwork: Artwork;
  draggedImageId: number | null;
  onUploadImage: (file: File | undefined) => void;
  onImageDelete: (image: ArtworkImage) => void;
  onImageAltTextSave: (image: ArtworkImage, altText: string) => void;
  onImageDragStart: (imageId: number) => void;
  onImageDragEnter: (imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: () => void;
}) {
  return (
    <section className="mt-5 rounded-[8px] bg-paper-dark/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-ink">Фотографии</h3>
        <label className={`${secondaryButtonClassName} cursor-pointer`}>
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {artwork.images.map((image) => {
            const imageUrl = getArtworkImageUrl(image);
            return (
              <div
                key={image.id}
                draggable
                onDragStart={(event) => {
                  event.stopPropagation();
                  event.dataTransfer.effectAllowed = "move";
                  onImageDragStart(image.id);
                }}
                onDragEnter={(event) => {
                  event.stopPropagation();
                  onImageDragEnter(image.id);
                }}
                onDragEnd={(event) => {
                  event.stopPropagation();
                  onImageDragEnd();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onImageDrop();
                }}
                className={`cursor-grab rounded-[8px] bg-paper p-2 transition-opacity active:cursor-grabbing ${draggedImageId === image.id ? "opacity-40" : "opacity-100"}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] bg-paper-dark">
                  {imageUrl ? <img src={imageUrl} alt={image.alt_text || artwork.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[12px] text-ink-light">Нет фото</div>}
                  <button
                    type="button"
                    onClick={() => onImageDelete(image)}
                    className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-600"
                    aria-label="Удалить фото"
                    title="Удалить фото"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <input
                  defaultValue={image.alt_text || artwork.title}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (value !== image.alt_text) {
                      onImageAltTextSave(image, value);
                    }
                  }}
                  className="mt-2 w-full rounded-[6px] border border-border/70 bg-white/40 px-2 py-1.5 text-[13px] font-medium text-ink outline-none focus:border-ink/40 dark:bg-transparent"
                  placeholder="Описание фото"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[14px] font-medium text-ink-light">Фотографии ещё не добавлены.</p>
      )}
    </section>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M2.1 12s3.6-6 9.9-6 9.9 6 9.9 6-3.6 6-9.9 6-9.9-6-9.9-6Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-2">
      <path d="M5 19l3.5-.8L19 7.7 16.3 5 5.8 15.5 5 19Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14.8 6.5 2.7 2.7" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-2">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconLink({ children, href, title }: { children: ReactNode; href: string; title: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={iconButtonClassName} title={title} aria-label={title}>
      {children}
    </a>
  );
}
