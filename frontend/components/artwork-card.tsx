"use client";

import Link from "next/link";
import type { Artwork, ArtworkImage } from "@/types";
import { useSiteSettings } from "@/lib/site-settings";
import { pickLocalized } from "@/lib/i18n";

function ArtworkThumbnail({
  image,
  title,
}: {
  image: ArtworkImage;
  title: string;
}) {
  const imageUrl =
    image.original_url ||
    image.thumb_url ||
    image.thumb_webp_url ||
    image.thumb_avif_url ||
    "";

  return (
    <img
      src={imageUrl}
      alt={image.alt_text || title}
      className="h-auto w-full rounded-[8px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
      loading="lazy"
    />
  );
}

export function ArtworkCard({
  artwork,
  large = false,
}: {
  artwork: Artwork;
  large?: boolean;
}) {
  const { language, t } = useSiteSettings();
  const cover = artwork.images?.[0];
  const title = pickLocalized(language, artwork.title, artwork.title_en);
  const size = pickLocalized(language, artwork.size, artwork.size_en);

  return (
    <Link href={`/artwork/${artwork.id}`} scroll={false} className="group block">
      <div className="mb-6 overflow-hidden rounded-[8px] bg-paper-dark">
        {cover ? (
          <ArtworkThumbnail image={cover} title={title} />
        ) : (
          <div
            className={
              large
                ? "flex aspect-[4/5] items-center justify-center rounded-[8px] text-[16px] text-ink-light"
                : "flex aspect-[3/4] items-center justify-center rounded-[8px] text-[16px] text-ink-light"
            }
          >
            {t.common.noImage}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-[18px] font-medium leading-[150%] text-ink">
          {title}
        </h3>

        {size && (
          <p className="text-[14px] font-normal leading-[150%] text-ink-light">
            {size}
          </p>
        )}

        <p
          className={[
            "text-[16px] font-medium leading-[150%] text-ink",
            artwork.status === "sold" ? "line-through text-ink-light" : "",
          ].join(" ")}
        >
          {artwork.price === null
            ? t.common.priceOnRequest
            : `${artwork.price.toLocaleString(
                language === "ru" ? "ru-RU" : "en-US",
              )} ${t.common.rub}`}
        </p>
      </div>
    </Link>
  );
}