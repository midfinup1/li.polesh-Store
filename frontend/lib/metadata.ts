export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://lipolesh.art";

export function absoluteUrl(path: string) {
  if (!path) {
    return siteUrl;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${siteUrl}${path}`;
  }

  return `${siteUrl}/${path}`;
}

export function getImageUrl(image: {
  original_url?: string;
  thumb_avif_url?: string;
  thumb_webp_url?: string;
  thumb_url?: string;
} | null | undefined) {
  if (!image) {
    return "";
  }

  return (
    image.original_url ||
    image.thumb_avif_url ||
    image.thumb_webp_url ||
    image.thumb_url ||
    ""
  );
}