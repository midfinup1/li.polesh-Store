import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artworks = await api.artworks.list().catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteURL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteURL}/order`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteURL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteURL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteURL}/personal-data`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const artworkRoutes: MetadataRoute.Sitemap = (
    Array.isArray(artworks) ? artworks : []
  ).map((artwork) => ({
    url: `${siteURL}/artwork/${artwork.id}`,
    lastModified: artwork.updated_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...artworkRoutes];
}
