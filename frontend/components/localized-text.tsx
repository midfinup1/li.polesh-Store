"use client";

import { useSiteSettings } from "@/lib/site-settings";

type LocalizedTextProps = {
  ru: string;
  en: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  className?: string;
};

export function LocalizedText({
  ru,
  en,
  as = "span",
  className,
}: LocalizedTextProps) {
  const { language } = useSiteSettings();
  const text = language === "ru" ? ru : en;

  if (as === "p") return <p className={className}>{text}</p>;
  if (as === "h1") return <h1 className={className}>{text}</h1>;
  if (as === "h2") return <h2 className={className}>{text}</h2>;
  if (as === "h3") return <h3 className={className}>{text}</h3>;

  return <span className={className}>{text}</span>;
}
