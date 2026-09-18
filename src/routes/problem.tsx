import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Upload } from "lucide-react";
import { useState } from "react";

import { Page } from "@/components/site/Page";
import { brand } from "@/config/brand";
import { useApp } from "@/lib/app-state";

const issues = [
  "Missing product",
  "Incorrect product",
  "Damaged product",
  "Poor-quality produce",
  "Expired product",
  "Incorrect quantity",
  "Delivery problem",
  "Unrecognised charge",
];

export const Route = createFileRoute("/problem")({
  head: () => ({
    meta: [
      { title: `Report a problem — ${brand.name}` },
      { name: "description", content: "Report a missing, damaged or incorrect item and request a refund or replacement." },
      { property: "og:title", content: `Report a problem — ${brand.name}` },
      { property: "og:description", content: "Refund and problem centre." },
    ],
  }),
  component: Problem,
});

function Problem() {
  const { state } = useApp();
  const [orderId, setOrderId] = useState(state.orders[0]?.id ?? "");
  const [issue, setIssue] = useState(issues[0]!);
  const [detail, setDetail] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <Page title="Report received">
        <div className="rounded-lg border border-success bg-success-bg p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <p className="mt-3 type-card text-success">We're on it</p>
          <p className="mt-2 text-sm text-slate-secondary">
            A team member reviews every report. We'll come back to you on WhatsApp with a refund,
            store credit or a replacement.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Refunds and problems" intro="Tell us what went wrong and we'll put it right.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <div className="rounded-lg border border-border bg-card p-4">
          <label htmlFor="order" className="text-sm font-semibold text-slate">Which order?</label>
          <select
            id="order"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            {state.orders.map((o) => (
              <option key={o.id} value={o.id}>{o.id} — {o.status}</option>
            ))}
            <option value="other">Another order or a general problem</option>
          </select>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold text-slate">What happened?</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {issues.map((i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-slate-secondary">
                <input type="radio" name="issue" checked={issue === i} onChange={() => setIssue(i)} />
                {i}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <label htmlFor="detail" className="text-sm font-semibold text-slate">Tell us more</label>
          <textarea
            id="detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={4}
            maxLength={1000}
            className="mt-2 w-full rounded-md border border-border bg-card p-3 text-sm"
          />
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-botanical px-3 py-2 text-sm font-semibold text-botanical">
            <Upload className="size-4" /> Add a photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          {photo ? <p className="mt-2 text-xs text-success">Attached: {photo}</p> : null}
        </div>

        <button type="submit" className="w-full rounded-md bg-coral py-3 text-sm font-semibold text-white hover:bg-coral-hover">
          Send report
        </button>
        <p className="text-center text-xs text-slate-muted">
          Refunds, store credit and replacements are approved by an administrator and recorded with
          the reason and evidence.
        </p>
      </form>
    </Page>
  );
}
