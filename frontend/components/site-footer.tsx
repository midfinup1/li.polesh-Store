import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper px-6 py-12 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <Link href="/" className="text-sm font-medium">
            lipolesh.art
          </Link>

          <p className="mt-3 max-w-md text-sm leading-6 text-ink-light">
            Каталог работ художницы. Для приобретения работы оставьте заявку,
            после чего художница свяжется с вами лично.
          </p>
        </div>

        <div>
          <p className="mb-4 text-xs uppercase tracking-widest text-ink-light">
            Документы
          </p>

          <nav className="space-y-3 text-sm">
            <Link href="/privacy" className="block hover:opacity-60">
              Политика конфиденциальности
            </Link>

            <Link href="/personal-data" className="block hover:opacity-60">
              Обработка персональных данных
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}