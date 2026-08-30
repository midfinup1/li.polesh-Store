import type { Artwork, ArtworkImage, Category, Exhibition, Order } from "@/types";

export type AdminTab = "artist" | "categories" | "exhibitions" | "artworks" | "orders" | "analytics" | "history";

export type DeleteTarget =
  | { type: "category"; category: Category }
  | { type: "exhibition"; exhibition: Exhibition }
  | { type: "artwork"; artwork: Artwork }
  | { type: "image"; artworkId: number; image: ArtworkImage }
  | { type: "order"; order: Order };
