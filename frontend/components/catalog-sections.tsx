"use client";

import { useMemo, useState } from "react";
import { ArtworkCard } from "@/components/artwork-card";
import { LocalizedText } from "@/components/localized-text";
import { SoldBadge } from "@/components/sold-badge";
import { useSiteSettings } from "@/lib/site-settings";
import { pickLocalized } from "@/lib/i18n";
import type { Artwork, Category } from "@/types";

type CatalogSectionProps = {
  artworks: Artwork[];
  categories: Category[];
};

export function CatalogSection({ artworks, categories }: CatalogSectionProps) {
  const { language } = useSiteSettings();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const filteredArtworks = useMemo(() => {
    const visible = artworks.filter((artwork) => artwork.status !== "hidden");

    if (activeCategoryId === null) {
      return visible;
    }

    return visible.filter((artwork) => artwork.category_id === activeCategoryId);
  }, [artworks, activeCategoryId]);

  const mainArtwork = filteredArtworks[0];
  const restArtworks = filteredArtworks.slice(1);

  return (
    <section
      id="catalog"
      className="mx-auto max-w-[1280px] scroll-mt-[120px] px-6 pb-32 md:px-10"
    >
      <h2 className="text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink md:text-[48px]">
        <LocalizedText ru="Каталог" en="Catalog" />
      </h2>

      <div className="mt-14 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => setActiveCategoryId(null)}
          className={[
            "inline-flex h-[44px] items-center rounded-[8px] px-5 text-[16px] font-medium leading-[150%] shadow-sm transition-opacity hover:opacity-70",
            activeCategoryId === null
              ? "bg-ink text-paper"
              : "bg-paper-dark text-ink",
          ].join(" ")}
        >
          <LocalizedText ru="все" en="all" />
        </button>

        {sortedCategories.map((category) => {
          const isActive = activeCategoryId === category.id;
          const label = pickLocalized(language, category.name, category.name_en);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={[
                "inline-flex h-[44px] items-center rounded-[8px] px-5 text-[16px] font-medium leading-[150%] shadow-sm transition-opacity hover:opacity-70",
                isActive ? "bg-ink text-paper" : "bg-paper-dark text-ink",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filteredArtworks.length > 0 ? (
        <div className="mt-16 grid gap-16 lg:grid-cols-[1.25fr_1fr]">
          {mainArtwork && (
            <div className="relative">
              {mainArtwork.status === "sold" && <SoldBadge />}

              <ArtworkCard artwork={mainArtwork} large />
            </div>
          )}

          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-1">
            {restArtworks.map((artwork) => (
              <div key={artwork.id} className="relative">
                {artwork.status === "sold" && <SoldBadge />}

                <ArtworkCard artwork={artwork} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-16 flex min-h-[320px] items-center justify-center rounded-[8px] bg-paper-dark text-[14px] text-ink-light">
          <LocalizedText
            ru="В этой категории пока нет работ"
            en="There are no artworks in this category yet"
          />
        </div>
      )}
    </section>
  );
}