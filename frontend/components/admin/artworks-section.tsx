import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Artist, Artwork, ArtworkImage, ArtworkStatus, Category, Order } from "@/types";
import { ArtworkAdminCard } from "@/components/admin/artwork-card";
import { PhotoUploadCard, buttonClassName, dangerButtonClassName, inputClassName, secondaryButtonClassName, smallInputClassName } from "@/components/admin/forms";
import { orderStatusClassName, orderStatusLabel } from "@/components/admin/helpers";

export function AdminArtworksSection({
  categories,
  artworkSearch,
  setArtworkSearch,
  artworksByCategory,
  editingId,
  draft,
  draggedArtworkId,
  draggedImageId,
  saving,
  categoryName,
  onCreateArtwork,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDraftChange,
  onStatusChange,
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
  artworkSearch: string;
  setArtworkSearch: Dispatch<SetStateAction<string>>;
  artworksByCategory: Map<number, Artwork[]>;
  editingId: number | null;
  draft: Artwork | null;
  draggedArtworkId: number | null;
  draggedImageId: number | null;
  saving: boolean;
  categoryName: (id: number | null) => string;
  onCreateArtwork: (event: FormEvent<HTMLFormElement>) => void;
  onStartEdit: (artwork: Artwork) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: (draft: Artwork) => void;
  onStatusChange: (artwork: Artwork, status: ArtworkStatus) => void;
  onDeleteArtwork: (artwork: Artwork) => void;
  onUploadImage: (artworkId: number, file: File | undefined) => void;
  onDeleteImage: (artworkId: number, image: ArtworkImage) => void;
  onImageAltTextSave: (artworkId: number, image: ArtworkImage, altText: string) => void;
  onDragArtworkStart: (artworkId: number) => void;
  onDragArtworkEnd: () => void;
  onDropArtwork: (categoryId: number, artworkId: number) => void;
  onImageDragStart: (imageId: number) => void;
  onImageDragEnd: () => void;
  onImageDrop: (artwork: Artwork, imageId: number) => void;
}) {
  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-[8px] border border-border p-4">
        <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
          Добавить работу
        </h2>

        <form onSubmit={onCreateArtwork} className="mt-5 grid gap-3 md:grid-cols-2">
          <input required name="title" placeholder="Название RU" className={inputClassName} />
          <input name="title_en" placeholder="Название EN" className={inputClassName} />
          <input name="price" type="number" min="0" placeholder="Цена, руб." className={inputClassName} />
          <select required name="category_id" className={inputClassName}>
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input name="year" type="number" min="1000" max="9999" placeholder="Год" className={inputClassName} />
          <input name="size" placeholder="Размер RU" className={inputClassName} />
          <input name="size_en" placeholder="Размер EN" className={inputClassName} />
          <input name="materials" placeholder="Материалы RU" className={inputClassName} />
          <input name="materials_en" placeholder="Материалы EN" className={inputClassName} />
          <textarea name="description" placeholder="Описание RU" rows={3} className={`${inputClassName} md:col-span-2`} />
          <textarea name="description_en" placeholder="Описание EN" rows={3} className={`${inputClassName} md:col-span-2`} />
          <button type="submit" disabled={saving} className={`${buttonClassName} md:col-span-2`}>
            Сохранить работу
          </button>
        </form>
      </div>

      <div className="rounded-[8px] border border-border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">Работы</h2>
          <input
            value={artworkSearch}
            onChange={(event) => setArtworkSearch(event.target.value)}
            placeholder="Поиск по названию, категории, статусу"
            className="w-full rounded-[8px] border border-border bg-transparent px-4 py-2 text-[15px] font-medium leading-[150%] outline-none focus:border-ink/40 md:max-w-[420px]"
          />
        </div>

        <div className="mt-5 space-y-6">
          {categories.map((category) => {
            const categoryArtworks = artworksByCategory.get(category.id) || [];

            return (
              <div key={category.id} className="rounded-[8px] border border-border p-3">
                <h3 className="text-[18px] font-semibold leading-[120%] text-ink">{category.name}</h3>

                {categoryArtworks.length === 0 ? (
                  <p className="mt-3 text-[15px] font-medium leading-[150%] text-ink-light">
                    Работ в категории нет.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {categoryArtworks.map((artwork) => (
                      <ArtworkAdminCard
                        key={artwork.id}
                        artwork={artwork}
                        draft={editingId === artwork.id ? draft : null}
                        categories={categories}
                        categoryName={categoryName(artwork.category_id)}
                        draggedArtworkId={draggedArtworkId}
                        onDragStart={() => onDragArtworkStart(artwork.id)}
                        onDragEnd={onDragArtworkEnd}
                        onDrop={() => onDropArtwork(category.id, artwork.id)}
                        onStartEdit={() => onStartEdit(artwork)}
                        onCancelEdit={onCancelEdit}
                        onSaveEdit={onSaveEdit}
                        onDraftChange={onDraftChange}
                        onStatusChange={(status) => onStatusChange(artwork, status)}
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}