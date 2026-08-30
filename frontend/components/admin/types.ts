import type { Artwork, ArtworkImage, Category, Order, Series } from "@/types";

export type AdminTab = "artist" | "categories" | "series" | "artworks" | "orders" | "analytics" | "history";

export type DeleteTarget =
  | { type: "category"; category: Category }
  | { type: "series"; series: Series }
  | { type: "artwork"; artwork: Artwork }
  | { type: "image"; artworkId: number; image: ArtworkImage }
  | { type: "order"; order: Order };
