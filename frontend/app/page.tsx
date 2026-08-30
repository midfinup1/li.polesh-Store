import { CatalogHome } from "@/components/catalog-home";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [artist, artworks, categories, series] = await Promise.all([
    api.artist.get().catch(() => null),
    api.artworks.list().catch(() => []),
    api.categories.list().catch(() => []),
    api.series.list().catch(() => []),
  ]);

  return (
    <CatalogHome
      artist={artist}
      artworks={artworks}
      categories={categories}
      series={series}
    />
  );
}
