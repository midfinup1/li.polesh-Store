"use client";

import { useState } from "react";
import { LocalizedText } from "@/components/localized-text";
import { OrderForm } from "@/components/order-form";
import { useSiteSettings } from "@/lib/site-settings";
import { pickLocalized } from "@/lib/i18n";

type ArtworkReservePanelProps = {
  artworkId: number;
  disabled?: boolean;
  comment?: string | null;
  commentEn?: string | null;
};

export function ArtworkReservePanel({
  artworkId,
  disabled = false,
  comment,
  commentEn,
}: ArtworkReservePanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const { language } = useSiteSettings();
  const localizedComment = pickLocalized(language, comment, commentEn);

  return (
    <div>
      {!formOpen && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setFormOpen(true)}
          className="mt-6 flex h-[52px] w-full items-center justify-center rounded-[8px] bg-ink px-6 text-[16px] font-medium leading-[150%] text-paper shadow-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LocalizedText ru="Забронировать" en="Reserve" />
        </button>
      )}

      {localizedComment && !formOpen && (
        <p className="mt-6 text-[16px] font-medium leading-[150%] text-ink-light">
          {localizedComment}
        </p>
      )}

      {disabled && !formOpen && (
        <p className="mt-6 text-[16px] font-medium leading-[150%] text-ink-light">
          <LocalizedText
            ru="Эта работа сейчас недоступна для заявки."
            en="This artwork is currently unavailable for request."
          />
        </p>
      )}

      {formOpen && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="mb-5 text-[16px] font-medium leading-[150%] text-ink-light transition-colors hover:text-ink"
          >
            ← <LocalizedText ru="Назад" en="Back" />
          </button>

          <OrderForm artworkId={artworkId} disabled={disabled} />
        </div>
      )}
    </div>
  );
}
