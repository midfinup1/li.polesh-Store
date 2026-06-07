import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkCard } from "@/components/artwork-card";
import { LocalizedText } from "@/components/localized-text";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "На заказ | lipolesh.art",
  description: "Информация о заказе картины у художницы",
};

export const revalidate = 60;

const priceRows = [
  ["18x24 CM", "15 000 – 25 000 ₽"],
  ["30x40 CM", "30 000 – 40 000 ₽"],
  ["40x50 CM", "43 000 – 53 000 ₽"],
  ["50x70 CM", "55 000 – 65 000 ₽"],
  ["60x80 CM", "70 000 – 80 000 ₽"],
];

export default async function OrderPage() {
  const [artist, artworks] = await Promise.all([
    api.artist.get().catch(() => null),
    api.artworks.list().catch(() => []),
  ]);

  const contactHref = artist?.email ? `mailto:${artist.email}` : "mailto:lis.polesh@gmail.com";
  const examples = Array.isArray(artworks) ? artworks.slice(0, 3) : [];

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto max-w-[1280px] px-6 pb-32 pt-[124px] md:px-10">
        <div className="max-w-[820px]">
          <h1 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[64px] md:leading-[77px]">
            <LocalizedText
              ru="Как заказать картину?"
              en="How to commission a painting?"
            />
          </h1>

          <LocalizedText
            as="p"
            className="mt-8 max-w-[820px] text-[20px] font-normal leading-[150%] text-black/75 dark:text-ink-light md:text-[24px]"
            ru="Стоимость работы зависит от формата работы, от сложности сюжета и от сроков реализации. Доставка оплачивается отдельно."
            en="The price depends on the artwork format, complexity of the subject and production timeline. Delivery is paid separately."
          />

          <LocalizedText
            as="p"
            className="mt-7 max-w-[733px] text-[20px] font-normal leading-[150%] text-black/75 dark:text-ink-light md:text-[24px]"
            ru="Для получения подробной информации свяжитесь со мной в Telegram."
            en="For detailed information, please contact me on Telegram."
          />

          <Link
            href={contactHref}
            className="mt-8 inline-flex h-[76px] items-center rounded-[8px] bg-ink px-8 text-[24px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80"
          >
            <LocalizedText ru="Связаться" en="Contact" />
          </Link>
        </div>

        <div className="mx-auto mt-28 max-w-[581px]">
          <div className="grid grid-cols-[168px_1fr] gap-x-28 text-[32px] font-semibold leading-[120%] text-[#898989] md:text-[35px]">
            <p>
              <LocalizedText ru="Формат" en="Format" />
            </p>
            <p className="text-center">
              <LocalizedText ru="Цены" en="Prices" />
            </p>
          </div>

          <div className="mt-9 grid grid-cols-[168px_1fr] gap-x-28 text-[24px] font-medium leading-[150%] text-ink md:text-[30px]">
            <div className="space-y-0">
              {priceRows.map(([format]) => (
                <p key={format}>{format}</p>
              ))}
            </div>
            <div className="space-y-0 text-left">
              {priceRows.map(([format, price]) => (
                <p key={format}>{price}</p>
              ))}
            </div>
          </div>
        </div>

        {examples.length > 0 && (
          <section className="mt-32">
            <h2 className="text-[40px] font-semibold leading-[110%] text-ink">
              <LocalizedText ru="Примеры работ" en="Examples" />
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {examples.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
