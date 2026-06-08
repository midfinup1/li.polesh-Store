import Image from "next/image";
import { LocalizedText } from "@/components/localized-text";
import { api } from "@/lib/api";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/metadata";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Об авторе",
  description: "Информация о художнице Елизавете Полещенко",
  openGraph: {
    type: "profile",
    siteName: "lipolesh.art",
    title: "Об авторе",
    description: "Информация о художнице Елизавете Полещенко",
    url: absoluteUrl("/about"),
    images: [
      {
        url: absoluteUrl("/favicon.png"),
        width: 512,
        height: 512,
        alt: "Елизавета Полещенко",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Об авторе",
    description: "Информация о художнице Елизавете Полещенко",
    images: [absoluteUrl("/favicon.png")],
  },
};

export default async function AboutPage() {
  const artist = await api.artist.get().catch(() => null);

  return (
    <main className="bg-paper text-ink">
      <section className="mx-auto max-w-[1280px] px-6 pb-32 pt-[124px] md:px-10">
        <div className="grid gap-16 md:grid-cols-[minmax(0,699px)_minmax(0,492px)] md:items-start md:gap-[89px]">
          <div>
            <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px] md:leading-[1.1]">
              <LocalizedText ru="Об авторе" en="About" />
            </h1>

            <p className="mt-6 text-[24px] font-normal leading-[150%] text-ink-light">
              <LocalizedText ru="художница" en="artist" />
            </p>

            <div className="mt-10">
              <h2 className="text-[18px] font-semibold leading-[120%] tracking-[-0.02em] text-ink">
                <LocalizedText ru="Медиум" en="Medium" />
              </h2>
              <p className="mt-4 text-[16px] font-medium leading-[150%] text-ink">
                <LocalizedText
                  ru="масляная и акварельная живопись, графика, скульптура, фотография"
                  en="oil and watercolor painting, graphics, sculpture, photography"
                />
              </p>
            </div>

            <div className="mt-[84px]">
              <h2 className="text-[18px] font-semibold leading-[120%] tracking-[-0.02em] text-ink">
                <LocalizedText ru="Контакты" en="Contacts" />
              </h2>

              <div className="mt-6 space-y-[22px] text-[16px] font-medium leading-[150%]">
                <div>
                  <p className="text-[#888888] dark:text-ink-light">Telegram канал</p>
                  <a
                    href="https://t.me/li_polesh_sklad"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block underline underline-offset-4 transition-opacity hover:opacity-60"
                  >
                    @li_polesh_sklad
                  </a>
                </div>

                <div>
                  <p className="text-[#888888] dark:text-ink-light">Instagram</p>
                  <a
                    href="https://instagram.com/li.polesh"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block underline underline-offset-4 transition-opacity hover:opacity-60"
                  >
                    @li.polesh
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[8px] bg-paper-dark">
            {artist?.photo_url ? (
              <Image
                src={artist.photo_url}
                alt={artist.name || "Елизавета Полещенко"}
                width={984}
                height={1314}
                priority
                className="h-auto w-full object-contain"
              />
            ) : (
              <div className="flex aspect-[492/657] items-center justify-center rounded-[8px] text-[16px] text-ink-light">
                <LocalizedText ru="Фото художницы" en="Artist photo" />
              </div>
            )}
          </div>
        </div>

        <TextSection
          className="mt-[157px]"
          titleRu="Биография"
          titleEn="Biography"
          ru={
            "Художница родилась в 2001 году на Дальнем Востоке в городе Комсомольск-на-Амуре, Хабаровский край. Прожила в родном городе 18 лет, закончив ДХШ им. Г.А.Цивелева в 2016 и общеобразовательную школу в 2019.\nПосле 11 класса поступила в Новосибирский государственный университет архитектуры, дизайна и искусств на факультет дизайна архитектурной среды.\nВ 2023 взяла академический отпуск, вступила в творческое объединение и начала свою деятельность в художественной среде города, занималась организацией мероприятий и выставок, принимала в них активное участие.\nВ 2024 году вернулась к учебе и устроилась работать в арт-пространство «Арт Ель», продолжая свою индивидуальную творческую деятельность."
          }
          en={
            "The artist was born in 2001 in the Russian Far East, in Komsomolsk-on-Amur, Khabarovsk Krai. She lived in her hometown for 18 years, graduating from the G.A. Tsivelev Children's Art School in 2016 and from secondary school in 2019.\nAfter finishing school, she entered Novosibirsk State University of Architecture, Design and Arts, studying architectural environment design.\nIn 2023 she took an academic leave, joined a creative association and began working actively in the city's artistic environment, organizing events and exhibitions and taking part in them.\nIn 2024 she returned to her studies and began working at the Art El art space, continuing her individual artistic practice."
          }
        />

        <TextSection
          className="mt-[94px]"
          titleRu="Образование"
          titleEn="Education"
          ru={
            "2009-2016 — МАУК ДО «ДХШ им. Г.А.Цивелева», г. Комсомольск-на-Амуре, Хабаровский край.\n2016-2019 — творческая практика у члена союза художников россии Колпасов Владимир Григорьевич, г. Комсомольск-на-Амуре, Хабаровский край\n2019-2025 — Новосибирский государственный университет архитектуры, дизайна и искусства им. А.Д.Крячкова, бакалавр дизайна архитектурной среды"
          }
          en={
            "2009-2016 — G.A. Tsivelev Children's Art School, Komsomolsk-on-Amur, Khabarovsk Krai.\n2016-2019 — creative practice with Vladimir Grigoryevich Kolpasov, member of the Union of Artists of Russia, Komsomolsk-on-Amur, Khabarovsk Krai.\n2019-2025 — Novosibirsk State University of Architecture, Design and Arts named after A.D. Kryachkov, bachelor's degree in architectural environment design."
          }
        />

        <TextSection
          className="mt-[94px]"
          titleRu="Выставки"
          titleEn="Exhibitions"
          ru={
            "2026 август-сентябрь — персональная выставка в пространстве «Арт Ель», г. Новосибирск.\n2025 сентябрь — коллективная выставка в рамках Фестиваля современного искусства, в «Карта мира» и пространстве «Арт Ель», г.Новосибирск.\n2024 декабрь — выставочная ярмарка «Артфокус». Мультипространство Контора Пароходства, Тюмень.\n2024 ноябрь-декабрь — выставка «Этот безумный, безумный, безумный, безумный АРТ мир», в арт-пространстве «Цоколь», г. Новосибирск.\n2023 ноябрь-декабрь — выставка «Розовые очки», г. Сочи, организаторы: Art Community\n2023 сентябрь-октябрь — выставка «Уголь», г. Новосибирск в арт-резиденции «Респект», организаторы «Красный клевер»"
          }
          en={
            "August-September 2026 — solo exhibition at Art El, Novosibirsk.\nSeptember 2025 — group exhibition as part of the Contemporary Art Festival, at Karta Mira and Art El, Novosibirsk.\nDecember 2024 — Artfocus art fair, Kontora Parokhodstva multi-space, Tyumen.\nNovember-December 2024 — exhibition This Mad, Mad, Mad, Mad ART World, Tsokol art space, Novosibirsk.\nNovember-December 2023 — Rose-Colored Glasses exhibition, Sochi, organized by Art Community.\nSeptember-October 2023 — Coal exhibition, Respect art residence, Novosibirsk, organized by Krasny Klever."
          }
        />
      </section>
    </main>
  );
}

function TextSection({
  className,
  titleRu,
  titleEn,
  ru,
  en,
}: {
  className?: string;
  titleRu: string;
  titleEn: string;
  ru: string;
  en: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-[30px] font-semibold leading-[51px] tracking-[-0.02em] text-ink">
        <LocalizedText ru={titleRu} en={titleEn} />
      </h2>

      <LocalizedText
        as="p"
        className="mt-10 max-w-[1075px] whitespace-pre-line text-[16px] font-medium leading-[150%] text-ink"
        ru={ru}
        en={en}
      />
    </section>
  );
}
