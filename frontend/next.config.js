/** @type {import('next').NextConfig} */
function hostnameFromURL(value) {
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function uniqueHosts(hosts) {
  return Array.from(new Set(hosts.filter(Boolean)));
}

const productionImageHosts = uniqueHosts([
  "lipolesh.art",
  "www.lipolesh.art",
  "3mjjbew73k.cdn.twcstorage.ru",
  hostnameFromURL(process.env.NEXT_PUBLIC_SITE_URL),
  hostnameFromURL(process.env.NEXT_PUBLIC_S3_PUBLIC_URL),
  ...(process.env.NEXT_IMAGE_REMOTE_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
]);

const nextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "backend",
        port: "8080",
        pathname: "/uploads/**",
      },
      ...productionImageHosts.map((hostname) => ({
        protocol: "https",
        hostname,
      })),
    ],
  },

  async rewrites() {
    const apiInternalURL =
      process.env.API_INTERNAL_URL || "http://backend:8080/api/v1";

    const apiOrigin = apiInternalURL.replace(/\/api\/v1\/?$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
