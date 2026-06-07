"use client";

import { useState } from "react";
import { LocalizedText } from "@/components/localized-text";
import { OrderForm } from "@/components/order-form";

type ArtworkReservePanelProps = {
  artworkId: number;
  disabled?: boolean;
  comment?: string | null;
};

export function ArtworkReservePanel({
  artworkId,
  disabled = false,
  comment,
}: ArtworkReservePanelProps) {
  const [formOpen, setFormOpen] = useState(false);

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

      {comment && !formOpen && (
        <p className="mt-6 text-[16px] font-medium leading-[150%] text-ink-light">
          {comment}
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
