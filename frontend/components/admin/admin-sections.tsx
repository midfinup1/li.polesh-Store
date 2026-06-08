/* eslint-disable @next/next/no-img-element */

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  AnalyticsSummary,
  Artist,
  Artwork,
  ArtworkImage,
  ArtworkStatus,
  Category,
  Order,
} from "@/types";
import {
  AnalyticsAdminSection,
  ArtworkAdminCard,
  PhotoUploadCard,
  buttonClassName,
  dangerButtonClassName,
  inputClassName,
  orderStatusClassName,
  orderStatusLabel,
  secondaryButtonClassName,
  smallInputClassName,
} from "@/components/admin/admin-components";

type ArtistPhotoSlot = "home" | "about";

export function AdminArtistSection({
  artist,
  setArtist,
  saving,
  uploadingArtistPhoto,
  onSave,
  onUploadPhoto,
}: {
  artist: Artist;
  setArtist: Dispatch<SetStateAction<Artist>>;
  saving: boolean;
  uploadingArtistPhoto: ArtistPhotoSlot | null;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUploadPhoto: (slot: ArtistPhotoSlot, file: File | undefined) => void;
}) {
  return (
    <section className="mt-6 rounded-[8px] border border-border p-4">
      <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
        Профиль художницы
      </h2>

      <form onSubmit={onSave} className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          required
          value={artist.name}
          onChange={(event) =>
            setArtist({ ...artist, name: event.target.value })
          }
          placeholder="Имя RU"
          className={inputClassName}
        />
        <input
          required
          value={artist.name_en}
          onChange={(event) =>
            setArtist({ ...artist, name_en: event.target.value })
          }
          placeholder="Имя EN"
          className={inputClassName}
        />
        <input
          type="email"
          value={artist.email}
          onChange={(event) =>
            setArtist({ ...artist, email: event.target.value })
          }
          placeholder="Email"
          className={inputClassName}
        />
        <input
          value={artist.instagram}
          onChange={(event) =>
            setArtist({ ...artist, instagram: event.target.value })
          }
          placeholder="Instagram"
          className={inputClassName}
        />
        <input
          value={artist.photo_url}
          onChange={(event) =>
            setArtist({ ...artist, photo_url: event.target.value })
          }
          placeholder="URL фотографии по умолчанию"
          className={`${inputClassName} md:col-span-2`}
        />
        <input
          value={artist.home_photo_url}
          onChange={(event) =>
            setArtist({ ...artist, home_photo_url: event.target.value })
          }
          placeholder="URL фото для главной"
          className={inputClassName}
        />
        <input
          value={artist.about_photo_url}
          onChange={(event) =>
            setArtist({ ...artist, about_photo_url: event.target.value })
          }
          placeholder="URL фото для страницы Об авторе"
          className={inputClassName}
        />

        <PhotoUploadCard
          title="Фото для главной"
          imageUrl={artist.home_photo_url || artist.photo_url}
          loading={uploadingArtistPhoto === "home"}
          onChange={(file) => onUploadPhoto("home", file)}
        />

        <PhotoUploadCard
          title="Фото для страницы Об авторе"
          imageUrl={artist.about_photo_url || artist.photo_url}
          loading={uploadingArtistPhoto === "about"}
          onChange={(file) => onUploadPhoto("about", file)}
        />

        <textarea
          value={artist.bio}
          onChange={(event) =>
            setArtist({ ...artist, bio: event.target.value })
          }
          placeholder="Artist statement RU"
          rows={4}
          className={`${inputClassName} md:col-span-2`}
        />
        <textarea
          value={artist.bio_en}
          onChange={(event) =>
            setArtist({ ...artist, bio_en: event.target.value })
          }
          placeholder="Artist statement EN"
          rows={4}
          className={`${inputClassName} md:col-span-2`}
        />
        <button
          type="submit"
          disabled={saving}
          className={`${buttonClassName} md:col-span-2`}
        >
          Сохранить профиль
        </button>
      </form>
    </section>
  );
}

