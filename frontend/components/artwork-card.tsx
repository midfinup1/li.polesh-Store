"use client";

import Link from "next/link";
import type { Artwork, ArtworkImage } from "@/types";
import { useSiteSettings } from "@/lib/site-settings";

function ArtworkThumbnail({ image, title }: { image: ArtworkImage; title: string }) {
  const fallback = image.thumb_url || image.original_url;

  return (
    <picture>
      {image.thumb_avif_url && <source srcSet={image.thumb_avif_url} type="image/avif" />}
      {image.thumb_webp_url && <source srcSet={image.thumb_webp_url} type="image/webp" />}
      <img
        src={fallback}
        alt={image.alt_text || title}
        className="h-auto w-full rounded-[8px] object-contain transition-opacity duration-300 group-hover:opacity-90"
        loading="lazy"
      />
    </picture>
  );
}

export function ArtworkCard({ artwork, large = false }: { artwork: Artwork; large?: boolean }) {
  const { language, t } = useSiteSettings();
  const cover = artwork.images?.[0];

  return (
    <Link href={`/artwork/${artwork.id}`} className="group block">
      <div className="mb-6 overflow-hidden rounded-[8px] bg-paper-dark">
        {cover ? (
          <ArtworkThumbnail image={cover} title={artwork.title} />
        ) : (
          <div className={large ? "flex aspect-[4/5] items-center justify-center rounded-[8px] text-[16px] text-ink-light" : "flex aspect-[3/4] items-center justify-center rounded-[8px] text-[16px] text-ink-light"}>
            {t.common.noImage}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-[30px] font-medium leading-[150%] text-ink">
          {artwork.title}
        </h3>

        {artwork.size && (
          <p className="text-[20px] font-normal leading-[150%] text-ink-light">
            {artwork.size}
          </p>
        )}

        <p className="text-[24px] font-medium leading-[150%] text-ink">
          {artwork.price === null
            ? t.common.priceOnRequest
            : `${artwork.price.toLocaleString(language === "ru" ? "ru-RU" : "en-US")} ${t.common.rub}`}
        </p>
      </div>
    </Link>
  );
}
