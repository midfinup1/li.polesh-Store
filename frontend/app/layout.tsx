import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  SiteSettingsProvider,
  type Language,
  type ThemeMode,
} from "@/lib/site-settings";
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

function normalizeLanguage(value: string | undefined): Language {
  if (value === "ru" || value === "en") {
    return value;
  }

  return "ru";
}

function normalizeTheme(value: string | undefined): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const initialLanguage = normalizeLanguage(
    cookieStore.get("site-language")?.value,
  );

  const initialTheme = normalizeTheme(cookieStore.get("site-theme")?.value);

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body className={`${inter.variable} bg-paper text-ink antialiased`}>
        <SiteSettingsProvider
          initialLanguage={initialLanguage}
          initialTheme={initialTheme}
        >
          <AnalyticsTracker />
          <SiteHeader />
          {children}
          <SiteFooter />
        </SiteSettingsProvider>
      </body>
    </html>
  );
}