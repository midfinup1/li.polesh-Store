import type { Language } from "@/lib/site-settings";

export function pickLocalized(
  language: Language,
  ruValue?: string | null,
  enValue?: string | null,
) {
  const ru = String(ruValue || "").trim();
  const en = String(enValue || "").trim();

  if (language === "en") {
    return en || ru;
  }

  return ru || en;
}
