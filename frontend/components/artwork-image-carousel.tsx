"use client";

import { useMemo, useState } from "react";
import { LocalizedText } from "@/components/localized-text";

type ArtworkImageCarouselImage = {
  display_url?: string;
  display_webp_url?: string;
  id: number;
  alt_text?: string;
  original_url?: string;
  thumb_avif_url?: string;
  thumb_webp_url?: string;
  thumb_url?: string;
};

type ArtworkImageCarouselProps = {
  images: ArtworkImageCarouselImage[];
  title: string;
};

// Display variant (~1600px, ~200-400KB) first; the multi-megabyte original is
// only a last-resort fallback for images uploaded before display variants
// existed (until backfill-images is run).
function getImageUrl(image: ArtworkImageCarouselImage) {
  return (
    image.display_url ||
    image.original_url ||
    image.thumb_url ||
    image.thumb_webp_url ||
    image.thumb_avif_url ||
    ""
  );
}

export function ArtworkImageCarousel({
  images,
  title,
}: ArtworkImageCarouselProps) {
  const preparedImages = useMemo(
    () => images.filter((image) => getImageUrl(image)),
    [images],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const safeActiveIndex =
    preparedImages.length > 0
      ? Math.min(activeIndex, preparedImages.length - 1)
      : 0;

  const hasManyImages = preparedImages.length > 1;

  function showPrevious() {
    if (!hasManyImages) {
      return;
    }

    setActiveIndex((current) =>
      current === 0 ? preparedImages.length - 1 : current - 1,
    );
  }

  function showNext() {
    if (!hasManyImages) {
      return;
    }

    setActiveIndex((current) =>
      current === preparedImages.length - 1 ? 0 : current + 1,
    );
  }

  function showImage(index: number) {
    setActiveIndex(index);
  }

  return (
    <div className="relative w-full">
      <div className="relative mx-auto w-full max-w-[620px]">
        <div className="overflow-hidden rounded-[8px] bg-transparent">
          {preparedImages.length > 0 ? (
            <div
              className="flex transition-transform duration-[650ms] ease-in-out"
              style={{
                width: `${preparedImages.length * 100}%`,
                transform: `translateX(-${
                  safeActiveIndex * (100 / preparedImages.length)
                }%)`,
              }}
            >
              {preparedImages.map((image) => {
                const imageUrl = getImageUrl(image);

                return (
                  <div
                    key={image.id}
                    className="flex min-h-[320px] shrink-0 items-center justify-center md:min-h-[520px]"
                    style={{ width: `${100 / preparedImages.length}%` }}
                  >
                    <img
                      src={imageUrl}
                      alt={image.alt_text || title}
                      className="h-auto max-h-[72vh] w-auto max-w-full rounded-[8px] object-contain"
                      decoding="async"
                      loading={
                        image.id === preparedImages[0]?.id ? "eager" : "lazy"
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex aspect-[505/678] items-center justify-center rounded-[8px] text-[16px] text-ink-light">
              <LocalizedText ru="Нет изображения" en="No image" />
            </div>
          )}
        </div>

        {hasManyImages && (
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,0.18)] backdrop-blur">
            {preparedImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => showImage(index)}
                className={[
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  index === safeActiveIndex
                    ? "scale-110 bg-black"
                    : "bg-black/30 hover:bg-black/50",
                ].join(" ")}
                aria-label={`Открыть изображение ${index + 1}`}
              />
            ))}
          </div>
        )}

        {hasManyImages && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_18px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:scale-105"
              aria-label="Предыдущее изображение"
            >
              <span className="flex h-full w-full items-center justify-center pb-[3px] pr-[2px] text-[34px] font-medium leading-none">
                ‹
              </span>
            </button>

            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_18px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:scale-105"
              aria-label="Следующее изображение"
            >
              <span className="flex h-full w-full items-center justify-center pb-[3px] pl-[2px] text-[34px] font-medium leading-none">
                ›
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}