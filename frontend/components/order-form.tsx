"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/lib/site-settings";

type OrderFormProps = {
  artworkId: number;
  disabled?: boolean;
};

export function OrderForm({ artworkId, disabled = false }: OrderFormProps) {
  const { t } = useSiteSettings();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || status === "sending") return;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const message = String(form.get("message") || "").trim();
    const consent = form.get("consent") === "on";

    if (!consent) {
      setStatus("error");
      setError(t.order.consentError);
      return;
    }

    try {
      setStatus("sending");
      setError("");

      await api.orders.create({ artwork_id: artworkId, name, email, phone, message });

      event.currentTarget.reset();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t.order.submitError);
    }
  }

  const fieldClass =
    "w-full rounded-[8px] border border-border bg-transparent px-4 py-3 text-[16px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink";

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-[24px] font-semibold leading-[120%] tracking-[-0.02em] text-ink">
        {t.order.title}
      </h2>
      <p className="text-[16px] font-medium leading-[150%] text-ink-light">
        {t.order.description}
      </p>

      <input
        required
        name="name"
        placeholder={t.order.name}
        className={fieldClass}
        disabled={disabled || status === "sending"}
      />
      <input
        required
        name="email"
        type="email"
        placeholder={t.order.email}
        className={fieldClass}
        disabled={disabled || status === "sending"}
      />
      <input
        name="phone"
        placeholder={t.order.phone}
        className={fieldClass}
        disabled={disabled || status === "sending"}
      />
      <textarea
        name="message"
        rows={4}
        placeholder={t.order.message}
        className={fieldClass}
        disabled={disabled || status === "sending"}
      />

      <label className="flex items-start gap-3 text-[14px] font-medium leading-[150%] text-ink-light">
        <input
          required
          name="consent"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded-[8px]"
          disabled={disabled || status === "sending"}
        />
        <span>
          {t.order.consentBefore}{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-4">
            {t.order.privacy}
          </Link>
          .
        </span>
      </label>

      <button
        disabled={disabled || status === "sending"}
        className="flex h-[52px] w-full items-center justify-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity disabled:opacity-50"
      >
        {status === "sending" ? t.order.sending : t.order.submit}
      </button>

      {disabled && <p className="text-[16px] font-medium leading-[150%] text-ink-light">{t.order.disabled}</p>}
      {status === "success" && <p className="text-[16px] font-medium leading-[150%] text-ink-light">{t.order.success}</p>}
      {status === "error" && error && <p className="text-[16px] font-medium leading-[150%] text-red-600">{error}</p>}
    </form>
  );
}
