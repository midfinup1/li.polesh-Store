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
        "Настоящая политика описывает порядок обработки персональных данных пользователей сайта lipolesh.art. Сайт является каталогом работ художницы и используется для просмотра работ, получения информации о художнице и отправки заявок на обратную связь.\n\nИспользуя форму заявки на сайте, пользователь подтверждает согласие на обработку персональных данных в соответствии с настоящей политикой.",
      s2Title: "2. Какие данные собираются",
      s2Text:
        "Через форму заявки пользователь может передать имя, контакт для связи, включая телефон, Telegram, адрес электронной почты или иной указанный пользователем способ связи, а также комментарий к заявке.\n\nТакже сайт может автоматически фиксировать технические данные, связанные с использованием сайта: адрес просмотренной страницы, тип события, например просмотр страницы или клик по категории, дату и время события, user-agent браузера и referrer. Эти данные используются для внутренней статистики работы сайта и не предназначены для идентификации конкретного пользователя.",
      s3Title: "3. Цели обработки",
      s3Text:
        "Персональные данные используются только для связи с пользователем по поводу выбранной работы, уточнения деталей заявки и дальнейшего личного общения между пользователем и художницей.\n\nТехнические данные используются для внутренней аналитики: оценки просмотров страниц, интереса к работам и улучшения структуры сайта.",
      s4Title: "4. Покупка работ",
      s4Text:
        "Сайт не принимает оплату и не оформляет покупку автоматически. Пользователь оставляет контактные данные, после чего художница или администратор сайта связывается с ним лично. Условия приобретения, оплаты, передачи или доставки работы обсуждаются индивидуально вне сайта.",
      s5Title: "5. Хранение данных",
      s5Text:
        "Данные заявок хранятся в базе данных сайта и доступны только администратору сайта. Данные не публикуются в открытом доступе.\n\nДанные хранятся до достижения целей обработки, удаления заявки администратором либо до получения запроса пользователя на удаление данных, если дальнейшее хранение не требуется по закону.",
      s6Title: "6. Передача данных третьим лицам",
      s6Text:
        "Данные не передаются третьим лицам для самостоятельного использования, продажи или рекламной рассылки.\n\nПри отправке заявки данные могут использоваться для формирования уведомления администратору сайта в Telegram. Также данные могут обрабатываться техническими сервисами, обеспечивающими работу сайта, базы данных, хостинга и хранения файлов, только в объёме, необходимом для работы сайта.\n\nПередача данных государственным органам возможна только в случаях, предусмотренных законом.",
      s7Title: "7. Защита данных",
      s7Text:
        "Администратор сайта принимает разумные технические и организационные меры для защиты данных от несанкционированного доступа, изменения, раскрытия или уничтожения.",
      s8Title: "8. Права пользователя",
      s8Text:
        "Пользователь может запросить уточнение, удаление или прекращение обработки своих персональных данных, направив обращение через контактные данные, указанные на странице «Об авторе», в разделе «Контакты».",
      s9Title: "9. Контакты",
      s9Text:
        "По вопросам обработки персональных данных можно связаться с администратором сайта через контактные данные, указанные на странице «Об авторе», в разделе «Контакты».",
    },
    personalData: {
      title: "Согласие на обработку персональных данных",
      s1Title: "1. Согласие пользователя",
      s1Text:
        "Отправляя заявку на сайте lipolesh.art, пользователь свободно, своей волей и в своём интересе даёт согласие на обработку персональных данных, указанных в форме заявки, в соответствии с Политикой конфиденциальности сайта.",
      s2Title: "2. Состав данных",
      s2Text:
        "Обрабатываются данные, которые пользователь самостоятельно указывает в форме заявки: имя, контакт для связи, включая телефон, Telegram, адрес электронной почты или иной указанный пользователем способ связи, а также комментарий к заявке.",
      s3Title: "3. Цель обработки",
      s3Text:
        "Данные используются для того, чтобы художница или администратор сайта могли связаться с пользователем по поводу выбранной работы, уточнить детали заявки и обсудить дальнейшее общение лично.",
      s4Title: "4. Действия с персональными данными",
      s4Text:
        "В рамках обработки персональных данных могут выполняться следующие действия: получение, запись, хранение, уточнение, использование, передача через технические сервисы, необходимые для работы сайта и уведомлений, удаление.",
      s5Title: "5. Характер сайта",
      s5Text:
        "Сайт не является платёжной системой и не оформляет покупку автоматически. Отправка заявки означает только запрос на обратную связь. Условия приобретения, оплаты, передачи или доставки работы обсуждаются индивидуально вне сайта.",
      s6Title: "6. Уведомления",
      s6Text:
        "При отправке заявки данные могут использоваться для формирования уведомления администратору сайта в Telegram. Уведомление нужно только для оперативной обработки заявки.",
      s7Title: "7. Срок действия согласия",
      s7Text:
        "Согласие действует до достижения цели обработки, удаления заявки администратором либо до момента отзыва согласия пользователем, если дальнейшее хранение данных не требуется по закону.",
      s8Title: "8. Отзыв согласия",
      s8Text:
        "Пользователь может отозвать согласие, а также запросить уточнение или удаление своих персональных данных, связавшись с администратором сайта через контактные данные, указанные на странице «Об авторе», в разделе «Контакты».",
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
    privacy: {
      title: "Privacy policy",
      s1Title: "1. General provisions",
      s1Text:
        "This policy describes how the personal data of lipolesh.art users is processed. The website is an artist catalog and is used to view artworks, obtain information about the artist and send contact requests.\n\nBy using the request form on the website, the user confirms consent to the processing of personal data in accordance with this policy.",
      s2Title: "2. Data collected",
      s2Text:
        "Through the request form, the user may provide their name, contact details, including phone number, Telegram, email address or another contact method specified by the user, as well as a request comment.\n\nThe website may also automatically record technical data related to the use of the website: the address of the viewed page, the type of event, such as a page view or category click, the date and time of the event, the browser user-agent and referrer. This data is used for internal website statistics and is not intended to identify a specific user.",
      s3Title: "3. Purposes of processing",
      s3Text:
        "Personal data is used only to contact the user regarding the selected artwork, clarify request details and continue personal communication between the user and the artist.\n\nTechnical data is used for internal analytics: to assess page views, interest in artworks and improve the website structure.",
      s4Title: "4. Artwork purchase",
      s4Text:
        "The website does not accept payments and does not complete purchases automatically. The user leaves contact details, after which the artist or website administrator contacts them personally. Purchase, payment, handover or delivery terms are discussed individually outside the website.",
      s5Title: "5. Data storage",
      s5Text:
        "Request data is stored in the website database and is available only to the website administrator. The data is not published publicly.\n\nData is stored until the purposes of processing are achieved, until the request is deleted by the administrator, or until the user requests deletion of the data, unless further storage is required by law.",
      s6Title: "6. Transfer to third parties",
      s6Text:
        "Data is not transferred to third parties for independent use, sale or advertising mailing.\n\nWhen a request is submitted, the data may be used to generate a notification to the website administrator in Telegram. The data may also be processed by technical services that ensure the operation of the website, database, hosting and file storage, only to the extent necessary for the website to operate.\n\nData may be transferred to government authorities only in cases provided by law.",
      s7Title: "7. Data protection",
      s7Text:
        "The website administrator takes reasonable technical and organizational measures to protect data from unauthorized access, alteration, disclosure or destruction.",
      s8Title: "8. User rights",
      s8Text:
        "The user may request clarification, deletion or termination of the processing of their personal data by contacting the website administrator using the contact details specified on the About page, in the Contacts section.",
      s9Title: "9. Contacts",
      s9Text:
        "For questions about personal data processing, contact the website administrator using the contact details specified on the About page, in the Contacts section.",
    },
    personalData: {
      title: "Consent to personal data processing",
      s1Title: "1. User consent",
      s1Text:
        "By submitting a request on lipolesh.art, the user freely, voluntarily and in their own interest consents to the processing of the personal data specified in the request form in accordance with the website Privacy Policy.",
      s2Title: "2. Data scope",
      s2Text:
        "The data processed includes the data that the user independently provides in the request form: name, contact details, including phone number, Telegram, email address or another contact method specified by the user, as well as a request comment.",
      s3Title: "3. Purpose of processing",
      s3Text:
        "The data is used so that the artist or website administrator can contact the user regarding the selected artwork, clarify request details and discuss further communication personally.",
      s4Title: "4. Actions with personal data",
      s4Text:
        "The following actions may be performed with personal data as part of processing: collection, recording, storage, clarification, use, transfer through technical services required for website operation and notifications, and deletion.",
      s5Title: "5. Nature of the website",
      s5Text:
        "The website is not a payment system and does not complete purchases automatically. Submitting a request only means asking for contact. Purchase, payment, handover or delivery terms are discussed individually outside the website.",
      s6Title: "6. Notifications",
      s6Text:
        "When a request is submitted, the data may be used to generate a notification to the website administrator in Telegram. The notification is needed only for prompt request processing.",
      s7Title: "7. Consent term",
      s7Text:
        "The consent remains valid until the purpose of processing is achieved, until the request is deleted by the administrator, or until consent is withdrawn by the user, unless further data storage is required by law.",
      s8Title: "8. Withdrawal of consent",
      s8Text:
        "The user may withdraw consent and request clarification or deletion of their personal data by contacting the website administrator using the contact details specified on the About page, in the Contacts section.",
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