import type { Artwork, ArtworkImage, Category, Order } from "@/types";

export type AdminTab = "artist" | "categories" | "artworks" | "orders" | "analytics" | "history";

export type DeleteTarget =
  | { type: "category"; category: Category }
  | { type: "artwork"; artwork: Artwork }
  | { type: "image"; artworkId: number; image: ArtworkImage }
  | { type: "order"; order: Order };
