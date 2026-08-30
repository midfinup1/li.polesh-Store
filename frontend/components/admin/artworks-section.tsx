import { useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  Artwork,
  ArtworkImage,
  Category,
  Exhibition,
} from "@/types";
import { ArtworkAdminCard } from "@/components/admin/artwork-card";
import { buttonClassName, inputClassName, secondaryButtonClassName } from "@/components/admin/forms";

type ArtworkViewMode = "grid" | "list";

const viewButtonClassName =
  "inline-flex h-[42px] w-[42px] items-center justify-center rounded-[8px] border border-border/80 transition-colors hover:border-ink/40";

export function AdminArtworksSection({
  categories,
  exhibitions,
  artworkSearch,
  setArtworkSearch,
  artworksByCategory,
  editingId,
  draft,
  draggedArtworkId,
  draggedImageId,
  saving,
  categoryName,
  exhibitionName,
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
  onDragArtworkEnd,
  onDropArtwork,
  onImageDragStart,
  onImageDragEnd,
  onImageDrop,
}: {
  categories: Category[];
  exhibitions: Exhibition[];
  artworkSearch: string;
  setArtworkSearch: Dispatch<SetStateAction<string>>;
  artworksByCategory: Map<number, Artwork[]>;
  editingId: number | null;
  draft: Artwork | null;
  draggedArtworkId: number | null;
  draggedImageId: number | null;
  saving: boolean;
  categoryName: (id: number | null) => string;
  exhibitionName: (id: number | null) => string;
  onCreateArtwork: (event: FormEvent<HTMLFormElement>) => void;
  onStartEdit: (artwork: Artwork) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: (draft: Artwork) => void;
  onDeleteArtwork: (artwork: Artwork) => void;
  onUploadImage: (artworkId: number, file: File | undefined) => void;
  onDeleteImage: (artworkId: number, image: ArtworkImage) => void;
  onImageAltTextSave: (
    artworkId: number,
    image: ArtworkImage,
    altText: string,
  ) => void;
  onDragArtworkStart: (artworkId: number) => void;
  onDragArtworkEnd: () => void;
  onDropArtwork: (categoryId: number, artworkId: number) => void;
  onImageDragStart: (imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: (artwork: Artwork, imageId: number) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<ArtworkViewMode>("grid");

  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<
    Record<number, boolean>
  >({});

  function toggleCategory(categoryId: number) {
    setCollapsedCategoryIds((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  }

  function handleCreateArtwork(event: FormEvent<HTMLFormElement>) {
    onCreateArtwork(event);
    setShowAddForm(false);
  }

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-[8px] bg-paper-dark/35 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
            Добавить работу
          </h2>
          <button
            type="button"
            onClick={() => setShowAddForm((value) => !value)}
            className={buttonClassName}
            aria-expanded={showAddForm}
          >
            {showAddForm ? "Свернуть" : "+ Новая работа"}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleCreateArtwork}
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input required name="title" placeholder="Название RU" className={inputClassName} />
            <input name="title_en" placeholder="Название EN" className={inputClassName} />
            <input name="price" type="number" min="0" placeholder="Цена, руб." className={inputClassName} />
            <select required name="category_id" className={inputClassName} defaultValue="">
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select name="exhibition_id" className={inputClassName} defaultValue="">
              <option value="">Без выставки</option>
              {exhibitions.map((exhibition) => (
                <option key={exhibition.id} value={exhibition.id}>
                  {exhibition.name}
                </option>
              ))}
            </select>
            <input name="year" type="number" min="1000" max="9999" placeholder="Год" className={inputClassName} />
            <input name="size" placeholder="Размер RU" className={inputClassName} />
            <input name="size_en" placeholder="Размер EN" className={inputClassName} />
            <input name="materials" placeholder="Материалы RU" className={inputClassName} />
            <input name="materials_en" placeholder="Материалы EN" className={inputClassName} />
            <textarea name="description" placeholder="Описание RU" rows={3} className={`${inputClassName} md:col-span-2`} />
            <textarea name="description_en" placeholder="Описание EN" rows={3} className={`${inputClassName} md:col-span-2`} />
            <textarea name="purchase_comment" placeholder="Комментарий к покупке RU" rows={2} className={`${inputClassName} md:col-span-2`} />
            <textarea name="purchase_comment_en" placeholder="Комментарий к покупке EN" rows={2} className={`${inputClassName} md:col-span-2`} />
            <button type="submit" disabled={saving} className={`${buttonClassName} md:col-span-2`}>
              Сохранить работу
            </button>
          </form>
        )}
      </div>

      <div className="rounded-[8px] bg-paper-dark/35 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
              Работы
            </h2>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex gap-2" aria-label="Вид списка работ">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={[
                  viewButtonClassName,
                  viewMode === "grid" ? "bg-ink text-paper" : "bg-paper text-ink",
                ].join(" ")}
                title="Сетка"
                aria-label="Показать сеткой"
              >
                <GridIcon />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={[
                  viewButtonClassName,
                  viewMode === "list" ? "bg-ink text-paper" : "bg-paper text-ink",
                ].join(" ")}
                title="Список"
                aria-label="Показать списком"
              >
                <ListIcon />
              </button>
            </div>
            <input
              value={artworkSearch}
              onChange={(event) => setArtworkSearch(event.target.value)}
              placeholder="Поиск по названию, категории, статусу"
              className="w-full rounded-[8px] border border-border/80 bg-white/40 px-4 py-3 text-[16px] font-medium leading-[150%] outline-none focus:border-ink/40 md:w-[380px] dark:bg-transparent"
            />
          </div>
        </div>

        <div className="mt-5 space-y-6">
          {categories.map((category) => {
            const categoryArtworks = artworksByCategory.get(category.id) || [];
            const isCategoryCollapsed = Boolean(collapsedCategoryIds[category.id]);

            return (
              <div key={category.id} className="rounded-[8px] bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium leading-[150%] text-ink-light">
                      {categoryArtworks.length} работ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={secondaryButtonClassName}
                  >
                    {isCategoryCollapsed ? "Показать категорию" : "Скрыть категорию"}
                  </button>
                </div>

                {!isCategoryCollapsed &&
                  (categoryArtworks.length === 0 ? (
                    <p className="mt-3 text-[15px] font-medium leading-[150%] text-ink-light">
                      Работ в категории нет.
                    </p>
                  ) : (
                    <div
                      className={[
                        "mt-4 grid gap-3",
                        viewMode === "grid"
                          ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                          : "grid-cols-1",
                      ].join(" ")}
                    >
                      {categoryArtworks.map((artwork) => (
                        <ArtworkAdminCard
                          key={artwork.id}
                          artwork={artwork}
                          draft={editingId === artwork.id ? draft : null}
                          categories={categories}
                          exhibitions={exhibitions}
                          categoryName={categoryName(artwork.category_id)}
                          exhibitionName={exhibitionName(artwork.exhibition_id)}
                          viewMode={viewMode}
                          draggedArtworkId={draggedArtworkId}
                          saving={saving}
                          onDragStart={() => onDragArtworkStart(artwork.id)}
                          onDragEnd={onDragArtworkEnd}
                          onDrop={() => onDropArtwork(category.id, artwork.id)}
                          onStartEdit={() => onStartEdit(artwork)}
                          onCancelEdit={onCancelEdit}
                          onSaveEdit={onSaveEdit}
                          onDraftChange={onDraftChange}
                          onDelete={() => onDeleteArtwork(artwork)}
                          onUploadImage={(file) => onUploadImage(artwork.id, file)}
                          onImageDelete={(image) => onDeleteImage(artwork.id, image)}
                          onImageAltTextSave={(image, altText) =>
                            onImageAltTextSave(artwork.id, image, altText)
                          }
                          draggedImageId={draggedImageId}
                          onImageDragStart={onImageDragStart}
                          onImageDragEnd={onImageDragEnd}
                          onImageDrop={(imageId) => onImageDrop(artwork, imageId)}
                        />
                      ))}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-current"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-none stroke-current stroke-2"
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
