import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EstimateNotice, IndependentNotice } from "@/components/site/Disclaimer";
import { ProductGrid } from "@/components/site/ProductCard";
import { StockBadge } from "@/components/site/StockBadge";
import { brand, formatSecondary, formatUsd } from "@/config/brand";
import {
  categoryBySlug,
  isAvailable,
  products,
  productBySlug,
  storeById,
  substitutionOptions,
  type SubstitutionPreference,
} from "@/data/catalog";
import { useApp } from "@/lib/app-state";
import { imageFor } from "@/lib/images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = productBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: `${p?.name ?? "Product"} — ${brand.name}` },
        { name: "description", content: p ? `${p.description} ${p.packSize}. Estimated price ${formatUsd(p.price)}.` : "" },
        { property: "og:title", content: `${p?.name ?? "Product"} — ${brand.name}` },
        { property: "og:description", content: p?.description ?? "" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { state, addToCart, toggleFavourite, setItemSubstitution } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [substitution, setSubstitution] = useState<SubstitutionPreference>(state.defaultSubstitution);

  const available = isAvailable(product.stock);
  const favourite = state.favourites.includes(product.id);
  const category = categoryBySlug(product.category);
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-xs text-slate-muted">
        <Link to="/" className="hover:underline">Home</Link>
        {category ? (
          <>
            {" / "}
            <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:underline">
              {category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <img
            src={imageFor(product.category)}
            alt={product.name}
            width={816}
            height={816}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="type-page text-slate">{product.name}</h1>
            <button
              type="button"
              onClick={() => toggleFavourite(product.id)}
              aria-pressed={favourite}
              aria-label="Save to favourites"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card"
            >
              <Heart className={cn("size-5", favourite && "fill-coral text-coral")} />
            </button>
          </div>

          <p className="mt-1 text-sm text-slate-secondary">{product.description}</p>
          <p className="mt-1 text-sm text-slate-muted">{product.packSize}</p>

          <div className="mt-3 flex items-center gap-2">
            <StockBadge status={product.stock} />
            {product.promoLabel ? (
              <span className="rounded bg-coral-tint px-1.5 py-0.5 text-xs font-semibold text-coral-pressed">
                {product.promoLabel}
              </span>
            ) : null}
          </div>

           <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-baseline gap-2">
              <span className="type-price-lg text-slate">
                {formatUsd(product.price)}
              </span>
              {product.wasPrice ? (
                <span className="text-sm text-slate-muted line-through">
                  {formatUsd(product.wasPrice)}
                </span>
              ) : null}
            </div>
            {brand.currency.showSecondary ? (
              <p className="text-xs text-slate-muted">≈ {formatSecondary(product.price)}</p>
            ) : null}

            {product.weighted ? (
              <div className="mt-3 rounded-md bg-warning-bg p-3 text-xs text-warning">
                <p className="font-semibold">Sold by weight</p>
                <p className="mt-1">
                  {formatUsd(product.pricePerKg ?? product.price)} per kg · estimated{" "}
                  {product.estimatedKg ?? 1} kg · estimated total{" "}
                  {formatUsd((product.pricePerKg ?? product.price) * (product.estimatedKg ?? 1) * quantity)}
                </p>
                <p className="mt-1">
                  We charge the final packed weight. If the difference is meaningful, we ask you to
                  approve it before payment.
                </p>
              </div>
            ) : null}

            <p className="mt-3 text-xs text-slate-muted">
              Sourced from {storeById(product.storeIds[0]!)?.name}
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate" htmlFor="sub">
                If this item is unavailable
              </label>
              <select
                id="sub"
                value={substitution}
                onChange={(e) => setSubstitution(e.target.value as SubstitutionPreference)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-slate"
              >
                {substitutionOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>

             <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-4 flex items-center gap-3 border-y border-border bg-card/95 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              <div className="flex items-center rounded-md border border-border">
                <button
                  type="button"
                  aria-label="Reduce quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid size-11 place-items-center text-slate"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-slate">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="grid size-11 place-items-center text-slate"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={!available}
                onClick={() => {
                  addToCart(product.id, product.storeIds[0]!, quantity);
                  setItemSubstitution(product.id, substitution);
                  toast.success(`${product.name} added to your basket`);
                }}
                className={cn(
                  "flex-1 rounded-md py-3 text-sm font-semibold text-white",
                  available ? "bg-coral hover:bg-coral-hover active:bg-coral-pressed" : "cursor-not-allowed bg-mist text-slate-muted",
                )}
              >
                {available ? "Add to cart" : "Not available"}
              </button>
            </div>

            <EstimateNotice className="mt-3" />
          </div>

          <IndependentNotice className="mt-4" />
        </div>
      </div>

      {related.length ? (
        <section className="mt-10">
          <h2 className="mb-3 type-card text-slate">You may also need</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
