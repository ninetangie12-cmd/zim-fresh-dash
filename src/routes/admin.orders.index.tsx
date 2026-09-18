import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { formatUsd } from "@/config/brand";
import { paymentMethods } from "@/data/catalog";
import { listOrders } from "@/lib/admin";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [
    { title: "Orders — TengaNow operations" },
    { name: "description", content: "Search and manage TengaNow customer orders." },
    { property: "og:title", content: "Orders — TengaNow operations" },
    { property: "og:description", content: "Search and manage TengaNow customer orders." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: OrdersList,
});

const filters = [
  { id: "all", label: "All" },
  { id: "payment", label: "Payment to check" },
  { id: "active", label: "In progress" },
  { id: "delivered", label: "Delivered" },
] as const;

function OrdersList() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: listOrders,
  });

  if (isLoading) return <p className="text-sm text-slate-secondary">Loading orders…</p>;
  if (error) return <p className="text-sm text-error">We couldn't load orders. Try again.</p>;

  const orders = (data ?? []).filter((o) => {
    const matchesQuery =
      !query.trim() ||
      o.code.toLowerCase().includes(query.trim().toLowerCase()) ||
      o.addressLine.toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "payment")
      return o.paymentStatus === "submitted" || o.paymentStatus === "awaiting";
    if (filter === "active")
      return o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "Refunded";
    if (filter === "delivered") return o.status === "Delivered";
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              filter === f.id
                ? "border-botanical bg-botanical-tint text-botanical"
                : "border-border bg-card text-slate-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order number or address"
          className="ml-auto w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-slate-muted">No orders match this view.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to="/admin/orders/$code"
                params={{ code: o.code }}
                className="block rounded-lg border border-border bg-card p-4 hover:border-botanical-mid"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display font-bold text-slate">{o.code}</span>
                  <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-botanical">
                    {o.status}
                  </span>
                  <span className="font-semibold text-slate">
                    {formatUsd(o.finalTotal ?? o.total)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-secondary">
                  {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                  {paymentMethods.find((m) => m.id === o.paymentMethod)?.name ?? o.paymentMethod} ·
                  payment {o.paymentStatus} · {new Date(o.placedAt).toLocaleString()}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-muted">{o.addressLine}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
