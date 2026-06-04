import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
        <Link href="/" className="font-display text-2xl">Портфолио</Link>
        <nav className="flex gap-5 text-sm md:gap-8">
          <Link className="hover:text-accent" href="/gallery">Галерея</Link>
          <Link className="hover:text-accent" href="/about">О художнице</Link>
          <Link className="hover:text-accent" href="/contacts">Контакты</Link>
        </nav>
      </div>
    </header>
  );
}
