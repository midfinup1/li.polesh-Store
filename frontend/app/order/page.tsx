import type { Metadata } from "next";
import { LocalizedText } from "@/components/localized-text";
import { absoluteUrl } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "На заказ",
  description: "Информация о заказе картины у художницы Елизаветы Полещенко",
  openGraph: {
    type: "website",
    siteName: "lipolesh.art",
    title: "На заказ",
    description: "Информация о заказе картины у художницы Елизаветы Полещенко",
    url: absoluteUrl("/order"),
    images: [
      {
        url: absoluteUrl("/favicon.png"),
        width: 512,
        height: 512,
        alt: "lipolesh.art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "На заказ",
    description: "Информация о заказе картины у художницы Елизаветы Полещенко",
    images: [absoluteUrl("/favicon.png")],
  },
};

export const revalidate = 60;

const priceRows = [
  ["18×24 см", "15 000 – 25 000 ₽"],
  ["30×40 см", "30 000 – 40 000 ₽"],
  ["40×50 см", "43 000 – 53 000 ₽"],
  ["50×70 см", "55 000 – 65 000 ₽"],
  ["60×80 см", "70 000 – 80 000 ₽"],
];

export default async function OrderPage() {
  const contactHref = "https://t.me/lipolesh";

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto max-w-[1280px] px-6 pb-32 pt-[124px] md:px-10">
        <div className="max-w-[820px]">
          <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px]">
            <LocalizedText
              ru="Как заказать картину?"
              en="How to commission a painting?"
            />
          </h1>

          <LocalizedText
            as="p"
            className="mt-8 max-w-[820px] text-[16px] font-normal leading-[150%] text-black/75 dark:text-ink-light"
            ru="Стоимость работы зависит от формата работы, от сложности сюжета и от сроков реализации. Доставка оплачивается отдельно."
            en="The price depends on the artwork format, complexity of the subject and production timeline. Delivery is paid separately."
          />

          <LocalizedText
            as="p"
            className="mt-7 max-w-[733px] text-[16px] font-normal leading-[150%] text-black/75 dark:text-ink-light"
            ru="Для получения подробной информации свяжитесь со мной в Telegram."
            en="For detailed information, please contact me on Telegram."
          />

          <a
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex h-[52px] items-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80"
          >
            <LocalizedText ru="Связаться" en="Contact" />
          </a>
        </div>

        <div className="mx-auto mt-28 w-full max-w-[520px]">
          <div className="grid grid-cols-2 gap-x-10 pb-6 text-center text-[16px] font-semibold leading-[150%] text-ink-light">
            <p>
              <LocalizedText ru="Формат" en="Format" />
            </p>

            <p>
              <LocalizedText ru="Цены" en="Prices" />
            </p>
          </div>

          <div className="space-y-2 text-center text-[16px] font-medium leading-[150%] text-ink">
            {priceRows.map(([format, price]) => (
              <div key={format} className="grid grid-cols-2 gap-x-10">
                <p>{format}</p>
                <p>{price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}