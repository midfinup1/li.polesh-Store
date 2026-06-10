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

  // Next >=15.2 streams metadata on dynamic pages: <meta> tags can end up in
  // <body> instead of <head>. Bots matching this list get blocking (in-<head>)
  // metadata. Setting the option REPLACES the default list, so it repeats the
  // defaults and adds TelegramBot (absent from defaults), which cannot parse
  // streamed metadata — that is what broke link previews in Telegram.
  htmlLimitedBots:
    /Mediapartners-Google|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|vkShare|TelegramBot|Telegram/i,

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
