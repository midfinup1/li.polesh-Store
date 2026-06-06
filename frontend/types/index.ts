// Mirrors backend domain entities

export type ArtworkStatus = "available" | "sold" | "hidden";

export interface ArtworkImage {
  id: number;
  artwork_id: number;
  original_url: string;
  thumb_url: string;
  thumb_webp_url: string;
  thumb_avif_url: string;
  alt_text: string;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Artwork {
  id: number;
  title: string;
  description: string;
  price: number | null;        // null = price on request
  status: ArtworkStatus;
  category_id: number | null;
  category?: Category;
  year: number | null;
  size: string;
  materials: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images: ArtworkImage[];
}

export type OrderStatus = "new" | "contacted" | "completed" | "cancelled";

export interface Order {
  id: number;
  artwork_id: number;
  artwork?: Artwork;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: OrderStatus;
  created_at: string;
}

export interface Artist {
  id: number;
  name: string;
  bio: string;
  photo_url: string;
  email: string;
  instagram: string;
}

// ─── API request/response types ───────────────────────────────────────────────

export interface CreateOrderRequest {
  artwork_id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
}
