import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Upload } from "lucide-react";
import { useState } from "react";

import { IndependentNotice } from "@/components/site/Disclaimer";
import { Page } from "@/components/site/Page";
import { brand } from "@/config/brand";
import { stores } from "@/data/catalog";
import { useApp } from "@/lib/app-state";
import { saveShoppingListRequest } from "@/lib/cloud";

export const Route = createFileRoute("/shopping-list")({
  head: () => ({
    meta: [
      { title: `Send your shopping list — ${brand.name}` },
      {
        name: "description",
        content:
          "Type your shopping list or upload a photo of a handwritten one. We confirm availability and final prices before you pay.",
      },
      { property: "og:title", content: `Send your shopping list — ${brand.name}` },
      { property: "og:description", content: "Type it or photograph it. We'll do the shopping." },
    ],
  }),
  component: ShoppingList,
});

function ShoppingList() {
  const { user } = useApp();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [preference, setPreference] = useState("tm-pnp");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  if (submitted) {
    return (
      <Page title="List received">
        <div className="rounded-lg border border-success bg-success-bg p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <p className="mt-3 type-card text-success">
            Your list has been received. We'll confirm availability and final prices before payment.
          </p>
          <p className="mt-2 text-sm text-slate-secondary">
            We usually reply on WhatsApp within 20 minutes during trading hours.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Send your shopping list"
      intro="Type your list or upload a photo of a handwritten one. No account needed."
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          // Signed-in customers get the request saved to their account so
          // support can pick it up; guests still get an immediate reply path.
          if (user) {
            void saveShoppingListRequest(user.id, {
              body: text,
              preference,
              instructions,
            }).catch(() => undefined);
          }
          setSubmitted(true);
        }}
      >
        <div className="rounded-lg border border-border bg-card p-4">
          <label htmlFor="list" className="text-sm font-semibold text-slate">
            Your shopping list
          </label>
          <textarea
            id="list"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            maxLength={2000}
            placeholder={"2 x mealie meal 10kg\n1 x cooking oil 2L\nrape - 3 bundles\nbread x 2"}
            className="mt-2 w-full rounded-md border border-border bg-card p-3 text-sm"
          />
          <p className="mt-1 text-xs text-slate-muted">{text.length}/2000 characters</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold text-slate">Photo of a handwritten list</p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-botanical px-4 py-2 text-sm font-semibold text-botanical">
            <Upload className="size-4" />
            Upload a photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          {fileName ? <p className="mt-2 text-xs text-success">Attached: {fileName}</p> : null}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold text-slate">Where should we shop?</p>
          <div className="mt-2 space-y-2 text-sm">
            {[
              ...stores.map((s) => ({ id: s.id, label: s.name })),
              { id: "best-price", label: "Find the best price" },
              { id: "nearest", label: "Nearest supermarket" },
              { id: "other", label: "Another preferred retailer" },
            ].map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-slate-secondary">
                <input
                  type="radio"
                  name="pref"
                  checked={preference === o.id}
                  onChange={() => setPreference(o.id)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <label htmlFor="notes" className="text-sm font-semibold text-slate">
            Special instructions
          </label>
          <textarea
            id="notes"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Brand preferences, budget limit, delivery landmark…"
            className="mt-2 w-full rounded-md border border-border bg-card p-3 text-sm"
          />
        </div>

        <IndependentNotice />

        <button
          type="submit"
          disabled={busy || (!text.trim() && !fileName)}
          className="w-full rounded-md bg-coral py-3 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
        >
          Submit for review
        </button>
        <p className="text-center text-xs text-slate-muted">
          A person reviews every list. Nothing is charged until you approve the final prices.
        </p>
      </form>
    </Page>
  );
}
