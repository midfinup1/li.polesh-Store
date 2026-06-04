import type { Artwork, Artist, Category, Order, CreateOrderRequest } from "@/types";

function baseURL() {
  if (typeof window === "undefined") return process.env.API_INTERNAL_URL || "http://localhost:8080/api/v1";
  return process.env.NEXT_PUBLIC_API_URL || "/api/v1";
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (!isFormData && init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const method = init.method || "GET";
  const cache = typeof window === "undefined" && method === "GET" ? (init.cache || "force-cache") : "no-store";
  const res = await fetch(`${baseURL()}${path}`, { ...init, headers, cache, credentials: "same-origin" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export const api = {
  artworks: { list: (params?: { category_id?: number }) => request<Artwork[]>(`/artworks${params?.category_id ? `?category_id=${params.category_id}` : ""}`), getById: (id: number) => request<Artwork>(`/artworks/${id}`) },
  categories: { list: () => request<Category[]>("/categories") },
  artist: { get: () => request<Artist>("/artist") },
  orders: { create: (data: CreateOrderRequest) => request<Order>("/orders", { method: "POST", body: JSON.stringify(data) }) },
  auth: { login: (email: string, password: string) => request<{ status: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }), logout: () => request<void>("/auth/logout", { method: "POST" }) },
  admin: {
    artworks: {
      list: () => request<Artwork[]>("/admin/artworks"),
      create: (data: Partial<Artwork>) => request<Artwork>("/admin/artworks", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Artwork>) => request<Artwork>(`/admin/artworks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      delete: (id: number) => request<void>(`/admin/artworks/${id}`, { method: "DELETE" }),
      uploadImage: (id: number, file: File) => { const form = new FormData(); form.append("image", file); return request<Artwork["images"][0]>(`/admin/artworks/${id}/images`, { method: "POST", body: form }); },
    },
    categories: { create: (data: Partial<Category>) => request<Category>("/admin/categories", { method: "POST", body: JSON.stringify(data) }) },
    orders: { list: () => request<Order[]>("/admin/orders"), updateStatus: (id: number, status: Order["status"]) => request<void>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }) },
    artist: { update: (data: Partial<Artist>) => request<Artist>("/admin/artist", { method: "PUT", body: JSON.stringify(data) }) },
  },
};
