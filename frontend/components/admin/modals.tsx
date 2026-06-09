import type { DeleteTarget } from "@/components/admin/types";
import { secondaryButtonClassName } from "@/components/admin/forms";

export function ConfirmDeleteModal({
  target,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title =
    target.type === "category"
      ? `Удалить категорию «${target.category.name}»?`
      : target.type === "artwork"
        ? `Удалить работу «${target.artwork.title}»?`
        : target.type === "order"
          ? `Удалить заявку #${target.order.id}?`
          : "Удалить изображение?";

  const description =
    target.type === "category"
      ? "Работы из этой категории останутся в системе, но потеряют привязку к категории."
      : target.type === "artwork"
        ? "Если по работе есть активные заявки в статусе «Новая» или «Связались», удалить работу нельзя. Сначала завершите или отмените эти заявки. Если по работе есть только завершённые или отменённые заявки, они будут удалены вместе с работой."
        : target.type === "order"
          ? "Заявка будет удалена из админки и базы данных. Это действие нельзя отменить."
          : "Изображение будет удалено из работы. Это действие нельзя отменить.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-[12px] border border-border bg-paper p-6 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[22px] font-semibold leading-[120%] text-ink">
          {title}
        </h2>

        <p className="mt-3 whitespace-pre-line text-[15px] font-medium leading-[150%] text-ink-light">
          {description}
        </p>

        {target.type === "artwork" && (
          <div className="mt-4 rounded-[8px] border border-border bg-paper-dark/40 p-3 text-[14px] font-medium leading-[150%] text-ink-light">
            <p>Удаление разрешено только если у работы нет активных заявок.</p>
            <p className="mt-2">Активные заявки: «Новая» и «Связались».</p>
            <p className="mt-2">Неактивные заявки: «Завершена» и «Отменена».</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={secondaryButtonClassName}
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-red-600 px-4 text-[15px] font-medium leading-[150%] text-white transition-opacity hover:opacity-80"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}