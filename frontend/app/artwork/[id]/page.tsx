import { notFound } from "next/navigation";
import { ArtworkImageCarousel } from "@/components/artwork-image-carousel";
import { ArtworkReservePanel } from "@/components/artwork-reserve-panel";
import { LocalizedText } from "@/components/localized-text";
import { api } from "@/lib/api";

export const revalidate = 60;

type ArtworkPageProps = {
  params: {
    id: string;
  };
};

function getImageUrl(image: any) {
  return (
    image?.original_url ||
    image?.thumb_avif_url ||
    image?.thumb_webp_url ||
    image?.thumb_url ||
    ""
  );
}

function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return null;
  }

  return `${price.toLocaleString("ru-RU")} ₽`;
}

export async function generateMetadata({ params }: ArtworkPageProps) {
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    return {
      title: "Работа не найдена | lipolesh.art",
    };
  }

  const artwork = await api.artworks.getById(id).catch(() => null);

  if (!artwork) {
    return {
      title: "Работа не найдена | lipolesh.art",
    };
  }

  const cover = artwork.images?.[0];
  const imageUrl = getImageUrl(cover);

  return {
    title: `${artwork.title} | lipolesh.art`,
    description: artwork.description || "Работа художницы",
    openGraph: {
      title: artwork.title,
      description: artwork.description || "Работа художницы",
      images: imageUrl ? [imageUrl] : [],
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

  const images = artwork.images || [];
  const price = formatPrice(artwork.price);
  const isSold = artwork.status === "sold";
  const isUnavailable = artwork.status === "sold" || artwork.status === "hidden";

  const details = [
    artwork.materials,
    artwork.year ? `${artwork.year} г.` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto grid max-w-[1280px] gap-14 px-6 pb-28 pt-[123px] md:grid-cols-[minmax(0,505px)_minmax(0,515px)] md:px-10 lg:gap-[143px]">
        <ArtworkImageCarousel images={images} title={artwork.title} />

        <aside className="pt-0">
          <div className="flex max-w-[515px] flex-col">
            <h1 className="text-[32px] font-semibold leading-[120%] text-ink">
              {artwork.title}
            </h1>

            <div className="mt-6 space-y-2">
              {artwork.size && (
                <p className="text-[16px] font-normal leading-[150%] text-ink-light">
                  {artwork.size}
                </p>
              )}

              {details && (
                <p className="text-[16px] font-normal leading-[150%] text-ink-light">
                  {details}
                </p>
              )}
            </div>

            <div className="mt-10">
              {isSold ? (
                <div>
                  <p className="text-[24px] font-semibold leading-[150%] text-ink">
                    <LocalizedText ru="Продано" en="Sold" />
                  </p>

                  {price && (
                    <p className="mt-1 text-[16px] font-medium leading-[150%] text-ink-light line-through">
                      {price}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[24px] font-medium leading-[150%] text-ink">
                  {price || (
                    <LocalizedText ru="Цена по запросу" en="Price on request" />
                  )}
                </p>
              )}
            </div>

            <div className="mt-8">
              <ArtworkReservePanel
                artworkId={artwork.id}
                disabled={isUnavailable}
                comment={artwork.description}
              />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}