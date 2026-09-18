import { Link, createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/site/Page";
import { ProductGrid } from "@/components/site/ProductCard";
import { brand } from "@/config/brand";
import { productById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/favourites")({
  head: () => ({
    meta: [
      { title: `Your favourites — ${brand.name}` },
      { name: "description", content: "The products you buy most often, saved for quick reordering." },
      { property: "og:title", content: `Your favourites — ${brand.name}` },
      { property: "og:description", content: "Your saved products." },
    ],
  }),
  component: Favourites,
});

function Favourites() {
  const { state } = useApp();
  const items = state.favourites.map(productById).filter(Boolean);

  return (
    <Page title="Favourites" intro="Products you've saved for next time." wide>
      {items.length ? (
        <ProductGrid products={items as NonNullable<(typeof items)[number]>[]} />
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-slate-secondary">
            You haven't saved any products yet. Tap the heart on any product to save it here.
          </p>
          <Link to="/stores" className="mt-4 inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white">
            Browse products
          </Link>
        </div>
      )}
    </Page>
  );
}
