import { LocalizedText } from "@/components/localized-text";

export function ReservedBadge() {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-black shadow-[0_4px_18px_rgba(0,0,0,0.16)] backdrop-blur">
      <LocalizedText ru="Забронировано" en="Reserved" />
    </div>
  );
}
