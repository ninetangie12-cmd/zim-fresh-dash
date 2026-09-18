import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Page } from "@/components/site/Page";
import { ProductGrid } from "@/components/site/ProductCard";
import { brand } from "@/config/brand";
import { products } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/liquor")({
  head: () => ({
    meta: [
      { title: `Liquor delivery (18+) — ${brand.name}` },
      {
        name: "description",
        content: "Beer, wine and spirits delivered in Harare. You must be 18 or older and show identification on delivery.",
      },
      { property: "og:title", content: `Liquor delivery (18+) — ${brand.name}` },
      { property: "og:description", content: "Age-restricted. Please drink responsibly." },
    ],
  }),
  component: Liquor,
});

function Liquor() {
  const { state, verifyAge } = useApp();
  const [dob, setDob] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");

  if (!state.ageVerified) {
    return (
      <Page title="Age verification" intro="You must be 18 or older to purchase alcohol.">
        <form
          className="rounded-lg border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!dob) return setError("Please enter your date of birth.");
            const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
            if (age < 18) return setError("You must be 18 or older to enter this section.");
            if (!acknowledged) return setError("Please confirm you are 18 or older.");
            setError("");
            verifyAge();
          }}
        >
          <label htmlFor="dob" className="text-sm font-semibold text-slate">Date of birth</label>
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />

          <label className="mt-4 flex items-start gap-2 text-sm text-slate-secondary">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-1" />
            I confirm I am 18 or older and I will show identification on delivery.
          </label>

          {error ? <p className="mt-3 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error}</p> : null}

          <button type="submit" className="mt-4 w-full rounded-md bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-hover">
            Enter the liquor section
          </button>

          <ul className="mt-4 space-y-1 text-xs text-slate-muted">
            <li>Identification is checked at the door. Riders may refuse delivery.</li>
            <li>Alcohol is never left unattended, at a gate or with a minor.</li>
            <li>Delivery hours for alcohol are restricted by licence conditions.</li>
            <li>Please drink responsibly.</li>
          </ul>
        </form>
      </Page>
    );
  }

  return (
    <Page title="Liquor" intro="Beer, wine, spirits and mixers from Liquor Supplies. 18+ only." wide>
      <p className="mb-4 rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
        Identification is required on delivery. Alcohol cannot be left unattended, and our riders
        record whether identification was successfully checked. Please drink responsibly.
      </p>
      <ProductGrid products={products.filter((p) => p.liquor)} />
      <p className="mt-6 text-sm text-slate-muted">
        Looking for mixers and snacks too?{" "}
        <Link to="/category/$slug" params={{ slug: "snacks-drinks" }} className="text-botanical underline">
          Browse snacks and drinks
        </Link>
        .
      </p>
    </Page>
  );
}
