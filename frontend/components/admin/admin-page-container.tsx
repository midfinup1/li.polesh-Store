"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type {
  AdminAuditLog,
  AdminAuditLogFilter,
  AnalyticsSummary,
  Artist,
  Artwork,
  ArtworkImage,
  Category,
  Order,
  Series,
} from "@/types";
import {
  AdminState,
  secondaryButtonClassName,
  TabButton,
} from "@/components/admin/forms";
import { ConfirmDeleteModal } from "@/components/admin/modals";
import type { AdminTab, DeleteTarget } from "@/components/admin/types";
import {
  moveInArray,
  slugify,
  sortedArtworks,
  sortedCategories,
  sortedSeries,
  statusLabel,
} from "@/components/admin/helpers";
import { AdminAnalyticsSection } from "@/components/admin/analytics-section";
import { AdminArtistSection } from "@/components/admin/artist-section";
import { AdminArtworksSection } from "@/components/admin/artworks-section";
import { AdminCategoriesSection } from "@/components/admin/categories-section";
import { AdminSeriesSection } from "@/components/admin/series-section";
import { AdminOrdersSection } from "@/components/admin/orders-section";
import { AdminAuditHistorySection } from "@/components/admin/audit-section";

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

function applySortOrder<T extends { id: number; sort_order: number }>(
  items: T[],
  ids: number[],
) {
  const orderById = new Map(ids.map((id, index) => [id, index]));

  return items.map((item) => {
    const sortOrder = orderById.get(item.id);
    return sortOrder === undefined ? item : { ...item, sort_order: sortOrder };
  });
}

