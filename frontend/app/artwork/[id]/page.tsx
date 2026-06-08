import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkCard } from "@/components/artwork-card";
import { ArtworkImageCarousel } from "@/components/artwork-image-carousel";
import { ArtworkReservePanel } from "@/components/artwork-reserve-panel";
import { LocalizedText } from "@/components/localized-text";
import { LocalizedValue } from "@/components/localized-value";
import { api } from "@/lib/api";
import { absoluteUrl, getImageUrl } from "@/lib/metadata";

export const revalidate = 60;

type ArtworkPageProps = {
  params: {
    id: string;
  };
};

function formatPriceRu(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return null;
  }

  return `${price.toLocaleString("ru-RU")} ₽`;
}

function formatPriceEn(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return null;
  }

  return `${price.toLocaleString("en-US")} RUB`;
}

export async function generateMetadata({ params }: ArtworkPageProps) {
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    return {
      title: "Работа не найдена",
      description: "Работа не найдена",
    };
  }

  const artwork = await api.artworks.getById(id).catch(() => null);

  if (!artwork) {
    return {
      title: "Работа не найдена",
      description: "Работа не найдена",
    };
  }

  const cover = artwork.images?.[0];
  const imageUrl = getImageUrl(cover);
  const absoluteImageUrl = imageUrl
    ? absoluteUrl(imageUrl)
    : absoluteUrl("/og-image.png");

  const title = artwork.title || "Работа";
  const description =
    artwork.description ||
    [
      artwork.size,
      artwork.materials,
      artwork.year ? `${artwork.year} г.` : null,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Работа художницы Елизаветы Полещенко";

  return {
    title,
    description,
    openGraph: {
      type: "article",
      siteName: "lipolesh.art",
      title,
      description,
      url: absoluteUrl(`/artwork/${artwork.id}`),
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: cover?.alt_text || artwork.title || "Работа художницы",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const artwork = await api.artworks.getById(id).catch(() => null);

  if (!artwork) {
    notFound();
  }

  const relatedArtworks = artwork.category_id
    ? await api.artworks
        .list({ category_id: artwork.category_id })
        .then((items) =>
          items
            .filter((item) => item.id !== artwork.id && item.status !== "hidden")
            .slice(0, 3),
        )
        .catch(() => [])
    : [];

  const images = artwork.images || [];
  const priceRu = formatPriceRu(artwork.price);
  const priceEn = formatPriceEn(artwork.price);
  const isSold = artwork.status === "sold";
  const isUnavailable = artwork.status === "sold" || artwork.status === "hidden";

  const detailsRu = [
    artwork.materials,
    artwork.year ? `${artwork.year} г.` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const detailsEn = [
    artwork.materials_en || artwork.materials,
    artwork.year ? `${artwork.year}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto grid max-w-[1280px] gap-14 px-6 pb-20 pt-[123px] md:grid-cols-[minmax(0,505px)_minmax(0,515px)] md:px-10 lg:gap-[143px]">
        <ArtworkImageCarousel images={images} title={artwork.title} />

        <aside className="pt-0">
          <div className="flex max-w-[515px] flex-col">
            <h1 className="text-[32px] font-semibold leading-[120%] text-ink">
              <LocalizedValue
                ru={artwork.title}
                en={artwork.title_en}
                fallbackRu="Работа"
                fallbackEn="Artwork"
              />
            </h1>

            <div className="mt-6 space-y-2">
              {(artwork.size || artwork.size_en) && (
                <p className="text-[16px] font-normal leading-[150%] text-ink-light">
                  <LocalizedValue
                    ru={artwork.size}
                    en={artwork.size_en}
                    fallbackRu={artwork.size}
                    fallbackEn={artwork.size}
                  />
                </p>
              )}

              {(detailsRu || detailsEn) && (
                <p className="text-[16px] font-normal leading-[150%] text-ink-light">
                  <LocalizedValue
                    ru={detailsRu}
                    en={detailsEn}
                    fallbackRu={detailsRu}
                    fallbackEn={detailsRu}
                  />
                </p>
              )}
            </div>

            <div className="mt-10">
              {isSold ? (
                <div>
                  <p className="text-[24px] font-semibold leading-[150%] text-ink">
                    <LocalizedText ru="Продано" en="Sold" />
                  </p>

                  {(priceRu || priceEn) && (
                    <p className="mt-1 text-[16px] font-medium leading-[150%] text-ink-light line-through">
                      <LocalizedValue
                        ru={priceRu || ""}
                        en={priceEn || priceRu || ""}
                      />
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[24px] font-medium leading-[150%] text-ink">
                  {priceRu || priceEn ? (
                    <LocalizedValue
                      ru={priceRu || ""}
                      en={priceEn || priceRu || ""}
                    />
                  ) : (
                    <LocalizedText ru="Цена по запросу" en="Price on request" />
                  )}
                </p>
              )}
            </div>

            <div className="mt-8">
              <ArtworkReservePanel
                artworkId={artwork.id}
                disabled={isUnavailable}
              />
            </div>

            {isSold && (
              <p className="mt-5 text-[16px] font-medium leading-[150%] text-ink-light">
                <LocalizedText
                  ru="Эта работа уже продана."
                  en="This artwork has already been sold."
                />
              </p>
            )}

            {(artwork.description || artwork.description_en) && (
              <p className="mt-8 text-[16px] font-medium leading-[150%] text-ink-light">
                <LocalizedValue
                  ru={artwork.description}
                  en={artwork.description_en}
                  fallbackRu={artwork.description}
                  fallbackEn={artwork.description}
                />
              </p>
            )}
          </div>
        </aside>
      </section>

      {relatedArtworks.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-6 pb-32 md:px-10">
          <div className="flex items-end justify-between gap-4 border-t border-border pt-14">
            <h2 className="text-[28px] font-semibold leading-[120%] tracking-[-0.02em] text-ink md:text-[36px]">
              <LocalizedText ru="Похожие работы" en="Related artworks" />
            </h2>

            <Link
              href="/#catalog"
              className="text-[16px] font-medium leading-[150%] text-ink-light underline underline-offset-4 transition-colors hover:text-ink"
            >
              <LocalizedText ru="В каталог" en="Catalog" />
            </Link>
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {relatedArtworks.map((relatedArtwork) => (
              <ArtworkCard key={relatedArtwork.id} artwork={relatedArtwork} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
