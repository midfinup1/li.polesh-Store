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

function moveInArray<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
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

  // id of the artwork currently in edit mode, plus its working draft.
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
      if (handleAuthError(err)) return;
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить данные админки",
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
      if (handleAuthError(err)) return;
      setError(err instanceof Error ? err.message : "Не удалось выполнить операцию");
    }
  }

  async function logout() {
    try {
      await api.auth.logout();
    } finally {
      router.replace("/admin/login");
    }
  }

  // ── Artist ────────────────────────────────────────────────────────────────
  async function saveArtist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(() => api.admin.artist.update(artist), "Профиль художницы сохранён");
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const slug = String(data.get("slug") ?? "").trim();
    await run(
      () => api.admin.categories.create({ name, slug, sort_order: categories.length }),
      "Категория добавлена",
    );
    form.reset();
  }

  async function deleteCategory(category: Category) {
    if (!confirm(`Удалить категорию «${category.name}»? Работы останутся без категории.`)) return;
    await run(() => api.admin.categories.delete(category.id), "Категория удалена");
  }

  // ── Artworks: create ──────────────────────────────────────────────────────
  async function createArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const rawPrice = String(data.get("price") ?? "").trim();
    const rawYear = String(data.get("year") ?? "").trim();
    const rawCategoryID = String(data.get("category_id") ?? "").trim();
    await run(
      () =>
        api.admin.artworks.create({
          title: String(data.get("title") ?? "").trim(),
          description: String(data.get("description") ?? "").trim(),
          price: rawPrice === "" ? null : Number(rawPrice),
          status: "available",
          category_id: rawCategoryID === "" ? null : Number(rawCategoryID),
          year: rawYear === "" ? null : Number(rawYear),
          size: String(data.get("size") ?? "").trim(),
          materials: String(data.get("materials") ?? "").trim(),
          sort_order: 0,
        }),
      "Работа добавлена",
    );
    form.reset();
  }

  // ── Artworks: edit / delete / status ──────────────────────────────────────
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
    if (!draft) return;
    await run(() => api.admin.artworks.update(draft.id, draft), "Работа обновлена");
    cancelEdit();
  }

  async function deleteArtwork(artwork: Artwork) {
    if (!confirm(`Удалить работу «${artwork.title}»? Действие необратимо.`)) return;
    await run(() => api.admin.artworks.delete(artwork.id), "Работа удалена");
  }

  async function updateArtworkStatus(artwork: Artwork, status: ArtworkStatus) {
    await run(
      () => api.admin.artworks.update(artwork.id, { ...artwork, status }),
      "Статус работы обновлён",
    );
  }

  // ── Artworks: images ──────────────────────────────────────────────────────
  async function uploadImage(artworkID: number, file: File | undefined) {
    if (!file) return;
    await run(() => api.admin.artworks.uploadImage(artworkID, file), "Изображение загружено");
  }

  async function deleteImage(artworkID: number, image: ArtworkImage) {
    if (!confirm("Удалить это изображение?")) return;
    await run(() => api.admin.artworks.deleteImage(artworkID, image.id), "Изображение удалено");
  }

  async function reorderImage(artwork: Artwork, from: number, to: number) {
    const reordered = moveInArray(artwork.images, from, to);
    if (reordered === artwork.images) return;
    await run(
      () => api.admin.artworks.reorderImages(artwork.id, reordered.map((image) => image.id)),
      "Порядок изображений обновлён",
    );
  }

  // ── Orders ──────────────────────────────────────────────────────────────────
  async function updateOrderStatus(orderID: number, status: Order["status"]) {
    await run(() => api.admin.orders.updateStatus(orderID, status), "Статус заявки обновлён");
  }

  const categoryName = (id: number | null) =>
    id == null ? "" : categories.find((c) => c.id === id)?.name ?? "";

  if (loading) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-7xl px-8 py-12">
        <p className="text-ink-light">Загрузка данных...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-5xl">Админка</h1>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-ink-light transition-colors hover:text-ink"
        >
          Выйти
        </button>
      </div>

      {error && <p className="my-6 border border-accent p-4 text-accent">{error}</p>}
      {notice && <p className="my-6 border border-ink/20 p-4">{notice}</p>}

      {/* Artist profile */}
      <section className="mt-12">
        <h2 className="text-3xl">Профиль художницы</h2>
        <form onSubmit={saveArtist} className="mt-6 grid gap-4 md:grid-cols-2">
          <input required value={artist.name} onChange={(e) => setArtist({ ...artist, name: e.target.value })} placeholder="Имя" className="border border-ink/20 bg-transparent px-4 py-3" />
          <input type="email" value={artist.email} onChange={(e) => setArtist({ ...artist, email: e.target.value })} placeholder="Email" className="border border-ink/20 bg-transparent px-4 py-3" />
          <input value={artist.instagram} onChange={(e) => setArtist({ ...artist, instagram: e.target.value })} placeholder="Instagram" className="border border-ink/20 bg-transparent px-4 py-3" />
          <input value={artist.photo_url} onChange={(e) => setArtist({ ...artist, photo_url: e.target.value })} placeholder="URL фотографии" className="border border-ink/20 bg-transparent px-4 py-3" />
          <textarea value={artist.bio} onChange={(e) => setArtist({ ...artist, bio: e.target.value })} placeholder="Биография" rows={5} className="border border-ink/20 bg-transparent px-4 py-3 md:col-span-2" />
          <button className="bg-ink px-7 py-3 text-paper md:col-span-2">Сохранить профиль</button>
        </form>
      </section>

      {/* Categories */}
      <section className="mt-16">
        <h2 className="text-3xl">Категории</h2>
        <form onSubmit={createCategory} className="mt-6 flex flex-col gap-4 md:flex-row">
          <input required name="name" placeholder="Название" className="grow border border-ink/20 bg-transparent px-4 py-3" />
          <input required name="slug" placeholder="slug" pattern="[a-z0-9-]+" title="Только латинские буквы нижнего регистра, цифры и дефис" className="grow border border-ink/20 bg-transparent px-4 py-3" />
          <button className="bg-ink px-7 py-3 text-paper">Добавить</button>
        </form>
        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-ink-light">Категорий пока нет.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-2 border border-ink/20 px-3 py-1 text-sm">
                <span>{category.name}</span>
                <button type="button" onClick={() => void deleteCategory(category)} className="text-ink-light hover:text-accent" aria-label={`Удалить ${category.name}`}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add artwork */}
      <section className="mt-16">
        <h2 className="text-3xl">Добавить работу</h2>
        <form onSubmit={createArtwork} className="mt-6 grid gap-4 md:grid-cols-2">
          <input required name="title" placeholder="Название" className="border border-ink/20 bg-transparent px-4 py-3" />
          <input name="price" type="number" min="0" placeholder="Цена, руб." className="border border-ink/20 bg-transparent px-4 py-3" />
          <select name="category_id" className="border border-ink/20 bg-paper px-4 py-3">
            <option value="">Без категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input name="year" type="number" min="1000" max="9999" placeholder="Год" className="border border-ink/20 bg-transparent px-4 py-3" />
          <input name="size" placeholder="Размер" className="border border-ink/20 bg-transparent px-4 py-3" />
          <input name="materials" placeholder="Материалы" className="border border-ink/20 bg-transparent px-4 py-3" />
          <textarea name="description" placeholder="Описание" rows={4} className="border border-ink/20 bg-transparent px-4 py-3 md:col-span-2" />
          <button className="bg-ink px-7 py-3 text-paper md:col-span-2">Сохранить работу</button>
        </form>
      </section>

      {/* Artworks list */}
      <section className="mt-16">
        <h2 className="text-3xl">Работы</h2>
        {artworks.length === 0 ? (
          <p className="mt-6 text-ink-light">Работ пока нет.</p>
        ) : (
          <div className="mt-6 space-y-6">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="border border-ink/10 p-5">
                {editingId === artwork.id && draft ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Название" className="border border-ink/20 bg-transparent px-3 py-2" />
                    <input type="number" min="0" value={draft.price ?? ""} onChange={(e) => setDraft({ ...draft, price: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Цена" className="border border-ink/20 bg-transparent px-3 py-2" />
                    <select value={draft.category_id ?? ""} onChange={(e) => setDraft({ ...draft, category_id: e.target.value === "" ? null : Number(e.target.value) })} className="border border-ink/20 bg-paper px-3 py-2">
                      <option value="">Без категории</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <input type="number" min="1000" max="9999" value={draft.year ?? ""} onChange={(e) => setDraft({ ...draft, year: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Год" className="border border-ink/20 bg-transparent px-3 py-2" />
                    <input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} placeholder="Размер" className="border border-ink/20 bg-transparent px-3 py-2" />
                    <input value={draft.materials} onChange={(e) => setDraft({ ...draft, materials: e.target.value })} placeholder="Материалы" className="border border-ink/20 bg-transparent px-3 py-2" />
                    <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ArtworkStatus })} className="border border-ink/20 bg-paper px-3 py-2">
                      {(Object.keys(statusLabel) as ArtworkStatus[]).map((s) => (
                        <option key={s} value={s}>{statusLabel[s]}</option>
                      ))}
                    </select>
                    <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Описание" rows={3} className="border border-ink/20 bg-transparent px-3 py-2 md:col-span-2" />
                    <div className="flex gap-3 md:col-span-2">
                      <button type="button" onClick={() => void saveEdit()} className="bg-ink px-5 py-2 text-paper">Сохранить</button>
                      <button type="button" onClick={cancelEdit} className="border border-ink/20 px-5 py-2">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="text-xl">{artwork.title}</p>
                      <p className="text-sm text-ink-light">
                        {statusLabel[artwork.status]}
                        {artwork.price != null && ` · ${artwork.price.toLocaleString("ru-RU")} ₽`}
                        {categoryName(artwork.category_id) && ` · ${categoryName(artwork.category_id)}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select value={artwork.status} onChange={(e) => void updateArtworkStatus(artwork, e.target.value as ArtworkStatus)} className="border border-ink/20 bg-paper px-3 py-2">
                        {(Object.keys(statusLabel) as ArtworkStatus[]).map((s) => (
                          <option key={s} value={s}>{statusLabel[s]}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => startEdit(artwork)} className="border border-ink/20 px-4 py-2 text-sm">Редактировать</button>
                      <button type="button" onClick={() => void deleteArtwork(artwork)} className="border border-accent px-4 py-2 text-sm text-accent">Удалить</button>
                    </div>
                  </div>
                )}

                {/* Images */}
                <div className="mt-4 border-t border-ink/10 pt-4">
                  <div className="flex flex-wrap gap-4">
                    {artwork.images.map((image, index) => (
                      <div key={image.id} className="w-28">
                        <div className="relative aspect-square overflow-hidden bg-paper-dark">
                          <img src={image.thumb_webp_url || image.thumb_url} alt={image.alt_text || artwork.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-ink-light">
                          <button type="button" disabled={index === 0} onClick={() => void reorderImage(artwork, index, index - 1)} className="disabled:opacity-30" aria-label="Сдвинуть влево">←</button>
                          <button type="button" onClick={() => void deleteImage(artwork.id, image)} className="hover:text-accent" aria-label="Удалить изображение">×</button>
                          <button type="button" disabled={index === artwork.images.length - 1} onClick={() => void reorderImage(artwork, index, index + 1)} className="disabled:opacity-30" aria-label="Сдвинуть вправо">→</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label className="mt-3 inline-block text-sm text-ink-light">
                    Добавить изображение:{" "}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void uploadImage(artwork.id, e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders */}
      <section className="mt-16">
        <h2 className="text-3xl">Заявки</h2>

        {orders.length === 0 ? (
          <p className="mt-6 text-ink-light">Заявок пока нет.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-ink/10 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <p className="text-lg font-medium">Заявка #{order.id}</p>

                    <dl className="mt-4 space-y-2 text-sm">
                      <div>
                        <dt className="inline text-ink-light">Покупатель: </dt>
                        <dd className="inline">{order.name}</dd>
                      </div>

                      <div>
                        <dt className="inline text-ink-light">Email: </dt>
                        <dd className="inline">
                          <a
                            href={`mailto:${order.email}`}
                            className="hover:text-accent"
                          >
                            {order.email}
                          </a>
                        </dd>
                      </div>

                      {order.phone && (
                        <div>
                          <dt className="inline text-ink-light">Телефон: </dt>
                          <dd className="inline">{order.phone}</dd>
                        </div>
                      )}

                      {order.message && (
                        <div>
                          <dt className="inline text-ink-light">Сообщение: </dt>
                          <dd className="inline">{order.message}</dd>
                        </div>
                      )}

                      <div>
                        <dt className="inline text-ink-light">Работа: </dt>
                        <dd className="inline">
                          <a
                            href={`/artwork/${order.artwork_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-accent"
                          >
                            {order.artwork?.title
                              ? `${order.artwork.title} #${order.artwork_id}`
                              : `ID ${order.artwork_id}`}
                          </a>
                        </dd>
                      </div>

                      {order.created_at && (
                        <div>
                          <dt className="inline text-ink-light">Создана: </dt>
                          <dd className="inline">
                            {new Date(order.created_at).toLocaleString("ru-RU")}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <select
                    value={order.status}
                    onChange={(event) =>
                      void updateOrderStatus(
                        order.id,
                        event.target.value as Order["status"],
                      )
                    }
                    className="border border-ink/20 bg-paper px-3 py-2"
                  >
                    <option value="new">Новая</option>
                    <option value="contacted">Связались</option>
                    <option value="completed">Завершена</option>
                    <option value="cancelled">Отменена</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
