import Link from "next/link";
import { LocalizedText } from "@/components/localized-text";

export function SiteFooter() {
  return (
    <footer className="bg-paper text-ink">
      <div className="mx-auto max-w-[1280px] border-t border-border px-6 py-12 md:px-10">
        <div className="grid gap-14 md:grid-cols-[1.55fr_0.68fr_0.76fr_0.78fr]">
          <div>
            <h2 className="mb-4 text-[22px] font-normal lowercase leading-[150%] text-[#7C7C7C] dark:text-ink-light">
              <LocalizedText ru="социальные сети" en="social media" />
            </h2>

            <div className="flex items-start gap-3">
              <SocialLink href="https://t.me/li_polesh_sklad" label="Telegram">
                <TelegramIcon />
              </SocialLink>

              <SocialLink href="https://vk.com/li.poles" label="VK">
                <VkIcon />
              </SocialLink>

              <SocialLink href="https://instagram.com/li.polesh" label="Instagram">
                <InstagramIcon />
              </SocialLink>
            </div>
          </div>

          <FooterColumn titleRu="Навигация" titleEn="Navigation">
            <FooterLink href="/about" ru="Об авторе" en="About" />
            <FooterLink href="/#catalog" ru="Каталог" en="Catalog" />
            <FooterLink href="/order" ru="На заказ" en="Commission" />
          </FooterColumn>

          <FooterColumn titleRu="Документы" titleEn="Documents">
            <FooterLink
              href="/privacy"
              ru="Политика конфиденциальности"
              en="Privacy policy"
            />
            <FooterLink
              href="/personal-data"
              ru="Обработка персональных данных"
              en="Personal data processing"
            />
          </FooterColumn>

          <FooterColumn titleRu="Реквизиты" titleEn="Details">
            <p>
              <LocalizedText
                ru="Полещенко Елизавета Сергеевна"
                en="Elizaveta Poleshchenko"
              />
            </p>
            <p>
              <LocalizedText ru="ИНН" en="Tax ID" />
            </p>
            <a
              href="mailto:lis.polesh@gmail.com"
              className="block underline underline-offset-4 transition-opacity hover:opacity-60"
            >
              lis.polesh@gmail.com
            </a>
            {/* <p>
              <LocalizedText ru="телефон" en="phone" />
            </p> */}
          </FooterColumn>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  titleRu,
  titleEn,
  children,
}: {
  titleRu: string;
  titleEn: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-6 text-[16px] font-medium leading-[150%] text-[#888888] dark:text-ink-light">
        <LocalizedText ru={titleRu} en={titleEn} />
      </h2>

      <div className="space-y-6 text-[16px] font-medium leading-[150%] text-[#454545] dark:text-ink">
        {children}
      </div>
    </div>
  );
}

function FooterLink({ href, ru, en }: { href: string; ru: string; en: string }) {
  return (
    <Link href={href} className="block transition-opacity hover:opacity-60">
      <LocalizedText ru={ru} en={en} />
    </Link>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-[54px] w-[54px] items-center justify-center rounded-[8px] text-[#828282] transition-colors hover:text-ink"
    >
      {children}
    </a>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10" fill="currentColor">
      <path d="M21.94 4.16a1.18 1.18 0 0 0-1.26-.18L2.75 11.22c-.78.32-.78 1.42.02 1.72l4.55 1.7 1.74 5.36c.22.67 1.08.84 1.54.3l2.5-2.96 4.63 3.42c.65.48 1.58.12 1.73-.67l3.05-14.76c.09-.45-.13-.9-.57-1.17ZM8.27 13.92l9.55-5.86c.18-.11.36.13.2.27l-7.9 7.08-.31 3.17-1.2-3.7-.34-.96Z" />
    </svg>
  );
}

function VkIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="h-11 w-11"
      fill="currentColor"
    >
      <path d="M25.54 34.5C11.92 34.5 4.15 25.16 3.83 9.62h6.82c.22 11.4 5.25 16.23 9.23 17.22V9.62h6.43v9.83c3.93-.43 8.07-4.9 9.46-9.83h6.43c-1.07 6.07-5.57 10.54-8.77 12.38 3.2 1.5 8.34 5.4 10.29 12.5h-7.08c-1.52-4.73-5.3-8.39-10.33-8.9v8.9h-.77Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
