"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { LocalizedText } from "@/components/localized-text";

type ArtworkImageCarouselImage = {
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

function getImageUrl(image: ArtworkImageCarouselImage) {
  return (
    image.original_url ||
    image.thumb_avif_url ||
    image.thumb_webp_url ||
    image.thumb_url ||
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

  const activeImage = preparedImages[activeIndex];
  const activeUrl = activeImage ? getImageUrl(activeImage) : "";
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

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-[8px] bg-paper-dark">
        {activeUrl ? (
          <Image
            src={activeUrl}
            alt={activeImage?.alt_text || title}
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

        {hasManyImages && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,0.18)] backdrop-blur">
            {preparedImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={[
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  index === activeIndex ? "bg-black" : "bg-black/30",
                ].join(" ")}
                aria-label={`Открыть изображение ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {hasManyImages && (
        <>
          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-x-[100%] -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_18px_rgba(0,0,0,0.18)] transition-transform hover:scale-105"
            aria-label="Предыдущее изображение"
          >
            <span className="flex h-full w-full items-center justify-center pb-[3px] pr-[2px] text-[34px] font-medium leading-none">
              ‹
            </span>
          </button>

          <button
            type="button"
            onClick={showNext}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 translate-x-[100%] -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_18px_rgba(0,0,0,0.18)] transition-transform hover:scale-105"
            aria-label="Следующее изображение"
          >
            <span className="flex h-full w-full items-center justify-center pb-[3px] pl-[2px] text-[34px] font-medium leading-none">
              ›
            </span>
          </button>
        </>
      )}
    </div>
  );
}