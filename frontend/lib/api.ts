import type {
  Artist,
  Artwork,
  Category,
  CreateOrderRequest,
  Order,
  AnalyticsSummary,
} from "@/types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function baseURL() {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_URL || "http://localhost:8080/api/v1";
  }

  return process.env.NEXT_PUBLIC_API_URL || "/api/v1";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const headers = new Headers(init.headers);

  if (!isFormData && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${baseURL()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = res.statusText;

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText);
        errorMessage = parsed.error || parsed.message || errorMessage;
      } catch {
        errorMessage = errorText;
      }
    }

    throw new ApiError(
      res.status,
      errorMessage || `Request failed: ${res.status}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();

  if (!text) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

function buildQuery(
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const api = {
  artworks: {
    list: (params?: { category_id?: number }) =>
      request<Artwork[]>(`/artworks${buildQuery(params)}`),

    getById: (id: number) => request<Artwork>(`/artworks/${id}`),
  },

  categories: {
    list: () => request<Category[]>("/categories"),
  },

  artist: {
    get: () => request<Artist>("/artist"),
  },

  orders: {
    create: (data: CreateOrderRequest) =>
      request<void>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  analytics: {
    trackView: (data: {
      path: string;
      artwork_id?: number | null;
      event_type?: "page_view" | "category_click";
    }) =>
      request<void>("/analytics/view", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  auth: {
    login: (email: string, password: string) =>
      request<{ status: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      request<void>("/auth/logout", {
        method: "POST",
      }),
  },

  admin: {
    artworks: {
      list: () => request<Artwork[]>("/admin/artworks"),

      create: (data: Partial<Artwork>) =>
        request<Artwork>("/admin/artworks", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      update: (id: number, data: Partial<Artwork>) =>
        request<Artwork>(`/admin/artworks/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      delete: (id: number) =>
        request<void>(`/admin/artworks/${id}`, {
          method: "DELETE",
        }),

      uploadImage: (id: number, file: File) => {
        const form = new FormData();
        form.append("image", file);

        return request<Artwork["images"][0]>(`/admin/artworks/${id}/images`, {
          method: "POST",
          body: form,
        });
      },

      deleteImage: (id: number, imageId: number) =>
        request<void>(`/admin/artworks/${id}/images/${imageId}`, {
          method: "DELETE",
        }),

      updateImageAltText: (id: number, imageId: number, altText: string) =>
        request<Artwork["images"][0]>(`/admin/artworks/${id}/images/${imageId}/alt`, {
          method: "PATCH",
          body: JSON.stringify({ alt_text: altText }),
        }),

      reorderImages: (id: number, imageIds: number[]) =>
        request<void>(`/admin/artworks/${id}/images/reorder`, {
          method: "PATCH",
          body: JSON.stringify({ image_ids: imageIds }),
        }),
    },

    categories: {
      create: (data: Partial<Category>) =>
        request<Category>("/admin/categories", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      update: (id: number, data: Partial<Category>) =>
        request<Category>(`/admin/categories/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      delete: (id: number) =>
        request<void>(`/admin/categories/${id}`, {
          method: "DELETE",
        }),
    },

    orders: {
      list: () => request<Order[]>("/admin/orders"),

      updateStatus: (id: number, status: Order["status"]) =>
        request<void>(`/admin/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
    },

    analytics: {
      summary: () => request<AnalyticsSummary>("/admin/analytics"),
    },

    artist: {
      update: (data: Partial<Artist>) =>
        request<Artist>("/admin/artist", {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      uploadPhoto: (slot: "home" | "about", file: File) => {
        const form = new FormData();
        form.append("image", file);

        return request<Artist>(`/admin/artist/photo/${slot}`, {
          method: "POST",
          body: form,
        });
      },
    },
  },
};
