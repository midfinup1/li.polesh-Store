"use client";

import Link from "next/link";
import { useState } from "react";

export function HomeMenu() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<"RU" | "EN">("RU");

  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 md:px-10">
        <Link href="/" className="text-sm font-medium tracking-tight">
          lipolesh.art
        </Link>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setLanguage(language === "RU" ? "EN" : "RU")}
            className="text-sm text-ink-light transition-colors hover:text-ink"
            aria-label="Переключить язык сайта"
          >
            {language}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-ink px-5 py-3 text-sm text-paper transition-opacity hover:opacity-80"
            aria-label="Открыть меню"
          >
            Меню
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-md flex-col bg-paper px-8 py-8 shadow-xl">
            <div className="mb-16 flex items-center justify-between">
              <span className="text-sm font-medium">lipolesh.art</span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-ink-light transition-colors hover:text-ink"
                aria-label="Закрыть меню"
              >
                Закрыть
              </button>
            </div>

            <nav className="flex flex-col gap-6 font-display text-4xl">
              <Link
                href="/gallery"
                onClick={() => setOpen(false)}
                className="transition-opacity hover:opacity-60"
              >
                Галерея
              </Link>

              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="transition-opacity hover:opacity-60"
              >
                О художнице
              </Link>

              <Link
                href="/contacts"
                onClick={() => setOpen(false)}
                className="transition-opacity hover:opacity-60"
              >
                Контакты
              </Link>
            </nav>

            <div className="mt-auto space-y-4 border-t border-ink/10 pt-8 text-sm text-ink-light">
              <Link
                href="/offer"
                onClick={() => setOpen(false)}
                className="block transition-colors hover:text-ink"
              >
                Публичная оферта
              </Link>

              <Link
                href="/privacy"
                onClick={() => setOpen(false)}
                className="block transition-colors hover:text-ink"
              >
                Политика конфиденциальности
              </Link>

              <Link
                href="/personal-data"
                onClick={() => setOpen(false)}
                className="block transition-colors hover:text-ink"
              >
                Обработка персональных данных
              </Link>

              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="block pt-4 transition-colors hover:text-ink"
              >
                Вход для администратора
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}