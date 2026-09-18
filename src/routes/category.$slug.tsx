import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { EstimateNotice } from "@/components/site/Disclaimer";
import { CategoryRail } from "@/components/site/CategoryRail";
import { Page } from "@/components/site/Page";
import { ProductGrid } from "@/components/site/ProductCard";
import { brand } from "@/config/brand";
import {
  categories,
  isAvailable,
  products as allProducts,
  promotionProducts,
  stores,
} from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = categories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Category";
    return {
      meta: [
        { title: `${name} delivery in Harare — ${brand.name}` },
        { name: "description", content: loaderData?.category.blurb ?? "" },
        { property: "og:title", content: `${name} — ${brand.name}` },
        { property: "og:description", content: loaderData?.category.blurb ?? "" },
      ],
    };
  },
  component: CategoryPage,
});

type Sort = "popular" | "price-asc" | "price-desc" | "newest";

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { state } = useApp();
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("popular");

  if (category.liquor && !state.ageVerified) {
    return (
      <Page title="Liquor" intro="You must be 18 or older to purchase alcohol.">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-slate-secondary">
            Please confirm your age before browsing the liquor section.
          </p>
          <Link
            to="/liquor"
            className="mt-4 inline-block rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-hover"
          >
            Confirm my age
          </Link>
        </div>
      </Page>
    );
  }

  let list =
    category.slug === "promotions"
      ? promotionProducts()
      : allProducts.filter((p) => p.category === category.slug);

  if (storeFilter !== "all") list = list.filter((p) => p.storeIds.includes(storeFilter));
  if (inStockOnly) list = list.filter((p) => isAvailable(p.stock));
  if (promoOnly) list = list.filter((p) => p.promoLabel);

  list = [...list].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "newest") return a.id < b.id ? 1 : -1;
    return Number(Boolean(b.popular)) - Number(Boolean(a.popular));
  });

  return (
    <Page title={category.name} intro={category.blurb} wide>
      <EstimateNotice className="mb-4" />
      <CategoryRail active={category.slug} />

      <div className="my-5 flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by store"
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm text-slate"
        >
          <option value="all">All stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm text-slate"
        >
          <option value="popular">Most popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="newest">Newest</option>
        </select>

        <Toggle active={inStockOnly} onClick={() => setInStockOnly((v) => !v)}>
          Available only
        </Toggle>
        <Toggle active={promoOnly} onClick={() => setPromoOnly((v) => !v)}>
          Promotions
        </Toggle>
      </div>

      {list.length ? (
        <ProductGrid products={list} />
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="type-card text-slate">Nothing matches those filters</p>
          <p className="mt-1 text-sm text-slate-muted">
            Try clearing a filter, or send us your shopping list and we'll source the items for you.
          </p>
          <Link
            to="/shopping-list"
            className="mt-4 inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover"
          >
            Send your shopping list
          </Link>
        </div>
      )}
    </Page>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
        active
          ? "border-botanical bg-botanical text-white"
          : "border-border bg-card text-slate-secondary"
      }`}
    >
      {children}
    </button>
  );
}
