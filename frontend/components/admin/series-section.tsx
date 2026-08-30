import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Series } from "@/types";
import { SortableNameSection } from "@/components/admin/sortable-name-section";

export function AdminSeriesSection({
  series,
  editingSeriesId,
  seriesDraft,
  saving,
  onCreateSeries,
  onSetSeriesDraft,
  onSaveSeriesEdit,
  onCancelSeriesEdit,
  onStartSeriesEdit,
  onPreviewSeries,
  onReorderSeries,
  onDeleteSeries,
}: {
  series: Series[];
  editingSeriesId: number | null;
  seriesDraft: Series | null;
  saving: boolean;
  onCreateSeries: (event: FormEvent<HTMLFormElement>) => void;
  onSetSeriesDraft: Dispatch<SetStateAction<Series | null>>;
  onSaveSeriesEdit: () => void;
  onCancelSeriesEdit: () => void;
  onStartSeriesEdit: (series: Series) => void;
  onPreviewSeries: (ids: number[]) => void;
  onReorderSeries: (ids: number[]) => void;
  onDeleteSeries: (series: Series) => void;
}) {
  return (
    <SortableNameSection
      title="Серии"
      items={series}
      editingId={editingSeriesId}
      draft={seriesDraft}
      saving={saving}
      onCreate={onCreateSeries}
      onSetDraft={onSetSeriesDraft}
      onSaveEdit={onSaveSeriesEdit}
      onCancelEdit={onCancelSeriesEdit}
      onStartEdit={onStartSeriesEdit}
      onPreviewOrder={onPreviewSeries}
      onCommitOrder={onReorderSeries}
      onDelete={onDeleteSeries}
    />
  );
}
