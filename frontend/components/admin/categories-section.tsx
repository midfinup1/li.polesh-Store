import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Category } from "@/types";
import { SortableNameSection } from "@/components/admin/sortable-name-section";

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
  onPreviewCategories,
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
  onPreviewCategories: (ids: number[]) => void;
  onReorderCategories: (ids: number[]) => void;
  onDeleteCategory: (category: Category) => void;
}) {
  return (
    <SortableNameSection
      title="Категории"
      items={categories}
      editingId={editingCategoryId}
      draft={categoryDraft}
      saving={saving}
      onCreate={onCreateCategory}
      onSetDraft={onSetCategoryDraft}
      onSaveEdit={onSaveCategoryEdit}
      onCancelEdit={onCancelEditCategory}
      onStartEdit={onStartEditCategory}
      onPreviewOrder={onPreviewCategories}
      onCommitOrder={onReorderCategories}
      onDelete={onDeleteCategory}
    />
  );
}
