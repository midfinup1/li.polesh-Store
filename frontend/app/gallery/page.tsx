import type { Metadata } from "next";
import Link from "next/link";

import { ArtworkCard } from "@/components/artwork-card";
import type { Artwork, Category } from "@/types";

export const metadata: Metadata = {
  title: "Галерея",
};

export const dynamic = "force-dynamic";

type GalleryPageProps = {
  searchParams?: {
    category_id?: string;
  };
};

function getAPIURL() {
  return process.env.API_INTERNAL_URL || "http://backend:8080/api/v1";
}

function parseCategoryID(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

async function getJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${getAPIURL()}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default async function GalleryPage({
  searchParams,
}: GalleryPageProps) {
  const categoryID = parseCategoryID(searchParams?.category_id);

  const artworksPath =
    categoryID !== undefined
      ? `/artworks?category_id=${categoryID}`
      : "/artworks";

  const [artworksResponse, categoriesResponse] = await Promise.all([
    getJSON<Artwork[]>(artworksPath).catch((error) => {
      console.error("Failed to load artworks", error);
      return [];
    }),
    getJSON<Category[]>("/categories").catch((error) => {
      console.error("Failed to load categories", error);
      return [];
    }),
  ]);

  const artworks = Array.isArray(artworksResponse) ? artworksResponse : [];
  const categories = Array.isArray(categoriesResponse)
    ? categoriesResponse
    : [];

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-8 py-16">
      <h1 className="mb-4 text-5xl md:text-6xl">Галерея</h1>

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
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </main>
  );
}