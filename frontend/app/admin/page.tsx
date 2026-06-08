"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type {
  Artist,
  Artwork,
  ArtworkImage,
  ArtworkStatus,
  Category,
  Order,
  AnalyticsSummary,
} from "@/types";
import {
  AnalyticsAdminSection,
  ArtworkAdminCard,
  ConfirmDeleteModal,
  type DeleteTarget,
  PhotoUploadCard,
  TabButton,
  buttonClassName,
  dangerButtonClassName,
  inputClassName,
  moveInArray,
  orderStatusClassName,
  orderStatusLabel,
  secondaryButtonClassName,
  smallInputClassName,
  sortedArtworks,
  sortedCategories,
  statusLabel,
} from "@/components/admin/admin-components";

type AdminTab = "artist" | "categories" | "artworks" | "orders" | "analytics";

const blankArtist: Artist = {
  id: 0,
  name: "",
  name_en: "",
  bio: "",
  bio_en: "",
  photo_url: "",
  home_photo_url: "",
  about_photo_url: "",
  email: "",
  instagram: "",
};

export default function AdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("artworks");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artist, setArtist] = useState<Artist>(blankArtist);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingArtistPhoto, setUploadingArtistPhoto] = useState<
    "home" | "about" | null
  >(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Artwork | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [categoryDraft, setCategoryDraft] = useState<Category | null>(null);

  const [artworkSearch, setArtworkSearch] = useState("");
  const [draggedArtworkId, setDraggedArtworkId] = useState<number | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

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
      const [
        worksResponse,
        ordersResponse,
        categoriesResponse,
        artistResponse,
        analyticsResponse,
      ] = await Promise.all([
        api.admin.artworks.list(),
        api.admin.orders.list(),
        api.categories.list(),
        api.artist.get(),
        api.admin.analytics.summary().catch(() => null),
      ]);

      setArtworks(Array.isArray(worksResponse) ? worksResponse : []);
      setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
      setCategories(
        Array.isArray(categoriesResponse) ? categoriesResponse : [],
      );
      setArtist(artistResponse ?? blankArtist);
      setAnalytics(analyticsResponse);
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
    setSaving(true);

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
    } finally {
      setSaving(false);
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

  async function uploadArtistPhoto(
    slot: "home" | "about",
    file: File | undefined,
  ) {
    if (!file) {
      return;
    }

    setUploadingArtistPhoto(slot);
    await run(
      async () => {
        const updated = await api.admin.artist.uploadPhoto(slot, file);
        setArtist(updated);
      },
      slot === "home"
        ? "Фото для главной загружено"
        : "Фото для страницы Об авторе загружено",
    );
    setUploadingArtistPhoto(null);
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

  async function reorderCategories(fromIndex: number, toIndex: number) {
    const current = sortedCategories(categories);
    const reordered = moveInArray(current, fromIndex, toIndex);

    if (reordered === current) {
      return;
    }

    await run(async () => {
      await Promise.all(
        reordered.map((category, sortOrder) =>
          api.admin.categories.update(category.id, {
            ...category,
            sort_order: sortOrder,
          }),
        ),
      );
    }, "Порядок категорий обновлён");
  }

  function getNextArtworkSortOrder(categoryId: number) {
    const categoryArtworks = artworks.filter(
      (artwork) => artwork.category_id === categoryId,
    );

    if (categoryArtworks.length === 0) {
      return 0;
    }

    return (
      Math.max(...categoryArtworks.map((artwork) => artwork.sort_order)) + 1
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

    if (!rawCategoryId) {
      setError("Выберите категорию работы");
      return;
    }

    const categoryId = Number(rawCategoryId);

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

    if (!draft.category_id) {
      setError("Выберите категорию работы");
      return;
    }

    await run(
      () => api.admin.artworks.update(draft.id, draft),
      "Работа обновлена",
    );

    cancelEdit();
  }

  async function updateArtworkStatus(artwork: Artwork, status: ArtworkStatus) {
    await run(
      () => api.admin.artworks.update(artwork.id, { ...artwork, status }),
      "Статус работы обновлён",
    );
  }

  async function reorderArtworksInCategory(
    categoryId: number,
    fromId: number,
    toId: number,
  ) {
    const current = sortedArtworks(
      artworks.filter((artwork) => artwork.category_id === categoryId),
    );
    const fromIndex = current.findIndex((artwork) => artwork.id === fromId);
    const toIndex = current.findIndex((artwork) => artwork.id === toId);
    const reordered = moveInArray(current, fromIndex, toIndex);

    if (reordered === current) {
      return;
    }

    await run(async () => {
      await Promise.all(
        reordered.map((artwork, sortOrder) =>
          api.admin.artworks.update(artwork.id, {
            ...artwork,
            sort_order: sortOrder,
          }),
        ),
      );
    }, "Порядок работ обновлён");
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

  async function updateImageAltText(
    artworkId: number,
    image: ArtworkImage,
    altText: string,
  ) {
    await run(
      () => api.admin.artworks.updateImageAltText(artworkId, image.id, altText),
      "Alt text изображения обновлён",
    );
  }

  async function reorderImage(artwork: Artwork, fromId: number, toId: number) {
    const current = artwork.images || [];
    const fromIndex = current.findIndex((image) => image.id === fromId);
    const toIndex = current.findIndex((image) => image.id === toId);
    const reordered = moveInArray(current, fromIndex, toIndex);

    if (reordered === current) {
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

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setDeleteTarget(null);

    if (target.type === "category") {
      await run(
        () => api.admin.categories.delete(target.category.id),
        "Категория удалена",
      );
      return;
    }

    if (target.type === "artwork") {
      await run(
        () => api.admin.artworks.delete(target.artwork.id),
        "Работа удалена",
      );
      return;
    }

    await run(
      () => api.admin.artworks.deleteImage(target.artworkId, target.image.id),
      "Изображение удалено",
    );
  }

  const categoriesSorted = useMemo(
    () => sortedCategories(categories),
    [categories],
  );

  const filteredArtworks = useMemo(() => {
    const query = artworkSearch.trim().toLowerCase();

    return sortedArtworks(artworks).filter((artwork) => {
      if (!query) {
        return true;
      }

      const categoryName =
        categories.find((category) => category.id === artwork.category_id)
          ?.name || "";
      const text = [
        artwork.title,
        artwork.title_en,
        artwork.materials,
        artwork.materials_en,
        categoryName,
        statusLabel[artwork.status],
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [artworks, artworkSearch, categories]);

  const artworksByCategory = useMemo(() => {
    const result = new Map<number, Artwork[]>();

    for (const category of categoriesSorted) {
      result.set(
        category.id,
        sortedArtworks(
          filteredArtworks.filter(
            (artwork) => artwork.category_id === category.id,
          ),
        ),
      );
    }

    return result;
  }, [categoriesSorted, filteredArtworks]);

  function categoryName(id: number | null) {
    if (id === null) {
      return "Без категории";
    }

    return (
      categories.find((category) => category.id === id)?.name || "Без категории"
    );
  }

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
    <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
          Админка
        </h1>

        <button
          type="button"
          onClick={() => void logout()}
          className={secondaryButtonClassName}
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

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        <TabButton
          active={activeTab === "artist"}
          onClick={() => setActiveTab("artist")}
        >
          Профиль
        </TabButton>
        <TabButton
          active={activeTab === "categories"}
          onClick={() => setActiveTab("categories")}
        >
          Категории
        </TabButton>
        <TabButton
          active={activeTab === "artworks"}
          onClick={() => setActiveTab("artworks")}
        >
          Работы
        </TabButton>
        <TabButton
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
        >
          Заявки
        </TabButton>
        <TabButton
          active={activeTab === "analytics"}
          onClick={() => setActiveTab("analytics")}
        >
          Статистика
        </TabButton>
      </nav>

      {activeTab === "artist" && (
        <section className="mt-6 rounded-[8px] border border-border p-4">
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
            Профиль художницы
          </h2>

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
              onChange={(file) => void uploadArtistPhoto("home", file)}
            />

            <PhotoUploadCard
              title="Фото для страницы Об авторе"
              imageUrl={artist.about_photo_url || artist.photo_url}
              loading={uploadingArtistPhoto === "about"}
              onChange={(file) => void uploadArtistPhoto("about", file)}
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
      )}

      {activeTab === "categories" && (
        <section className="mt-6 rounded-[8px] border border-border p-4">
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
            Категории
          </h2>

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
            <button type="submit" disabled={saving} className={buttonClassName}>
              Добавить
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {categoriesSorted.map((category, index) => (
              <div
                key={category.id}
                draggable={editingCategoryId !== category.id}
                onDragStart={() => setDraggedArtworkId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void reorderCategories(index, index)}
                className="rounded-[8px] border border-border p-3"
              >
                {editingCategoryId === category.id && categoryDraft ? (
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                    <input
                      value={categoryDraft.name}
                      onChange={(event) =>
                        setCategoryDraft({
                          ...categoryDraft,
                          name: event.target.value,
                        })
                      }
                      placeholder="Название RU"
                      className={smallInputClassName}
                    />
                    <input
                      value={categoryDraft.name_en}
                      onChange={(event) =>
                        setCategoryDraft({
                          ...categoryDraft,
                          name_en: event.target.value,
                        })
                      }
                      placeholder="Название EN"
                      className={smallInputClassName}
                    />
                    <input
                      value={categoryDraft.slug}
                      onChange={(event) =>
                        setCategoryDraft({
                          ...categoryDraft,
                          slug: event.target.value,
                        })
                      }
                      placeholder="slug"
                      className={smallInputClassName}
                    />
                    <button
                      type="button"
                      onClick={() => void saveCategoryEdit()}
                      className={buttonClassName}
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditCategory}
                      className={secondaryButtonClassName}
                    >
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
                        EN: {category.name_en || "не заполнено"} · slug:{" "}
                        {category.slug} · порядок: {category.sort_order}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => void reorderCategories(index, index - 1)}
                        className={secondaryButtonClassName}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === categoriesSorted.length - 1}
                        onClick={() => void reorderCategories(index, index + 1)}
                        className={secondaryButtonClassName}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditCategory(category)}
                        className={secondaryButtonClassName}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: "category", category })
                        }
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
      )}

      {activeTab === "artworks" && (
        <section className="mt-6 space-y-5">
          <div className="rounded-[8px] border border-border p-4">
            <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
              Добавить работу
            </h2>

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
              <select required name="category_id" className={inputClassName}>
                <option value="">Выберите категорию</option>
                {categoriesSorted.map((category) => (
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
                disabled={saving}
                className={`${buttonClassName} md:col-span-2`}
              >
                Сохранить работу
              </button>
            </form>
          </div>

          <div className="rounded-[8px] border border-border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
                Работы
              </h2>
              <input
                value={artworkSearch}
                onChange={(event) => setArtworkSearch(event.target.value)}
                placeholder="Поиск по названию, категории, статусу"
                className="w-full rounded-[8px] border border-border bg-transparent px-4 py-2 text-[15px] font-medium leading-[150%] outline-none focus:border-ink/40 md:max-w-[420px]"
              />
            </div>

            <div className="mt-5 space-y-6">
              {categoriesSorted.map((category) => {
                const categoryArtworks =
                  artworksByCategory.get(category.id) || [];

                return (
                  <div
                    key={category.id}
                    className="rounded-[8px] border border-border p-3"
                  >
                    <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                      {category.name}
                    </h3>

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
                            categories={categoriesSorted}
                            categoryName={categoryName(artwork.category_id)}
                            draggedArtworkId={draggedArtworkId}
                            onDragStart={() => setDraggedArtworkId(artwork.id)}
                            onDragEnd={() => setDraggedArtworkId(null)}
                            onDrop={() => {
                              if (draggedArtworkId !== null) {
                                void reorderArtworksInCategory(
                                  category.id,
                                  draggedArtworkId,
                                  artwork.id,
                                );
                              }
                            }}
                            onStartEdit={() => startEdit(artwork)}
                            onCancelEdit={cancelEdit}
                            onSaveEdit={() => void saveEdit()}
                            onDraftChange={setDraft}
                            onStatusChange={(status) =>
                              void updateArtworkStatus(artwork, status)
                            }
                            onDelete={() =>
                              setDeleteTarget({ type: "artwork", artwork })
                            }
                            onUploadImage={(file) =>
                              void uploadImage(artwork.id, file)
                            }
                            onImageDelete={(image) =>
                              setDeleteTarget({
                                type: "image",
                                artworkId: artwork.id,
                                image,
                              })
                            }
                            onImageAltTextSave={(image, altText) =>
                              void updateImageAltText(
                                artwork.id,
                                image,
                                altText,
                              )
                            }
                            draggedImageId={draggedImageId}
                            onImageDragStart={(imageId) =>
                              setDraggedImageId(imageId)
                            }
                            onImageDragEnd={() => setDraggedImageId(null)}
                            onImageDrop={(imageId) => {
                              if (draggedImageId !== null) {
                                void reorderImage(
                                  artwork,
                                  draggedImageId,
                                  imageId,
                                );
                              }
                            }}
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
      )}

      {activeTab === "analytics" && (
        <AnalyticsAdminSection
          analytics={analytics}
          ordersCount={orders.length}
        />
      )}
      {activeTab === "orders" && (
        <section className="mt-6 rounded-[8px] border border-border p-4">
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
            Заявки
          </h2>

          {orders.length === 0 ? (
            <div className="mt-5 rounded-[8px] border border-border p-6 text-[16px] font-medium leading-[150%] text-ink-light">
              Заявок пока нет.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {orders.map((order) => {
                const isTechnicalEmail =
                  !order.email || order.email === "no-email@lipolesh.art";

                return (
                  <article
                    key={order.id}
                    className="rounded-[8px] border border-border p-4"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                            Заявка #{order.id}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-[13px] font-semibold leading-[150%] ${orderStatusClassName[order.status]}`}
                          >
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
                          {order.message && (
                            <div className="md:col-span-2">
                              <dt className="text-ink-light">Комментарий</dt>
                              <dd className="mt-1 whitespace-pre-line text-ink">
                                {order.message}
                              </dd>
                            </div>
                          )}
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
                          className="mt-2 h-[44px] w-full rounded-[8px] border border-border bg-paper px-3 text-[15px] font-medium leading-[150%] text-ink outline-none transition-colors focus:border-ink/40"
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
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          target={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </main>
  );
}
