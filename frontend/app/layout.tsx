import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteSettingsProvider } from "@/lib/site-settings";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { siteUrl } from "@/lib/metadata";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "lipolesh.art",
    template: "%s | lipolesh.art",
  },
  description: "Портфолио художницы Елизаветы Полещенко",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "lipolesh.art",
    title: "lipolesh.art",
    description: "Портфолио художницы Елизаветы Полещенко",
    url: siteUrl,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "lipolesh.art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "lipolesh.art",
    description: "Портфолио художницы Елизаветы Полещенко",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} bg-paper text-ink antialiased`}>
        <SiteSettingsProvider>
          <AnalyticsTracker />
          <SiteHeader />
          {children}
          <SiteFooter />
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
