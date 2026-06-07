import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  const [artist, artworks] = await Promise.all([
    api.artist.get().catch(() => null),
    api.artworks.list().catch(() => []),
  ]);

  const visibleArtworks = Array.isArray(artworks) ? artworks.slice(0, 4) : [];
  const mainArtwork = visibleArtworks[0];
  const sideArtworks = visibleArtworks.slice(1, 3);
  const wideArtwork = visibleArtworks[3];

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:px-10">
        <section className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative aspect-[4/5] max-w-[360px] bg-paper-dark">
            {artist?.photo_url ? (
              <Image
                src={artist.photo_url}
                alt={artist.name || "Художница"}
                fill
                priority
                className="object-cover grayscale"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-light">
                Фото художницы
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">
              {artist?.name || "Елизавета Полещенко"}
            </h1>
          </div>
        </section>

        <section className="mt-16 max-w-5xl">
          <h2 className="mb-6 font-display text-4xl font-semibold md:text-5xl">
            Artist statement
          </h2>

          <p className="max-w-5xl text-sm leading-7 text-ink-light md:text-base">
            {artist?.bio ||
              "В своей художественной практике я обращаюсь к познанию личного и эмоционального, через анализ мимолетных образов, формируемых внутренним опытом и памятью. Через анималистичные образы раскрываются темы внутреннего напряжения, принятия и уязвимости."}
          </p>

          <Link
            href="/gallery"
            className="mt-8 inline-block bg-ink px-5 py-3 text-sm text-paper transition-opacity hover:opacity-80"
          >
            Смотреть каталог
          </Link>
        </section>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28 md:px-10">
        <h2 className="mb-8 font-display text-3xl font-semibold md:text-4xl">
          Каталог
        </h2>

        <div className="mb-10 flex flex-wrap gap-3">
          <Link
            href="/gallery"
            className="bg-ink px-4 py-2 text-xs text-paper"
          >
            картины
          </Link>

          <Link
            href="/gallery"
            className="bg-paper-dark px-4 py-2 text-xs text-ink"
          >
            постеры
          </Link>

          <Link
            href="/gallery"
            className="bg-paper-dark px-4 py-2 text-xs text-ink"
          >
            керамика
          </Link>
        </div>

        {visibleArtworks.length > 0 ? (
          <div className="grid gap-8">
            <div className="grid gap-8 lg:grid-cols-[1.65fr_1fr]">
              {mainArtwork && <CatalogCard artwork={mainArtwork} large />}

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
                {sideArtworks.map((artwork) => (
                  <CatalogCard key={artwork.id} artwork={artwork} />
                ))}
              </div>
            </div>

            {wideArtwork && <CatalogCard artwork={wideArtwork} wide />}
          </div>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center bg-paper-dark text-ink-light">
            Работы пока не добавлены
          </div>
        )}
      </section>
    </main>
  );
}

function CatalogCard({
  artwork,
  large = false,
  wide = false,
}: {
  artwork: any;
  large?: boolean;
  wide?: boolean;
}) {
  const cover = artwork.images?.[0];

  const imageUrl =
    cover?.thumb_avif_url ||
    cover?.thumb_webp_url ||
    cover?.thumb_url ||
    cover?.original_url;

  return (
    <Link href={`/artwork/${artwork.id}`} className="group block">
      <div
        className={[
          "relative mb-4 overflow-hidden bg-paper-dark",
          large ? "aspect-[4/5]" : "",
          wide ? "aspect-[16/9]" : "",
          !large && !wide ? "aspect-[3/4]" : "",
        ].join(" ")}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={cover?.alt_text || artwork.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-light">
            Нет изображения
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold">
            {artwork.title}
          </h3>

          {artwork.size && (
            <p className="mt-1 text-xs text-ink-light">{artwork.size}</p>
          )}
        </div>

        <p className="shrink-0 text-sm">
          {artwork.price !== null
            ? `${artwork.price.toLocaleString("ru-RU")} ₽`
            : "Цена по запросу"}
        </p>
      </div>
    </Link>
  );
}