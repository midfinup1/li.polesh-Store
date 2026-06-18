import type { AnalyticsSummary } from "@/types";

export function AdminAnalyticsSection({
  analytics,
  ordersCount,
}: {
  analytics: AnalyticsSummary | null;
  ordersCount: number;
}) {
  if (!analytics) {
    return (
      <section className="mt-6 rounded-[8px] border border-border p-4">
        <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
          Статистика
        </h2>
        <p className="mt-4 text-[15px] font-medium leading-[150%] text-ink-light">
          Статистика пока недоступна.
        </p>
      </section>
    );
  }

  // Derived from existing data (no backend change): average page views per day
  // over the last 30 days — a more intuitive "how busy is the site" number.
  const viewsPerDay = Math.round(analytics.views_30_days / 30);

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-[8px] border border-border p-4">
        <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
          Статистика
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AnalyticsCard
            title="Заявки за 30 дней"
            value={analytics.orders_30_days}
            note={`Всего заявок: ${ordersCount}`}
            highlight
          />
          <AnalyticsCard
            title="Просмотры за 30 дней"
            value={analytics.views_30_days}
            note={`≈ ${viewsPerDay} в день`}
          />
          <AnalyticsCard
            title="Просмотры за 7 дней"
            value={analytics.views_7_days}
          />
          <AnalyticsCard
            title="Просмотры работ за 30 дней"
            value={analytics.artwork_views_30_days}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <AnalyticsList
          title="Топ работ за 30 дней"
          emptyText="Просмотров работ пока нет."
          items={analytics.top_artworks.map((item) => ({
            label: item.title,
            value: item.views,
            href: `/artwork/${item.artwork_id}`,
          }))}
        />
        <AnalyticsList
          title="Топ страниц за 30 дней"
          emptyText="Просмотров страниц пока нет."
          items={analytics.top_pages.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
        />
        <AnalyticsList
          title="Клики по категориям за 30 дней"
          emptyText="Кликов по категориям пока нет."
          items={analytics.category_clicks.map((item) => ({
            label: item.label.replace(/^\/category\//, ""),
            value: item.value,
          }))}
        />
      </div>
    </section>
  );
}

function AnalyticsCard({
  title,
  value,
  note,
  highlight,
}: {
  title: string;
  value: number | string;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[8px] border p-4",
        highlight
          ? "border-ink/30 bg-ink/[0.04]"
          : "border-border bg-paper-dark/40",
      ].join(" ")}
    >
      <p className="text-[13px] font-semibold leading-[150%] text-ink-light">
        {title}
      </p>
      <p className="mt-2 text-[28px] font-semibold leading-[120%] text-ink">
        {value}
      </p>
      {note && (
        <p className="mt-2 text-[13px] font-medium leading-[150%] text-ink-light">
          {note}
        </p>
      )}
    </div>
  );
}

function AnalyticsList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: { label: string; value: number; href?: string }[];
}) {
  return (
    <div className="rounded-[8px] border border-border p-4">
      <h3 className="text-[18px] font-semibold leading-[120%] text-ink">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-[15px] font-medium leading-[150%] text-ink-light">
          {emptyText}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 text-[15px] font-medium leading-[150%]"
            >
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  {item.label}
                </a>
              ) : (
                <span className="min-w-0 truncate text-ink">{item.label}</span>
              )}
              <span className="shrink-0 rounded-full bg-paper-dark px-3 py-1 text-[13px] text-ink-light">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}