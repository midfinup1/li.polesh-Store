"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LocalizedText } from "@/components/localized-text";
import { useSiteSettings } from "@/lib/site-settings";

type Language = "ru" | "en";
type Theme = "light" | "dark" | "system";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const { language, setLanguage, theme, setTheme } = useSiteSettings();
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setThemeOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setThemeOpen(false);
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  function selectLanguage(value: Language) {
    setLanguage(value);
  }

  function selectTheme(value: Theme) {
    setTheme(value);
    setThemeOpen(false);
  }

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

          <div className="flex items-center gap-[15px]">
            <div className="flex items-center gap-[9px] text-[20px] font-medium leading-[150%]">
              <button
                type="button"
                onClick={() => selectLanguage("ru")}
                className={language === "ru" ? "text-ink" : "text-ink-light"}
                aria-label="Включить русский язык"
              >
                RU
              </button>

              <button
                type="button"
                onClick={() => selectLanguage("en")}
                className={language === "en" ? "text-ink" : "text-ink-light"}
                aria-label="Enable English language"
              >
                EN
              </button>
            </div>

            <div ref={themeMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setThemeOpen((value) => !value)}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-[8px] border border-border text-ink-light transition-colors hover:text-ink"
                aria-label="Выбрать тему сайта"
                aria-expanded={themeOpen}
              >
                <ThemeIcon theme={theme} />
              </button>

              {themeOpen && (
                <div className="absolute right-0 top-[64px] z-50 w-48 rounded-[8px] border border-border bg-paper p-2 shadow-sm">
                  <ThemeOption
                    active={theme === "light"}
                    onClick={() => selectTheme("light")}
                    icon={<SunIcon />}
                    labelRu="Светлая"
                    labelEn="Light"
                  />

                  <ThemeOption
                    active={theme === "dark"}
                    onClick={() => selectTheme("dark")}
                    icon={<MoonIcon />}
                    labelRu="Тёмная"
                    labelEn="Dark"
                  />

                  <ThemeOption
                    active={theme === "system"}
                    onClick={() => selectTheme("system")}
                    icon={<SystemIcon />}
                    labelRu="Системная"
                    labelEn="System"
                  />
                </div>
              )}
            </div>

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
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-md flex-col bg-paper px-8 py-8 shadow-sm">
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

            <nav className="flex flex-col gap-6 text-[40px] font-semibold leading-[110%] tracking-[-0.02em]">
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

              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="block pt-4 transition-colors hover:text-ink"
              >
                <LocalizedText ru="Вход для администратора" en="Admin login" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ThemeOption({
  active,
  onClick,
  icon,
  labelRu,
  labelEn,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  labelRu: string;
  labelEn: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left text-[16px] font-medium leading-[150%] transition-colors",
        active
          ? "bg-ink text-paper"
          : "text-ink-light hover:bg-paper-dark hover:text-ink",
      ].join(" ")}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>
        <LocalizedText ru={labelRu} en={labelEn} />
      </span>
    </button>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "light") return <SunIcon />;
  if (theme === "dark") return <MoonIcon />;
  return <SystemIcon />;
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M9 20h6" />
      <path d="M12 16v4" />
    </svg>
  );
}
