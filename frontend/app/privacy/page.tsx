import { PrivacyContent } from "@/components/policy-pages";
import { absoluteUrl } from "@/lib/metadata";

export const metadata = {
  title: "Политика конфиденциальности | lipolesh.art",
  description: "Политика конфиденциальности сайта lipolesh.art",
  openGraph: {
    type: "website",
    siteName: "lipolesh.art",
    title: "Политика конфиденциальности",
    description: "Политика конфиденциальности сайта lipolesh.art",
    url: absoluteUrl("/privacy"),
    images: [
      {
        url: absoluteUrl("/og-image.png"),
        width: 1200,
        height: 630,
        alt: "lipolesh.art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Политика конфиденциальности",
    description: "Политика конфиденциальности сайта lipolesh.art",
    images: [absoluteUrl("/og-image.png")],
  },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
