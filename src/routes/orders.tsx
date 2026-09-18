import { Link, createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/site/Page";
import { brand, formatUsd } from "@/config/brand";
import { productById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: `Your orders — ${brand.name}` },
      { name: "description", content: "Track active deliveries and view your order history." },
      { property: "og:title", content: `Your orders — ${brand.name}` },
      { property: "og:description", content: "Track deliveries and reorder in a tap." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { state, addToCart } = useApp();

  return (
    <Page title="Your orders" intro="Active deliveries and past orders.">
      {state.orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-slate-secondary">
          You haven't placed an order yet.
          <div className="mt-4">
            <Link to="/stores" className="rounded-md bg-coral px-4 py-2 font-semibold text-white">
              Start shopping
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {state.orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="type-card text-slate">{o.id}</p>
                  <p className="text-xs text-slate-muted">
                    {new Date(o.placedAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Harare",
                    })}
                  </p>
                </div>
                <span className="rounded bg-botanical-tint px-2 py-1 text-xs font-semibold text-botanical">
                  {o.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-secondary">
                {o.items.length} item{o.items.length === 1 ? "" : "s"} · {formatUsd(o.total)}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to="/order/$id"
                  params={{ id: o.id }}
                  className="rounded-md bg-botanical px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Track order
                </Link>
                <Link
                  to="/receipt/$id"
                  params={{ id: o.id }}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-slate"
                >
                  Receipt
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    for (const item of o.items) {
                      const p = productById(item.productId);
                      if (p) addToCart(p.id, item.storeId, item.quantity);
                    }
                  }}
                  className="rounded-md border border-coral px-3 py-1.5 text-sm font-semibold text-coral"
                >
                  Reorder
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
