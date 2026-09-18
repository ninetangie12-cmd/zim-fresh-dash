import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBasket } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatUsd } from "@/config/brand";
import { productById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export function QuickBasket() {
  const { state, totals, setQuantity, user, openAuthModal } = useApp();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !user) {
      openAuthModal(() => {
        setOpen(true);
      });
      return;
    }
    setOpen(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        aria-label={`Basket, ${totals.itemCount} items`}
        className="relative grid size-11 shrink-0 place-items-center rounded-xl text-primary-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
      >
        <ShoppingBasket className="size-5" />
        {totals.itemCount > 0 ? (
          <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-coral px-1 text-xs font-bold tabular text-primary-foreground">
            {totals.itemCount}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto rounded-t-2xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 md:hidden">
        <SheetHeader className="pr-10 text-left">
          <SheetTitle className="type-card text-slate">Your basket</SheetTitle>
          <SheetDescription>{totals.itemCount ? `${totals.itemCount} items · estimated ${formatUsd(totals.total)}` : "Your basket is ready when you are."}</SheetDescription>
        </SheetHeader>
        {state.cart.length ? (
          <>
            <ul className="mt-4 divide-y divide-border">
              {state.cart.slice(0, 4).map((line) => {
                const product = productById(line.productId);
                if (!product) return null;
                return (
                  <li key={line.productId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate">{product.name}</p>
                      <p className="type-meta">{product.packSize} · {formatUsd(product.price * line.quantity)}</p>
                    </div>
                    <div className="flex h-11 items-center rounded-xl border border-border">
                      <button aria-label={`Reduce ${product.name}`} onClick={() => setQuantity(product.id, line.quantity - 1)} className="grid size-11 place-items-center text-botanical"><Minus className="size-4" /></button>
                      <span className="w-6 text-center text-sm font-semibold tabular">{line.quantity}</span>
                      <button aria-label={`Add another ${product.name}`} onClick={() => setQuantity(product.id, line.quantity + 1)} className="grid size-11 place-items-center text-botanical"><Plus className="size-4" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {state.cart.length > 4 ? <p className="type-small mt-2 text-slate-muted">And {state.cart.length - 4} more items</p> : null}
            <Link onClick={() => setOpen(false)} to="/basket" className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-coral px-4 text-[15px] font-bold text-primary-foreground hover:bg-coral-hover">
              Review basket · {formatUsd(totals.total)}
            </Link>
          </>
        ) : (
          <div className="py-10 text-center">
            <ShoppingBasket className="mx-auto size-8 text-slate-muted" />
            <p className="mt-3 text-sm text-slate-secondary">Add products to see them here.</p>
            <Link onClick={() => setOpen(false)} to="/stores" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-coral px-4 text-sm font-bold text-primary-foreground">Start shopping</Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}