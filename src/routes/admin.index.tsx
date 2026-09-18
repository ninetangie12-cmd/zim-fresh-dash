import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { formatUsd } from "@/config/brand";
import { storeById } from "@/data/catalog";
import { buildStats, listOrders } from "@/lib/admin";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "Operations overview — TengaNow" },
    { name: "description", content: "TengaNow sales, payments and active order overview." },
    { property: "og:title", content: "Operations overview — TengaNow" },
    { property: "og:description", content: "TengaNow sales, payments and active order overview." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Overview,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-muted">{label}</p>
      <p className="mt-1 type-page text-slate">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-muted">{hint}</p> : null}
    </div>
  );
}

function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: listOrders,
  });

  if (isLoading) return <p className="text-sm text-slate-secondary">Loading today's numbers…</p>;
  if (error) return <p className="text-sm text-error">We couldn't load the numbers. Try again.</p>;

  const orders = data ?? [];
  const s = buildStats(orders);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orders today" value={String(s.ordersToday)} />
        <Stat label="Sales today" value={formatUsd(s.grossToday)} hint="Final price where confirmed" />
        <Stat label="Payments to check" value={String(s.pendingPayments)} />
        <Stat label="Active orders" value={String(s.activeOrders)} />
        <Stat label="Delivered" value={String(s.completedOrders)} />
        <Stat label="Cancelled" value={String(s.cancelledOrders)} />
        <Stat label="Average basket" value={formatUsd(s.averageBasket)} />
        <Stat
          label="Substitution rate"
          value={`${s.substitutionRate.toFixed(0)}%`}
          hint="Items replaced or removed"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="type-card text-slate">Orders by status</h2>
          {s.byStatus.length ? (
            <ul className="mt-3 space-y-2">
              {s.byStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-secondary">{row.status}</span>
                  <span className="font-semibold text-slate">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-muted">No orders yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="type-card text-slate">Most ordered products</h2>
          {s.topProducts.length ? (
            <ul className="mt-3 space-y-2">
              {s.topProducts.map((row) => (
                <li key={row.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-secondary">{row.name}</span>
                  <span className="font-semibold text-slate">{row.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-muted">Nothing sold yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="type-card text-slate">Busiest stores</h2>
          {s.topStores.length ? (
            <ul className="mt-3 space-y-2">
              {s.topStores.map((row) => (
                <li key={row.storeId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-secondary">
                    {storeById(row.storeId)?.name ?? row.storeId}
                  </span>
                  <span className="font-semibold text-slate">{row.count} lines</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-muted">No store activity yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="type-card text-slate">Latest orders</h2>
          <ul className="mt-3 space-y-2">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                <Link
                  to="/admin/orders/$code"
                  params={{ code: o.code }}
                  className="font-semibold text-botanical hover:underline"
                >
                  {o.code}
                </Link>
                <span className="truncate text-slate-secondary">{o.status}</span>
                <span className="font-semibold text-slate">
                  {formatUsd(o.finalTotal ?? o.total)}
                </span>
              </li>
            ))}
            {orders.length === 0 ? (
              <li className="text-sm text-slate-muted">No orders yet.</li>
            ) : null}
          </ul>
          <p className="mt-3 text-xs text-slate-muted">
            Total sales all time: {formatUsd(s.grossAll)} · Returning customers:{" "}
            {s.returningCustomers}
          </p>
        </div>
      </div>
    </>
  );
}
