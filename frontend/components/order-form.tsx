"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

type OrderFormProps = {
  artworkId: number;
  disabled?: boolean;
};

export function OrderForm({ artworkId, disabled = false }: OrderFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
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
      setError("Необходимо согласие на обработку персональных данных.");
      return;
    }

    try {
      setStatus("sending");
      setError("");

      await api.orders.create({
        artwork_id: artworkId,
        name,
        email,
        phone,
        message,
      });

      event.currentTarget.reset();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось отправить заявку. Попробуйте позже.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 border-t border-ink/10 pt-8">
      <h2 className="text-3xl">Оставить заявку</h2>

      <p className="text-sm leading-6 text-ink-light">
        Оставьте контакты, и художница свяжется с вами лично, чтобы обсудить
        работу и возможное приобретение.
      </p>

      <input
        required
        name="name"
        placeholder="Ваше имя"
        className="w-full border border-ink/20 bg-transparent px-4 py-3"
        disabled={disabled || status === "sending"}
      />

      <input
        required
        name="email"
        type="email"
        placeholder="Email"
        className="w-full border border-ink/20 bg-transparent px-4 py-3"
        disabled={disabled || status === "sending"}
      />

      <input
        name="phone"
        placeholder="Телефон или Telegram"
        className="w-full border border-ink/20 bg-transparent px-4 py-3"
        disabled={disabled || status === "sending"}
      />

      <textarea
        name="message"
        rows={4}
        placeholder="Комментарий"
        className="w-full border border-ink/20 bg-transparent px-4 py-3"
        disabled={disabled || status === "sending"}
      />

      <label className="flex items-start gap-3 text-sm leading-6 text-ink-light">
        <input
          required
          name="consent"
          type="checkbox"
          className="mt-1"
          disabled={disabled || status === "sending"}
        />

        <span>
          Я согласен на обработку персональных данных и ознакомлен с{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-4">
            политикой конфиденциальности
          </Link>
          .
        </span>
      </label>

      <button
        disabled={disabled || status === "sending"}
        className="border border-ink bg-ink px-8 py-3 text-paper transition-opacity disabled:opacity-50"
      >
        {status === "sending" ? "Отправка..." : "Оставить заявку"}
      </button>

      {disabled && (
        <p className="text-sm text-ink-light">
          Работа сейчас недоступна для заявки.
        </p>
      )}

      {status === "success" && (
        <p className="text-sm text-ink-light">
          Заявка отправлена. Художница свяжется с вами лично.
        </p>
      )}

      {status === "error" && error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}