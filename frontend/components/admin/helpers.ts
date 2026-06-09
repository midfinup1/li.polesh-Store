import type { Artwork, ArtworkStatus, Category, Order } from "@/types";

export const statusLabel: Record<ArtworkStatus, string> = {
  available: "В наличии",
  sold: "Продано",
  hidden: "Скрыто",
};

export const orderStatusLabel: Record<Order["status"], string> = {
  new: "Новая",
  contacted: "Связались",
  completed: "Завершена",
  cancelled: "Отменена",
};

export const orderStatusClassName: Record<Order["status"], string> = {
  new: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return "";
  }

  return `${price.toLocaleString("ru-RU")} ₽`;
}

export function sortedCategories(categories: Category[]) {
  return [...categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
}

export function sortedArtworks(artworks: Artwork[]) {
  return [...artworks].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
}

export function moveInArray<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }

  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
