import type { ArtworkImage } from "@/types";

export function ArtworkPicture({
  image,
  title,
  className = "absolute inset-0 h-full w-full object-cover",
  loading = "lazy",
}: {
  image: ArtworkImage;
  title: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const fallback = image.thumb_url || image.original_url;

  return (
    <picture>
      {image.thumb_avif_url && <source srcSet={image.thumb_avif_url} type="image/avif" />}
      {image.thumb_webp_url && <source srcSet={image.thumb_webp_url} type="image/webp" />}
      <img
        src={fallback}
        alt={image.alt_text || title}
        className={className}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
