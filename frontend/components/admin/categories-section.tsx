import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Category } from "@/types";
import {
  buttonClassName,
  dangerButtonClassName,
  inputClassName,
  secondaryButtonClassName,
  smallInputClassName,
} from "@/components/admin/forms";

export function AdminCategoriesSection({
  categories,
  editingCategoryId,
  categoryDraft,
  saving,
  onCreateCategory,
  onSetCategoryDraft,
  onSaveCategoryEdit,
  onCancelEditCategory,
  onStartEditCategory,
  onReorderCategories,
  onDeleteCategory,
}: {
  categories: Category[];
  editingCategoryId: number | null;
  categoryDraft: Category | null;
  saving: boolean;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void;
  onSetCategoryDraft: Dispatch<SetStateAction<Category | null>>;
  onSaveCategoryEdit: () => void;
  onCancelEditCategory: () => void;
  onStartEditCategory: (category: Category) => void;
  onReorderCategories: (fromIndex: number, toIndex: number) => void;
  onDeleteCategory: (category: Category) => void;
}) {
  return (
    <section className="mt-6 rounded-[8px] border border-border p-4">
      <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
        Категории
      </h2>
      <p className="mt-1 text-[14px] font-medium leading-[150%] text-ink-light">
        Адрес категории формируется автоматически из английского названия.
      </p>

      <form
        onSubmit={onCreateCategory}
        className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
      >
        <input required name="name" placeholder="Название RU" className={inputClassName} />
        <input name="name_en" placeholder="Название EN" className={inputClassName} />
        <button type="submit" disabled={saving} className={buttonClassName}>
          Добавить
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {categories.map((category, index) => (
          <div key={category.id} className="rounded-[8px] border border-border p-3">
            {editingCategoryId === category.id && categoryDraft ? (
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <input
                  value={categoryDraft.name}
                  onChange={(event) =>
                    onSetCategoryDraft({ ...categoryDraft, name: event.target.value })
                  }
                  placeholder="Название RU"
                  className={smallInputClassName}
                />
                <input
                  value={categoryDraft.name_en}
                  onChange={(event) =>
                    onSetCategoryDraft({ ...categoryDraft, name_en: event.target.value })
                  }
                  placeholder="Название EN"
                  className={smallInputClassName}
                />
                <button type="button" onClick={onSaveCategoryEdit} className={buttonClassName}>
                  Сохранить
                </button>
                <button type="button" onClick={onCancelEditCategory} className={secondaryButtonClassName}>
                  Отмена
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[16px] font-semibold leading-[150%] text-ink">
                    {category.name}
                  </p>
                  <p className="text-[14px] font-medium leading-[150%] text-ink-light">
                    EN: {category.name_en || "не заполнено"} · порядок: {category.sort_order}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onReorderCategories(index, index - 1)}
                    className={`${secondaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === categories.length - 1}
                    onClick={() => onReorderCategories(index, index + 1)}
                    className={`${secondaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label="Переместить вниз"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartEditCategory(category)}
                    className={secondaryButtonClassName}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category)}
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
