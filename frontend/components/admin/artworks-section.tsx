import { useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import type { Artwork, ArtworkImage, Category, Series } from "@/types";
import { ArtworkAdminCard } from "@/components/admin/artwork-card";
import {
  buttonClassName,
  iconButtonClassName,
  inputClassName,
} from "@/components/admin/forms";

type ArtworkViewMode = "grid" | "list";

export function AdminArtworksSection({
  categories,
  series,
  artworkSearch,
  setArtworkSearch,
  artworksByCategory,
  editingId,
  draft,
  draggedArtworkId,
  draggedImageId,
  saving,
  categoryName,
  seriesName,
  onCreateArtwork,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDraftChange,
  onDeleteArtwork,
  onUploadImage,
  onDeleteImage,
  onImageAltTextSave,
  onDragArtworkStart,
  onDragArtworkEnter,
  onDragArtworkEnd,
  onDropArtwork,
  onImageDragStart,
  onImageDragEnter,
  onImageDragEnd,
  onImageDrop,
}: {
  categories: Category[];
  series: Series[];
  artworkSearch: string;
  setArtworkSearch: Dispatch<SetStateAction<string>>;
  artworksByCategory: Map<number, Artwork[]>;
  editingId: number | null;
  draft: Artwork | null;
  draggedArtworkId: number | null;
  draggedImageId: number | null;
  saving: boolean;
  categoryName: (id: number | null) => string;
  seriesName: (id: number | null) => string;
  onCreateArtwork: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onStartEdit: (artwork: Artwork) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: (draft: Artwork) => void;
  onDeleteArtwork: (artwork: Artwork) => void;
  onUploadImage: (artworkId: number, file: File | undefined) => void;
  onDeleteImage: (artworkId: number, image: ArtworkImage) => void;
  onImageAltTextSave: (artworkId: number, image: ArtworkImage, altText: string) => void;
  onDragArtworkStart: (artworkId: number) => void;
  onDragArtworkEnter: (categoryId: number, artworkId: number) => void;
  onDragArtworkEnd: () => void;
  onDropArtwork: (categoryId: number) => void;
  onImageDragStart: (artwork: Artwork, imageId: number) => void;
  onImageDragEnter: (artworkId: number, imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: (artworkId: number) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<ArtworkViewMode>("grid");
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Record<number, boolean>>({});

  function toggleCategory(categoryId: number) {
    setCollapsedCategoryIds((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  }

  async function handleCreateArtwork(event: FormEvent<HTMLFormElement>) {
    if (await onCreateArtwork(event)) {
      setShowAddForm(false);
    }
  }

  return (
    <section className="mt-6 space-y-8">
      <div className="rounded-[8px] bg-paper-dark/35 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-semibold leading-[120%] text-ink">
            Новая работа
          </h2>
          <button
            type="button"
            onClick={() => setShowAddForm((value) => !value)}
            className={showAddForm ? iconButtonClassName : buttonClassName}
            aria-expanded={showAddForm}
            aria-label={showAddForm ? "Закрыть форму" : "Добавить работу"}
          >
            {showAddForm ? <CloseIcon /> : "Добавить"}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleCreateArtwork} className="mt-4 space-y-5">
            <FormGroup title="Основное">
              <input required name="title" placeholder="Название RU" className={inputClassName} />
              <input name="title_en" placeholder="Название EN" className={inputClassName} />
              <select required name="category_id" className={inputClassName} defaultValue="">
                <option value="">Категория</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select name="exhibition_id" className={inputClassName} defaultValue="">
                <option value="">Без серии</option>
                {series.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </FormGroup>

            <FormGroup title="Параметры">
              <CreateField label="Цена, руб.">
                <input name="price" type="number" min="0" step="1" placeholder="Например, 500" className={inputClassName} />
              </CreateField>
              <CreateField label="Год">
                <input name="year" type="number" min="1000" max="9999" step="1" placeholder="Например, 2026" className={inputClassName} />
              </CreateField>
              <CreateField label="Размер RU">
                <input name="size" className={inputClassName} />
              </CreateField>
              <CreateField label="Размер EN">
                <input name="size_en" className={inputClassName} />
              </CreateField>
              <CreateField label="Материалы RU">
                <input name="materials" className={inputClassName} />
              </CreateField>
              <CreateField label="Материалы EN">
                <input name="materials_en" className={inputClassName} />
              </CreateField>
            </FormGroup>

            <FormGroup title="Описание">
              <textarea name="description" placeholder="Описание RU" rows={4} className={inputClassName} />
              <textarea name="description_en" placeholder="Описание EN" rows={4} className={inputClassName} />
              <textarea name="purchase_comment" placeholder="Комментарий к покупке RU" rows={3} className={inputClassName} />
              <textarea name="purchase_comment_en" placeholder="Комментарий к покупке EN" rows={3} className={inputClassName} />
            </FormGroup>

            <button type="submit" disabled={saving} className={`${buttonClassName} w-full`}>
              Сохранить работу
            </button>
          </form>
        )}
      </div>

      <div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">Работы</h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-1.5" aria-label="Вид списка работ">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`${iconButtonClassName} ${viewMode === "grid" ? "bg-ink text-paper" : ""}`}
                title="Сетка"
                aria-label="Показать сеткой"
              >
                <GridIcon />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`${iconButtonClassName} ${viewMode === "list" ? "bg-ink text-paper" : ""}`}
                title="Список"
                aria-label="Показать списком"
              >
                <ListIcon />
              </button>
            </div>
            <input
              value={artworkSearch}
              onChange={(event) => setArtworkSearch(event.target.value)}
              placeholder="Поиск по работам"
              className={`${inputClassName} sm:w-[330px]`}
            />
          </div>
        </div>

        <div className="mt-5 space-y-8">
          {categories.map((category) => {
            const categoryArtworks = artworksByCategory.get(category.id) || [];
            const isCollapsed = Boolean(collapsedCategoryIds[category.id]);

            return (
              <section key={category.id} className="border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[18px] font-semibold leading-[120%] text-ink">{category.name}</h3>
                    <p className="mt-0.5 text-[13px] font-medium text-ink-light">{categoryArtworks.length} работ</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={iconButtonClassName}
                    aria-label={isCollapsed ? "Развернуть категорию" : "Свернуть категорию"}
                    title={isCollapsed ? "Развернуть" : "Свернуть"}
                  >
                    <ChevronIcon expanded={!isCollapsed} />
                  </button>
                </div>

                {!isCollapsed && (
                  categoryArtworks.length === 0 ? (
                    <p className="mt-3 text-[14px] font-medium text-ink-light">Работ в категории нет.</p>
                  ) : (
                    <div
                      className={[
                        "mt-4 grid gap-3",
                        viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1",
                      ].join(" ")}
                    >
                      {categoryArtworks.map((artwork) => (
                        <ArtworkAdminCard
                          key={artwork.id}
                          artwork={artwork}
                          draft={editingId === artwork.id ? draft : null}
                          categories={categories}
                          series={series}
                          categoryName={categoryName(artwork.category_id)}
                          seriesName={seriesName(artwork.exhibition_id)}
                          viewMode={viewMode}
                          draggedArtworkId={draggedArtworkId}
                          saving={saving}
                          onDragStart={() => onDragArtworkStart(artwork.id)}
                          onDragEnter={() => onDragArtworkEnter(category.id, artwork.id)}
                          onDragEnd={onDragArtworkEnd}
                          onDrop={() => onDropArtwork(category.id)}
                          onStartEdit={() => onStartEdit(artwork)}
                          onCancelEdit={onCancelEdit}
                          onSaveEdit={onSaveEdit}
                          onDraftChange={onDraftChange}
                          onDelete={() => onDeleteArtwork(artwork)}
                          onUploadImage={(file) => onUploadImage(artwork.id, file)}
                          onImageDelete={(image) => onDeleteImage(artwork.id, image)}
                          onImageAltTextSave={(image, altText) => onImageAltTextSave(artwork.id, image, altText)}
                          draggedImageId={draggedImageId}
                          onImageDragStart={(imageId) => onImageDragStart(artwork, imageId)}
                          onImageDragEnter={(imageId) => onImageDragEnter(artwork.id, imageId)}
                          onImageDragEnd={onImageDragEnd}
                          onImageDrop={() => onImageDrop(artwork.id)}
                        />
                      ))}
                    </div>
                  )
                )}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[14px] font-semibold text-ink-light">{title}</legend>
      <div className="grid gap-2 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CreateField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="block text-[13px] font-medium text-ink-light">{label}</span>
      {children}
    </label>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2.5">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-5 w-5 fill-none stroke-current stroke-2 transition-transform ${expanded ? "rotate-90" : ""}`}>
      <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
