"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSiteSettings } from "@/lib/site-settings";
import { api } from "@/lib/api";

type OrderFormProps = {
  artworkId: number;
  disabled?: boolean;
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

const dictionary = {
  ru: {
    title: "Оставить заявку",
    description:
      "Оставьте контакт, и художница свяжется с вами лично, чтобы обсудить работу и возможное приобретение.",
    name: "Ваше имя",
    contact: "Укажите желаемый способ связи",
    message: "Комментарий",
    consentStart: "Я согласен на обработку персональных данных и ознакомлен с",
    privacy: "политикой конфиденциальности",
    submit: "Оставить заявку",
    loading: "Отправка...",
    success: "Заявка отправлена. Художница свяжется с вами.",
    error: "Не удалось отправить заявку. Попробуйте позже.",
    validation: "Заполните имя, контакт и подтвердите согласие.",
    disabled: "Эта работа сейчас недоступна для заявки.",
  },
  en: {
    title: "Leave a request",
    description:
      "Leave your contact, and the artist will contact you personally to discuss the artwork and possible acquisition.",
    name: "Your name",
    contact: "Preferred contact method",
    message: "Comment",
    consentStart:
      "I agree to the processing of personal data and have read the",
    privacy: "privacy policy",
    submit: "Leave a request",
    loading: "Sending...",
    success: "Request sent. The artist will contact you.",
    error: "Could not send the request. Please try again later.",
    validation: "Please fill in your name, contact and confirm consent.",
    disabled: "This artwork is currently unavailable for request.",
  },
};

export function OrderForm({ artworkId, disabled = false }: OrderFormProps) {
  const { language } = useSiteSettings();
  const t = dictionary[language];

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    if (disabled || status === "loading") {
      return;
    }

    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const contact = String(formData.get("contact") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const consent = formData.get("consent") === "on";

    if (!name || !contact || !consent) {
      setStatus("error");
      setError(t.validation);
      return;
    }

    setStatus("loading");
    setError("");

    try {
      await api.orders.create({
        artwork_id: artworkId,
        name,
        email: "no-email@lipolesh.art",
        phone: contact,
        message,
      });

      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
      setError(t.error);
    }
  }

  return (
    <form onSubmit={onSubmit} autoComplete="off" className="space-y-7">
      <div>
        <h2 className="text-[18px] font-semibold leading-[120%] tracking-[-0.02em] text-ink">
          {t.title}
        </h2>

        <p className="mt-5 max-w-[760px] text-[16px] font-medium leading-[150%] text-ink-light">
          {t.description}
        </p>
      </div>

      <input
        name="name"
        type="text"
        required
        autoComplete="off"
        disabled={disabled || status === "loading"}
        placeholder={t.name}
        className={inputClassName}
      />

      <input
        name="contact"
        type="text"
        required
        autoComplete="off"
        disabled={disabled || status === "loading"}
        placeholder={t.contact}
        className={inputClassName}
      />

      <textarea
        name="message"
        rows={5}
        autoComplete="off"
        disabled={disabled || status === "loading"}
        placeholder={t.message}
        className={inputClassName}
      />

      <label className="flex items-start gap-3 text-[14px] font-medium leading-[150%] text-ink-light">
        <input
          name="consent"
          type="checkbox"
          required
          disabled={disabled || status === "loading"}
          className="mt-1 h-4 w-4 rounded-[4px] border border-border bg-transparent accent-current"
        />

        <span>
          {t.consentStart}{" "}
          <Link
            href="/privacy"
            className="text-ink underline underline-offset-4"
          >
            {t.privacy}
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={disabled || status === "loading"}
        className="flex h-[52px] w-full items-center justify-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? t.loading : t.submit}
      </button>

      {disabled && (
        <p className="text-[16px] font-medium leading-[150%] text-ink-light">
          {t.disabled}
        </p>
      )}

      {status === "success" && (
        <p className="text-[16px] font-medium leading-[150%] text-ink-light">
          {t.success}
        </p>
      )}

      {status === "error" && error && (
        <p className="text-[16px] font-medium leading-[150%] text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

const inputClassName =
  "w-full rounded-[8px] border border-border bg-transparent px-4 py-3 text-[16px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";