export function AdminPageContainer() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("artworks");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [artist, setArtist] = useState<Artist>(blankArtist);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditFilters, setAuditFilters] = useState<AdminAuditLogFilter>({
    limit: 50,
    offset: 0,
  });
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);

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
  const [editingSeriesId, setEditingSeriesId] = useState<number | null>(
    null,
  );
  const [seriesDraft, setSeriesDraft] = useState<Series | null>(null);

  const [artworkSearch, setArtworkSearch] = useState("");
  const [draggedArtworkId, setDraggedArtworkId] = useState<number | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const draggedArtworkIdRef = useRef<number | null>(null);
  const draggedImageIdRef = useRef<number | null>(null);
  const artworkDragSnapshot = useRef<Artwork[] | null>(null);
  const artworkDropCommitted = useRef(false);
  const imageDragSnapshot = useRef<{ artworkId: number; images: ArtworkImage[] } | null>(null);
  const imageDropCommitted = useRef(false);

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
        seriesResponse,
        artistResponse,
        analyticsResponse,
        auditLogsResponse,
      ] = await Promise.all([
        api.admin.artworks.list(),
        api.admin.orders.list(),
        api.categories.list(),
        api.series.list(),
        api.artist.get(),
        api.admin.analytics.summary().catch(() => null),
        api.admin.auditLogs
          .list({ limit: 50, offset: 0 })
          .catch(() => ({ items: [], total: 0, limit: 50, offset: 0 })),
      ]);

      setArtworks(Array.isArray(worksResponse) ? worksResponse : []);
      setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
      setCategories(
        Array.isArray(categoriesResponse) ? categoriesResponse : [],
      );
      setSeries(
        Array.isArray(seriesResponse) ? seriesResponse : [],
      );
      setArtist(artistResponse ?? blankArtist);
      setAnalytics(analyticsResponse);
      setAuditLogs(
        Array.isArray(auditLogsResponse)
          ? auditLogsResponse
          : auditLogsResponse.items,
      );
      setAuditTotal(
        Array.isArray(auditLogsResponse)
          ? auditLogsResponse.length
          : auditLogsResponse.total,
      );
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
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void load();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const hasUnsavedChanges = Boolean(draft || categoryDraft || seriesDraft);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function confirmUnsavedLeave() {
    return (
      !hasUnsavedChanges ||
      window.confirm("Есть несохранённые изменения. Покинуть страницу без сохранения?")
    );
  }

  async function reloadAuditLogs(nextFilters = auditFilters) {
    setAuditLoading(true);
    setError("");

    try {
      const response = await api.admin.auditLogs.list(nextFilters);
      setAuditLogs(Array.isArray(response) ? response : response.items);
      setAuditTotal(Array.isArray(response) ? response.length : response.total);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить историю действий",
      );
    } finally {
      setAuditLoading(false);
    }
  }

  async function run(
    action: () => Promise<unknown>,
    successMessage: string,
    fallbackErrorMessage = "Не удалось выполнить операцию",
  ): Promise<boolean> {
    setError("");
    setNotice("");
    setSaving(true);

    try {
      await action();
      setNotice(successMessage);
      await load();
      return true;
    } catch (err) {
      if (handleAuthError(err)) {
        return false;
      }

      setError(err instanceof Error ? err.message : fallbackErrorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (!confirmUnsavedLeave()) {
      return;
    }

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
    // Slug is no longer entered by hand: derive it from the EN name, falling
    // back to a transliteration of the RU name.
    const slug = slugify(nameEn, name);

    if (!name || !slug) {
      setError("Заполните название категории");
      return;
    }

    const created = await run(
      () =>
        api.admin.categories.create({
          name,
          name_en: nameEn,
          slug,
          sort_order: categories.length,
        }),
      "Категория добавлена",
    );

    if (created) {
      form.reset();
    }
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

    const payload = {
      ...categoryDraft,
      slug: slugify(categoryDraft.name_en, categoryDraft.name),
    };

    const saved = await run(
      () => api.admin.categories.update(payload.id, payload),
      "Категория обновлена",
    );

    if (saved) {
      cancelEditCategory();
    }
  }

  function previewCategories(ids: number[]) {
    setCategories((items) => applySortOrder(items, ids));
  }

  async function reorderCategories(ids: number[]) {
    setError("");
    setNotice("");
    setSaving(true);

    try {
      await api.admin.categories.reorder(ids);
      setNotice("Порядок категорий обновлён");
      void reloadAuditLogs();
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }

      setError(err instanceof Error ? err.message : "Не удалось обновить порядок категорий");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function createSeries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const nameEn = String(data.get("name_en") ?? "").trim();
    const slug = slugify(nameEn, name);

    if (!name || !slug) {
      setError("Заполните название серии");
      return;
    }

    const created = await run(
      () =>
        api.admin.series.create({
          name,
          name_en: nameEn,
          slug,
          sort_order: series.length,
        }),
      "Серия добавлена",
    );

    if (created) {
      form.reset();
    }
  }

  function startEditSeries(item: Series) {
    setEditingSeriesId(item.id);
    setSeriesDraft({ ...item });
  }

  function cancelEditSeries() {
    setEditingSeriesId(null);
    setSeriesDraft(null);
  }

  async function saveSeriesEdit() {
    if (!seriesDraft) {
      return;
    }

    const payload = {
      ...seriesDraft,
      slug: slugify(seriesDraft.name_en, seriesDraft.name),
    };

    const saved = await run(
      () => api.admin.series.update(payload.id, payload),
      "Серия обновлена",
    );

    if (saved) {
      cancelEditSeries();
    }
  }

  function previewSeries(ids: number[]) {
    setSeries((items) => applySortOrder(items, ids));
  }

  async function reorderSeries(ids: number[]) {
    setError("");
    setNotice("");
    setSaving(true);

    try {
      await api.admin.series.reorder(ids);
      setNotice("Порядок серий обновлён");
      void reloadAuditLogs();
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }

      setError(err instanceof Error ? err.message : "Не удалось обновить порядок серий");
      await load();
    } finally {
      setSaving(false);
    }
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

  async function createArtwork(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const rawPrice = String(data.get("price") ?? "").trim();
    const rawYear = String(data.get("year") ?? "").trim();
    const rawCategoryId = String(data.get("category_id") ?? "").trim();
    const rawSeriesId = String(data.get("exhibition_id") ?? "").trim();
    const title = String(data.get("title") ?? "").trim();

    if (!title) {
      setError("Укажите название работы");
      return false;
    }

    if (!rawCategoryId) {
      setError("Выберите категорию работы");
      return false;
    }

    const categoryId = Number(rawCategoryId);

    const created = await run(
      () =>
        api.admin.artworks.create({
          title,
          title_en: String(data.get("title_en") ?? "").trim(),
          description: String(data.get("description") ?? "").trim(),
          description_en: String(data.get("description_en") ?? "").trim(),
          purchase_comment: String(data.get("purchase_comment") ?? "").trim(),
          purchase_comment_en: String(
            data.get("purchase_comment_en") ?? "",
          ).trim(),
          price: rawPrice === "" ? null : Number(rawPrice),
          status: "available",
          category_id: categoryId,
          exhibition_id: rawSeriesId === "" ? null : Number(rawSeriesId),
          year: rawYear === "" ? null : Number(rawYear),
          size: String(data.get("size") ?? "").trim(),
          size_en: String(data.get("size_en") ?? "").trim(),
          materials: String(data.get("materials") ?? "").trim(),
          materials_en: String(data.get("materials_en") ?? "").trim(),
          sort_order: getNextArtworkSortOrder(categoryId),
        }),
      "Работа добавлена",
    );

    if (created) {
      form.reset();
    }
    return created;
  }

  function startEdit(artwork: Artwork) {
    setEditingId(artwork.id);
    setDraft({
      ...artwork,
      purchase_comment: artwork.purchase_comment || "",
      purchase_comment_en: artwork.purchase_comment_en || "",
    });
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

    const saved = await run(
      () => api.admin.artworks.update(draft.id, draft),
      "Работа обновлена",
    );

    if (saved) {
      cancelEdit();
    }
  }

  function startArtworkDrag(artworkId: number) {
    artworkDragSnapshot.current = artworks;
    artworkDropCommitted.current = false;
    draggedArtworkIdRef.current = artworkId;
    setDraggedArtworkId(artworkId);
  }

  function previewArtworkDrop(categoryId: number, targetId: number) {
    const activeId = draggedArtworkIdRef.current;
    if (activeId === null || activeId === targetId) {
      return;
    }

    const draggedArtwork = artworks.find((artwork) => artwork.id === activeId);
    if (!draggedArtwork || draggedArtwork.category_id !== categoryId) {
      return;
    }

    const current = sortedArtworks(
      artworks.filter((artwork) => artwork.category_id === categoryId),
    );
    const fromIndex = current.findIndex((artwork) => artwork.id === activeId);
    const toIndex = current.findIndex((artwork) => artwork.id === targetId);
    const reordered = moveInArray(current, fromIndex, toIndex);

    if (reordered === current) {
      return;
    }

    const nextById = new Map(
      reordered.map((artwork, sortOrder) => [artwork.id, { ...artwork, sort_order: sortOrder }]),
    );
    setArtworks((items) => items.map((item) => nextById.get(item.id) ?? item));
  }

  async function commitArtworkDrop(categoryId: number) {
    const reorderedIds = sortedArtworks(
      artworks.filter((artwork) => artwork.category_id === categoryId),
    ).map((artwork) => artwork.id);
    const previousArtworks = artworkDragSnapshot.current;

    artworkDropCommitted.current = true;

    setError("");
    setNotice("");
    setSaving(true);

    try {
      await api.admin.artworks.reorder(categoryId, reorderedIds);
      setNotice("Порядок работ обновлён");
      void reloadAuditLogs();
    } catch (err) {
      if (previousArtworks) {
        setArtworks(previousArtworks);
      }

      if (handleAuthError(err)) {
        return;
      }

      setError(
        err instanceof Error ? err.message : "Не удалось обновить порядок работ",
      );
    } finally {
      setSaving(false);
      artworkDragSnapshot.current = null;
    }
  }

  function endArtworkDrag() {
    if (!artworkDropCommitted.current && artworkDragSnapshot.current) {
      setArtworks(artworkDragSnapshot.current);
      artworkDragSnapshot.current = null;
    }
    draggedArtworkIdRef.current = null;
    setDraggedArtworkId(null);
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

  function startImageDrag(artwork: Artwork, imageId: number) {
    imageDragSnapshot.current = { artworkId: artwork.id, images: artwork.images };
    imageDropCommitted.current = false;
    draggedImageIdRef.current = imageId;
    setDraggedImageId(imageId);
  }

  function previewImageDrop(artworkId: number, targetId: number) {
    const activeId = draggedImageIdRef.current;
    if (activeId === null || activeId === targetId) {
      return;
    }

    const artwork = artworks.find((item) => item.id === artworkId);
    if (!artwork) {
      return;
    }

    const current = [...artwork.images].sort(
      (a, b) => a.sort_order - b.sort_order || a.id - b.id,
    );
    const fromIndex = current.findIndex((image) => image.id === activeId);
    const toIndex = current.findIndex((image) => image.id === targetId);
    const reordered = moveInArray(current, fromIndex, toIndex);

    if (reordered === current) {
      return;
    }

    const orderedImages = reordered.map((image, sortOrder) => ({ ...image, sort_order: sortOrder }));
    setArtworks((items) =>
      items.map((item) => item.id === artworkId ? { ...item, images: orderedImages } : item),
    );
  }

  async function commitImageDrop(artworkId: number) {
    const artwork = artworks.find((item) => item.id === artworkId);
    if (!artwork) {
      return;
    }

    imageDropCommitted.current = true;
    setError("");
    setNotice("");
    setSaving(true);

    try {
      await api.admin.artworks.reorderImages(
        artwork.id,
        [...artwork.images]
          .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
          .map((image) => image.id),
      );
      setNotice("Порядок изображений обновлён");
      void reloadAuditLogs();
    } catch (err) {
      const snapshot = imageDragSnapshot.current;
      if (snapshot) {
        setArtworks((items) =>
          items.map((item) => item.id === snapshot.artworkId ? { ...item, images: snapshot.images } : item),
        );
      }

      if (handleAuthError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Не удалось обновить порядок изображений");
    } finally {
      setSaving(false);
      imageDragSnapshot.current = null;
    }
  }

  function endImageDrag() {
    const snapshot = imageDragSnapshot.current;
    if (!imageDropCommitted.current && snapshot) {
      setArtworks((items) =>
        items.map((item) => item.id === snapshot.artworkId ? { ...item, images: snapshot.images } : item),
      );
      imageDragSnapshot.current = null;
    }
    draggedImageIdRef.current = null;
    setDraggedImageId(null);
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

    if (target.type === "series") {
      await run(
        () => api.admin.series.delete(target.series.id),
        "Серия удалена",
        "Не удалось удалить серию",
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

  const seriesSorted = useMemo(
    () => sortedSeries(series),
    [series],
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
      const seriesName =
        series.find((item) => item.id === artwork.exhibition_id)
          ?.name || "";
      const text = [
        artwork.title,
        artwork.title_en,
        artwork.materials,
        artwork.materials_en,
        categoryName,
        seriesName,
        statusLabel[artwork.status],
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [artworks, artworkSearch, categories, series]);

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

  function seriesName(id: number | null) {
    if (id === null) {
      return "Без серии";
    }

    return (
      series.find((item) => item.id === id)?.name ||
      "Без серии"
    );
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-[1280px] px-6 py-12 md:px-10">
        <AdminState
          loading
          loadingText="Загружаем админку..."
          emptyText="Данные админки пока отсутствуют."
        />
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

      <nav className="sticky top-0 z-20 mt-6 flex flex-wrap gap-2 border-b border-border bg-paper/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <TabButton
          active={activeTab === "artist"}
          onClick={() => {
            if (confirmUnsavedLeave()) {
              setActiveTab("artist");
            }
          }}
        >
          Профиль
        </TabButton>

        <TabButton
          active={activeTab === "categories"}
          onClick={() => {
            if (confirmUnsavedLeave()) {
              setActiveTab("categories");
            }
          }}
        >
          Категории
        </TabButton>

        <TabButton
          active={activeTab === "series"}
          onClick={() => {
            if (confirmUnsavedLeave()) {
              setActiveTab("series");
            }
          }}
        >
          Серии
        </TabButton>

        <TabButton
          active={activeTab === "artworks"}
          onClick={() => {
            if (confirmUnsavedLeave()) {
              setActiveTab("artworks");
            }
          }}
        >
          Работы
        </TabButton>

        <TabButton
          active={activeTab === "orders"}
          onClick={() => {
            if (confirmUnsavedLeave()) {
              setActiveTab("orders");
            }
          }}
        >
          Заявки
        </TabButton>

        <TabButton
          active={activeTab === "analytics"}
          onClick={() => {
            if (confirmUnsavedLeave()) {
              setActiveTab("analytics");
            }
          }}
        >
          Статистика
        </TabButton>

        <TabButton
          active={activeTab === "history"}
          onClick={() => {
            if (confirmUnsavedLeave()) {
              setActiveTab("history");
            }
          }}
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
          onPreviewCategories={previewCategories}
          onReorderCategories={(ids) => void reorderCategories(ids)}
          onDeleteCategory={(category) =>
            setDeleteTarget({ type: "category", category })
          }
        />
      )}

      {activeTab === "series" && (
        <AdminSeriesSection
          series={seriesSorted}
          editingSeriesId={editingSeriesId}
          seriesDraft={seriesDraft}
          saving={saving}
          onCreateSeries={createSeries}
          onSetSeriesDraft={setSeriesDraft}
          onSaveSeriesEdit={() => void saveSeriesEdit()}
          onCancelSeriesEdit={cancelEditSeries}
          onStartSeriesEdit={startEditSeries}
          onPreviewSeries={previewSeries}
          onReorderSeries={(ids) => void reorderSeries(ids)}
          onDeleteSeries={(item) =>
            setDeleteTarget({ type: "series", series: item })
          }
        />
      )}

      {activeTab === "artworks" && (
        <AdminArtworksSection
          categories={categoriesSorted}
          series={seriesSorted}
          artworkSearch={artworkSearch}
          setArtworkSearch={setArtworkSearch}
          artworksByCategory={artworksByCategory}
          editingId={editingId}
          draft={draft}
          draggedArtworkId={draggedArtworkId}
          draggedImageId={draggedImageId}
          saving={saving}
          categoryName={categoryName}
          seriesName={seriesName}
          onCreateArtwork={createArtwork}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={() => void saveEdit()}
          onDraftChange={setDraft}
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
          onDragArtworkStart={startArtworkDrag}
          onDragArtworkEnter={previewArtworkDrop}
          onDragArtworkEnd={endArtworkDrag}
          onDropArtwork={(categoryId) => void commitArtworkDrop(categoryId)}
          onImageDragStart={startImageDrag}
          onImageDragEnter={previewImageDrop}
          onImageDragEnd={endImageDrag}
          onImageDrop={(artworkId) => void commitImageDrop(artworkId)}
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
        <AdminAnalyticsSection analytics={analytics} ordersCount={orders.length} />
      )}

      {activeTab === "history" && (
        <AdminAuditHistorySection
          auditLogs={auditLogs}
          total={auditTotal}
          filters={auditFilters}
          loading={auditLoading}
          onChangeFilters={setAuditFilters}
          onApplyFilters={(filters) => {
            setAuditFilters(filters);
            void reloadAuditLogs(filters);
          }}
        />
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
