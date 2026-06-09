"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "ru" | "en";
export type ThemeMode = "light" | "dark" | "system";

export const dictionaries = {
  ru: {
    nav: {
      menu: "Меню",
      close: "Закрыть",
      gallery: "Каталог",
      about: "Об авторе",
      contacts: "Контакты",
      order: "Как заказать",
      privacy: "Политика конфиденциальности",
      personalData: "Обработка персональных данных",
      admin: "Вход для администратора",
      language: "Язык",
      theme: "Тема",
      light: "Светлая",
      dark: "Тёмная",
      system: "Системная",
    },
    common: {
      documents: "Документы",
      navigation: "Навигация",
      contacts: "Контакты",
      noImage: "Нет изображения",
      priceOnRequest: "Цена по запросу",
      sold: "Продано",
      available: "Доступно",
      rub: "₽",
      siteName: "lipolesh.art",
    },
    home: {
      artistFallback: "Елизавета Полещенко",
      photoFallback: "Фото художницы",
      statementTitle: "Artist statement",
      statementFallback:
        "В своей художественной практике я обращаюсь к познанию личного и эмоционального, через анализ мимолетных образов, формируемых внутренним опытом и памятью. Через анималистичные образы раскрываются темы внутреннего напряжения, принятия и уязвимости.",
      viewCatalog: "Смотреть каталог",
      catalog: "Каталог",
      paintings: "картины",
      posters: "постеры",
      ceramics: "керамика",
      empty: "Работы пока не добавлены",
      featured: "Избранные работы",
    },
    gallery: {
      title: "Каталог",
      description: "Оригинальные произведения, доступные для просмотра и заявки.",
      all: "Все",
      empty: "Работы в этой категории пока не опубликованы.",
    },
    about: {
      label: "Об авторе",
      title: "About",
      fallbackName: "Елизавета Полещенко",
      fallbackBio:
        "Здесь будет биография художницы, описание практики и художественного метода.",
    },
    contacts: {
      title: "Контакты",
      description: "По вопросам приобретения работ, выставок и сотрудничества.",
      contactMe: "Связаться",
      social: "Социальные сети",
    },
    howToOrder: {
      title: "Как заказать картину?",
      intro:
        "Стоимость работы зависит от формата, размера, сложности сюжета и сроков выполнения. Для получения подробной информации свяжитесь со мной.",
      button: "Связаться",
      format: "Формат",
      prices: "Цены",
      stepsTitle: "Как проходит заказ",
      step1: "Вы выбираете работу или оставляете заявку на индивидуальный заказ.",
      step2: "Художница связывается с вами лично и уточняет детали.",
      step3: "Оплата, передача или доставка обсуждаются индивидуально вне сайта.",
    },
    artwork: {
      year: "Год",
      materials: "Материалы",
      size: "Размер",
      description: "Описание",
      request: "Заказать",
      note:
        "Заявка не является покупкой. Художница свяжется с вами лично, чтобы обсудить условия приобретения.",
      back: "Назад в каталог",
    },
    order: {
      title: "Оставить заявку",
      description:
        "Оставьте контакты, и художница свяжется с вами лично, чтобы обсудить работу и возможное приобретение.",
      name: "Ваше имя",
      email: "Email",
      phone: "Телефон или Telegram",
      message: "Комментарий",
      consentError: "Необходимо согласие на обработку персональных данных.",
      submitError: "Не удалось отправить заявку. Попробуйте позже.",
      consentBefore:
        "Я согласен на обработку персональных данных и ознакомлен с",
      privacy: "политикой конфиденциальности",
      sending: "Отправка...",
      submit: "Оставить заявку",
      disabled: "Работа сейчас недоступна для заявки.",
      success: "Заявка отправлена. Художница свяжется с вами лично.",
    },
    footer: {
      description:
        "Каталог работ художницы. Для приобретения работы оставьте заявку, после чего художница свяжется с вами лично.",
    },
  },
  en: {
    nav: {
      menu: "Menu",
      close: "Close",
      gallery: "Catalog",
      about: "About",
      contacts: "Contacts",
      order: "How to order",
      privacy: "Privacy policy",
      personalData: "Personal data processing",
      admin: "Admin login",
      language: "Language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    common: {
      documents: "Documents",
      navigation: "Navigation",
      contacts: "Contacts",
      noImage: "No image",
      priceOnRequest: "Price on request",
      sold: "Sold",
      available: "Available",
      rub: "RUB",
      siteName: "lipolesh.art",
    },
    home: {
      artistFallback: "Elizaveta Poleshchenko",
      photoFallback: "Artist photo",
      statementTitle: "Artist statement",
      statementFallback:
        "In her artistic practice, the artist turns to personal and emotional experience through fleeting images, memory and internal states. Animalistic imagery reveals themes of tension, vulnerability and acceptance.",
      viewCatalog: "View catalog",
      catalog: "Catalog",
      paintings: "paintings",
      posters: "posters",
      ceramics: "ceramics",
      empty: "No artworks have been published yet",
      featured: "Featured works",
    },
    gallery: {
      title: "Catalog",
      description: "Original artworks available for viewing and inquiry.",
      all: "All",
      empty: "No artworks have been published in this category yet.",
    },
    about: {
      label: "About",
      title: "About",
      fallbackName: "Elizaveta Poleshchenko",
      fallbackBio:
        "Artist biography, practice description and artistic method will be placed here.",
    },
    contacts: {
      title: "Contacts",
      description: "For artwork inquiries, exhibitions and collaboration.",
      contactMe: "Contact me",
      social: "Social media",
    },
    howToOrder: {
      title: "How to order an artwork?",
      intro:
        "The price depends on format, size, subject complexity and timing. Contact me to discuss details.",
      button: "Contact",
      format: "Format",
      prices: "Prices",
      stepsTitle: "Order process",
      step1: "Choose an existing artwork or leave a request for a custom piece.",
      step2: "The artist contacts you personally and clarifies the details.",
      step3: "Payment, handover or delivery are discussed individually outside the website.",
    },
    artwork: {
      year: "Year",
      materials: "Materials",
      size: "Size",
      description: "Description",
      request: "Request",
      note:
        "A request is not a purchase. The artist will contact you personally to discuss the terms.",
      back: "Back to catalog",
    },
    order: {
      title: "Leave a request",
      description:
        "Leave your contact details, and the artist will contact you personally to discuss the artwork.",
      name: "Your name",
      email: "Email",
      phone: "Phone or Telegram",
      message: "Comment",
      consentError: "Consent to personal data processing is required.",
      submitError: "Failed to send the request. Please try again later.",
      consentBefore:
        "I agree to the processing of personal data and have read the",
      privacy: "privacy policy",
      sending: "Sending...",
      submit: "Leave a request",
      disabled: "This artwork is currently unavailable for requests.",
      success: "Request sent. The artist will contact you personally.",
    },
    footer: {
      description:
        "Artist portfolio. Leave a request, and the artist will contact you personally.",
    },
  },
} as const;

type Dictionary = (typeof dictionaries)[Language];

type SiteSettingsContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: Dictionary;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && systemDark);

  document.documentElement.classList.toggle("dark", isDark);
}

function setClientCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function SiteSettingsProvider({
  children,
  initialLanguage = "ru",
  initialTheme = "system",
}: {
  children: ReactNode;
  initialLanguage?: Language;
  initialTheme?: ThemeMode;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("site-language", language);
    setClientCookie("site-language", language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem("site-theme", theme);
    setClientCookie("site-theme", theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(theme);

    media.addEventListener("change", listener);

    return () => {
      media.removeEventListener("change", listener);
    };
  }, [theme]);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
  }

  function setTheme(nextTheme: ThemeMode) {
    setThemeState(nextTheme);
  }

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      t: dictionaries[language],
    }),
    [language, theme],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  }

  return context;
}