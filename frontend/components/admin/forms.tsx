/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";

export const inputClassName =
  "w-full rounded-[8px] border border-border bg-transparent px-4 py-3 text-[16px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

export const smallInputClassName =
  "w-full rounded-[8px] border border-border bg-transparent px-3 py-2 text-[15px] font-medium leading-[150%] outline-none transition-colors placeholder:text-ink-light focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonClassName =
  "inline-flex h-[42px] items-center justify-center rounded-[8px] bg-ink px-4 text-[15px] font-medium leading-[150%] text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClassName =
  "inline-flex h-[42px] items-center justify-center rounded-[8px] border border-border px-4 text-[15px] font-medium leading-[150%] transition-colors hover:border-ink/40";

export const dangerButtonClassName =
  "inline-flex h-[42px] items-center justify-center rounded-[8px] border border-red-600 px-4 text-[15px] font-medium leading-[150%] text-red-600 transition-opacity hover:opacity-70";

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[8px] px-4 py-2 text-[15px] font-semibold leading-[150%] transition-colors",
        active ? "bg-ink text-paper" : "bg-paper-dark text-ink hover:bg-border",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function AdminState({
  loading,
  error,
  empty,
  loadingText,
  errorText,
  emptyText,
}: {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  loadingText: string;
  errorText?: string;
  emptyText: string;
}) {
  if (loading) {
    return (
      <div className="mt-6 rounded-[8px] border border-border p-4">
        <p className="text-[15px] font-medium leading-[150%] text-ink-light">
          {loadingText}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-[8px] bg-paper-dark" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-6 rounded-[8px] border border-red-200 bg-red-50 p-4 text-[15px] font-medium leading-[150%] text-red-700">
        {errorText || error}
      </p>
    );
  }

  if (empty) {
    return (
      <p className="mt-6 rounded-[8px] bg-paper-dark p-4 text-[15px] font-medium leading-[150%] text-ink-light">
        {emptyText}
      </p>
    );
  }

  return null;
}

export function PhotoUploadCard({
  title,
  imageUrl,
  loading,
  onChange,
}: {
  title: string;
  imageUrl: string;
  loading: boolean;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-[8px] border border-border p-3">
      <p className="text-[15px] font-semibold leading-[150%] text-ink">
        {title}
      </p>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="mt-3 h-40 w-full rounded-[8px] object-cover"
        />
      ) : (
        <div className="mt-3 flex h-40 items-center justify-center rounded-[8px] bg-paper-dark text-[14px] text-ink-light">
          Фото не загружено
        </div>
      )}
      <label className="mt-3 inline-flex cursor-pointer rounded-[8px] border border-border px-4 py-2 text-[14px] font-medium transition-colors hover:border-ink/40">
        {loading ? "Загрузка..." : "Загрузить файл"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={(event) => onChange(event.target.files?.[0])}
          className="hidden"
        />
      </label>
    </div>
  );
}