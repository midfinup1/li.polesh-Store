"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export function OrderForm({ artworkId, disabled }: { artworkId: number; disabled: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending"); setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api.orders.create({ artwork_id: artworkId, name: String(data.get("name") || ""), email: String(data.get("email") || ""), phone: String(data.get("phone") || ""), message: String(data.get("message") || "") });
      setState("sent");
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить заявку");
      setState("error");
    }
  }
  if (disabled) return <p className="mt-8 border border-ink/20 p-5 text-ink-light">Эта работа уже продана.</p>;
  if (state === "sent") return <p className="mt-8 border border-ink/20 p-5">Заявка отправлена. Художница свяжется с вами.</p>;
  return (
    <form onSubmit={submit} className="mt-8 space-y-4 border-t border-ink/10 pt-8">
      <h2 className="text-3xl">Запросить покупку</h2>
      <input required name="name" placeholder="Ваше имя" className="w-full border border-ink/20 bg-transparent px-4 py-3" />
      <input required type="email" name="email" placeholder="Email" className="w-full border border-ink/20 bg-transparent px-4 py-3" />
      <input name="phone" placeholder="Телефон или Telegram" className="w-full border border-ink/20 bg-transparent px-4 py-3" />
      <textarea name="message" rows={4} placeholder="Комментарий" className="w-full border border-ink/20 bg-transparent px-4 py-3" />
      {state === "error" && <p className="text-accent">{error}</p>}
      <button disabled={state === "sending"} className="border border-ink bg-ink px-8 py-3 text-paper transition-opacity disabled:opacity-50">{state === "sending" ? "Отправка..." : "Отправить заявку"}</button>
    </form>
  );
}
