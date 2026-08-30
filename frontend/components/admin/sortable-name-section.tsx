import { useRef, useState } from "react";
import type { Dispatch, DragEvent, FormEvent, SetStateAction } from "react";
import {
  buttonClassName,
  dangerIconButtonClassName,
  iconButtonClassName,
  smallInputClassName,
} from "@/components/admin/forms";
import { moveInArray } from "@/components/admin/helpers";

export interface SortableNameItem {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  sort_order: number;
}

export function SortableNameSection<T extends SortableNameItem>({
  title,
  items,
  editingId,
  draft,
  saving,
  onCreate,
  onSetDraft,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onPreviewOrder,
  onCommitOrder,
  onDelete,
}: {
  title: string;
  items: T[];
  editingId: number | null;
  draft: T | null;
  saving: boolean;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onSetDraft: Dispatch<SetStateAction<T | null>>;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (item: T) => void;
  onPreviewOrder: (ids: number[]) => void;
  onCommitOrder: (ids: number[]) => void;
  onDelete: (item: T) => void;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const draggedIdRef = useRef<number | null>(null);
  const originalOrder = useRef<number[]>([]);
  const dropCommitted = useRef(false);

  function startDrag(itemId: number, event: DragEvent<HTMLDivElement>) {
    originalOrder.current = items.map((item) => item.id);
    dropCommitted.current = false;
    draggedIdRef.current = itemId;
    setDraggedId(itemId);
    event.dataTransfer.effectAllowed = "move";
  }

  function previewAt(targetId: number) {
    const activeId = draggedIdRef.current;
    if (activeId === null || activeId === targetId) {
      return;
    }

    const fromIndex = items.findIndex((item) => item.id === activeId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    const reordered = moveInArray(items, fromIndex, toIndex);

    if (reordered !== items) {
      onPreviewOrder(reordered.map((item) => item.id));
    }
  }

  function commitDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dropCommitted.current = true;
    onCommitOrder(items.map((item) => item.id));
  }

  function endDrag() {
    if (!dropCommitted.current && originalOrder.current.length > 0) {
      onPreviewOrder(originalOrder.current);
    }

    draggedIdRef.current = null;
    setDraggedId(null);
  }

  return (
    <section className="mt-6 p-1 sm:p-2">
      <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
        {title}
      </h2>

      <form
        onSubmit={onCreate}
        className="mt-5 grid items-stretch gap-2 md:grid-cols-[1fr_1fr_132px]"
      >
        <input required name="name" placeholder="Название RU" className={smallInputClassName} />
        <input name="name_en" placeholder="Название EN" className={smallInputClassName} />
        <button type="submit" disabled={saving} className={`${buttonClassName} h-full min-h-11`}>
          Добавить
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={editingId !== item.id && !saving}
            onDragStart={(event) => startDrag(item.id, event)}
            onDragEnter={() => previewAt(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={commitDrop}
            onDragEnd={endDrag}
            className={[
              "rounded-[8px] bg-paper-dark/45 px-3 py-2.5 transition-[opacity,transform] duration-150",
              editingId === item.id ? "" : "cursor-grab active:cursor-grabbing",
              draggedId === item.id ? "opacity-45" : "opacity-100",
            ].join(" ")}
          >
            {editingId === item.id && draft ? (
              <div className="grid items-stretch gap-2 md:grid-cols-[36px_1fr_1fr_auto_auto]">
                <div className="flex items-center justify-center text-[15px] font-semibold text-ink-light">
                  {index + 1}
                </div>
                <input
                  value={draft.name}
                  onChange={(event) => onSetDraft({ ...draft, name: event.target.value })}
                  placeholder="Название RU"
                  className={smallInputClassName}
                />
                <input
                  value={draft.name_en}
                  onChange={(event) => onSetDraft({ ...draft, name_en: event.target.value })}
                  placeholder="Название EN"
                  className={smallInputClassName}
                />
                <button type="button" onClick={onSaveEdit} className={buttonClassName}>
                  Сохранить
                </button>
                <button type="button" onClick={onCancelEdit} className={iconButtonClassName} aria-label="Отмена" title="Отмена">
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2">
                <div className="text-center text-[15px] font-semibold text-ink-light">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold leading-[135%] text-ink">
                    {item.name}
                  </p>
                  {item.name_en && (
                    <p className="mt-0.5 truncate text-[14px] font-medium leading-[140%] text-ink-light">
                      {item.name_en}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onStartEdit(item)}
                    className={iconButtonClassName}
                    aria-label={`Редактировать: ${item.name}`}
                    title="Редактировать"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className={dangerIconButtonClassName}
                    aria-label={`Удалить: ${item.name}`}
                    title="Удалить"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-2">
      <path d="M5 19l3.5-.8L19 7.7 16.3 5 5.8 15.5 5 19Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14.8 6.5 2.7 2.7" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-2">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
