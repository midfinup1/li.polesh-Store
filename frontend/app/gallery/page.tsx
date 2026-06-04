import type { Metadata } from "next";
import Link from "next/link";

import { ArtworkCard } from "@/components/artwork-card";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Галерея",
};

export const revalidate = 60;

type GalleryPageProps = {
  searchParams: {
    category_id?: string;
  };
};

export default async function GalleryPage({
  searchParams,
}: GalleryPageProps) {
  const parsedCategoryID = searchParams.category_id
    ? Number(searchParams.category_id)
    : undefined;

  const categoryID =
    parsedCategoryID !== undefined && Number.isInteger(parsedCategoryID)
      ? parsedCategoryID
      : undefined;

  const [artworksResponse, categoriesResponse] = await Promise.all([
    api.artworks
      .list(categoryID !== undefined ? { category_id: categoryID } : undefined)
      .catch(() => []),
    api.categories.list().catch(() => []),
  ]);

  const artworks = Array.isArray(artworksResponse) ? artworksResponse : [];
  const categories = Array.isArray(categoriesResponse)
    ? categoriesResponse
    : [];

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-8 py-16">
      <h1 className="mb-4 text-5xl md:text-6xl">
        Галерея
      </h1>

      <p className="mb-10 max-w-2xl text-ink-light">
        Оригинальные произведения, доступные для просмотра и приобретения.
      </p>

      {categories.length > 0 && (
        <nav className="mb-12 flex flex-wrap gap-3">
          <Link
            href="/gallery"
            className={
              categoryID === undefined
                ? "border border-ink bg-ink px-4 py-2 text-paper"
                : "border border-ink/20 px-4 py-2"
            }
          >
            Все
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/gallery?category_id=${category.id}`}
              className={
                categoryID === category.id
                  ? "border border-ink bg-ink px-4 py-2 text-paper"
                  : "border border-ink/20 px-4 py-2"
              }
            >
              {category.name}
            </Link>
          ))}
        </nav>
      )}

      {artworks.length === 0 ? (
        <p className="text-ink-light">
          Работы в этой категории пока не опубликованы.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
            />
          ))}
        </div>
      )}
    </main>
  );
}