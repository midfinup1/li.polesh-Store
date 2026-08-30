import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Exhibition } from "@/types";
import {
  buttonClassName,
  dangerButtonClassName,
  inputClassName,
  secondaryButtonClassName,
  smallInputClassName,
} from "@/components/admin/forms";

export function AdminExhibitionsSection({
  exhibitions,
  editingExhibitionId,
  exhibitionDraft,
  saving,
  onCreateExhibition,
  onSetExhibitionDraft,
  onSaveExhibitionEdit,
  onCancelEditExhibition,
  onStartEditExhibition,
  onReorderExhibitions,
  onDeleteExhibition,
}: {
  exhibitions: Exhibition[];
  editingExhibitionId: number | null;
  exhibitionDraft: Exhibition | null;
  saving: boolean;
  onCreateExhibition: (event: FormEvent<HTMLFormElement>) => void;
  onSetExhibitionDraft: Dispatch<SetStateAction<Exhibition | null>>;
  onSaveExhibitionEdit: () => void;
  onCancelEditExhibition: () => void;
  onStartEditExhibition: (exhibition: Exhibition) => void;
  onReorderExhibitions: (fromIndex: number, toIndex: number) => void;
  onDeleteExhibition: (exhibition: Exhibition) => void;
}) {
  return (
    <section className="mt-6 rounded-[8px] bg-paper-dark/35 p-5">
      <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
        Выставки
      </h2>

      <form
        onSubmit={onCreateExhibition}
        className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
      >
        <input required name="name" placeholder="Название RU" className={inputClassName} />
        <input name="name_en" placeholder="Название EN" className={inputClassName} />
        <button type="submit" disabled={saving} className={buttonClassName}>
          Добавить
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {exhibitions.map((exhibition, index) => (
          <div key={exhibition.id} className="rounded-[8px] bg-paper p-3">
            {editingExhibitionId === exhibition.id && exhibitionDraft ? (
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <input
                  value={exhibitionDraft.name}
                  onChange={(event) =>
                    onSetExhibitionDraft({ ...exhibitionDraft, name: event.target.value })
                  }
                  placeholder="Название RU"
                  className={smallInputClassName}
                />
                <input
                  value={exhibitionDraft.name_en}
                  onChange={(event) =>
                    onSetExhibitionDraft({ ...exhibitionDraft, name_en: event.target.value })
                  }
                  placeholder="Название EN"
                  className={smallInputClassName}
                />
                <button type="button" onClick={onSaveExhibitionEdit} className={buttonClassName}>
                  Сохранить
                </button>
                <button type="button" onClick={onCancelEditExhibition} className={secondaryButtonClassName}>
                  Отмена
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[16px] font-semibold leading-[150%] text-ink">
                    {exhibition.name}
                  </p>
                  <p className="text-[14px] font-medium leading-[150%] text-ink-light">
                    EN: {exhibition.name_en || "не заполнено"} · порядок: {exhibition.sort_order}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onReorderExhibitions(index, index - 1)}
                    className={`${secondaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === exhibitions.length - 1}
                    onClick={() => onReorderExhibitions(index, index + 1)}
                    className={`${secondaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label="Переместить вниз"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartEditExhibition(exhibition)}
                    className={secondaryButtonClassName}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteExhibition(exhibition)}
                    className={dangerButtonClassName}
                  >
                    Удалить
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
