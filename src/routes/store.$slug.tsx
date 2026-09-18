import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { EstimateNotice, IndependentNotice } from "@/components/site/Disclaimer";
import { CategoryRail } from "@/components/site/CategoryRail";
import { Page } from "@/components/site/Page";
import { ProductGrid } from "@/components/site/ProductCard";
import { brand, formatUsd } from "@/config/brand";
import { categories, products, stores } from "@/data/catalog";

export const Route = createFileRoute("/store/$slug")({
  loader: ({ params }) => {
    const store = stores.find((s) => s.slug === params.slug);
    if (!store) throw notFound();
    return { store };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.store.name ?? "Store";
    return {
      meta: [
        { title: `${name} — shop with ${brand.name}` },
        {
          name: "description",
          content: loaderData?.store.description ?? "Shop this store for delivery in Harare.",
        },
        { property: "og:title", content: `${name} — ${brand.name}` },
        { property: "og:description", content: loaderData?.store.description ?? "" },
      ],
    };
  },
  component: StorePage,
});

function StorePage() {
  const { store } = Route.useLoaderData();
  const storeProducts = products.filter((p) => p.storeIds.includes(store.id));

  if (store.sourcing) {
    return (
      <Page title={store.name} intro={store.description} wide>
        <IndependentNotice className="mb-5" />
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative h-48 w-full md:h-56">
            <img
              src={store.coverImage}
              alt={store.name}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1 text-xs font-bold shadow-md">
                ⚡ Personal Sourcing
              </span>
              <h1 className="mt-2 font-heading text-2xl font-bold md:text-3xl">{store.name}</h1>
            </div>
          </div>
          <div className="p-6">
            <h2 className="type-card text-slate">Tell us what you need</h2>
            <p className="mt-2 text-sm text-slate-secondary">
              Send your shopping list and we'll source the items from a suitable nearby retailer, or
              from whichever store has the best available price. We confirm availability and final
              prices with you before you pay.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-secondary">
              <li className="flex items-center gap-2">
                <span className="font-semibold text-slate">Delivery estimate:</span> {store.etaMinutes[0]}–{store.etaMinutes[1]} minutes
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-slate">Delivery fee:</span> {formatUsd(store.deliveryFee)}
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-slate">Coverage:</span> Harare metropolitan area
              </li>
            </ul>
            <Link
              to="/shopping-list"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-coral px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-coral-hover"
            >
              Send your shopping list
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={store.name} intro={store.description} wide>
      <IndependentNotice className="mb-4" />
      <EstimateNotice className="mb-4" />

      {/* Modern Storefront Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="relative h-48 w-full md:h-60">
          <img
            src={store.coverImage}
            alt={`${store.name} banner`}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
          
          {/* Floating Badges */}
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            {store.promoBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1 text-xs font-extrabold text-white shadow-md">
                🏷️ {store.promoBadge}
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              ⚡ {store.etaMinutes[0]}–{store.etaMinutes[1]} min
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="font-heading text-2xl font-black md:text-3xl">{store.name}</h1>
            <p className="mt-1 text-sm text-white/90">{store.primaryCategories}</p>
          </div>
        </div>

        {/* Store Metadata bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 p-4 text-xs md:text-sm text-slate-secondary">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <span className="flex items-center gap-1 font-bold text-slate">
              ★ {store.rating.toFixed(1)} ({store.reviewCount} ratings)
            </span>
            <span className="text-border">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {store.deliveryFee === 0 ? "Free Delivery" : `${formatUsd(store.deliveryFee)} Delivery`}
            </span>
            <span className="text-border">•</span>
            <span>{store.distance} from you</span>
            <span className="text-border">•</span>
            <span>{store.pickup.hours}</span>
          </div>

          <Link
            to="/stores"
            className="text-xs font-semibold text-botanical hover:underline"
          >
            ← View all stores
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <CategoryRail />
      </div>

      {storeProducts.length > 0 ? (
        <ProductGrid products={storeProducts} />
      ) : (
        <div className="my-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h3 className="text-lg font-bold text-slate">Catalog updating for {store.name}</h3>
          <p className="mt-1 text-sm text-slate-secondary">
            Products for this merchant are being prepared. In the meantime, you can send us your shopping list or browse our full store network.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/shopping-list"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-coral px-5 text-sm font-bold text-white shadow-sm hover:bg-coral-hover"
            >
              Send a shopping list
            </Link>
            <Link
              to="/stores"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-slate hover:bg-mist"
            >
              Browse other stores
            </Link>
          </div>
        </div>
      )}
    </Page>
  );
}
