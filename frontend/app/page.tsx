import Image from "next/image";
import Link from "next/link";
import { ArtworkCard } from "@/components/artwork-card";
import { LocalizedText } from "@/components/localized-text";
import { api } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  const [artist, artworks] = await Promise.all([
    api.artist.get().catch(() => null),
    api.artworks.list().catch(() => []),
  ]);

  const visibleArtworks = Array.isArray(artworks) ? artworks : [];
  const leftArtworks = visibleArtworks.filter((_, index) => index % 2 === 0);
  const rightArtworks = visibleArtworks.filter((_, index) => index % 2 === 1);

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto max-w-[1280px] px-6 pb-24 pt-[116px] md:px-10">
        <div className="grid items-start gap-14 md:grid-cols-[494px_1fr] md:gap-[57px]">
          <div className="overflow-hidden rounded-[8px] bg-paper-dark">
            {artist?.photo_url ? (
              <Image
                src={artist.photo_url}
                alt={artist.name || "Artist"}
                width={988}
                height={1318}
                priority
                className="h-auto w-full object-contain grayscale"
              />
            ) : (
              <div className="flex aspect-[494/659] items-center justify-center rounded-[8px] text-[14px] text-ink-light">
                <LocalizedText ru="Фото художницы" en="Artist photo" />
              </div>
            )}
          </div>

          <div className="pt-[108px]">
            <h1 className="max-w-[713px] text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px] md:leading-[1.1]">
              {artist?.name || (
                <LocalizedText
                  ru="Елизавета Полещенко"
                  en="Elizaveta Poleshchenko"
                />
              )}
            </h1>
          </div>
        </div>

        <section className="mt-[101px] max-w-[1264px]">
          <h2 className="text-[36px] font-bold leading-[1.12] tracking-[-0.02em] text-ink md:text-[48px] md:leading-[1.1]">
            Artist statement
          </h2>

          {artist?.bio ? (
            <p className="mt-6 max-w-[1261px] text-[20px] font-normal leading-[150%] text-black/75 dark:text-ink-light md:text-[16px]">
              {artist.bio}
            </p>
          ) : (
            <LocalizedText
              as="p"
              className="mt-6 max-w-[1261px] text-[20px] font-normal leading-[150%] text-black/75 dark:text-ink-light md:text-[16px]"
              ru="В своей художественной практике я обращаюсь к познанию личного и эмоционального, через анализ мимолетных образов, формируя из интуитивного целостные образы и сюжеты. Через анималистичные образы рассуждаю о внутреннем, о привязанностях, о поиске объяснения своих действий и чувств. Человек в моих работах чаще находится в роли наблюдателя и больше выражает процесс обдумывания нежели процесс прямых и активных действий. В начале своей работы над картиной мне важны первые интуитивные зарисовки и мазки, из которых потом формируется целостный образ."
              en="In her artistic practice, the artist turns to personal and emotional experience through fleeting images, memory and internal states. Animalistic imagery reveals themes of tension, vulnerability and acceptance. The human figure often appears as an observer, expressing a process of reflection rather than direct action."
            />
          )}

          <Link
            href="#catalog"
            className="mt-[52px] inline-flex h-[52px] items-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80"
          >
            <LocalizedText ru="Смотреть каталог" en="View catalog" />
          </Link>
        </section>
      </section>

      <section
        id="catalog"
        className="mx-auto max-w-[1280px] scroll-mt-[120px] px-6 pb-32 pt-[170px] md:px-10"
      >
        <h2 className="text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink md:text-[48px]">
          <LocalizedText ru="Каталог" en="Catalog" />
        </h2>

        <div className="mt-12 flex flex-wrap gap-4">
          <a
            href="#catalog"
            className="inline-flex h-[44px] items-center rounded-[8px] bg-ink px-5 text-[16px] font-medium leading-[150%] text-paper shadow-sm"
          >
            <LocalizedText ru="картины" en="paintings" />
          </a>

          <a
            href="#catalog"
            className="inline-flex h-[44px] items-center rounded-[8px] bg-paper-dark px-5 text-[16px] font-medium leading-[150%] text-ink shadow-sm transition-opacity hover:opacity-70"
          >
            <LocalizedText ru="постеры" en="posters" />
          </a>

          <a
            href="#catalog"
            className="inline-flex h-[44px] items-center rounded-[8px] bg-paper-dark px-5 text-[16px] font-medium leading-[150%] text-ink shadow-sm transition-opacity hover:opacity-70"
          >
            <LocalizedText ru="керамика" en="ceramics" />
          </a>
        </div>

        {visibleArtworks.length > 0 ? (
          <div className="mt-[102px] grid gap-[80px] lg:grid-cols-[minmax(0,681px)_minmax(0,502px)] lg:items-start">
            <div className="space-y-[70px]">
              {leftArtworks.map((artwork, index) => (
                <ArtworkCard key={artwork.id} artwork={artwork} large={index === 0} />
              ))}
            </div>

            <div className="space-y-[70px]">
              {rightArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-16 flex min-h-[320px] items-center justify-center rounded-[8px] bg-paper-dark text-[14px] text-ink-light">
            <LocalizedText ru="Работы пока не добавлены" en="No artworks yet" />
          </div>
        )}
      </section>
    </main>
  );
}
