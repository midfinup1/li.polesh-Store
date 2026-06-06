import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Display font for headings — elegant serif with a Cyrillic subset (the site
// is Russian-language). Avoids the "Unknown subset" build failure that fonts
// without Cyrillic coverage would trigger.
const display = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

// Body font — clean and readable, full Cyrillic coverage.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Портфолио художницы",
    template: "%s | Портфолио художницы",
  },
  description: "Портфолио художницы: оригинальные работы, описание и запрос на приобретение.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "Artist Portfolio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${display.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
