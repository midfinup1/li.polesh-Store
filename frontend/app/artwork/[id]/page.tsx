import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderForm } from "@/components/order-form";
import { api } from "@/lib/api";
import type { ArtworkImage } from "@/types";

export const dynamic = "force-dynamic";

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function assetURL(url: string | null | undefined) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return url;
}

function ArtworkImageView({
  image,
  alt,
  priority = false,
}: {
  image: ArtworkImage;
  alt: string;
  priority?: boolean;
}) {
  const src = assetURL(image.original_url || image.thumb_url);

  return (
    <img
      src={src}
      alt={image.alt_text || alt}
      className="h-full w-full object-contain"
      loading={priority ? "eager" : "lazy"}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return {};
  }

  const artwork = await api.artworks.getById(id).catch(() => null);

  if (!artwork) {
    return {};
  }

  const description =
    artwork.description?.slice(0, 200) ||
    `${artwork.title} — оригинальная работа.`;

  const image = artwork.images?.[0]?.original_url;
  const canonical = `${siteURL}/artwork/${artwork.id}`;

  return {
    title: artwork.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: artwork.title,
      description,
      url: canonical,
      type: "article",
      images: image ? [{ url: assetURL(image) }] : undefined,
    },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const artwork = await api.artworks.getById(id).catch(() => null);

  if (!artwork) {
    notFound();
  }

  const images = Array.isArray(artwork.images) ? artwork.images : [];
  const cover = images[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    image: images.map((img) => assetURL(img.original_url)),
    description: artwork.description || undefined,
    artform: artwork.materials || undefined,
    dateCreated: artwork.year ? String(artwork.year) : undefined,
    url: `${siteURL}/artwork/${artwork.id}`,
    offers: {
      "@type": "Offer",
      price: artwork.price ?? undefined,
      priceCurrency: "RUB",
      availability:
        artwork.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-12 px-8 py-16 lg:grid-cols-[1.05fr_.95fr]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative aspect-[3/4] overflow-hidden bg-paper-dark">
        {cover ? (
          <ArtworkImageView image={cover} alt={artwork.title} priority />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-light">
            Нет изображения
          </div>
        )}
      </div>

      <section>
        <h1 className="text-5xl">{artwork.title}</h1>

        <p className="mt-5 text-xl">
          {artwork.price === null
            ? "Цена по запросу"
            : `${artwork.price.toLocaleString("ru-RU")} ₽`}
        </p>

        <dl className="mt-8 space-y-3 text-ink-light">
          {artwork.year && (
            <div>
              <dt className="inline text-ink">Год: </dt>
              <dd className="inline">{artwork.year}</dd>
            </div>
          )}

          {artwork.materials && (
            <div>
              <dt className="inline text-ink">Материалы: </dt>
              <dd className="inline">{artwork.materials}</dd>
            </div>
          )}

          {artwork.size && (
            <div>
              <dt className="inline text-ink">Размер: </dt>
              <dd className="inline">{artwork.size}</dd>
            </div>
          )}
        </dl>

        {artwork.description && (
          <p className="mt-8 whitespace-pre-line leading-relaxed">
            {artwork.description}
          </p>
        )}

        {images.length > 1 && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {images.slice(1).map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden bg-paper-dark"
              >
                <ArtworkImageView image={image} alt={artwork.title} />
              </div>
            ))}
          </div>
        )}

        <OrderForm
          artworkId={artwork.id}
          disabled={artwork.status !== "available"}
        />
      </section>
    </main>
  );
}