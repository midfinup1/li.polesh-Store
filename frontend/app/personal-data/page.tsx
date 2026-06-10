import { PersonalDataContent } from "@/components/policy-pages";
import { absoluteUrl } from "@/lib/metadata";

export const metadata = {
  title: "Обработка персональных данных | lipolesh.art",
  description: "Согласие на обработку персональных данных на сайте lipolesh.art",
  openGraph: {
    type: "website",
    siteName: "lipolesh.art",
    title: "Обработка персональных данных",
    description: "Согласие на обработку персональных данных на сайте lipolesh.art",
    url: absoluteUrl("/personal-data"),
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
    title: "Обработка персональных данных",
    description: "Согласие на обработку персональных данных на сайте lipolesh.art",
    images: [absoluteUrl("/og-image.png")],
  },
};

export default function PersonalDataPage() {
  return <PersonalDataContent />;
}
