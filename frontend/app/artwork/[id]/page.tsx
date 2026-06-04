import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { OrderForm } from "@/components/order-form";

export const revalidate = 60;
export default async function ArtworkPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const artwork = await api.artworks.getById(id).catch(() => null);
  if (!artwork) notFound();
  const cover = artwork.images?.[0];
  return (
    <main className="mx-auto grid max-w-7xl gap-12 px-8 py-16 lg:grid-cols-[1.05fr_.95fr]">
      <div className="relative aspect-[3/4] bg-paper-dark">
        {cover ? <Image src={cover.original_url} alt={cover.alt_text || artwork.title} fill className="object-contain" priority /> : <div className="absolute inset-0 flex items-center justify-center text-ink-light">Нет изображения</div>}
      </div>
      <section>
        <h1 className="text-5xl">{artwork.title}</h1>
        <p className="mt-5 text-xl">{artwork.price === null ? "Цена по запросу" : `${artwork.price.toLocaleString("ru-RU")} ₽`}</p>
        <dl className="mt-8 space-y-3 text-ink-light">
          {artwork.year && <div><dt className="inline text-ink">Год: </dt><dd className="inline">{artwork.year}</dd></div>}
          {artwork.materials && <div><dt className="inline text-ink">Материалы: </dt><dd className="inline">{artwork.materials}</dd></div>}
          {artwork.size && <div><dt className="inline text-ink">Размер: </dt><dd className="inline">{artwork.size}</dd></div>}
        </dl>
        {artwork.description && <p className="mt-8 whitespace-pre-line leading-relaxed">{artwork.description}</p>}
        <OrderForm artworkId={artwork.id} disabled={artwork.status !== "available"} />
      </section>
    </main>
  );
}
