import Image from "next/image";
import { notFound } from "next/navigation";
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
  const cover = images[0];
  const coverUrl = getImageUrl(cover);
  const price = formatPrice(artwork.price);
  const isUnavailable =
    artwork.status === "sold" || artwork.status === "hidden";

  const details = [
    artwork.materials,
    artwork.year ? `${artwork.year} г.` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto grid max-w-[1280px] gap-14 px-6 pb-28 pt-[123px] md:grid-cols-[minmax(0,505px)_minmax(0,515px)] md:px-10 lg:gap-[143px]">
        <div>
          <div className="relative overflow-hidden rounded-[8px] bg-paper-dark">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={cover?.alt_text || artwork.title}
                width={1010}
                height={1356}
                priority
                className="h-auto w-full object-contain"
              />
            ) : (
              <div className="flex aspect-[505/678] items-center justify-center rounded-[8px] text-[16px] text-ink-light">
                <LocalizedText ru="Нет изображения" en="No image" />
              </div>
            )}

            {artwork.status === "sold" && (
              <div className="absolute right-4 top-4 rounded-[8px] bg-ink px-3 py-2 text-[16px] text-paper">
                <LocalizedText ru="Продано" en="Sold" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-5 grid grid-cols-3 gap-4">
              {images.slice(1).map((image: any) => {
                const imageUrl = getImageUrl(image);

                return (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-[8px] bg-paper-dark"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={image.alt_text || artwork.title}
                        width={600}
                        height={800}
                        className="h-auto w-full object-contain"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center rounded-[8px] text-[16px] text-ink-light">
                        <LocalizedText ru="Нет изображения" en="No image" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="pt-0">
          <div className="flex max-w-[515px] flex-col gap-6">
            <h1 className="text-[32px] font-semibold leading-[120%] text-ink">
              {artwork.title}
            </h1>

            <div className="space-y-1">
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

            <p className="mt-4 text-[16px] font-medium leading-[150%] text-ink">
              {price || (
                <LocalizedText ru="Цена по запросу" en="Price on request" />
              )}
            </p>

            <ArtworkReservePanel
              artworkId={artwork.id}
              disabled={isUnavailable}
              comment={artwork.description}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}