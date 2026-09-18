import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { StockBadge } from "@/components/site/StockBadge";
import { brand, formatSecondary, formatUsd } from "@/config/brand";
import { isAvailable, storeById, type Product } from "@/data/catalog";
import { useApp } from "@/lib/app-state";
import { imageFor } from "@/lib/images";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { state, user, openAuthModal, addToCart, setQuantity, toggleFavourite } = useApp();
  const line = state.cart.find((i) => i.productId === product.id);
  const available = isAvailable(product.stock);
  const favourite = state.favourites.includes(product.id);
  const store = storeById(product.storeIds[0]!);

  const fallbackImg = imageFor(product.category);
  const [imgSrc, setImgSrc] = useState(product.image || fallbackImg);

  return (
    <article className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-botanical-mid">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-mist"
      >
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onError={() => {
            if (imgSrc !== fallbackImg) setImgSrc(fallbackImg);
          }}
          width={816}
          height={816}
          className="size-full object-cover"
        />
        {product.promoLabel ? (
          <span className="type-eyebrow absolute left-2 top-2 rounded bg-coral px-1.5 py-0.5 text-white">
            {product.promoLabel}
          </span>
        ) : null}
      </Link>

      <button
        type="button"
        onClick={() => toggleFavourite(product.id)}
        aria-label={favourite ? `Remove ${product.name} from favourites` : `Save ${product.name}`}
        aria-pressed={favourite}
        className="absolute right-1.5 top-1.5 grid size-11 place-items-center rounded-full bg-card/95 text-slate-secondary shadow-sm"
      >
        <Heart className={cn("size-4", favourite && "fill-coral text-coral")} />
      </button>

       <div className="flex flex-1 flex-col gap-1 p-3">
        <StockBadge status={product.stock} className="self-start" />
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="type-card clamp-2 text-slate"
        >
          {product.name}
        </Link>
        <p className="type-meta">{product.packSize}</p>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="type-price text-slate">
              {formatUsd(product.price)}
            </span>
            {product.wasPrice ? (
              <span className="type-small tabular text-slate-muted line-through">
                {formatUsd(product.wasPrice)}
              </span>
            ) : null}
          </div>
          {brand.currency.showSecondary ? (
            <p className="type-small tabular text-slate-muted">≈ {formatSecondary(product.price)}</p>
          ) : null}
          <p className="type-small text-slate-muted">Estimated · {store?.name}</p>

          {!available ? (
             <button
              type="button"
              disabled
               className="type-ui mt-2 min-h-11 w-full cursor-not-allowed rounded-xl bg-mist px-2 text-slate-muted"
            >
              Not available
            </button>
          ) : line ? (
             <div className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-botanical-tint">
              <button
                type="button"
                aria-label={`Reduce ${product.name}`}
                onClick={() => setQuantity(product.id, line.quantity - 1)}
                 className="grid size-11 place-items-center rounded-xl text-botanical"
              >
                <Minus className="size-4" />
              </button>
              <span className="type-ui tabular text-botanical">{line.quantity}</span>
              <button
                type="button"
                aria-label={`Add another ${product.name}`}
                onClick={() => setQuantity(product.id, line.quantity + 1)}
                 className="grid size-11 place-items-center rounded-xl text-botanical"
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal(() => {
                    addToCart(product.id, product.storeIds[0]!);
                    toast.success(`${product.name} added to your basket`);
                  });
                  return;
                }
                addToCart(product.id, product.storeIds[0]!);
                toast.success(`${product.name} added to your basket`);
              }}
               className="mt-2 min-h-11 w-full rounded-xl bg-coral px-2 text-[15px] font-bold leading-none text-primary-foreground transition-colors hover:bg-coral-hover active:bg-coral-pressed"
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
