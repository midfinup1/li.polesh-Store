"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import type {
  Artist,
  Artwork,
  ArtworkImage,
  ArtworkStatus,
  Category,
  Order,
} from "@/types";

const blankArtist: Artist = {
  id: 0,
  name: "",
  bio: "",
  photo_url: "",
  email: "",
  instagram: "",
};

const statusLabel: Record<ArtworkStatus, string> = {
  available: "В наличии",
  sold: "Продано",
  hidden: "Скрыто",
};

const orderStatusLabel: Record<Order["status"], string> = {
  new: "Новая",
  contacted: "Связались",
  completed: "Завершена",
  cancelled: "Отменена",
};

const inputClassName =
  "w-full rounded-[8px] border border-border bg-transparent px-4 py-3 text-[16px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

const smallInputClassName =
  "w-full rounded-[8px] border border-border bg-transparent px-3 py-2 text-[16px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

const selectClassName =
  "h-[44px] rounded-[8px] border border-border bg-paper px-3 text-[16px] font-medium leading-[150%] text-ink outline-none transition-colors focus:border-ink/40";

const sectionTitleClassName =
  "text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink";

function moveInArray<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) {
    return items;
  }

  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);

  return copy;
}

function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return "";
  }

  return `${price.toLocaleString("ru-RU")} ₽`;
}

