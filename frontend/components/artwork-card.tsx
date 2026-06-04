import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/types";

export function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const cover = artwork.images?.[0];
  return (
    <Link href={`/artwork/${artwork.id}`} className="group block">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-paper-dark">
        {cover ? (
          <Image src={cover.thumb_url} alt={cover.alt_text || artwork.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
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
