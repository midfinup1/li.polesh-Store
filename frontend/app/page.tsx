import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { api } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Портфолио",
};

export default async function HomePage() {
  const [artworksResponse, artist] = await Promise.all([
    api.artworks.list().catch(() => []),
    api.artist.get().catch(() => null),
  ]);

  const artworks = Array.isArray(artworksResponse)
    ? artworksResponse
    : [];

  const featured = artworks.slice(0, 6);

  return (
    <main>
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-8 py-24">
        <p className="mb-6 text-sm uppercase tracking-widest text-ink-light">
          Художник
        </p>

        <h1 className="mb-8 font-display text-6xl leading-none md:text-8xl">
          {artist?.name || "Имя художника"}
        </h1>

        <p className="mb-12 max-w-xl leading-relaxed text-ink-light">
          {artist?.bio?.split("\n")[0] ||
            "Краткое описание работ художника."}
        </p>

        <div className="flex gap-6">
          <Link
            href="/gallery"
            className="inline-block border border-ink px-8 py-3 transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            Галерея
          </Link>

          <Link
            href="/about"
            className="inline-block px-8 py-3 text-ink-light transition-colors duration-200 hover:text-ink"
          >
            О художнике
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-8 py-24">
          <h2 className="mb-12 font-display text-4xl">
            Работы
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((artwork) => {
              const cover = artwork.images?.[0];

              return (
                <Link
                  key={artwork.id}
                  href={`/artwork/${artwork.id}`}
                  className="group block"
                >
                  <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-paper-dark">
                    {cover ? (
                      <Image
                        src={cover.thumb_avif_url || cover.thumb_webp_url || cover.thumb_url}
                        alt={cover.alt_text || artwork.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-ink-light">
                        Нет изображения
                      </div>
                    )}

                    {artwork.status === "sold" && (
                      <div className="absolute right-3 top-3 bg-ink px-2 py-1 text-xs text-paper">
                        Продано
                      </div>
                    )}
                  </div>

                  <h3 className="font-display text-xl">
                    {artwork.title}
                  </h3>

                  {artwork.price !== null ? (
                    <p className="mt-1 text-ink-light">
                      {artwork.price.toLocaleString("ru-RU")} руб.
                    </p>
                  ) : (
                    <p className="mt-1 text-ink-light">
                      Цена по запросу
                    </p>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/gallery"
              className="inline-block border border-ink px-8 py-3 transition-colors duration-200 hover:bg-ink hover:text-paper"
            >
              Все работы
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}