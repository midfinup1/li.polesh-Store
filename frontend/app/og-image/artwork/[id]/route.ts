import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

type OgImageRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const PUBLIC_MEDIA_BASE_URL = "https://lipolesh.art/media";
const S3_PUBLIC_BASE_URL =
  "https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5";

function parseArtworkId(value: string) {
  const normalizedValue = value.replace(/\.jpe?g$/i, "");
  const id = Number(normalizedValue);

  return Number.isFinite(id) ? id : null;
}

function getArtworkPreviewImageUrl(artwork: {
  images?: {
    thumb_url?: string;
    thumb_webp_url?: string;
    original_url?: string;
    thumb_avif_url?: string;
  }[];
}) {
  const cover = artwork.images?.[0];

  return (
    cover?.thumb_url ||
    cover?.thumb_webp_url ||
    cover?.original_url ||
    cover?.thumb_avif_url ||
    null
  );
}

function toInternalImageUrl(url: string) {
  if (url.startsWith(PUBLIC_MEDIA_BASE_URL)) {
    return url.replace(PUBLIC_MEDIA_BASE_URL, S3_PUBLIC_BASE_URL);
  }

  return url;
}

function getContentTypeFromUrl(url: string) {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.endsWith(".jpg") || normalizedUrl.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalizedUrl.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedUrl.endsWith(".webp")) {
    return "image/webp";
  }

  if (normalizedUrl.endsWith(".avif")) {
    return "image/avif";
  }

  return "image/jpeg";
}

export async function GET(_request: Request, { params }: OgImageRouteProps) {
  const { id: rawId } = await params;
  const id = parseArtworkId(rawId);

  if (id === null) {
    return new NextResponse("Invalid artwork id", { status: 400 });
  }

  try {
    const artwork = await api.artworks.getById(id);
    const imageUrl = getArtworkPreviewImageUrl(artwork);

    if (!imageUrl) {
      return new NextResponse("Artwork image not found", { status: 404 });
    }

    const internalImageUrl = toInternalImageUrl(imageUrl);

    const imageResponse = await fetch(internalImageUrl, {
      cache: "no-store",
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/avif,image/*,*/*",
        "User-Agent": "lipolesh.art-og-image-proxy",
      },
    });

    if (!imageResponse.ok) {
      return new NextResponse("Artwork image fetch failed", {
        status: imageResponse.status,
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") ||
      getContentTypeFromUrl(internalImageUrl);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(imageBuffer.byteLength),
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Artwork OpenGraph image error:", {
      id,
      error,
    });

    if (error instanceof ApiError && error.status === 404) {
      return new NextResponse("Artwork not found", { status: 404 });
    }

    return new NextResponse("Artwork image error", { status: 500 });
  }
}