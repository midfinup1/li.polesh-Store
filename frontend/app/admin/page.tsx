"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type {
  Artist,
  Artwork,
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

export default function AdminPage() {
  const router = useRouter();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artist, setArtist] = useState<Artist>(blankArtist);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

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
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить данные админки",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function createArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const materials = String(data.get("materials") ?? "").trim();
    const size = String(data.get("size") ?? "").trim();

    const rawPrice = String(data.get("price") ?? "").trim();
    const rawYear = String(data.get("year") ?? "").trim();
    const rawCategoryID = String(data.get("category_id") ?? "").trim();

    await run(
      () =>
        api.admin.artworks.create({
          title,
          description,
          price: rawPrice === "" ? null : Number(rawPrice),
          status: "available",
          category_id: rawCategoryID === "" ? null : Number(rawCategoryID),
          year: rawYear === "" ? null : Number(rawYear),
          size,
          materials,
          sort_order: 0,
        }),
      "Работа добавлена",
    );

    form.reset();
  }

  async function uploadImage(artworkID: number, file: File | undefined) {
    if (!file) {
      return;
    }

    await run(
      () => api.admin.artworks.uploadImage(artworkID, file),
      "Изображение загружено",
    );
  }

  async function updateArtworkStatus(
    artwork: Artwork,
    status: ArtworkStatus,
  ) {
    await run(
      () => api.admin.artworks.update(artwork.id, { ...artwork, status }),
      "Статус работы обновлён",
    );
  }

  async function updateOrderStatus(
    orderID: number,
    status: Order["status"],
  ) {
    await run(
      () => api.admin.orders.updateStatus(orderID, status),
      "Статус заявки обновлён",
    );
  }

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

      {error && (
        <p className="my-6 border border-accent p-4 text-accent">
          {error}
        </p>
      )}

      {notice && (
        <p className="my-6 border border-ink/20 p-4">
          {notice}
        </p>
      )}

      <section className="mt-12">
        <h2 className="text-3xl">Профиль художницы</h2>

        <form
          onSubmit={saveArtist}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <input
            required
            value={artist.name}
            onChange={(event) =>
              setArtist({ ...artist, name: event.target.value })
            }
            placeholder="Имя"
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <input
            type="email"
            value={artist.email}
            onChange={(event) =>
              setArtist({ ...artist, email: event.target.value })
            }
            placeholder="Email"
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <input
            value={artist.instagram}
            onChange={(event) =>
              setArtist({ ...artist, instagram: event.target.value })
            }
            placeholder="Instagram"
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <input
            value={artist.photo_url}
            onChange={(event) =>
              setArtist({ ...artist, photo_url: event.target.value })
            }
            placeholder="URL фотографии"
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <textarea
            value={artist.bio}
            onChange={(event) =>
              setArtist({ ...artist, bio: event.target.value })
            }
            placeholder="Биография"
            rows={5}
            className="border border-ink/20 bg-transparent px-4 py-3 md:col-span-2"
          />

          <button className="bg-ink px-7 py-3 text-paper md:col-span-2">
            Сохранить профиль
          </button>
        </form>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl">Категории</h2>

        <form
          onSubmit={createCategory}
          className="mt-6 flex flex-col gap-4 md:flex-row"
        >
          <input
            required
            name="name"
            placeholder="Название"
            className="grow border border-ink/20 bg-transparent px-4 py-3"
          />

          <input
            required
            name="slug"
            placeholder="slug"
            pattern="[a-z0-9-]+"
            title="Разрешены только латинские буквы нижнего регистра, цифры и дефис"
            className="grow border border-ink/20 bg-transparent px-4 py-3"
          />

          <button className="bg-ink px-7 py-3 text-paper">
            Добавить
          </button>
        </form>

        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-ink-light">
            Категорий пока нет.
          </p>
        ) : (
          <p className="mt-4 text-sm text-ink-light">
            {categories.map((category) => category.name).join(" · ")}
          </p>
        )}
      </section>

      <section className="mt-16">
        <h2 className="text-3xl">Добавить работу</h2>

        <form
          onSubmit={createArtwork}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <input
            required
            name="title"
            placeholder="Название"
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <input
            name="price"
            type="number"
            min="0"
            placeholder="Цена, руб."
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <select
            name="category_id"
            className="border border-ink/20 bg-paper px-4 py-3"
          >
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
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <input
            name="size"
            placeholder="Размер"
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <input
            name="materials"
            placeholder="Материалы"
            className="border border-ink/20 bg-transparent px-4 py-3"
          />

          <textarea
            name="description"
            placeholder="Описание"
            rows={4}
            className="border border-ink/20 bg-transparent px-4 py-3 md:col-span-2"
          />

          <button className="bg-ink px-7 py-3 text-paper md:col-span-2">
            Сохранить работу
          </button>
        </form>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl">Работы</h2>

        {artworks.length === 0 ? (
          <p className="mt-6 text-ink-light">
            Работ пока нет.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                className="flex flex-col justify-between gap-4 border border-ink/10 p-5 md:flex-row md:items-center"
              >
                <div>
                  <p className="text-xl">{artwork.title}</p>

                  <p className="text-sm text-ink-light">
                    {artwork.status === "available" && "В наличии"}
                    {artwork.status === "sold" && "Продано"}
                    {artwork.status === "hidden" && "Скрыто"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      void uploadImage(
                        artwork.id,
                        event.target.files?.[0],
                      )
                    }
                  />

                  <select
                    value={artwork.status}
                    onChange={(event) =>
                      void updateArtworkStatus(
                        artwork,
                        event.target.value as ArtworkStatus,
                      )
                    }
                    className="border border-ink/20 bg-paper px-3 py-2"
                  >
                    <option value="available">В наличии</option>
                    <option value="sold">Продано</option>
                    <option value="hidden">Скрыто</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16">
        <h2 className="text-3xl">Заявки</h2>

        {orders.length === 0 ? (
          <p className="mt-6 text-ink-light">
            Заявок пока нет.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-ink/10 p-5"
              >
                <p className="font-medium">
                  {order.name} — {order.email}
                </p>

                {order.phone && (
                  <p className="mt-2 text-sm text-ink-light">
                    {order.phone}
                  </p>
                )}

                {order.message && (
                  <p className="mt-2 text-sm text-ink-light">
                    {order.message}
                  </p>
                )}

                <select
                  value={order.status}
                  onChange={(event) =>
                    void updateOrderStatus(
                      order.id,
                      event.target.value as Order["status"],
                    )
                  }
                  className="mt-4 border border-ink/20 bg-paper px-3 py-2"
                >
                  <option value="new">Новая</option>
                  <option value="contacted">Связались</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}