import { useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { formatSecondary, formatUsd } from "@/config/brand";
import { productById, storeById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export function CartDrawer() {
  const {
    state,
    totals,
    user,
    isCartOpen,
    closeCart,
    setQuantity,
    removeFromCart,
    openAuthModal,
  } = useApp();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on Escape key and lock body scroll
  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  // Free delivery calculation
  const freeThreshold = totals.freeDeliveryThreshold ?? 25;
  const isFreeDelivery = totals.subtotal >= freeThreshold;
  const remainingForFree = Math.max(0, freeThreshold - totals.subtotal);
  const progressPercent = Math.min(100, Math.round((totals.subtotal / freeThreshold) * 100));

  // Handle Checkout Click with Auth Intercept
  const handleCheckout = () => {
    if (!user) {
      // Intercept with AuthModal; once authenticated, proceed to checkout
      openAuthModal(() => {
        closeCart();
        navigate({ to: "/checkout" });
      });
      return;
    }

    closeCart();
    navigate({ to: "/checkout" });
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark backdrop overlay with blur */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      />

      {/* Drawer Container: Slide from right on desktop, slide up from bottom on mobile */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your Shopping Basket"
        className="relative z-10 flex h-full w-full flex-col bg-white shadow-2xl transition-transform animate-in duration-300 ease-out sm:max-w-md md:w-[460px] max-md:max-h-[92vh] max-md:mt-auto max-md:rounded-t-3xl max-md:slide-in-from-bottom md:rounded-l-3xl md:slide-in-from-right"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 md:hidden">
          <span className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        {/* ----------------- Drawer Header ----------------- */}
        <div className="border-b border-border/70 px-5 pt-3 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-botanical/10 text-botanical">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate tracking-tight">Your Basket</h2>
                <p className="text-xs font-semibold text-slate-muted">
                  {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            <button
              onClick={closeCart}
              aria-label="Close cart"
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-secondary hover:bg-mist hover:text-slate transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">Continue Shopping</span>
              <X className="size-4" />
            </button>
          </div>

          {/* Sixty60-inspired Free Delivery Progress Bar */}
          {state.cart.length > 0 && (
            <div className="mt-3.5 rounded-2xl bg-canvas/80 p-3 border border-border/60">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  {isFreeDelivery ? (
                    <>
                      <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
                      <span className="text-emerald-700">🎉 You unlocked FREE Delivery!</span>
                    </>
                  ) : (
                    <>
                      <Truck className="size-3.5 text-coral" />
                      <span className="text-slate">
                        Add <span className="text-coral font-extrabold">{formatUsd(remainingForFree)}</span> more for <span className="text-emerald-700 font-extrabold">FREE Delivery</span>
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[11px] tabular text-slate-muted">{progressPercent}%</span>
              </div>

              {/* Progress bar container */}
              <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isFreeDelivery
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "bg-gradient-to-r from-coral to-amber-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ----------------- Cart Items List / Empty State ----------------- */}
        <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-border/60">
          {state.cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12 px-4">
              <div className="grid size-20 place-items-center rounded-3xl bg-mist text-slate-muted mb-4 shadow-inner">
                <ShoppingBag className="size-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate">Your basket is empty</h3>
              <p className="mt-1.5 max-w-xs text-xs text-slate-muted leading-relaxed">
                Explore rapid grocery and farm-fresh delivery in Harare. Add everyday groceries and treats to see them here!
              </p>
              <button
                onClick={() => {
                  closeCart();
                  navigate({ to: "/stores" });
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-coral px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-coral-hover active:scale-98 transition-all cursor-pointer"
              >
                <span>Start Shopping</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {state.cart.map((line) => {
                const product = productById(line.productId);
                if (!product) return null;
                const store = storeById(line.storeId);
                const lineTotalUsd = product.price * line.quantity;

                return (
                  <li key={line.productId} className="flex gap-3.5 py-4 first:pt-1 last:pb-2">
                    {/* Thumbnail Image */}
                    <div className="relative size-18 sm:size-20 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-mist/50">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                      />
                      {product.promoLabel && (
                        <span className="absolute bottom-1 left-1 rounded-md bg-coral/95 px-1 py-0.5 text-[9px] font-bold text-white leading-none">
                          Promo
                        </span>
                      )}
                    </div>

                    {/* Info & Quantity controls */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to="/product/$slug"
                            params={{ slug: product.slug }}
                            onClick={closeCart}
                            className="font-bold text-sm text-slate hover:text-botanical transition-colors line-clamp-2 leading-snug"
                          >
                            {product.name}
                          </Link>

                          {/* Instant trash removal button */}
                          <button
                            onClick={() => removeFromCart(product.id)}
                            aria-label={`Remove ${product.name} from basket`}
                            className="text-slate-muted hover:text-red-500 transition-colors p-1 -mr-1 cursor-pointer"
                          >
                            <X className="size-4" />
                          </button>
                        </div>

                        {/* Packaging & Store tag */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-muted">
                          <span>{product.packSize}</span>
                          {store && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-slate-secondary truncate max-w-[120px]">
                                {store.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Controls Row */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {/* Dual Currency Price Display */}
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-extrabold text-slate text-sm sm:text-base">
                              {formatUsd(lineTotalUsd)}
                            </span>
                            {product.wasPrice && (
                              <span className="text-xs text-slate-muted line-through">
                                {formatUsd(product.wasPrice * line.quantity)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate-muted">
                            ~ {formatSecondary(lineTotalUsd)}
                          </p>
                        </div>

                        {/* Integrated [-] [qty] [+] controls */}
                        <div className="flex h-9 items-center rounded-xl border border-border/80 bg-canvas shadow-2xs">
                          <button
                            onClick={() => setQuantity(product.id, line.quantity - 1)}
                            aria-label={
                              line.quantity === 1
                                ? `Remove ${product.name}`
                                : `Decrease quantity of ${product.name}`
                            }
                            className="grid size-9 place-items-center text-slate-secondary hover:text-slate active:scale-90 transition-transform cursor-pointer"
                          >
                            {line.quantity === 1 ? (
                              <Trash2 className="size-4 text-red-500 hover:text-red-600" />
                            ) : (
                              <Minus className="size-3.5 stroke-[2.5]" />
                            )}
                          </button>

                          <span className="w-8 text-center text-xs font-extrabold text-slate tabular">
                            {line.quantity}
                          </span>

                          <button
                            onClick={() => setQuantity(product.id, line.quantity + 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                            className="grid size-9 place-items-center text-botanical hover:text-botanical-hover active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus className="size-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ----------------- Order Summary & Checkout CTA ----------------- */}
        {state.cart.length > 0 && (
          <div className="border-t border-border/70 bg-canvas/40 px-5 pt-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.03)]">
            {/* Breakdown summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-secondary">
                <span>Subtotal ({totals.itemCount} items)</span>
                <span className="font-semibold text-slate">{formatUsd(totals.subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-secondary">
                <span className="flex items-center gap-1">
                  <span>Delivery Fee</span>
                  {isFreeDelivery && (
                    <span className="rounded bg-emerald-100 px-1 py-0.2 text-[10px] font-bold text-emerald-800">
                      SAVED
                    </span>
                  )}
                </span>
                {isFreeDelivery ? (
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-slate-muted">
                      {formatUsd(totals.baseDeliveryFee ?? 3.5)}
                    </span>
                    <span className="font-extrabold text-emerald-600">FREE</span>
                  </div>
                ) : (
                  <span className="font-semibold text-slate">{formatUsd(totals.deliveryFee)}</span>
                )}
              </div>

              <div className="flex justify-between text-slate-secondary">
                <span>Service Fee</span>
                <span className="font-semibold text-slate">{formatUsd(totals.serviceFee)}</span>
              </div>

              {totals.savings > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Promotional Savings</span>
                  <span>-{formatUsd(totals.savings)}</span>
                </div>
              )}

              {/* Total Row */}
              <div className="pt-2 border-t border-border/60 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-extrabold text-slate">Estimated Total</span>
                  <p className="text-[11px] font-medium text-slate-muted">Includes VAT & fees</p>
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-extrabold text-slate tracking-tight">
                    {formatUsd(totals.total)}
                  </div>
                  <div className="inline-block rounded-md bg-mist px-1.5 py-0.5 text-[11px] font-bold text-slate-secondary">
                    ~ {formatSecondary(totals.total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Sixty60-style Checkout Button */}
            <button
              onClick={handleCheckout}
              className="mt-3.5 flex w-full items-center justify-between rounded-2xl bg-coral px-5 py-3.5 font-bold text-white shadow-lg shadow-coral/25 hover:bg-coral-hover active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <span>Proceed to Checkout</span>
                <ArrowRight className="size-4.5" />
              </div>
              <span className="text-sm sm:text-base font-extrabold tabular">
                {formatUsd(totals.total)}
              </span>
            </button>

            {/* Micro assurances */}
            <div className="mt-2.5 flex items-center justify-center gap-4 text-[11px] font-medium text-slate-muted">
              <span className="flex items-center gap-1">
                <Zap className="size-3 text-amber-500" />
                Rapid 60-min delivery
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600" />
                Guaranteed fresh
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
