import type { Artwork, ArtworkStatus, Category, Order } from "@/types";

export const statusLabel: Record<ArtworkStatus, string> = {
  available: "В наличии",
  reserved: "Забронировано",
  sold: "Продано",
  hidden: "Скрыто",
};

export const statusDotClassName: Record<ArtworkStatus, string> = {
  available: "bg-emerald-500",
  reserved: "bg-amber-500",
  sold: "bg-red-500",
  hidden: "bg-ink-light",
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

const cyrillicMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

// Generates a URL-safe slug. Prefers the English name; if it's empty,
// transliterates the Russian name. The backend requires a non-empty slug,
// so the admin no longer asks for it manually — it's derived here.
export function slugify(primary: string, fallback = ""): string {
  const source = (primary.trim() || fallback.trim()).toLowerCase();

  const transliterated = Array.from(source)
    .map((char) => (char in cyrillicMap ? cyrillicMap[char] : char))
    .join("");

  const slug = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug;
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
