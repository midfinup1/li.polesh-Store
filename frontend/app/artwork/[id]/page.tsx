import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { OrderForm } from "@/components/order-form";

export const revalidate = 60;

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Pre-render the artwork pages that exist at build time (ISR keeps them fresh
// and new ones are rendered on demand). Best-effort: if the API is unavailable
// during build, pages are simply rendered on first request.
export async function generateStaticParams() {
  const artworks = await api.artworks.list().catch(() => []);
  return (Array.isArray(artworks) ? artworks : []).map((a) => ({ id: String(a.id) }));
}

export async function generateMetadata(
  { params }: { params: { id: string } },
): Promise<Metadata> {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return {};
  const artwork = await api.artworks.getById(id).catch(() => null);
  if (!artwork) return {};

  const description =
    artwork.description?.slice(0, 200) ||
    `${artwork.title} — оригинальная работа.`;
  const image = artwork.images?.[0]?.original_url;
  const canonical = `${siteURL}/artwork/${artwork.id}`;

  return {
    title: artwork.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: artwork.title,
      description,
      url: canonical,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ArtworkPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const artwork = await api.artworks.getById(id).catch(() => null);
  if (!artwork) notFound();
  const cover = artwork.images?.[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    image: artwork.images?.map((img) => img.original_url) ?? [],
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative aspect-[3/4] bg-paper-dark">
        {cover ? <Image src={cover.original_url} alt={cover.alt_text || artwork.title} fill className="object-contain" priority /> : <div className="absolute inset-0 flex items-center justify-center text-ink-light">Нет изображения</div>}
      </div>
      <section>
        <h1 className="text-5xl">{artwork.title}</h1>
        <p className="mt-5 text-xl">{artwork.price === null ? "Цена по запросу" : `${artwork.price.toLocaleString("ru-RU")} ₽`}</p>
        <dl className="mt-8 space-y-3 text-ink-light">
          {artwork.year && <div><dt className="inline text-ink">Год: </dt><dd className="inline">{artwork.year}</dd></div>}
          {artwork.materials && <div><dt className="inline text-ink">Материалы: </dt><dd className="inline">{artwork.materials}</dd></div>}
          {artwork.size && <div><dt className="inline text-ink">Размер: </dt><dd className="inline">{artwork.size}</dd></div>}
        </dl>
        {artwork.description && <p className="mt-8 whitespace-pre-line leading-relaxed">{artwork.description}</p>}
        <OrderForm artworkId={artwork.id} disabled={artwork.status !== "available"} />
      </section>
    </main>
  );
}
