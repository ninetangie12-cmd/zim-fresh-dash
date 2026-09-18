import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/site/Page";
import { brand, formatUsd, whatsappLink } from "@/config/brand";
import { orderStatuses, paymentMethods, productById, zoneById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/order/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.id} — ${brand.name}` },
      { name: "description", content: "Follow your delivery from picking to your gate." },
      { property: "og:title", content: `Order ${params.id} — ${brand.name}` },
      { property: "og:description", content: "Live order tracking." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { state, markProof, hydrated } = useApp();
  const order = state.orders.find((o) => o.id === id);
  if (!order && !hydrated)
    return (
      <Page title="Loading your order…">
        <p className="text-sm text-slate-secondary">One moment while we fetch your order.</p>
      </Page>
    );
  if (!order) throw notFound();

  const saved = state.addresses.find((a) => a.id === order.addressId);
  const address = saved ?? {
    line: order.addressLine ?? "",
    landmark: order.addressLandmark,
    zoneId: order.addressZoneId ?? "",
  };
  const zone = address.zoneId ? zoneById(address.zoneId) : undefined;
  const currentIndex = Math.max(orderStatuses.indexOf(order.status as (typeof orderStatuses)[number]), 0);
  const customerStatuses = ["Order received", "Payment approved", "Store confirming stock", "Items being picked", "Rider assigned", "On the way", "Rider approaching", "Delivered"] as const;
  const activeCustomerIndex = customerStatuses.reduce((last, status, index) => {
    const statusIndex = orderStatuses.indexOf(status);
    return statusIndex <= currentIndex ? index : last;
  }, 0);
  const method = paymentMethods.find((m) => m.id === order.paymentMethod);
  const needsProof = order.paymentMethod !== "cod" && !order.proofUploaded;

  return (
    <Page title={`Order ${order.id}`} intro={order.status} wide>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          {needsProof ? (
            <div className="mb-4 rounded-lg border border-warning bg-warning-bg p-4">
              <h2 className="type-label text-warning">Payment confirmation needed</h2>
              <p className="mt-1 text-xs text-warning">
                Pay with {method?.name} and upload your proof of payment. Your order is only marked
                as paid once an administrator approves it.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover">
                  <Upload className="size-4" />
                  Upload proof of payment
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      void markProof(order.id, file)
                        .then(() =>
                          toast.success("Proof received. We'll confirm your payment shortly."),
                        )
                        .catch(() =>
                          toast.error("That upload didn't go through. Please try again."),
                        );
                    }}
                  />
                </label>
                <Link
                  to="/payment/$id"
                  params={{ id: order.id }}
                  className="rounded-md border border-warning px-4 py-2 text-sm font-semibold text-warning"
                >
                  Payment instructions
                </Link>
              </div>
            </div>
          ) : null}

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="type-card text-slate">Progress</h2>
            <ol className="mt-3 space-y-0">
               {customerStatuses.map((status, i) => {
                 const done = i < activeCustomerIndex;
                 const active = i === activeCustomerIndex;
                return (
                  <li key={status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid size-5 place-items-center rounded-full text-xs ${
                          done ? "bg-botanical text-white" : active ? "bg-coral text-white" : "bg-mist text-slate-muted"
                        }`}
                      >
                        {done ? <Check className="size-3" /> : null}
                      </span>
                       {i < customerStatuses.length - 1 ? (
                        <span className={`h-6 w-px ${done ? "bg-botanical" : "bg-border"}`} />
                      ) : null}
                    </div>
                    <span className={`pb-1 text-sm ${active ? "font-semibold text-slate" : done ? "text-slate-secondary" : "text-slate-muted"}`}>
                      {status}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="mt-4 rounded-lg border border-border bg-card p-4">
            <h2 className="type-card text-slate">Items</h2>
            <ul className="mt-2 divide-y divide-border text-sm">
              {order.items.map((i) => {
                const p = productById(i.productId);
                if (!p) return null;
                return (
                  <li key={i.productId} className="flex justify-between py-2">
                    <span className="text-slate-secondary">{i.quantity} × {p.name}</span>
                    {order.hidePrices ? null : (
                      <span className="font-medium text-slate">{formatUsd(p.price * i.quantity)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="type-card text-slate">Delivery</h2>
            <p className="mt-2 text-slate-secondary">{address?.line}</p>
            {address?.landmark ? <p className="text-xs text-slate-muted">Landmark: {address.landmark}</p> : null}
            <p className="mt-2 text-xs text-slate-muted">
              Estimated delivery: {zone ? `${zone.etaMinutes[0]}–${zone.etaMinutes[1]} minutes` : "45–70 minutes"}
            </p>
            <div className="mt-3 rounded-md bg-botanical-tint p-3">
              <p className="text-xs text-botanical">One-time delivery PIN</p>
              <p className="font-display text-2xl font-extrabold tracking-widest tabular text-botanical">{order.pin}</p>
              <p className="mt-1 text-xs text-botanical">Give this to your rider on arrival.</p>
            </div>
            <div className="mt-3 rounded-md bg-mist p-3 text-xs text-slate-secondary">
              <p className="font-semibold text-slate">Your rider</p>
              <p>Assigned once your items are picked. Live GPS tracking is coming soon.</p>
            </div>
          </div>

          {order.hidePrices ? null : (
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <div className="flex justify-between font-display font-bold text-slate">
                <span>Estimated total</span>
                <span>{formatUsd(order.total)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-muted">
                Final total is confirmed after picking and weighing.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <a
              href={whatsappLink(`Hello, I need help with order ${order.id}.`)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md bg-success py-2.5 text-center text-sm font-semibold text-white"
            >
              Contact support
            </a>
            <Link to="/receipt/$id" params={{ id: order.id }} className="block rounded-md border border-border py-2.5 text-center text-sm font-medium text-slate">
              View receipt
            </Link>
            <Link to="/problem" className="block rounded-md border border-border py-2.5 text-center text-sm font-medium text-slate">
              Report a problem
            </Link>
          </div>
        </aside>
      </div>
    </Page>
  );
}
