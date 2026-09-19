import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Beef, Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { brand, formatSecondary, formatUsd } from "@/config/brand";
import { premiumMeatsProducts, type Product } from "@/data/catalog";
import { useApp } from "@/lib/app-state";
import { imageFor } from "@/lib/images";
import { cn } from "@/lib/utils";

export function MeatProductCard({ product }: { product: Product }) {
  const { state, user, openAuthModal, addToCart, setQuantity, toggleFavourite } = useApp();
  const line = state.cart.find((i) => i.productId === product.id);
  const isFavourite = state.favourites.includes(product.id);
  const quantity = line?.quantity ?? 0;

  const fallbackImg = imageFor(product.category);
  const [imgSrc, setImgSrc] = useState(product.image || fallbackImg);

  useEffect(() => {
    setImgSrc(product.image || fallbackImg);
  }, [product.image, fallbackImg]);

  const handleImageError = () => {
    if (imgSrc !== fallbackImg) {
      setImgSrc(fallbackImg);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal(() => {
        addToCart(product.id, product.storeIds[0]!);
        toast.success(`Added ${product.name} to your basket`);
      });
      return;
    }

    addToCart(product.id, product.storeIds[0]!);
    toast.success(`Added ${product.name} to your basket`);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(product.id, quantity - 1);
  };

  const handleToggleFavourite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavourite(product.id);
  };

  return (
    <article className="group relative flex flex-col justify-between h-full rounded-2xl border border-border/80 bg-card p-3 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-botanical/30 hover:shadow-lg">
      {/* Product Image & Badges Container */}
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative w-full aspect-square flex items-center justify-center p-2.5 sm:p-3.5 md:p-4 bg-neutral-50/60 rounded-2xl overflow-hidden dark:bg-slate-900/40"
      >
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onError={handleImageError}
          className="size-full max-h-[88%] object-contain object-center mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top-Left Floating Badge: Discount or Freshness */}
        {product.promoLabel && (
          <div className="absolute left-2 top-2 pointer-events-none">
            {product.promoLabel.startsWith("-") ? (
              <span className="inline-flex items-center rounded-md bg-coral px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
                {product.promoLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs dark:bg-emerald-500">
                <Beef className="size-3 shrink-0" />
                <span>{product.promoLabel}</span>
              </span>
            )}
          </div>
        )}

        {/* Top-Right Heart / Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleFavourite}
          aria-label={isFavourite ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isFavourite}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 text-slate-muted shadow-xs transition-colors hover:text-coral focus-visible:outline-hidden dark:bg-slate-800/95"
        >
          <Heart className={cn("size-4 transition-transform active:scale-125", isFavourite && "fill-coral text-coral")} />
        </button>
      </Link>

      {/* Product Information (Pack size and Title with uniform height constraint) */}
      <div className="flex flex-1 flex-col justify-start my-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-muted">
          {product.packSize}
        </span>

        {/* Product Title (1-2 line clamp with consistent minimum height) */}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mt-0.5 min-h-[2.5rem] font-heading text-sm font-bold leading-snug tracking-tight text-slate transition-colors line-clamp-2 group-hover:text-botanical"
        >
          {product.name}
        </Link>
      </div>

      {/* Pricing & Interactive Add Stepper Row */}
      <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-border/40">
        {/* Price Column */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-base font-extrabold text-slate md:text-lg">
              {formatUsd(product.price)}
            </span>
            {product.wasPrice && (
              <span className="text-xs font-medium text-slate-muted line-through tabular-nums">
                {formatUsd(product.wasPrice)}
              </span>
            )}
          </div>
          {brand.currency.showSecondary && (
            <span className="text-[11px] font-medium text-slate-muted tabular-nums">
              ≈ {formatSecondary(product.price)}
            </span>
          )}
        </div>

        {/* Interactive Add Button: Circular + or Expanded - [qty] + Stepper */}
        <div className="shrink-0">
          {quantity > 0 ? (
            <div className="flex h-9 items-center rounded-full bg-botanical px-1 text-white shadow-md shadow-botanical/20 transition-all duration-300">
              <button
                type="button"
                onClick={handleDecrement}
                aria-label={`Reduce quantity of ${product.name}`}
                className="grid size-7 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/20 active:scale-95"
              >
                <Minus className="size-3.5 stroke-[2.5]" />
              </button>

              <span className="min-w-[1.25rem] text-center font-heading text-xs font-bold tabular-nums text-white">
                {quantity}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                aria-label={`Increase quantity of ${product.name}`}
                className="grid size-7 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/20 active:scale-95"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              className="grid size-9 place-items-center rounded-full bg-coral text-white shadow-md shadow-coral/25 transition-all duration-200 hover:scale-105 hover:bg-coral-hover active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-coral"
            >
              <Plus className="size-4.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function PremiumMeatsSection() {
  const meatItems = premiumMeatsProducts();

  return (
    <section className="w-full" aria-labelledby="fresh-picks-title">
      {/* Section Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-rose-100 text-rose-700 shadow-xs dark:bg-rose-950/60 dark:text-rose-400">
              <Beef className="size-4.5" />
            </span>
            <h2
              id="premium-meats-title"
              className="font-heading text-xl font-black tracking-tight text-slate md:text-2xl"
            >
              Premium Meats & Butchery
            </h2>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-secondary md:text-sm">
            Fresh, quality cuts straight from the butcher.
          </p>
        </div>

        <Link
          to="/category/$slug"
          params={{ slug: "meat-butchery" }}
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-botanical hover:underline"
        >
          <span>View All Meat (15)</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Mobile Horizontal Snap-Scrolling Carousel */}
      <div className="flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1 -mx-4 px-4 md:hidden">
        {meatItems.map((product) => (
          <div key={product.id} className="w-[185px] sm:w-[210px] shrink-0 snap-start flex flex-col">
            <MeatProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Desktop 4 to 5 Column Responsive Grid */}
      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5 pt-1 items-stretch">
        {meatItems.map((product) => (
          <MeatProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
