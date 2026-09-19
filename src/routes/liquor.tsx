import { Link, createFileRoute, Navigate } from "@tanstack/react-router";

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
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/auth" />;
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
