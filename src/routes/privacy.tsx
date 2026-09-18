import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/site/Page";
import { brand } from "@/config/brand";

const sections = [
  {
    title: "What we collect",
    body: "Your name, mobile number, delivery addresses with landmarks and notes, order history, payment confirmations you upload, and messages you send our support team.",
  },
  {
    title: "Why we collect it",
    body: "To shop for you, deliver to the right gate, confirm payments, handle refunds and answer your questions. We also use anonymous totals to understand which areas and products to serve better.",
  },
  {
    title: "Who sees it",
    body: "Your shopper sees your list and substitution preferences. Your rider sees your address, phone number and delivery PIN. Administrators see order and payment records. We do not sell your information.",
  },
  {
    title: "Ordering for someone else",
    body: "When you order for another person, we share only what the rider needs to deliver. If you choose to hide prices, the recipient does not see what you paid.",
  },
  {
    title: "Keeping it safe",
    body: "Payment approvals, refunds and price changes are handled on our servers and recorded in an audit trail. Access is limited by role, so staff only see the orders they are working on.",
  },
  {
    title: "Your choices",
    body: `Ask us to correct or delete your information at any time on ${brand.contact.supportEmail}. We keep order and payment records where the law requires it.`,
  },
];

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy policy — ${brand.name}` },
      { name: "description", content: "What information we collect when you order, why we need it, and who can see it." },
      { property: "og:title", content: `Privacy policy — ${brand.name}` },
      { property: "og:description", content: "How we handle your information." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <Page title="Privacy policy" intro="Last updated September 2026.">
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
