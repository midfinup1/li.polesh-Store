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
    privacy: {
      title: "Политика конфиденциальности",
      s1Title: "1. Общие положения",
      s1Text:
        "Настоящая политика описывает порядок обработки персональных данных пользователей сайта lipolesh.art. Сайт является каталогом работ художницы и используется для отправки заявок на обратную связь.",
      s2Title: "2. Какие данные собираются",
      s2Text:
        "Через форму заявки пользователь может передать имя, адрес электронной почты, телефон или Telegram, а также комментарий.",
      s3Title: "3. Цели обработки",
      s3Text:
        "Данные используются только для связи с пользователем по поводу выбранной работы, уточнения деталей и дальнейшего личного общения между пользователем и художницей.",
      s4Title: "4. Покупка работ",
      s4Text:
        "Сайт не принимает оплату и не оформляет покупку автоматически. Пользователь оставляет контактные данные, после чего художница связывается с ним лично. Условия приобретения, оплаты, передачи или доставки работы обсуждаются индивидуально вне сайта.",
      s5Title: "5. Хранение данных",
      s5Text:
        "Данные заявок хранятся в базе данных сайта и доступны только администратору сайта. Данные не публикуются в открытом доступе.",
      s6Title: "6. Передача данных третьим лицам",
      s6Text:
        "Данные не передаются третьим лицам, за исключением случаев, когда такая передача необходима по закону.",
      s7Title: "7. Контакты",
      s7Text:
        "По вопросам обработки персональных данных можно связаться с администратором сайта через контактные данные, указанные на странице «Контакты».",
    },
    personalData: {
      title: "Согласие на обработку персональных данных",
      s1Title: "1. Согласие пользователя",
      s1Text:
        "Отправляя заявку на сайте lipolesh.art, пользователь даёт согласие на обработку персональных данных, указанных в форме заявки.",
      s2Title: "2. Состав данных",
      s2Text:
        "Обрабатываются данные, которые пользователь самостоятельно указывает в форме: имя, email, телефон или Telegram, комментарий к заявке.",
      s3Title: "3. Цель обработки",
      s3Text:
        "Данные используются для того, чтобы художница могла связаться с пользователем по поводу выбранной работы и обсудить детали лично.",
      s4Title: "4. Характер сайта",
      s4Text:
        "Сайт не является платёжной системой и не оформляет покупку автоматически. Отправка заявки означает только запрос на обратную связь.",
      s5Title: "5. Срок действия согласия",
      s5Text:
        "Согласие действует до достижения цели обработки или до момента его отзыва пользователем.",
      s6Title: "6. Отзыв согласия",
      s6Text:
        "Пользователь может отозвать согласие, связавшись с администратором сайта через контактные данные, указанные на странице «Контакты».",
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
      rub: "₽",
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
    privacy: {
      title: "Privacy policy",
      s1Title: "1. General provisions",
      s1Text:
        "This policy describes how personal data of lipolesh.art users is processed. The website is an artist catalog and is used to send contact requests.",
      s2Title: "2. Data collected",
      s2Text:
        "Through the request form, users may provide their name, email address, phone number or Telegram, and a comment.",
      s3Title: "3. Purposes of processing",
      s3Text:
        "The data is used only to contact the user regarding the selected artwork and to continue personal communication between the user and the artist.",
      s4Title: "4. Artwork purchase",
      s4Text:
        "The website does not accept payments and does not complete purchases automatically. The user leaves contact details, and the artist contacts them personally. Payment, handover or delivery terms are discussed individually outside the website.",
      s5Title: "5. Data storage",
      s5Text:
        "Requests are stored in the website database and are available only to the website administrator. The data is not published publicly.",
      s6Title: "6. Transfer to third parties",
      s6Text:
        "The data is not transferred to third parties, except when required by law.",
      s7Title: "7. Contacts",
      s7Text:
        "For questions about personal data processing, contact the website administrator using the contact details on the Contacts page.",
    },
    personalData: {
      title: "Consent to personal data processing",
      s1Title: "1. User consent",
      s1Text:
        "By submitting a request on lipolesh.art, the user consents to the processing of the personal data specified in the request form.",
      s2Title: "2. Data scope",
      s2Text:
        "The following data provided by the user may be processed: name, email, phone or Telegram, and request comment.",
      s3Title: "3. Purpose of processing",
      s3Text:
        "The data is used so that the artist can contact the user regarding the selected artwork and discuss the details personally.",
      s4Title: "4. Nature of the website",
      s4Text:
        "The website is not a payment system and does not complete purchases automatically. Submitting a request only means asking for contact.",
      s5Title: "5. Consent term",
      s5Text:
        "The consent remains valid until the purpose of processing is achieved or until it is withdrawn by the user.",
      s6Title: "6. Withdrawal of consent",
      s6Text:
        "The user may withdraw consent by contacting the website administrator using the contact details on the Contacts page.",
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
  if (typeof window === "undefined") return;

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && systemDark);

  document.documentElement.classList.toggle("dark", isDark);
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("site-language");
    const savedTheme = window.localStorage.getItem("site-theme");

    if (savedLanguage === "ru" || savedLanguage === "en") {
      setLanguageState(savedLanguage);
    }

    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("system");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(theme);

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("site-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
  }

  function setTheme(nextTheme: ThemeMode) {
    setThemeState(nextTheme);
    window.localStorage.setItem("site-theme", nextTheme);
    applyTheme(nextTheme);
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
