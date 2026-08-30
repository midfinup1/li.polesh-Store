import type { ArtworkImage } from "@/types";

export function ArtworkPicture({
  image,
  title,
  className = "absolute inset-0 h-full w-full object-cover",
  loading = "lazy",
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 560px",
}: {
  image: ArtworkImage;
  title: string;
  className?: string;
  loading?: "eager" | "lazy";
  sizes?: string;
}) {
  const fallback = image.display_url || image.thumb_url || image.original_url;
  const webpSrcSet = [
    image.thumb_webp_url ? `${image.thumb_webp_url} 800w` : "",
    image.display_webp_url ? `${image.display_webp_url} 2400w` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const jpegSrcSet = [
    image.thumb_url ? `${image.thumb_url} 800w` : "",
    image.display_url ? `${image.display_url} 2400w` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <picture>
      {webpSrcSet && <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />}
      {!image.display_webp_url && image.thumb_avif_url && (
        <source srcSet={`${image.thumb_avif_url} 800w`} sizes={sizes} type="image/avif" />
      )}
      <img
        src={fallback}
        srcSet={jpegSrcSet || undefined}
        sizes={jpegSrcSet ? sizes : undefined}
        alt={image.alt_text || title}
        className={className}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