export default function AdminPage() {
  const router = useRouter();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artist, setArtist] = useState<Artist>(blankArtist);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Artwork | null>(null);

  const handleAuthError = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return true;
      }

      return false;
    },
    [router],
  );

  const load = useCallback(async () => {
    setError("");

    try {
      const [worksResponse, ordersResponse, categoriesResponse, artistResponse] =
        await Promise.all([
          api.admin.artworks.list(),
          api.admin.orders.list(),
          api.categories.list(),
          api.artist.get(),
        ]);

      setArtworks(Array.isArray(worksResponse) ? worksResponse : []);
      setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      setArtist(artistResponse ?? blankArtist);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить данные админки",
      );
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
      await load();
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }

      setError(
        err instanceof Error ? err.message : "Не удалось выполнить операцию",
      );
    }
  }

  async function logout() {
    try {
      await api.auth.logout();
    } finally {
      router.replace("/admin/login");
    }
  }

  async function saveArtist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await run(
      () => api.admin.artist.update(artist),
      "Профиль художницы сохранён",
    );
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const slug = String(data.get("slug") ?? "").trim();

    if (!name || !slug) {
      setError("Заполните название и slug категории");
      return;
    }

    await run(
      () =>
        api.admin.categories.create({
          name,
          slug,
          sort_order: categories.length,
        }),
      "Категория добавлена",
    );

    form.reset();
  }

  async function deleteCategory(category: Category) {
    if (
      !confirm(
        `Удалить категорию «${category.name}»? Работы останутся без категории.`,
      )
    ) {
      return;
    }

    await run(
      () => api.admin.categories.delete(category.id),
      "Категория удалена",
    );
  }

  async function createArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const rawPrice = String(data.get("price") ?? "").trim();
    const rawYear = String(data.get("year") ?? "").trim();
    const rawCategoryId = String(data.get("category_id") ?? "").trim();

    const title = String(data.get("title") ?? "").trim();

    if (!title) {
      setError("Укажите название работы");
      return;
    }

    await run(
      () =>
        api.admin.artworks.create({
          title,
          description: String(data.get("description") ?? "").trim(),
          price: rawPrice === "" ? null : Number(rawPrice),
          status: "available",
          category_id: rawCategoryId === "" ? null : Number(rawCategoryId),
          year: rawYear === "" ? null : Number(rawYear),
          size: String(data.get("size") ?? "").trim(),
          materials: String(data.get("materials") ?? "").trim(),
          sort_order: 0,
        }),
      "Работа добавлена",
    );

    form.reset();
  }

  function startEdit(artwork: Artwork) {
    setEditingId(artwork.id);
    setDraft({ ...artwork });
    setNotice("");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit() {
    if (!draft) {
      return;
    }

    await run(
      () => api.admin.artworks.update(draft.id, draft),
      "Работа обновлена",
    );

    cancelEdit();
  }

  async function deleteArtwork(artwork: Artwork) {
    if (
      !confirm(`Удалить работу «${artwork.title}»? Действие необратимо.`)
    ) {
      return;
    }

    await run(
      () => api.admin.artworks.delete(artwork.id),
      "Работа удалена",
    );
  }

  async function updateArtworkStatus(artwork: Artwork, status: ArtworkStatus) {
    await run(
      () => api.admin.artworks.update(artwork.id, { ...artwork, status }),
      "Статус работы обновлён",
    );
  }

  async function uploadImage(artworkId: number, file: File | undefined) {
    if (!file) {
      return;
    }

    await run(
      () => api.admin.artworks.uploadImage(artworkId, file),
      "Изображение загружено",
    );
  }

  async function deleteImage(artworkId: number, image: ArtworkImage) {
    if (!confirm("Удалить это изображение?")) {
      return;
    }

    await run(
      () => api.admin.artworks.deleteImage(artworkId, image.id),
      "Изображение удалено",
    );
  }

  async function reorderImage(artwork: Artwork, from: number, to: number) {
    const reordered = moveInArray(artwork.images, from, to);

    if (reordered === artwork.images) {
      return;
    }

    await run(
      () =>
        api.admin.artworks.reorderImages(
          artwork.id,
          reordered.map((image) => image.id),
        ),
      "Порядок изображений обновлён",
    );
  }

  async function updateOrderStatus(orderId: number, status: Order["status"]) {
    await run(
      () => api.admin.orders.updateStatus(orderId, status),
      "Статус заявки обновлён",
    );
  }

  const categoryName = (id: number | null) =>
    id == null ? "" : categories.find((category) => category.id === id)?.name ?? "";

  if (loading) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-[1280px] px-6 py-12 md:px-10">
        <p className="text-[16px] font-medium leading-[150%] text-ink-light">
          Загрузка данных...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-12 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
          Админка
        </h1>

        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-[8px] border border-border px-4 py-2 text-[16px] font-medium leading-[150%] text-ink-light transition-colors hover:border-ink/40 hover:text-ink"
        >
          Выйти
        </button>
      </div>

      {error && (
        <p className="my-6 rounded-[8px] border border-red-600 p-4 text-[16px] font-medium leading-[150%] text-red-600">
          {error}
        </p>
      )}

      {notice && (
        <p className="my-6 rounded-[8px] border border-border p-4 text-[16px] font-medium leading-[150%] text-ink">
          {notice}
        </p>
      )}

      <section className="mt-12 rounded-[8px] border border-border p-6">
        <h2 className={sectionTitleClassName}>Профиль художницы</h2>

        <form onSubmit={saveArtist} className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            required
            value={artist.name}
            onChange={(event) =>
              setArtist({ ...artist, name: event.target.value })
            }
            placeholder="Имя"
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
            placeholder="URL фотографии"
            className={inputClassName}
          />

          <textarea
            value={artist.bio}
            onChange={(event) =>
              setArtist({ ...artist, bio: event.target.value })
            }
            placeholder="Биография"
            rows={5}
            className={`${inputClassName} md:col-span-2`}
          />

          <button
            type="submit"
            className="flex h-[52px] items-center justify-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80 md:col-span-2"
          >
            Сохранить профиль
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-[8px] border border-border p-6">
        <h2 className={sectionTitleClassName}>Категории</h2>

        <form
          onSubmit={createCategory}
          className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
        >
          <input
            required
            name="name"
            placeholder="Название"
            className={inputClassName}
          />

          <input
            required
            name="slug"
            placeholder="slug"
            pattern="[a-z0-9-]+"
            title="Только латинские буквы нижнего регистра, цифры и дефис"
            className={inputClassName}
          />

          <button
            type="submit"
            className="h-[52px] rounded-[8px] bg-ink px-7 text-[16px] font-medium leading-[150%] text-paper transition-opacity hover:opacity-80"
          >
            Добавить
          </button>
        </form>

        {categories.length === 0 ? (
          <p className="mt-4 text-[16px] font-medium leading-[150%] text-ink-light">
            Категорий пока нет.
          </p>
        ) : (
          <ul className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center gap-3 rounded-[8px] border border-border px-3 py-2 text-[14px] font-medium leading-[150%]"
              >
                <span>{category.name}</span>

                <button
                  type="button"
                  onClick={() => void deleteCategory(category)}
                  className="text-ink-light transition-colors hover:text-red-600"
                  aria-label={`Удалить ${category.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-[8px] border border-border p-6">
        <h2 className={sectionTitleClassName}>Добавить работу</h2>

        <form onSubmit={createArtwork} className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            required
            name="title"
            placeholder="Название"
            className={inputClassName}
          />

          <input
            name="price"
            type="number"
            min="0"
            placeholder="Цена, руб."
            className={inputClassName}
          />

          <select name="category_id" className={inputClassName}>
            <option value="">Без категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            name="year"
            type="number"
            min="1000"
            max="9999"
            placeholder="Год"
            className={inputClassName}
          />

          <input name="size" placeholder="Размер" className={inputClassName} />

          <input
            name="materials"
            placeholder="Материалы"
            className={inputClassName}
          />

          <textarea
            name="description"
            placeholder="Описание"
            rows={4}
            className={`${inputClassName} md:col-span-2`}
          />

          <button
            type="submit"
            className="flex h-[52px] items-center justify-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80 md:col-span-2"
          >
            Сохранить работу
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-[8px] border border-border p-6">
        <h2 className={sectionTitleClassName}>Работы</h2>

        {artworks.length === 0 ? (
          <p className="mt-6 text-[16px] font-medium leading-[150%] text-ink-light">
            Работ пока нет.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {artworks.map((artwork) => (
              <article
                key={artwork.id}
                className="rounded-[8px] border border-border p-5"
              >
                {editingId === artwork.id && draft ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={draft.title}
                      onChange={(event) =>
                        setDraft({ ...draft, title: event.target.value })
                      }
                      placeholder="Название"
                      className={smallInputClassName}
                    />

                    <input
                      type="number"
                      min="0"
                      value={draft.price ?? ""}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          price:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                      placeholder="Цена"
                      className={smallInputClassName}
                    />

                    <select
                      value={draft.category_id ?? ""}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          category_id:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                      className={smallInputClassName}
                    >
                      <option value="">Без категории</option>
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
                        setDraft({
                          ...draft,
                          year:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                      placeholder="Год"
                      className={smallInputClassName}
                    />

                    <input
                      value={draft.size}
                      onChange={(event) =>
                        setDraft({ ...draft, size: event.target.value })
                      }
                      placeholder="Размер"
                      className={smallInputClassName}
                    />

                    <input
                      value={draft.materials}
                      onChange={(event) =>
                        setDraft({ ...draft, materials: event.target.value })
                      }
                      placeholder="Материалы"
                      className={smallInputClassName}
                    />

                    <select
                      value={draft.status}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          status: event.target.value as ArtworkStatus,
                        })
                      }
                      className={smallInputClassName}
                    >
                      {(Object.keys(statusLabel) as ArtworkStatus[]).map(
                        (status) => (
                          <option key={status} value={status}>
                            {statusLabel[status]}
                          </option>
                        ),
                      )}
                    </select>

                    <textarea
                      value={draft.description}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          description: event.target.value,
                        })
                      }
                      placeholder="Описание"
                      rows={3}
                      className={`${smallInputClassName} md:col-span-2`}
                    />

                    <div className="flex gap-3 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit()}
                        className="rounded-[8px] bg-ink px-5 py-2 text-[16px] font-medium leading-[150%] text-paper transition-opacity hover:opacity-80"
                      >
                        Сохранить
                      </button>

                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-[8px] border border-border px-5 py-2 text-[16px] font-medium leading-[150%]"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="text-[20px] font-semibold leading-[120%] text-ink">
                        {artwork.title}
                      </p>

                      <p className="mt-2 text-[14px] font-medium leading-[150%] text-ink-light">
                        {statusLabel[artwork.status]}
                        {artwork.price != null && ` · ${formatPrice(artwork.price)}`}
                        {categoryName(artwork.category_id) &&
                          ` · ${categoryName(artwork.category_id)}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={artwork.status}
                        onChange={(event) =>
                          void updateArtworkStatus(
                            artwork,
                            event.target.value as ArtworkStatus,
                          )
                        }
                        className={selectClassName}
                      >
                        {(Object.keys(statusLabel) as ArtworkStatus[]).map(
                          (status) => (
                            <option key={status} value={status}>
                              {statusLabel[status]}
                            </option>
                          ),
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() => startEdit(artwork)}
                        className="rounded-[8px] border border-border px-4 py-2 text-[16px] font-medium leading-[150%] transition-colors hover:border-ink/40"
                      >
                        Редактировать
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteArtwork(artwork)}
                        className="rounded-[8px] border border-red-600 px-4 py-2 text-[16px] font-medium leading-[150%] text-red-600 transition-opacity hover:opacity-70"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 border-t border-border pt-5">
                  <div className="flex flex-wrap gap-4">
                    {artwork.images.map((image, index) => (
                      <div key={image.id} className="w-28">
                        <div className="relative aspect-square overflow-hidden rounded-[8px] bg-paper-dark">
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

                        <div className="mt-2 flex items-center justify-between text-[14px] font-medium leading-[150%] text-ink-light">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() =>
                              void reorderImage(artwork, index, index - 1)
                            }
                            className="transition-colors hover:text-ink disabled:opacity-30"
                            aria-label="Сдвинуть влево"
                          >
                            ←
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteImage(artwork.id, image)}
                            className="transition-colors hover:text-red-600"
                            aria-label="Удалить изображение"
                          >
                            ×
                          </button>

                          <button
                            type="button"
                            disabled={index === artwork.images.length - 1}
                            onClick={() =>
                              void reorderImage(artwork, index, index + 1)
                            }
                            className="transition-colors hover:text-ink disabled:opacity-30"
                            aria-label="Сдвинуть вправо"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <label className="mt-4 block text-[14px] font-medium leading-[150%] text-ink-light">
                    Добавить изображение
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        void uploadImage(artwork.id, event.target.files?.[0])
                      }
                      className="mt-2 block w-full text-[14px]"
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[8px] border border-border p-6">
        <div>
          <h2 className={sectionTitleClassName}>Заявки</h2>

          <p className="mt-2 text-[16px] font-medium leading-[150%] text-ink-light">
            Здесь отображаются заявки, которые пользователи оставили на
            страницах работ.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-[8px] border border-border p-6 text-[16px] font-medium leading-[150%] text-ink-light">
            Заявок пока нет.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const isTechnicalEmail =
                !order.email || order.email === "no-email@lipolesh.art";

              return (
                <article
                  key={order.id}
                  className="rounded-[8px] border border-border p-5"
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                          Заявка #{order.id}
                        </h3>

                        <span className="rounded-[8px] bg-paper-dark px-3 py-1 text-[14px] font-medium leading-[150%] text-ink-light">
                          {orderStatusLabel[order.status]}
                        </span>
                      </div>

                      <dl className="mt-5 space-y-3 text-[16px] font-medium leading-[150%]">
                        <div>
                          <dt className="text-ink-light">Имя</dt>
                          <dd className="mt-1 text-ink">{order.name}</dd>
                        </div>

                        {order.phone && (
                          <div>
                            <dt className="text-ink-light">Контакт</dt>
                            <dd className="mt-1 whitespace-pre-line text-ink">
                              {order.phone}
                            </dd>
                          </div>
                        )}

                        {!isTechnicalEmail && (
                          <div>
                            <dt className="text-ink-light">Email</dt>
                            <dd className="mt-1 text-ink">
                              <a
                                href={`mailto:${order.email}`}
                                className="underline underline-offset-4 transition-opacity hover:opacity-70"
                              >
                                {order.email}
                              </a>
                            </dd>
                          </div>
                        )}

                        {order.message && (
                          <div>
                            <dt className="text-ink-light">Комментарий</dt>
                            <dd className="mt-1 whitespace-pre-line text-ink">
                              {order.message}
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
                              {order.artwork?.title
                                ? `${order.artwork.title} #${order.artwork_id}`
                                : `ID ${order.artwork_id}`}
                            </a>
                          </dd>
                        </div>

                        {order.created_at && (
                          <div>
                            <dt className="text-ink-light">Создана</dt>
                            <dd className="mt-1 text-ink">
                              {new Date(order.created_at).toLocaleString(
                                "ru-RU",
                              )}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="w-full shrink-0 md:w-[220px]">
                      <label className="block text-[14px] font-medium leading-[150%] text-ink-light">
                        Статус
                      </label>

                      <select
                        value={order.status}
                        onChange={(event) =>
                          void updateOrderStatus(
                            order.id,
                            event.target.value as Order["status"],
                          )
                        }
                        className="mt-2 h-[44px] w-full rounded-[8px] border border-border bg-paper px-3 text-[16px] font-medium leading-[150%] text-ink outline-none transition-colors focus:border-ink/40"
                      >
                        <option value="new">Новая</option>
                        <option value="contacted">Связались</option>
                        <option value="completed">Завершена</option>
                        <option value="cancelled">Отменена</option>
                      </select>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}