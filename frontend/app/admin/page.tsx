"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
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
  name_en: "",
  bio: "",
  bio_en: "",
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
  "w-full rounded-[8px] border border-border bg-transparent px-3 py-2 text-[15px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

const selectClassName =
  "h-[40px] rounded-[8px] border border-border bg-paper px-3 text-[15px] font-medium leading-[150%] text-ink outline-none transition-colors focus:border-ink/40";

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

function sortedCategories(categories: Category[]) {
  return [...categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
}

function sortedArtworks(artworks: Artwork[]) {
  return [...artworks].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
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

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [categoryDraft, setCategoryDraft] = useState<Category | null>(null);

  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({
    artist: true,
    categories: false,
    createArtwork: true,
    artworks: false,
    orders: true,
  });

  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<number | string, boolean>
  >({});

  const [expandedArtworks, setExpandedArtworks] = useState<
    Record<number, boolean>
  >({});

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

  function toggleSection(key: string) {
    setCollapsedSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleCategory(key: number | string) {
    setCollapsedCategories((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleArtworkDetails(id: number) {
    setExpandedArtworks((current) => ({
      ...current,
      [id]: !current[id],
    }));
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
    const nameEn = String(data.get("name_en") ?? "").trim();
    const slug = String(data.get("slug") ?? "").trim();

    if (!name || !slug) {
      setError("Заполните название и slug категории");
      return;
    }

    await run(
      () =>
        api.admin.categories.create({
          name,
          name_en: nameEn,
          slug,
          sort_order: categories.length,
        }),
      "Категория добавлена",
    );

    form.reset();
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryDraft({ ...category });
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setCategoryDraft(null);
  }

  async function saveCategoryEdit() {
    if (!categoryDraft) {
      return;
    }

    await run(
      () => api.admin.categories.update(categoryDraft.id, categoryDraft),
      "Категория обновлена",
    );

    cancelEditCategory();
  }

  async function reorderCategory(index: number, direction: -1 | 1) {
    const current = sortedCategories(categories);
    const reordered = moveInArray(current, index, index + direction);

    if (reordered === current) {
      return;
    }

    await run(
      async () => {
        await Promise.all(
          reordered.map((category, sortOrder) =>
            api.admin.categories.update(category.id, {
              ...category,
              sort_order: sortOrder,
            }),
          ),
        );
      },
      "Порядок категорий обновлён",
    );
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

  function getNextArtworkSortOrder(categoryId: number | null) {
    const categoryArtworks = artworks.filter(
      (artwork) => artwork.category_id === categoryId,
    );

    if (categoryArtworks.length === 0) {
      return 0;
    }

    return Math.max(...categoryArtworks.map((artwork) => artwork.sort_order)) + 1;
  }

  async function createArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const rawPrice = String(data.get("price") ?? "").trim();
    const rawYear = String(data.get("year") ?? "").trim();
    const rawCategoryId = String(data.get("category_id") ?? "").trim();
    const categoryId = rawCategoryId === "" ? null : Number(rawCategoryId);
    const title = String(data.get("title") ?? "").trim();

    if (!title) {
      setError("Укажите название работы");
      return;
    }

    await run(
      () =>
        api.admin.artworks.create({
          title,
          title_en: String(data.get("title_en") ?? "").trim(),
          description: String(data.get("description") ?? "").trim(),
          description_en: String(data.get("description_en") ?? "").trim(),
          price: rawPrice === "" ? null : Number(rawPrice),
          status: "available",
          category_id: categoryId,
          year: rawYear === "" ? null : Number(rawYear),
          size: String(data.get("size") ?? "").trim(),
          size_en: String(data.get("size_en") ?? "").trim(),
          materials: String(data.get("materials") ?? "").trim(),
          materials_en: String(data.get("materials_en") ?? "").trim(),
          sort_order: getNextArtworkSortOrder(categoryId),
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

  async function reorderArtworkInCategory(
    categoryId: number | null,
    artwork: Artwork,
    direction: -1 | 1,
  ) {
    const group = sortedArtworks(
      artworks.filter((item) => item.category_id === categoryId),
    );

    const index = group.findIndex((item) => item.id === artwork.id);

    if (index === -1) {
      return;
    }

    const reordered = moveInArray(group, index, index + direction);

    if (reordered === group) {
      return;
    }

    await run(
      async () => {
        await Promise.all(
          reordered.map((item, sortOrder) =>
            api.admin.artworks.update(item.id, {
              ...item,
              sort_order: sortOrder,
            }),
          ),
        );
      },
      "Порядок работ в категории обновлён",
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
    id == null
      ? ""
      : categories.find((category) => category.id === id)?.name ?? "";

  const orderedCategories = sortedCategories(categories);
  const uncategorizedArtworks = sortedArtworks(
    artworks.filter((artwork) => artwork.category_id === null),
  );

  if (loading) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-[1280px] px-6 py-8 md:px-10">
        <p className="text-[16px] font-medium leading-[150%] text-ink-light">
          Загрузка данных...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
          Админка
        </h1>

        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-[8px] border border-border px-4 py-2 text-[15px] font-medium leading-[150%] text-ink-light transition-colors hover:border-ink/40 hover:text-ink"
        >
          Выйти
        </button>
      </div>

      {error && (
        <p className="my-4 rounded-[8px] border border-red-600 p-3 text-[15px] font-medium leading-[150%] text-red-600">
          {error}
        </p>
      )}

      {notice && (
        <p className="my-4 rounded-[8px] border border-border p-3 text-[15px] font-medium leading-[150%] text-ink">
          {notice}
        </p>
      )}

      <section className="mt-6 rounded-[8px] border border-border p-4">
        <AdminSectionHeader
          title="Профиль художницы"
          collapsed={collapsedSections.artist}
          onToggle={() => toggleSection("artist")}
        />

        {!collapsedSections.artist && (
          <form
            onSubmit={saveArtist}
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
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
              placeholder="URL фотографии"
              className={`${inputClassName} md:col-span-2`}
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
              className="flex h-[48px] items-center justify-center rounded-[8px] bg-ink px-6 text-[15px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80 md:col-span-2"
            >
              Сохранить профиль
            </button>
          </form>
        )}
      </section>

      <section className="mt-4 rounded-[8px] border border-border p-4">
        <AdminSectionHeader
          title="Категории"
          collapsed={collapsedSections.categories}
          onToggle={() => toggleSection("categories")}
          right={
            <span className="text-[14px] font-medium leading-[150%] text-ink-light">
              {categories.length} шт.
            </span>
          }
        />

        {!collapsedSections.categories && (
          <>
            <form
              onSubmit={createCategory}
              className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <input
                required
                name="name"
                placeholder="Название RU"
                className={inputClassName}
              />

              <input
                name="name_en"
                placeholder="Название EN"
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
                className="h-[48px] rounded-[8px] bg-ink px-7 text-[15px] font-medium leading-[150%] text-paper transition-opacity hover:opacity-80"
              >
                Добавить
              </button>
            </form>

            {categories.length === 0 ? (
              <p className="mt-4 text-[15px] font-medium leading-[150%] text-ink-light">
                Категорий пока нет.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {orderedCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="rounded-[8px] border border-border p-3"
                  >
                    {editingCategoryId === category.id && categoryDraft ? (
                      <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                        <input
                          value={categoryDraft.name}
                          onChange={(event) =>
                            setCategoryDraft({
                              ...categoryDraft,
                              name: event.target.value,
                            })
                          }
                          className={smallInputClassName}
                          placeholder="Название RU"
                        />

                        <input
                          value={categoryDraft.name_en}
                          onChange={(event) =>
                            setCategoryDraft({
                              ...categoryDraft,
                              name_en: event.target.value,
                            })
                          }
                          className={smallInputClassName}
                          placeholder="Название EN"
                        />

                        <input
                          value={categoryDraft.slug}
                          onChange={(event) =>
                            setCategoryDraft({
                              ...categoryDraft,
                              slug: event.target.value,
                            })
                          }
                          className={smallInputClassName}
                          placeholder="slug"
                        />

                        <button
                          type="button"
                          onClick={() => void saveCategoryEdit()}
                          className="rounded-[8px] bg-ink px-4 py-2 text-[15px] text-paper"
                        >
                          Сохранить
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditCategory}
                          className="rounded-[8px] border border-border px-4 py-2 text-[15px]"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-[15px] font-semibold leading-[150%] text-ink">
                            {category.name}
                          </p>

                          <p className="text-[13px] font-medium leading-[150%] text-ink-light">
                            EN: {category.name_en || "не заполнено"} · slug:{" "}
                            {category.slug} · порядок: {category.sort_order}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => void reorderCategory(index, -1)}
                            className="rounded-[8px] border border-border px-3 py-1.5 text-[15px] disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={index === orderedCategories.length - 1}
                            onClick={() => void reorderCategory(index, 1)}
                            className="rounded-[8px] border border-border px-3 py-1.5 text-[15px] disabled:opacity-30"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() => startEditCategory(category)}
                            className="rounded-[8px] border border-border px-3 py-1.5 text-[15px]"
                          >
                            Редактировать
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteCategory(category)}
                            className="rounded-[8px] border border-red-600 px-3 py-1.5 text-[15px] text-red-600"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-4 rounded-[8px] border border-border p-4">
        <AdminSectionHeader
          title="Добавить работу"
          collapsed={collapsedSections.createArtwork}
          onToggle={() => toggleSection("createArtwork")}
        />

        {!collapsedSections.createArtwork && (
          <form
            onSubmit={createArtwork}
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input
              required
              name="title"
              placeholder="Название RU"
              className={inputClassName}
            />

            <input
              name="title_en"
              placeholder="Название EN"
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
              {orderedCategories.map((category) => (
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

            <input
              name="size"
              placeholder="Размер RU"
              className={inputClassName}
            />

            <input
              name="size_en"
              placeholder="Размер EN"
              className={inputClassName}
            />

            <input
              name="materials"
              placeholder="Материалы RU"
              className={inputClassName}
            />

            <input
              name="materials_en"
              placeholder="Материалы EN"
              className={inputClassName}
            />

            <textarea
              name="description"
              placeholder="Описание RU"
              rows={3}
              className={`${inputClassName} md:col-span-2`}
            />

            <textarea
              name="description_en"
              placeholder="Описание EN"
              rows={3}
              className={`${inputClassName} md:col-span-2`}
            />

            <button
              type="submit"
              className="flex h-[48px] items-center justify-center rounded-[8px] bg-ink px-6 text-[15px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80 md:col-span-2"
            >
              Сохранить работу
            </button>
          </form>
        )}
      </section>

      <section className="mt-4 rounded-[8px] border border-border p-4">
        <AdminSectionHeader
          title="Работы"
          collapsed={collapsedSections.artworks}
          onToggle={() => toggleSection("artworks")}
          right={
            <span className="text-[14px] font-medium leading-[150%] text-ink-light">
              {artworks.length} шт.
            </span>
          }
        />

        {!collapsedSections.artworks && (
          <>
            {artworks.length === 0 ? (
              <p className="mt-4 text-[15px] font-medium leading-[150%] text-ink-light">
                Работ пока нет.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {orderedCategories.map((category) => {
                  const categoryArtworks = sortedArtworks(
                    artworks.filter(
                      (artwork) => artwork.category_id === category.id,
                    ),
                  );

                  return (
                    <div
                      key={category.id}
                      className="rounded-[8px] border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className="text-left"
                        >
                          <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                            {category.name}{" "}
                            <span className="text-ink-light">
                              {collapsedCategories[category.id] ? "＋" : "−"}
                            </span>
                          </h3>

                          {category.name_en && (
                            <p className="mt-1 text-[13px] font-medium leading-[150%] text-ink-light">
                              {category.name_en}
                            </p>
                          )}
                        </button>

                        <p className="text-[14px] font-medium leading-[150%] text-ink-light">
                          {categoryArtworks.length} работ
                        </p>
                      </div>

                      {!collapsedCategories[category.id] && (
                        <div className="mt-4">
                          {categoryArtworks.length === 0 ? (
                            <p className="text-[15px] font-medium leading-[150%] text-ink-light">
                              В этой категории пока нет работ.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {categoryArtworks.map((artwork, index) => (
                                <ArtworkAdminCard
                                  key={artwork.id}
                                  artwork={artwork}
                                  index={index}
                                  total={categoryArtworks.length}
                                  expanded={!!expandedArtworks[artwork.id]}
                                  toggleExpanded={() =>
                                    toggleArtworkDetails(artwork.id)
                                  }
                                  editingId={editingId}
                                  draft={draft}
                                  categories={orderedCategories}
                                  startEdit={startEdit}
                                  cancelEdit={cancelEdit}
                                  saveEdit={saveEdit}
                                  setDraft={setDraft}
                                  deleteArtwork={deleteArtwork}
                                  updateArtworkStatus={updateArtworkStatus}
                                  uploadImage={uploadImage}
                                  deleteImage={deleteImage}
                                  reorderImage={reorderImage}
                                  reorderArtworkInCategory={
                                    reorderArtworkInCategory
                                  }
                                  categoryName={categoryName}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {uncategorizedArtworks.length > 0 && (
                  <div className="rounded-[8px] border border-border p-3">
                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => toggleCategory("uncategorized")}
                        className="text-left"
                      >
                        <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                          Без категории{" "}
                          <span className="text-ink-light">
                            {collapsedCategories.uncategorized ? "＋" : "−"}
                          </span>
                        </h3>
                      </button>

                      <p className="text-[14px] font-medium leading-[150%] text-ink-light">
                        {uncategorizedArtworks.length} работ
                      </p>
                    </div>

                    {!collapsedCategories.uncategorized && (
                      <div className="mt-4 space-y-3">
                        {uncategorizedArtworks.map((artwork, index) => (
                          <ArtworkAdminCard
                            key={artwork.id}
                            artwork={artwork}
                            index={index}
                            total={uncategorizedArtworks.length}
                            expanded={!!expandedArtworks[artwork.id]}
                            toggleExpanded={() =>
                              toggleArtworkDetails(artwork.id)
                            }
                            editingId={editingId}
                            draft={draft}
                            categories={orderedCategories}
                            startEdit={startEdit}
                            cancelEdit={cancelEdit}
                            saveEdit={saveEdit}
                            setDraft={setDraft}
                            deleteArtwork={deleteArtwork}
                            updateArtworkStatus={updateArtworkStatus}
                            uploadImage={uploadImage}
                            deleteImage={deleteImage}
                            reorderImage={reorderImage}
                            reorderArtworkInCategory={reorderArtworkInCategory}
                            categoryName={categoryName}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-4 rounded-[8px] border border-border p-4">
        <AdminSectionHeader
          title="Заявки"
          collapsed={collapsedSections.orders}
          onToggle={() => toggleSection("orders")}
          right={
            <span className="text-[14px] font-medium leading-[150%] text-ink-light">
              {orders.length} шт.
            </span>
          }
        />

        {!collapsedSections.orders && (
          <>
            {orders.length === 0 ? (
              <div className="mt-4 rounded-[8px] border border-border p-4 text-[15px] font-medium leading-[150%] text-ink-light">
                Заявок пока нет.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {orders.map((order) => {
                  const isTechnicalEmail =
                    !order.email || order.email === "no-email@lipolesh.art";

                  return (
                    <article
                      key={order.id}
                      className="rounded-[8px] border border-border p-4"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-[17px] font-semibold leading-[120%] text-ink">
                              Заявка #{order.id}
                            </h3>

                            <span className="rounded-[8px] bg-paper-dark px-3 py-1 text-[13px] font-medium leading-[150%] text-ink-light">
                              {orderStatusLabel[order.status]}
                            </span>
                          </div>

                          <dl className="mt-4 space-y-2 text-[15px] font-medium leading-[150%]">
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
                          <label className="block text-[13px] font-medium leading-[150%] text-ink-light">
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
                            className="mt-2 h-[40px] w-full rounded-[8px] border border-border bg-paper px-3 text-[15px] font-medium leading-[150%] text-ink outline-none transition-colors focus:border-ink/40"
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
          </>
        )}
      </section>
    </main>
  );
}

function AdminSectionHeader({
  title,
  collapsed,
  onToggle,
  right,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 text-left"
      >
        <span className="text-[22px] font-semibold leading-[120%] tracking-[-0.02em] text-ink">
          {title}
        </span>

        <span className="text-[18px] font-medium leading-none text-ink-light">
          {collapsed ? "＋" : "−"}
        </span>
      </button>

      {right}
    </div>
  );
}

function ArtworkAdminCard({
  artwork,
  index,
  total,
  expanded,
  toggleExpanded,
  editingId,
  draft,
  categories,
  startEdit,
  cancelEdit,
  saveEdit,
  setDraft,
  deleteArtwork,
  updateArtworkStatus,
  uploadImage,
  deleteImage,
  reorderImage,
  reorderArtworkInCategory,
  categoryName,
}: {
  artwork: Artwork;
  index: number;
  total: number;
  expanded: boolean;
  toggleExpanded: () => void;
  editingId: number | null;
  draft: Artwork | null;
  categories: Category[];
  startEdit: (artwork: Artwork) => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<void>;
  setDraft: (artwork: Artwork) => void;
  deleteArtwork: (artwork: Artwork) => Promise<void>;
  updateArtworkStatus: (
    artwork: Artwork,
    status: ArtworkStatus,
  ) => Promise<void>;
  uploadImage: (artworkId: number, file: File | undefined) => Promise<void>;
  deleteImage: (artworkId: number, image: ArtworkImage) => Promise<void>;
  reorderImage: (artwork: Artwork, from: number, to: number) => Promise<void>;
  reorderArtworkInCategory: (
    categoryId: number | null,
    artwork: Artwork,
    direction: -1 | 1,
  ) => Promise<void>;
  categoryName: (id: number | null) => string;
}) {
  return (
    <article className="rounded-[8px] border border-border p-3">
      {editingId === artwork.id && draft ? (
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
            placeholder="Название RU"
            className={smallInputClassName}
          />

          <input
            value={draft.title_en}
            onChange={(event) =>
              setDraft({ ...draft, title_en: event.target.value })
            }
            placeholder="Название EN"
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
            placeholder="Размер RU"
            className={smallInputClassName}
          />

          <input
            value={draft.size_en}
            onChange={(event) =>
              setDraft({ ...draft, size_en: event.target.value })
            }
            placeholder="Размер EN"
            className={smallInputClassName}
          />

          <input
            value={draft.materials}
            onChange={(event) =>
              setDraft({ ...draft, materials: event.target.value })
            }
            placeholder="Материалы RU"
            className={smallInputClassName}
          />

          <input
            value={draft.materials_en}
            onChange={(event) =>
              setDraft({ ...draft, materials_en: event.target.value })
            }
            placeholder="Материалы EN"
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
            {(Object.keys(statusLabel) as ArtworkStatus[]).map((status) => (
              <option key={status} value={status}>
                {statusLabel[status]}
              </option>
            ))}
          </select>

          <textarea
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
            placeholder="Описание RU"
            rows={3}
            className={`${smallInputClassName} md:col-span-2`}
          />

          <textarea
            value={draft.description_en}
            onChange={(event) =>
              setDraft({ ...draft, description_en: event.target.value })
            }
            placeholder="Описание EN"
            rows={3}
            className={`${smallInputClassName} md:col-span-2`}
          />

          <div className="flex gap-2 md:col-span-2">
            <button
              type="button"
              onClick={() => void saveEdit()}
              className="rounded-[8px] bg-ink px-4 py-2 text-[15px] text-paper"
            >
              Сохранить
            </button>

            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-[8px] border border-border px-4 py-2 text-[15px]"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <p className="text-[17px] font-semibold leading-[120%] text-ink">
              {artwork.title}
            </p>

            <p className="mt-1 text-[13px] font-medium leading-[150%] text-ink-light">
              EN: {artwork.title_en || "не заполнено"}
            </p>

            <p className="mt-1 text-[13px] font-medium leading-[150%] text-ink-light">
              #{index + 1}
              {" · "}
              {statusLabel[artwork.status]}
              {artwork.price != null && ` · ${formatPrice(artwork.price)}`}
              {categoryName(artwork.category_id) &&
                ` · ${categoryName(artwork.category_id)}`}
              {" · "}
              порядок: {artwork.sort_order}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() =>
                void reorderArtworkInCategory(
                  artwork.category_id,
                  artwork,
                  -1,
                )
              }
              className="rounded-[8px] border border-border px-3 py-1.5 text-[15px] disabled:opacity-30"
            >
              ↑
            </button>

            <button
              type="button"
              disabled={index === total - 1}
              onClick={() =>
                void reorderArtworkInCategory(
                  artwork.category_id,
                  artwork,
                  1,
                )
              }
              className="rounded-[8px] border border-border px-3 py-1.5 text-[15px] disabled:opacity-30"
            >
              ↓
            </button>

            <button
              type="button"
              onClick={toggleExpanded}
              className="rounded-[8px] border border-border px-3 py-1.5 text-[14px] font-medium leading-[150%]"
            >
              {expanded ? "скрыть" : "детали"}
            </button>

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
              {(Object.keys(statusLabel) as ArtworkStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => startEdit(artwork)}
              className="rounded-[8px] border border-border px-3 py-1.5 text-[15px] font-medium leading-[150%]"
            >
              Редактировать
            </button>

            <button
              type="button"
              onClick={() => void deleteArtwork(artwork)}
              className="rounded-[8px] border border-red-600 px-3 py-1.5 text-[15px] font-medium leading-[150%] text-red-600"
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap gap-3">
            {artwork.images.map((image, imageIndex) => (
              <div key={image.id} className="w-24">
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

                <div className="mt-1.5 flex items-center justify-between text-[13px] font-medium leading-[150%] text-ink-light">
                  <button
                    type="button"
                    disabled={imageIndex === 0}
                    onClick={() =>
                      void reorderImage(artwork, imageIndex, imageIndex - 1)
                    }
                    className="disabled:opacity-30"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteImage(artwork.id, image)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>

                  <button
                    type="button"
                    disabled={imageIndex === artwork.images.length - 1}
                    onClick={() =>
                      void reorderImage(artwork, imageIndex, imageIndex + 1)
                    }
                    className="disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <label className="mt-3 block text-[13px] font-medium leading-[150%] text-ink-light">
            Добавить изображение
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                void uploadImage(artwork.id, event.target.files?.[0])
              }
              className="mt-2 block w-full text-[13px]"
            />
          </label>
        </div>
      )}
    </article>
  );
}