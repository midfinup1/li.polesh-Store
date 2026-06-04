/** @type {import('next').NextConfig} */
const storageHost = process.env.NEXT_PUBLIC_IMAGE_HOST;
const remotePatterns = storageHost ? [{ protocol: "https", hostname: storageHost }] : [];

const nextConfig = {
  output: "standalone",
  images: { remotePatterns },
  async rewrites() {
    const backend = process.env.API_INTERNAL_URL || "http://localhost:8080/api/v1";
    return [
      { source: "/api/v1/:path*", destination: `${backend}/:path*` },
      { source: "/uploads/:path*", destination: `${backend.replace("/api/v1", "")}/uploads/:path*` },
    ];
  },
};
module.exports = nextConfig;