export function AdminCategoriesSection({
  categories,
  editingCategoryId,
  categoryDraft,
  saving,
  onCreateCategory,
  onSetCategoryDraft,
  onSaveCategoryEdit,
  onCancelEditCategory,
  onStartEditCategory,
  onReorderCategories,
  onDeleteCategory,
}: {
  categories: Category[];
  editingCategoryId: number | null;
  categoryDraft: Category | null;
  saving: boolean;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void;
  onSetCategoryDraft: Dispatch<SetStateAction<Category | null>>;
  onSaveCategoryEdit: () => void;
  onCancelEditCategory: () => void;
  onStartEditCategory: (category: Category) => void;
  onReorderCategories: (fromIndex: number, toIndex: number) => void;
  onDeleteCategory: (category: Category) => void;
}) {
  return (
    <section className="mt-6 rounded-[8px] border border-border p-4">
      <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
        Категории
      </h2>

      <form
        onSubmit={onCreateCategory}
        className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <input required name="name" placeholder="Название RU" className={inputClassName} />
        <input name="name_en" placeholder="Название EN" className={inputClassName} />
        <input
          required
          name="slug"
          placeholder="slug"
          pattern="[a-z0-9-]+"
          title="Только латинские буквы нижнего регистра, цифры и дефис"
          className={inputClassName}
        />
        <button type="submit" disabled={saving} className={buttonClassName}>
          Добавить
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {categories.map((category, index) => (
          <div key={category.id} className="rounded-[8px] border border-border p-3">
            {editingCategoryId === category.id && categoryDraft ? (
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <input
                  value={categoryDraft.name}
                  onChange={(event) =>
                    onSetCategoryDraft({ ...categoryDraft, name: event.target.value })
                  }
                  placeholder="Название RU"
                  className={smallInputClassName}
                />
                <input
                  value={categoryDraft.name_en}
                  onChange={(event) =>
                    onSetCategoryDraft({ ...categoryDraft, name_en: event.target.value })
                  }
                  placeholder="Название EN"
                  className={smallInputClassName}
                />
                <input
                  value={categoryDraft.slug}
                  onChange={(event) =>
                    onSetCategoryDraft({ ...categoryDraft, slug: event.target.value })
                  }
                  placeholder="slug"
                  className={smallInputClassName}
                />
                <button type="button" onClick={onSaveCategoryEdit} className={buttonClassName}>
                  Сохранить
                </button>
                <button type="button" onClick={onCancelEditCategory} className={secondaryButtonClassName}>
                  Отмена
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[16px] font-semibold leading-[150%] text-ink">
                    {category.name}
                  </p>
                  <p className="text-[14px] font-medium leading-[150%] text-ink-light">
                    EN: {category.name_en || "не заполнено"} · slug: {category.slug} · порядок: {category.sort_order}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onReorderCategories(index, index - 1)}
                    className={secondaryButtonClassName}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === categories.length - 1}
                    onClick={() => onReorderCategories(index, index + 1)}
                    className={secondaryButtonClassName}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartEditCategory(category)}
                    className={secondaryButtonClassName}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category)}
                    className={dangerButtonClassName}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

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

export function AdminOrdersSection({
  orders,
  onUpdateStatus,
  onDeleteOrder,
}: {
  orders: Order[];
  onUpdateStatus: (orderId: number, status: Order["status"]) => void;
  onDeleteOrder: (order: Order) => void;
}) {
  return (
    <section className="mt-6 rounded-[8px] border border-border p-4">
      <h2 className="text-[24px] font-semibold leading-[120%] text-ink">Заявки</h2>

      {orders.length === 0 ? (
        <div className="mt-5 rounded-[8px] border border-border p-6 text-[16px] font-medium leading-[150%] text-ink-light">
          Заявок пока нет.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((order) => {
            const isTechnicalEmail = !order.email || order.email === "no-email@lipolesh.art";

            return (
              <article key={order.id} className="rounded-[8px] border border-border p-4">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                        Заявка #{order.id}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-[13px] font-semibold leading-[150%] ${orderStatusClassName[order.status]}`}>
                        {orderStatusLabel[order.status]}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 text-[15px] font-medium leading-[150%] md:grid-cols-2">
                      <div>
                        <dt className="text-ink-light">Имя</dt>
                        <dd className="mt-1 text-ink">{order.name}</dd>
                      </div>
                      {order.phone && (
                        <div>
                          <dt className="text-ink-light">Контакт</dt>
                          <dd className="mt-1 whitespace-pre-line text-ink">{order.phone}</dd>
                        </div>
                      )}
                      {!isTechnicalEmail && (
                        <div>
                          <dt className="text-ink-light">Email</dt>
                          <dd className="mt-1 text-ink">
                            <a href={`mailto:${order.email}`} className="underline underline-offset-4 transition-opacity hover:opacity-70">
                              {order.email}
                            </a>
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-ink-light">Работа</dt>
                        <dd className="mt-1 text-ink">
                          <a
                            href={`/artwork/${order.artwork_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4 transition-opacity hover:opacity-70"
                          >
                            {order.artwork?.title ? `${order.artwork.title} #${order.artwork_id}` : `ID ${order.artwork_id}`}
                          </a>
                        </dd>
                      </div>
                      {order.message && (
                        <div className="md:col-span-2">
                          <dt className="text-ink-light">Комментарий</dt>
                          <dd className="mt-1 whitespace-pre-line text-ink">{order.message}</dd>
                        </div>
                      )}
                      {order.created_at && (
                        <div>
                          <dt className="text-ink-light">Создана</dt>
                          <dd className="mt-1 text-ink">
                            {new Date(order.created_at).toLocaleString("ru-RU")}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="w-full shrink-0 space-y-3 md:w-[220px]">
                    <div>
                      <label className="block text-[14px] font-medium leading-[150%] text-ink-light">
                        Статус
                      </label>
                      <select
                        value={order.status}
                        onChange={(event) =>
                          onUpdateStatus(order.id, event.target.value as Order["status"])
                        }
                        className="mt-2 h-[44px] w-full rounded-[8px] border border-border bg-paper px-3 text-[15px] font-medium leading-[150%] text-ink outline-none transition-colors focus:border-ink/40"
                      >
                        <option value="new">Новая</option>
                        <option value="contacted">Связались</option>
                        <option value="completed">Завершена</option>
                        <option value="cancelled">Отменена</option>
                      </select>
                    </div>

                    <button type="button" onClick={() => onDeleteOrder(order)} className={`${dangerButtonClassName} w-full`}>
                      Удалить заявку
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function AdminAnalyticsSection({
  analytics,
  ordersCount,
}: {
  analytics: AnalyticsSummary | null;
  ordersCount: number;
}) {
  return <AnalyticsAdminSection analytics={analytics} ordersCount={ordersCount} />;
}
