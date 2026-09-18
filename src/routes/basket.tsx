import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EstimateNotice, IndependentNotice } from "@/components/site/Disclaimer";
import { Page } from "@/components/site/Page";
import { brand, formatUsd } from "@/config/brand";
import {
  productById,
  storeById,
  substitutionOptions,
  type SubstitutionPreference,
} from "@/data/catalog";
import { useApp } from "@/lib/app-state";
import { imageFor } from "@/lib/images";

export const Route = createFileRoute("/basket")({
  head: () => ({
    meta: [
      { title: `Your basket — ${brand.name}` },
      { name: "description", content: "Review your basket, set substitution preferences and continue to checkout." },
      { property: "og:title", content: `Your basket — ${brand.name}` },
      { property: "og:description", content: "Review your basket before checkout." },
    ],
  }),
  component: Basket,
});

function Basket() {
  const { state, totals, setQuantity, removeFromCart, setItemSubstitution, addList } = useApp();
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const storeGroups = [...new Set(state.cart.map((i) => i.storeId))];

  if (!state.cart.length) {
    return (
      <Page title="Your basket" intro="Your basket is empty, but your next shop is close by.">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-slate-secondary">
            Nothing here yet. Browse the categories, or send us your shopping list and we'll source
            the items for you.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
             <Link to="/stores" className="inline-flex min-h-11 items-center rounded-xl bg-coral px-4 text-sm font-bold text-primary-foreground hover:bg-coral-hover">
              Start shopping
            </Link>
             <Link to="/shopping-list" className="inline-flex min-h-11 items-center rounded-xl border border-botanical px-4 text-sm font-semibold text-botanical">
              Send a list
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Your basket" intro={`${totals.itemCount} items`} wide>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Prices and stock can change. Refresh before checkout.
            </span>
            <button
              type="button"
              onClick={() => {
                setRefreshedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
                toast.success("Basket refreshed — prices and stock are current");
              }}
              className="inline-flex items-center gap-1 rounded border border-warning px-2 py-1 font-semibold"
            >
              <RefreshCw className="size-3" /> Refresh basket
            </button>
          </div>
          {refreshedAt ? (
            <p className="-mt-2 mb-4 text-xs text-slate-muted">Last refreshed at {refreshedAt}.</p>
          ) : null}

          {storeGroups.length > 1 ? (
            <p className="mb-4 rounded-md bg-info-bg px-3 py-2 text-xs text-info">
              Your items come from {storeGroups.length} stores. These are picked as separate orders
              and each one carries its own delivery fee.
            </p>
          ) : null}

          {storeGroups.map((storeId) => {
            const store = storeById(storeId);
            const items = state.cart.filter((i) => i.storeId === storeId);
            return (
              <section key={storeId} className="mb-5 rounded-lg border border-border bg-card">
                <h2 className="border-b border-border px-4 py-3 type-label text-slate">
                  {store?.name} · {items.length} item{items.length === 1 ? "" : "s"}
                </h2>
                <ul>
                  {items.map((item) => {
                    const product = productById(item.productId);
                    if (!product) return null;
                    return (
                       <li key={item.productId} className="flex gap-3 border-b border-border p-3 last:border-0 md:p-4">
                        <img
                          src={imageFor(product.category)}
                          alt=""
                          loading="lazy"
                          width={816}
                          height={816}
                          className="size-16 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                to="/product/$slug"
                                params={{ slug: product.slug }}
                                className="text-sm font-semibold text-slate"
                              >
                                {product.name}
                              </Link>
                              <p className="text-xs text-slate-muted">{product.packSize}</p>
                              {product.weighted ? (
                                <p className="text-xs text-warning">
                                  Charged on final packed weight
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${product.name}`}
                              onClick={() => removeFromCart(product.id)}
                               className="grid size-11 shrink-0 place-items-center rounded-lg text-slate-muted hover:bg-error-bg hover:text-error"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <select
                            aria-label={`Substitution preference for ${product.name}`}
                            value={item.substitution}
                            onChange={(e) =>
                              setItemSubstitution(product.id, e.target.value as SubstitutionPreference)
                            }
                             className="mt-2 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-slate-secondary"
                          >
                            {substitutionOptions.map((o) => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </select>

                          <div className="mt-2 flex items-center justify-between">
                             <div className="flex min-h-11 items-center rounded-xl border border-border">
                              <button
                                type="button"
                                aria-label="Reduce quantity"
                                onClick={() => setQuantity(product.id, item.quantity - 1)}
                                 className="grid size-11 place-items-center text-slate"
                              >
                                <Minus className="size-4" />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => setQuantity(product.id, item.quantity + 1)}
                                 className="grid size-11 place-items-center text-slate"
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>
                            <span className="type-label text-slate">
                              {formatUsd(product.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <button
            type="button"
            onClick={() => {
              addList(`Basket ${new Date().toLocaleDateString("en-GB")}`, state.cart.map((i) => i.productId));
              toast.success("Basket saved as a list");
            }}
            className="rounded-md border border-botanical px-4 py-2 text-sm font-semibold text-botanical"
          >
            Save basket as a list
          </button>
        </div>

         <aside className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 bg-canvas/95 px-4 pb-2 pt-3 backdrop-blur-md lg:top-40 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="type-card text-slate">Order summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Estimated product total" value={formatUsd(totals.subtotal)} />
              <Row label="Delivery fee" value={formatUsd(totals.deliveryFee)} />
              <Row label="Service fee" value={formatUsd(totals.serviceFee)} />
              {totals.savings > 0 ? (
                <Row label="You save" value={`- ${formatUsd(totals.savings)}`} tone="success" />
              ) : null}
              <div className="flex justify-between border-t border-border pt-2 type-card text-slate">
                <dt>Estimated total</dt>
                <dd>{formatUsd(totals.total)}</dd>
              </div>
            </dl>

            <Link
              to="/checkout"
             className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-coral px-4 text-[15px] font-bold text-primary-foreground hover:bg-coral-hover"
            >
              Continue to checkout
            </Link>
            <EstimateNotice className="mt-3" />
          </div>
          <IndependentNotice className="mt-3" />
        </aside>
      </div>
    </Page>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-secondary">{label}</dt>
      <dd className={tone === "success" ? "font-medium text-success" : "font-medium text-slate"}>
        {value}
      </dd>
    </div>
  );
}
