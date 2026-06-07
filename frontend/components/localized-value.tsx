"use client";

import { useSiteSettings } from "@/lib/site-settings";
import { pickLocalized } from "@/lib/i18n";

type LocalizedValueProps = {
  ru?: string | null;
  en?: string | null;
  fallbackRu?: string;
  fallbackEn?: string;
};

export function LocalizedValue({
  ru,
  en,
  fallbackRu = "",
  fallbackEn = "",
}: LocalizedValueProps) {
  const { language } = useSiteSettings();

  return <>{pickLocalized(language, ru || fallbackRu, en || fallbackEn)}</>;
}
