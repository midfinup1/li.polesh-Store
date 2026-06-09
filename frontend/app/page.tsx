"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArtworkCard } from "@/components/artwork-card";
import { LocalizedText } from "@/components/localized-text";
import { LocalizedValue } from "@/components/localized-value";
import { SoldBadge } from "@/components/sold-badge";
import { useSiteSettings } from "@/lib/site-settings";
import { pickLocalized } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Artist, Artwork, Category } from "@/types";

export default function HomePage() {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { language } = useSiteSettings();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [artistResponse, artworksResponse, categoriesResponse] =
          await Promise.all([
            api.artist.get().catch(() => null),
            api.artworks.list().catch(() => []),
            api.categories.list().catch(() => []),
          ]);

        if (!mounted) {
          return;
        }

        setArtist(artistResponse);
        setArtworks(Array.isArray(artworksResponse) ? artworksResponse : []);
        setCategories(
          Array.isArray(categoriesResponse) ? categoriesResponse : [],
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id,
      ),
    [categories],
  );

  const selectedCategoryId = useMemo(() => {
    if (visibleCategories.length === 0) {
      return null;
    }

    if (
      activeCategoryId !== null &&
      visibleCategories.some((category) => category.id === activeCategoryId)
    ) {
      return activeCategoryId;
    }

    return visibleCategories[0].id;
  }, [activeCategoryId, visibleCategories]);

  const visibleArtworks = useMemo(() => {
    if (selectedCategoryId === null) {
      return [];
    }

    return artworks
      .filter((artwork) => artwork.status !== "hidden")
      .filter((artwork) => artwork.category_id === selectedCategoryId)
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }, [artworks, selectedCategoryId]);

  const firstColumnArtworks = visibleArtworks.filter(
    (_, index) => index % 3 === 0,
  );
  const secondColumnArtworks = visibleArtworks.filter(
    (_, index) => index % 3 === 1,
  );
  const thirdColumnArtworks = visibleArtworks.filter(
    (_, index) => index % 3 === 2,
  );

  const homePhotoUrl = artist?.home_photo_url || artist?.photo_url || "";

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto max-w-[1280px] px-6 pb-24 pt-12 md:px-10 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-[360px_1fr] lg:grid-cols-[420px_1fr] lg:gap-14">
          <div className="overflow-hidden rounded-[8px] bg-paper-dark">
            {loading ? (
              <div className="h-[320px] w-full animate-pulse rounded-[8px] bg-paper-dark md:h-[380px] lg:h-[410px]" />
            ) : homePhotoUrl ? (
              <Image
                src={homePhotoUrl}
                alt={artist?.name || "Artist"}
                width={840}
                height={1050}
                priority
                className="h-[320px] w-full object-cover grayscale md:h-[380px] lg:h-[410px]"
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-[8px] text-[14px] text-ink-light md:h-[380px] lg:h-[410px]">
                <LocalizedText ru="Фото художницы" en="Artist photo" />
              </div>
            )}
          </div>

          <div className="self-start pt-[90px] md:pt-[110px] lg:pt-[80px]">
            {loading ? (
              <div className="h-[56px] max-w-[520px] animate-pulse rounded-[8px] bg-paper-dark md:h-[64px]" />
            ) : (
              <h1 className="max-w-[713px] text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px] md:leading-[1.1]">
                <LocalizedValue
                  ru={artist?.name}
                  en={artist?.name_en}
                  fallbackRu="Елизавета Полещенко"
                  fallbackEn="Elizaveta Poleshchenko"
                />
              </h1>
            )}
          </div>
        </div>

        <section className="mt-10 max-w-[1264px] md:mt-12">
          <h2 className="text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-ink md:text-[44px] md:leading-[1.1]">
            Artist statement
          </h2>

          {loading ? (
            <div className="mt-5 space-y-3">
              <div className="h-5 w-full animate-pulse rounded-[8px] bg-paper-dark" />
              <div className="h-5 w-[96%] animate-pulse rounded-[8px] bg-paper-dark" />
              <div className="h-5 w-[92%] animate-pulse rounded-[8px] bg-paper-dark" />
              <div className="h-5 w-[86%] animate-pulse rounded-[8px] bg-paper-dark" />
              <div className="h-5 w-[68%] animate-pulse rounded-[8px] bg-paper-dark" />
            </div>
          ) : (
            <p className="mt-5 max-w-[1261px] text-[16px] font-normal leading-[150%] text-black/75 dark:text-ink-light">
              <LocalizedValue
                ru={artist?.bio}
                en={artist?.bio_en}
                fallbackRu="В своей художественной практике я обращаюсь к познанию личного и эмоционального, через анализ мимолетных образов, формируя из интуитивного целостные образы и сюжеты. Через анималистичные образы рассуждаю о внутреннем, о привязанностях, о поиске объяснения своих действий и чувств. Человек в моих работах чаще находится в роли наблюдателя и больше выражает процесс обдумывания нежели процесс прямых и активных действий. В начале своей работы над картиной мне важны первые интуитивные зарисовки и мазки, из которых потом формируется целостный образ."
                fallbackEn="In my artistic practice, I turn to the exploration of the personal and emotional through the analysis of fleeting images, shaping intuitive impressions into complete images and narratives. Through animalistic imagery, I reflect on the inner world, on attachments, and on the search for explanations for one’s actions and feelings. In my works, the human figure more often appears as an observer, expressing a process of contemplation rather than direct and active action. At the beginning of my work on a painting, the first intuitive sketches and brushstrokes are important to me, as they later form a complete image."
              />
            </p>
          )}

          <Link
            href="#catalog"
            className="mt-6 inline-flex h-[48px] items-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80"
          >
            <LocalizedText ru="Смотреть каталог" en="View catalog" />
          </Link>
        </section>
      </section>

      <section
        id="catalog"
        className="mx-auto max-w-[1280px] scroll-mt-[120px] px-6 pb-32 pt-20 md:px-10"
      >
        <h2 className="text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink md:text-[48px]">
          <LocalizedText ru="Каталог" en="Catalog" />
        </h2>

        {visibleCategories.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-4">
            {visibleCategories.map((category) => {
              const isActive = selectedCategoryId === category.id;
              const label = pickLocalized(
                language,
                category.name,
                category.name_en,
              );

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(category.id);
                    void api.analytics
                      .trackView({
                        path: `/category/${category.slug}`,
                        category_id: category.id,
                        event_type: "category_click",
                      })
                      .catch(() => {});
                  }}
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
        )}

        {loading ? (
          <div className="mt-16 flex min-h-[320px] items-center justify-center rounded-[8px] bg-paper-dark text-[14px] text-ink-light">
            <LocalizedText ru="Загрузка..." en="Loading..." />
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="mt-16 flex min-h-[320px] items-center justify-center rounded-[8px] bg-paper-dark text-[14px] text-ink-light">
            <LocalizedText
              ru="Категории пока не добавлены"
              en="No categories yet"
            />
          </div>
        ) : visibleArtworks.length > 0 ? (
          <div className="mt-[102px] grid gap-[56px] md:grid-cols-2 lg:grid-cols-[minmax(0,560px)_minmax(0,320px)_minmax(0,320px)] lg:items-start">
            <div className="space-y-[70px]">
              {firstColumnArtworks.map((artwork) => (
                <div key={artwork.id} className="relative">
                  {artwork.status === "sold" && <SoldBadge />}

                  <ArtworkCard artwork={artwork} />
                </div>
              ))}
            </div>

            <div className="space-y-[70px]">
              {secondColumnArtworks.map((artwork) => (
                <div key={artwork.id} className="relative">
                  {artwork.status === "sold" && <SoldBadge />}

                  <ArtworkCard artwork={artwork} />
                </div>
              ))}
            </div>

            <div className="space-y-[70px]">
              {thirdColumnArtworks.map((artwork) => (
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
    </main>
  );
}