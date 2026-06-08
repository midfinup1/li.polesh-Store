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
  AdminAuditLog,
} from "@/types";
import {
  ConfirmDeleteModal,
  type DeleteTarget,
  TabButton,
  moveInArray,
  secondaryButtonClassName,
  sortedArtworks,
  sortedCategories,
  statusLabel,
} from "@/components/admin/admin-components";
import {
  AdminAnalyticsSection,
  AdminArtistSection,
  AdminArtworksSection,
  AdminCategoriesSection,
  AdminOrdersSection,
  AdminAuditHistorySection,
} from "@/components/admin/admin-sections";

type AdminTab = "artist" | "categories" | "artworks" | "orders" | "analytics" | "history";

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
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

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
        auditLogsResponse,
      ] = await Promise.all([
        api.admin.artworks.list(),
        api.admin.orders.list(),
        api.categories.list(),
        api.artist.get(),
        api.admin.analytics.summary().catch(() => null),
        api.admin.auditLogs.list().catch(() => []),
      ]);

      setArtworks(Array.isArray(worksResponse) ? worksResponse : []);
      setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
      setCategories(
        Array.isArray(categoriesResponse) ? categoriesResponse : [],
      );
      setArtist(artistResponse ?? blankArtist);
      setAnalytics(analyticsResponse);
      setAuditLogs(Array.isArray(auditLogsResponse) ? auditLogsResponse : []);
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

  async function run(
    action: () => Promise<unknown>,
    successMessage: string,
    fallbackErrorMessage = "Не удалось выполнить операцию",
  ) {
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

      setError(err instanceof Error ? err.message : fallbackErrorMessage);
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
        "Не удалось удалить категорию",
      );
      return;
    }

    if (target.type === "artwork") {
      await run(
        () => api.admin.artworks.delete(target.artwork.id),
        "Работа удалена",
        "Не удалось удалить работу",
      );
      return;
    }

    if (target.type === "order") {
      await run(
        () => api.admin.orders.delete(target.order.id),
        "Заявка удалена",
        "Не удалось удалить заявку",
      );
      return;
    }

    await run(
      () => api.admin.artworks.deleteImage(target.artworkId, target.image.id),
      "Изображение удалено",
      "Не удалось удалить изображение",
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
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          История
        </TabButton>
      </nav>

      {activeTab === "artist" && (
        <AdminArtistSection
          artist={artist}
          setArtist={setArtist}
          saving={saving}
          uploadingArtistPhoto={uploadingArtistPhoto}
          onSave={saveArtist}
          onUploadPhoto={(slot, file) => void uploadArtistPhoto(slot, file)}
        />
      )}

      {activeTab === "categories" && (
        <AdminCategoriesSection
          categories={categoriesSorted}
          editingCategoryId={editingCategoryId}
          categoryDraft={categoryDraft}
          saving={saving}
          onCreateCategory={createCategory}
          onSetCategoryDraft={setCategoryDraft}
          onSaveCategoryEdit={() => void saveCategoryEdit()}
          onCancelEditCategory={cancelEditCategory}
          onStartEditCategory={startEditCategory}
          onReorderCategories={(fromIndex, toIndex) =>
            void reorderCategories(fromIndex, toIndex)
          }
          onDeleteCategory={(category) =>
            setDeleteTarget({ type: "category", category })
          }
        />
      )}

      {activeTab === "artworks" && (
        <AdminArtworksSection
          categories={categoriesSorted}
          artworkSearch={artworkSearch}
          setArtworkSearch={setArtworkSearch}
          artworksByCategory={artworksByCategory}
          editingId={editingId}
          draft={draft}
          draggedArtworkId={draggedArtworkId}
          draggedImageId={draggedImageId}
          saving={saving}
          categoryName={categoryName}
          onCreateArtwork={createArtwork}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={() => void saveEdit()}
          onDraftChange={setDraft}
          onStatusChange={(artwork, status) =>
            void updateArtworkStatus(artwork, status)
          }
          onDeleteArtwork={(artwork) =>
            setDeleteTarget({ type: "artwork", artwork })
          }
          onUploadImage={(artworkId, file) => void uploadImage(artworkId, file)}
          onDeleteImage={(artworkId, image) =>
            setDeleteTarget({ type: "image", artworkId, image })
          }
          onImageAltTextSave={(artworkId, image, altText) =>
            void updateImageAltText(artworkId, image, altText)
          }
          onDragArtworkStart={setDraggedArtworkId}
          onDragArtworkEnd={() => setDraggedArtworkId(null)}
          onDropArtwork={(categoryId, artworkId) => {
            if (draggedArtworkId !== null) {
              void reorderArtworksInCategory(
                categoryId,
                draggedArtworkId,
                artworkId,
              );
            }
          }}
          onImageDragStart={setDraggedImageId}
          onImageDragEnd={() => setDraggedImageId(null)}
          onImageDrop={(artwork, imageId) => {
            if (draggedImageId !== null) {
              void reorderImage(artwork, draggedImageId, imageId);
            }
          }}
        />
      )}

      {activeTab === "orders" && (
        <AdminOrdersSection
          orders={orders}
          onUpdateStatus={(orderId, status) =>
            void updateOrderStatus(orderId, status)
          }
          onDeleteOrder={(order) => setDeleteTarget({ type: "order", order })}
        />
      )}

      {activeTab === "analytics" && (
        <AdminAnalyticsSection
          analytics={analytics}
          ordersCount={orders.length}
        />
      )}

      {activeTab === "history" && (
        <AdminAuditHistorySection auditLogs={auditLogs} />
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
