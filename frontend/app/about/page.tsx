import type { Metadata } from "next";
import Image from "next/image";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "О художнице" };
export const revalidate = 60;

export default async function AboutPage() {
  const artist = await api.artist.get().catch(() => null);

  const jsonLd = artist?.name
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: artist.name,
        description: artist.bio || undefined,
        image: artist.photo_url || undefined,
        email: artist.email || undefined,
        sameAs: artist.instagram
          ? [artist.instagram.startsWith("http") ? artist.instagram : `https://instagram.com/${artist.instagram.replace("@", "")}`]
          : undefined,
      }
    : null;

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-6xl gap-12 px-8 py-16 md:grid-cols-[360px_1fr]">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <div className="relative aspect-[3/4] bg-paper-dark">{artist?.photo_url ? <Image src={artist.photo_url} alt={artist.name} fill className="object-cover" /> : null}</div>
      <article>
        <p className="mb-4 text-sm uppercase tracking-widest text-ink-light">О художнице</p>
        <h1 className="text-5xl">{artist?.name || "Имя художницы"}</h1>
        <p className="mt-10 whitespace-pre-line leading-relaxed text-ink-light">{artist?.bio || "Здесь будет биография художницы, описание практики и художественного метода."}</p>
      </article>
    </main>
  );
}
