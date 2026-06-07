"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LocalizedText } from "@/components/localized-text";
import { useSiteSettings } from "@/lib/site-settings";

type Language = "ru" | "en";
type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

  const { language, setLanguage, theme, setTheme } = useSiteSettings();

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function updateSystemTheme() {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    }

    updateSystemTheme();

    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme);
    };
  }, []);

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (theme === "system") {
      return systemTheme;
    }

    return theme;
  }, [theme, systemTheme]);

  function toggleLanguage() {
    setLanguage(language === "ru" ? "en" : "ru");
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }

  const languageButtonText = language === "ru" ? "EN" : "RU";
  const isLightTheme = resolvedTheme === "light";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-[100px] max-w-[1280px] items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            className="text-[20px] font-medium leading-[150%] text-ink"
          >
            lipolesh.art
          </Link>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex h-[52px] items-center justify-center rounded-[8px] text-[16px] font-medium leading-[150%] text-ink transition-opacity hover:opacity-60"
              aria-label={
                language === "ru"
                  ? "Enable English language"
                  : "Включить русский язык"
              }
            >
              {languageButtonText}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="group flex h-[36px] w-[36px] items-center justify-center rounded-[8px] bg-transparent text-ink transition-colors duration-200 hover:bg-paper-dark"
              aria-label={
                isLightTheme
                  ? "Переключить на тёмную тему"
                  : "Переключить на светлую тему"
              }
            >
              <BulbIcon active={isLightTheme} />
            </button>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="h-[52px] rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80"
              aria-label="Открыть меню"
            >
              <LocalizedText ru="меню" en="menu" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="ml-auto flex h-full w-full max-w-md flex-col bg-paper px-8 py-8 shadow-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-16 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-[20px] font-medium leading-[150%]"
              >
                lipolesh.art
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[16px] font-medium leading-[150%] text-ink-light transition-colors hover:text-ink"
                aria-label="Закрыть меню"
              >
                <LocalizedText ru="закрыть" en="close" />
              </button>
            </div>

            <nav className="flex flex-col gap-6 text-[28px] font-semibold leading-[110%] tracking-[-0.02em]">
              <Link
                href="/#catalog"
                onClick={() => setOpen(false)}
                className="transition-opacity hover:opacity-60"
              >
                <LocalizedText ru="Каталог" en="Catalog" />
              </Link>

              <Link
                href="/order"
                onClick={() => setOpen(false)}
                className="transition-opacity hover:opacity-60"
              >
                <LocalizedText ru="На заказ" en="Commission" />
              </Link>

              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="transition-opacity hover:opacity-60"
              >
                <LocalizedText ru="Об авторе" en="About" />
              </Link>
            </nav>

            <div className="mt-auto space-y-4 border-t border-border pt-8 text-[16px] font-medium leading-[150%] text-ink-light">
              <Link
                href="/privacy"
                onClick={() => setOpen(false)}
                className="block transition-colors hover:text-ink"
              >
                <LocalizedText
                  ru="Политика конфиденциальности"
                  en="Privacy policy"
                />
              </Link>

              <Link
                href="/personal-data"
                onClick={() => setOpen(false)}
                className="block transition-colors hover:text-ink"
              >
                <LocalizedText
                  ru="Обработка персональных данных"
                  en="Personal data processing"
                />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BulbIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={[
        "h-6 w-6 transition-all duration-300 ease-out",
        active ? "rotate-0 opacity-100" : "-rotate-6 opacity-45",
      ].join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.2 14.6C6.8 13.4 6 11.7 6 9.8C6 6.5 8.7 4 12 4C15.3 4 18 6.5 18 9.8C18 11.7 17.2 13.4 15.8 14.6C15.1 15.2 14.8 16 14.8 16.8V17H9.2V16.8C9.2 16 8.9 15.2 8.2 14.6Z" />

      <g
        className={[
          "origin-center transition-all duration-300 ease-out",
          active ? "scale-100 opacity-100" : "scale-90 opacity-0",
        ].join(" ")}
      >
        <path d="M12 1.8V1" />
        <path d="M4.9 4.2L4.2 3.5" />
        <path d="M19.1 4.2L19.8 3.5" />
        <path d="M2.4 10H1.4" />
        <path d="M22.6 10H21.6" />
      </g>
    </svg>
  );
}