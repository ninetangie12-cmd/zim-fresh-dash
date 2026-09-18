import { createFileRoute, notFound } from "@tanstack/react-router";

import { Page } from "@/components/site/Page";
import { SERVICE_FEE, paymentMethods, productById } from "@/data/catalog";
import { brand, formatUsd, whatsappLink } from "@/config/brand";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/receipt/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Receipt ${params.id} — ${brand.name}` },
      { name: "description", content: "Your itemised digital receipt." },
      { property: "og:title", content: `Receipt ${params.id} — ${brand.name}` },
      { property: "og:description", content: "Itemised digital receipt." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const { state, hydrated } = useApp();
  const order = state.orders.find((o) => o.id === id);
  if (!order && !hydrated)
    return (
      <Page title="Loading your receipt…">
        <p className="text-sm text-slate-secondary">One moment while we fetch your receipt.</p>
      </Page>
    );
  if (!order) throw notFound();

  const subtotal = order.items.reduce((sum, i) => {
    const p = productById(i.productId);
    return sum + (p ? p.price * i.quantity : 0);
  }, 0);

  return (
    <Page title={`Receipt ${order.id}`} intro={new Date(order.placedAt).toLocaleString("en-GB")}>
      <div className="rounded-lg border border-border bg-card p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-muted">
              <th className="pb-2">Item</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Final price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((i) => {
              const p = productById(i.productId);
              if (!p) return null;
              return (
                <tr key={i.productId}>
                  <td className="py-2 text-slate-secondary">
                    {p.name}
                    <span className="block text-xs text-slate-muted">
                      {p.weighted ? `Final packed weight ${(p.estimatedKg ?? 1).toFixed(2)} kg` : p.packSize}
                    </span>
                  </td>
                  <td className="py-2 text-right text-slate-secondary">{i.quantity}</td>
                  <td className="py-2 text-right font-medium text-slate">{formatUsd(p.price * i.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <Row label="Estimated amount" value={formatUsd(subtotal)} />
          <Row label="Removed products" value={formatUsd(0)} />
          <Row label="Substitutions" value="None" />
          <Row label="Delivery fee" value={formatUsd(order.deliveryFee)} />
          <Row label="Service fee" value={formatUsd(SERVICE_FEE)} />
          <Row label="Discounts" value={formatUsd(0)} />
          <Row label="Rider tip" value={formatUsd(0)} />
          <Row label="Refunds" value={formatUsd(0)} />
          <Row label="Payment method" value={paymentMethods.find((m) => m.id === order.paymentMethod)?.name ?? ""} />
          <Row label="Purchase receipt reference" value={`REF-${order.id.replace("TN-", "")}`} />
          <div className="flex justify-between border-t border-border pt-2 type-card text-slate">
            <dt>Final total</dt>
            <dd>{formatUsd(subtotal + order.deliveryFee + SERVICE_FEE)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-botanical px-4 py-2 text-sm font-semibold text-white"
          >
            Download receipt
          </button>
          <a
            href={whatsappLink(`Please send me the receipt for order ${order.id}.`)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate"
          >
            Send on WhatsApp
          </a>
          <a
            href={`mailto:${brand.contact.supportEmail}?subject=Receipt ${order.id}`}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate"
          >
            Email me the receipt
          </a>
        </div>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-secondary">{label}</dt>
      <dd className="text-right font-medium text-slate">{value}</dd>
    </div>
  );
}
