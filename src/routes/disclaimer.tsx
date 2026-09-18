import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/site/Page";
import { DISCLAIMER, brand } from "@/config/brand";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: `Independent service disclaimer — ${brand.name}` },
      { name: "description", content: `${brand.name} is an independent shopping and delivery service and is not affiliated with the retailers customers select.` },
      { property: "og:title", content: `Independent service — ${brand.name}` },
      { property: "og:description", content: "How our independent shopping service works." },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <Page title="Independent service disclaimer">
      <div className="space-y-4 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-slate-secondary">
        <p className="rounded-md bg-info-bg p-3 font-medium text-info">{DISCLAIMER}</p>
        <p>
          When you place an order, you are asking {brand.name} to shop on your behalf at a retailer
          you choose, or at a suitable nearby store where you ask us to find the best available
          price. We buy the goods as an ordinary customer would and deliver them to you.
        </p>
        <p>
          Retailer names appear on this platform only to describe where you would like us to shop.
          We do not use retailer logos, marketing material or brand colours, and nothing here should
          be read as a partnership, sponsorship or endorsement.
        </p>
        <p>
          Prices shown are our estimates of shelf prices. The shopper confirms the actual price in
          store. Where the final price differs meaningfully from the estimate, we ask you to approve
          it before payment is taken.
        </p>
        <p>
          Stock availability is not guaranteed. Where an item cannot be found, we follow the
          substitution preference you selected.
        </p>
      </div>
    </Page>
  );
}
