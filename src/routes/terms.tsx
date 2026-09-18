import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/site/Page";
import { DISCLAIMER, brand } from "@/config/brand";

const sections = [
  {
    title: "1. About this service",
    body: `${brand.name} is an independent shopping and delivery service operating in Harare, Zimbabwe. ${DISCLAIMER}`,
  },
  {
    title: "2. Estimated prices",
    body: "All prices displayed before purchase are estimates. Your shopper confirms the shelf price in store. Where the confirmed price is meaningfully higher than the estimate, we ask for your approval before payment is taken. Removed products reduce your final total.",
  },
  {
    title: "3. Products sold by weight",
    body: "Meat, fruit, vegetables and deli items are charged on the final packed weight. We show the price per kilogram and an estimated total before purchase, and the final weight on your receipt.",
  },
  {
    title: "4. Substitutions",
    body: "You choose what happens when an item is unavailable. Unless you have selected automatic substitution, we ask for your approval before replacing an item.",
  },
  {
    title: "5. Payment",
    body: "Fulfilment of a paid order begins once an administrator has approved your payment. Approved cash-on-delivery orders are the exception. Every payment decision is recorded against the responsible administrator.",
  },
  {
    title: "6. Alcohol",
    body: "You must be 18 or older to buy alcohol. Identification is checked at delivery, delivery hours are restricted, riders may refuse delivery, and alcohol is never left unattended.",
  },
  {
    title: "7. Delivery",
    body: "Delivery estimates depend on store distance, order size, picking time, and shopper and rider availability. A one-time PIN is used at handover. Unattended delivery is not permitted for alcohol, high-value orders, cash-on-delivery orders or orders requiring identification.",
  },
  {
    title: "8. Cancellations and changes",
    body: "Orders can be edited or cancelled until picking begins or the cut-off shown on your order, whichever comes first. After that, please contact support.",
  },
  {
    title: "9. Refunds",
    body: "Refunds, partial refunds, store credit, replacements and delivery-fee refunds are issued after review. Every refund is recorded with its reason, the evidence supplied and the responsible administrator.",
  },
  {
    title: "10. Receipts",
    body: "Every completed order receives a digital receipt showing estimated amounts, final prices, removed items, substitutions, final weights, fees, discounts, tips, refunds and the final total.",
  },
];

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms and conditions — ${brand.name}` },
      { name: "description", content: "The terms that apply when you order groceries or liquor through our independent shopping and delivery service." },
      { property: "og:title", content: `Terms and conditions — ${brand.name}` },
      { property: "og:description", content: "Our service terms." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <Page title="Terms and conditions" intro="Last updated September 2026.">
      <div className="space-y-5 rounded-lg border border-border bg-card p-5">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="type-label text-slate">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-secondary">{s.body}</p>
          </section>
        ))}
      </div>
    </Page>
  );
}
