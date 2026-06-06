import Link from "next/link";
import type { Artwork, ArtworkImage } from "@/types";

function ArtworkThumbnail({ image, title }: { image: ArtworkImage; title: string }) {
  return (
    <picture>
      {image.thumb_avif_url && <source srcSet={image.thumb_avif_url} type="image/avif" />}
      {image.thumb_webp_url && <source srcSet={image.thumb_webp_url} type="image/webp" />}
      <img
        src={image.thumb_url}
        alt={image.alt_text || title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    </picture>
  );
}

export function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const cover = artwork.images?.[0];
  return (
    <Link href={`/artwork/${artwork.id}`} className="group block">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-paper-dark">
        {cover ? (
          <ArtworkThumbnail image={cover} title={artwork.title} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-light">Нет изображения</div>
        )}
        {artwork.status === "sold" && <span className="absolute right-3 top-3 bg-ink px-3 py-1 text-xs text-paper">Продано</span>}
      </div>
      <h3 className="text-2xl">{artwork.title}</h3>
      <p className="mt-1 text-ink-light">{artwork.price === null ? "Цена по запросу" : `${artwork.price.toLocaleString("ru-RU")} ₽`}</p>
    </Link>
  );
}
