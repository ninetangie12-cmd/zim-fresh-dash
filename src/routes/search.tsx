import { Link, createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/site/Page";
import { ProductGrid } from "@/components/site/ProductCard";
import { CategoryRail } from "@/components/site/CategoryRail";
import { brand } from "@/config/brand";
import { popularProducts, searchProducts } from "@/data/catalog";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: `Search products — ${brand.name}` },
      {
        name: "description",
        content: "Search groceries, fresh produce, household essentials and liquor for delivery in Harare.",
      },
      { property: "og:title", content: `Search products — ${brand.name}` },
      { property: "og:description", content: "Find what you need and add it to your basket." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const results = searchProducts(q);

  return (
    <Page
      title={q ? `Results for "${q}"` : "Search"}
      intro={q ? `${results.length} product${results.length === 1 ? "" : "s"} found` : "Use the search bar above to find products."}
      wide
    >
      {!q ? <div className="mb-5"><CategoryRail /></div> : null}
      {results.length ? (
        <ProductGrid products={results} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 text-center md:p-8">
          <p className="type-card text-slate">
            {q ? "We couldn't find that product" : "Start typing to search"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-muted">
            Try a simpler word, or send us your shopping list and we'll source the items from a
            suitable nearby retailer.
          </p>
          <Link
            to="/shopping-list"
             className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-coral px-4 text-sm font-bold text-primary-foreground hover:bg-coral-hover"
          >
            Send your shopping list
          </Link>
          <div className="mt-8 text-left">
            <h2 className="mb-3 type-card text-slate">Popular instead</h2>
            <ProductGrid products={popularProducts().slice(0, 5)} />
          </div>
        </div>
      )}
    </Page>
  );
}
