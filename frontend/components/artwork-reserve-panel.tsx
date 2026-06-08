"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { LocalizedText } from "@/components/localized-text";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/lib/site-settings";
import type { Order } from "@/types";

type ArtworkReservePanelProps = {
  artworkId: number;
  disabled?: boolean;
  sold?: boolean;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

function pick(language: string, ru: string, en: string) {
  return language === "en" ? en : ru;
}

export function ArtworkReservePanel({
  artworkId,
  disabled = false,
  sold = false,
}: ArtworkReservePanelProps) {
  const { language } = useSiteSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const isSubmitDisabled = useMemo(
    () => state === "submitting" || !privacyAccepted,
    [state, privacyAccepted],
  );

  function openForm() {
    if (disabled) {
      return;
    }

    setIsOpen(true);
    setState("idle");
    setCreatedOrder(null);
    setPrivacyAccepted(false);
  }

  function closeForm() {
    if (state === "submitting") {
      return;
    }

    setIsOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!privacyAccepted) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !phone) {
      setState("error");
      return;
    }

    setState("submitting");

    try {
      const order = await api.orders.create({
        artwork_id: artworkId,
        name,
        email: "no-email@lipolesh.art",
        phone,
        message,
      });

      setCreatedOrder(order);
      setState("success");
      form.reset();
      setPrivacyAccepted(false);
    } catch {
      setState("error");
    }
  }

  if (sold) {
    return (
      <p className="text-[16px] font-medium leading-[150%] text-ink-light">
        <LocalizedText
          ru="Эта работа уже продана."
          en="This artwork has already been sold."
        />
      </p>
    );
  }

  if (disabled) {
    return (
      <p className="text-[16px] font-medium leading-[150%] text-ink-light">
        <LocalizedText
          ru="Эта работа сейчас недоступна для заявки."
          en="This artwork is currently unavailable for requests."
        />
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={openForm}
        className="flex h-[52px] w-full items-center justify-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80"
      >
        <LocalizedText ru="Забронировать" en="Reserve" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8"
          onMouseDown={closeForm}
        >
          <div
            className="w-full max-w-[640px] rounded-[8px] bg-paper p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
                  <LocalizedText ru="Оставить заявку" en="Send a request" />
                </h2>

                <p className="mt-3 text-[16px] font-normal leading-[150%] text-ink-light">
                  <LocalizedText
                    ru="Оставьте контакт, и художница свяжется с вами лично, чтобы обсудить работу и возможное приобретение."
                    en="Leave your contact details, and the artist will get in touch with you personally to discuss the artwork and possible purchase."
                  />
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-[8px] border border-border px-3 py-1 text-[16px] font-medium leading-[150%] text-ink-light transition-colors hover:border-ink/40 hover:text-ink"
              >
                ×
              </button>
            </div>

            {state === "success" ? (
              <div className="mt-8 rounded-[8px] border border-border p-5">
                <p className="text-[18px] font-semibold leading-[150%] text-ink">
                  <LocalizedText ru="Заявка отправлена" en="Request sent" />
                </p>

                <p className="mt-3 text-[16px] font-medium leading-[150%] text-ink-light">
                  <LocalizedText
                    ru={`Номер заявки: ${
                      createdOrder?.id ?? ""
                    }. Художница свяжется с вами в ближайшее время.`}
                    en={`Request number: ${
                      createdOrder?.id ?? ""
                    }. The artist will contact you soon.`}
                  />
                </p>

                <button
                  type="button"
                  onClick={closeForm}
                  className="mt-6 inline-flex h-[44px] items-center rounded-[8px] bg-ink px-5 text-[16px] font-medium leading-[150%] text-paper transition-opacity hover:opacity-80"
                >
                  <LocalizedText ru="Закрыть" en="Close" />
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-4">
                <input
                  required
                  name="name"
                  placeholder={pick(language, "Имя", "Name")}
                  className="h-[52px] w-full rounded-[8px] border border-border bg-transparent px-4 text-[16px] font-medium leading-[150%] outline-none placeholder:text-ink-light focus:border-ink/40"
                />

                <input
                  required
                  name="phone"
                  placeholder={pick(
                    language,
                    "Telegram, телефон или другой контакт",
                    "Telegram, phone or another contact",
                  )}
                  className="h-[52px] w-full rounded-[8px] border border-border bg-transparent px-4 text-[16px] font-medium leading-[150%] outline-none placeholder:text-ink-light focus:border-ink/40"
                />

                <textarea
                  name="message"
                  placeholder={pick(language, "Комментарий", "Comment")}
                  rows={5}
                  className="w-full rounded-[8px] border border-border bg-transparent px-4 py-3 text-[16px] font-medium leading-[150%] outline-none placeholder:text-ink-light focus:border-ink/40"
                />

                <label className="flex items-start gap-3 text-[14px] font-medium leading-[150%] text-ink-light">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) =>
                      setPrivacyAccepted(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-ink"
                  />

                  <span>
                    <LocalizedText
                      ru="Я согласен на обработку персональных данных и ознакомлен с "
                      en="I agree to the processing of personal data and have read the "
                    />

                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-ink underline underline-offset-4"
                    >
                      <LocalizedText
                        ru="политикой конфиденциальности"
                        en="privacy policy"
                      />
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={[
                    "flex h-[52px] w-full items-center justify-center rounded-[8px] px-6 text-[16px] font-medium leading-[150%] shadow-sm transition-colors",
                    isSubmitDisabled
                      ? "cursor-not-allowed bg-[#8A8A8A] text-white"
                      : "bg-ink text-paper hover:opacity-80",
                  ].join(" ")}
                >
                  {state === "submitting" ? (
                    <LocalizedText ru="Отправляем..." en="Sending..." />
                  ) : (
                    <LocalizedText ru="Оставить заявку" en="Send request" />
                  )}
                </button>

                {state === "error" && (
                  <p className="text-[16px] font-medium leading-[150%] text-red-600">
                    <LocalizedText
                      ru="Не удалось отправить заявку. Попробуйте позже."
                      en="Failed to send the request. Please try again later."
                    />
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}