import { Link, createFileRoute } from "@tanstack/react-router";

import { IndependentNotice } from "@/components/site/Disclaimer";
import { Page } from "@/components/site/Page";
import { brand, whatsappLink } from "@/config/brand";

const faqs = [
  {
    q: "Why are prices shown as estimates?",
    a: "Shelf prices in Zimbabwe change often. We show our best estimate, then your shopper confirms the real price in store. If the difference is meaningful, we ask you to approve it before payment.",
  },
  {
    q: "How long does delivery take?",
    a: "Most Harare deliveries land in 45 to 90 minutes, depending on your suburb, the size of your order and how busy the store is. Your estimate is shown before you check out.",
  },
  {
    q: "How do I pay?",
    a: "EcoCash, InnBucks, OneMoney, Visa or Mastercard, bank transfer, or cash on delivery. For mobile money and transfers, upload your proof of payment and we confirm it before shopping starts.",
  },
  {
    q: "What happens if something is out of stock?",
    a: "Your substitution preference decides. We can contact you first, replace with the closest alternative, replace only at the same price or less, remove the item, or make no substitutions at all.",
  },
  {
    q: "Can I order for family in Zimbabwe from abroad?",
    a: "Yes. At checkout, tick 'this delivery is for another person', add their name and Zimbabwean number, and choose to hide prices from them. They receive the delivery updates.",
  },
  {
    q: "Do you deliver alcohol?",
    a: "Yes, to customers 18 and older. Identification is checked at delivery, alcohol is never left unattended, and riders may refuse delivery.",
  },
];

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: `Help and support — ${brand.name}` },
      { name: "description", content: "Answers about delivery times, payment, substitutions and refunds, plus how to reach our team." },
      { property: "og:title", content: `Help and support — ${brand.name}` },
      { property: "og:description", content: "We're here every day from 07:00 to 20:00." },
    ],
  }),
  component: Help,
});

function Help() {
  return (
    <Page title="Help and support" intro={`We're available ${brand.contact.hours}.`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-success p-4 text-white"
        >
          <span className="block font-display text-base font-bold">WhatsApp us</span>
          <span className="block text-sm text-white/90">{brand.contact.phone}</span>
        </a>
        <a href={`mailto:${brand.contact.supportEmail}`} className="rounded-lg border border-border bg-card p-4">
          <span className="block type-card text-slate">Email us</span>
          <span className="block text-sm text-slate-secondary">{brand.contact.supportEmail}</span>
        </a>
      </div>

      <div className="mt-6 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="rounded-lg border border-border bg-card p-4">
            <summary className="cursor-pointer type-label text-slate">{f.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-secondary">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/problem" className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white">
          Report a problem
        </Link>
        <Link to="/orders" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate">
          Track an order
        </Link>
      </div>

      <IndependentNotice className="mt-6" />
    </Page>
  );
}
