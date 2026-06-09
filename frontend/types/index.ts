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
  name_en: string;
  slug: string;
  sort_order: number;
  created_at?: string;
}

export interface Artwork {
  id: number;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  price: number | null;
  status: ArtworkStatus;
  category_id: number | null;
  category?: Category;
  year: number | null;
  size: string;
  size_en: string;
  materials: string;
  materials_en: string;
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
  name_en: string;
  bio: string;
  bio_en: string;
  photo_url: string;
  home_photo_url: string;
  about_photo_url: string;
  email: string;
  instagram: string;
}

export interface CreateOrderRequest {
  artwork_id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface AnalyticsMetric {
  label: string;
  value: number;
}

export interface AnalyticsArtworkMetric {
  artwork_id: number;
  title: string;
  title_en: string;
  views: number;
}

export interface AnalyticsSummary {
  views_7_days: number;
  views_30_days: number;
  artwork_views_30_days: number;
  orders_30_days: number;
  conversion_30_days: number;
  top_artworks: AnalyticsArtworkMetric[];
  top_pages: AnalyticsMetric[];
  category_clicks: AnalyticsMetric[];
}


export interface AdminAuditLogFilter {
  limit?: number;
  offset?: number;
  action?: string;
  entity_type?: string;
  admin_email?: string;
  date_from?: string;
  date_to?: string;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number | null;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
