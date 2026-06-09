import { useMemo, useState } from "react";
import type { Order } from "@/types";
import { dangerButtonClassName, secondaryButtonClassName } from "@/components/admin/forms";
import { orderStatusClassName, orderStatusLabel } from "@/components/admin/helpers";

export function AdminOrdersSection({
  orders,
  onUpdateStatus,
  onDeleteOrder,
}: {
  orders: Order[];
  onUpdateStatus: (orderId: number, status: Order["status"]) => void;
  onDeleteOrder: (order: Order) => void;
}) {
  const [collapsedOrderIds, setCollapsedOrderIds] = useState<
    Record<number, boolean>
  >({});

  const allOrderIds = useMemo(() => orders.map((order) => order.id), [orders]);

  function toggleOrder(orderId: number) {
    setCollapsedOrderIds((current) => ({
      ...current,
      [orderId]: !current[orderId],
    }));
  }

  function collapseAllOrders() {
    setCollapsedOrderIds(
      allOrderIds.reduce<Record<number, boolean>>((result, orderId) => {
        result[orderId] = true;
        return result;
      }, {}),
    );
  }

  function expandAllOrders() {
    setCollapsedOrderIds({});
  }

  return (
    <section className="mt-6 rounded-[8px] border border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
            Заявки
          </h2>
          <p className="mt-1 text-[14px] font-medium leading-[150%] text-ink-light">
            Заявки можно свернуть, чтобы быстро просматривать список.
          </p>
        </div>

        {orders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={collapseAllOrders}
              className={secondaryButtonClassName}
            >
              Свернуть все
            </button>
            <button
              type="button"
              onClick={expandAllOrders}
              className={secondaryButtonClassName}
            >
              Развернуть все
            </button>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="mt-5 rounded-[8px] border border-border p-6 text-[16px] font-medium leading-[150%] text-ink-light">
          Заявок пока нет.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((order) => {
            const isTechnicalEmail =
              !order.email || order.email === "no-email@lipolesh.art";
            const isCollapsed = Boolean(collapsedOrderIds[order.id]);

            return (
              <article key={order.id} className="rounded-[8px] border border-border p-4">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
                        Заявка #{order.id}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-[13px] font-semibold leading-[150%] ${orderStatusClassName[order.status]}`}
                      >
                        {orderStatusLabel[order.status]}
                      </span>
                      {order.created_at && (
                        <span className="text-[14px] font-medium leading-[150%] text-ink-light">
                          {new Date(order.created_at).toLocaleString("ru-RU")}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 truncate text-[15px] font-medium leading-[150%] text-ink-light">
                      {order.name || "Без имени"}
                      {order.phone ? ` · ${order.phone}` : ""}
                      {!isTechnicalEmail ? ` · ${order.email}` : ""}
                      {order.artwork?.title
                        ? ` · ${order.artwork.title} #${order.artwork_id}`
                        : ` · Работа #${order.artwork_id}`}
                    </p>

                    {!isCollapsed && (
                      <dl className="mt-4 grid gap-3 text-[15px] font-medium leading-[150%] md:grid-cols-2">
                        <div>
                          <dt className="text-ink-light">Имя</dt>
                          <dd className="mt-1 text-ink">{order.name}</dd>
                        </div>
                        {order.phone && (
                          <div>
                            <dt className="text-ink-light">Контакт</dt>
                            <dd className="mt-1 whitespace-pre-line text-ink">
                              {order.phone}
                            </dd>
                          </div>
                        )}
                        {!isTechnicalEmail && (
                          <div>
                            <dt className="text-ink-light">Email</dt>
                            <dd className="mt-1 text-ink">
                              <a
                                href={`mailto:${order.email}`}
                                className="underline underline-offset-4 transition-opacity hover:opacity-70"
                              >
                                {order.email}
                              </a>
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-ink-light">Работа</dt>
                          <dd className="mt-1 text-ink">
                            <a
                              href={`/artwork/${order.artwork_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4 transition-opacity hover:opacity-70"
                            >
                              {order.artwork?.title
                                ? `${order.artwork.title} #${order.artwork_id}`
                                : `ID ${order.artwork_id}`}
                            </a>
                          </dd>
                        </div>
                        {order.message && (
                          <div className="md:col-span-2">
                            <dt className="text-ink-light">Комментарий</dt>
                            <dd className="mt-1 whitespace-pre-line text-ink">
                              {order.message}
                            </dd>
                          </div>
                        )}
                        {order.created_at && (
                          <div>
                            <dt className="text-ink-light">Создана</dt>
                            <dd className="mt-1 text-ink">
                              {new Date(order.created_at).toLocaleString("ru-RU")}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>

                  <div className="w-full shrink-0 space-y-3 md:w-[220px]">
                    <button
                      type="button"
                      onClick={() => toggleOrder(order.id)}
                      className={`${secondaryButtonClassName} w-full`}
                    >
                      {isCollapsed ? "Развернуть" : "Свернуть"}
                    </button>

                    {!isCollapsed && (
                      <div>
                        <label className="block text-[14px] font-medium leading-[150%] text-ink-light">
                          Статус
                        </label>
                        <select
                          value={order.status}
                          onChange={(event) =>
                            onUpdateStatus(
                              order.id,
                              event.target.value as Order["status"],
                            )
                          }
                          className="mt-2 h-[44px] w-full rounded-[8px] border border-border bg-paper px-3 text-[15px] font-medium leading-[150%] text-ink outline-none transition-colors focus:border-ink/40"
                        >
                          <option value="new">Новая</option>
                          <option value="contacted">Связались</option>
                          <option value="completed">Завершена</option>
                          <option value="cancelled">Отменена</option>
                        </select>
                      </div>
                    )}

                    {!isCollapsed && (
                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order)}
                        className={`${dangerButtonClassName} w-full`}
                      >
                        Удалить заявку
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
