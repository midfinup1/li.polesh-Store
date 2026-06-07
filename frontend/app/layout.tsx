import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteSettingsProvider } from "@/lib/site-settings";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "lipolesh.art",
  description: "Каталог работ художницы",
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
          <SiteHeader />
          {children}
          <SiteFooter />
        </SiteSettingsProvider>
      </body>
    </html>
  );
}