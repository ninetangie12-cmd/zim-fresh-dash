import { AlertTriangle, Store as StoreIcon, Trash2 } from "lucide-react";
import { storeById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export function MultiStoreCartModal() {
  const { pendingStoreConflict, resolveStoreConflict } = useApp();

  if (!pendingStoreConflict) return null;

  const existingStore = storeById(pendingStoreConflict.existingStoreId);
  const newStore = storeById(pendingStoreConflict.newStoreId);

  const existingStoreName = existingStore?.name || "your current store";
  const newStoreName = newStore?.name || "the new store";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start gap-3.5">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-100 dark:bg-amber-950/60">
            <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-slate">
              Start new cart from {newStoreName}?
            </h3>
            <p className="mt-1 text-sm text-slate-secondary leading-relaxed">
              Your cart currently contains items from <strong>{existingStoreName}</strong>. To ensure direct, swift delivery from a single retailer, you can only order from one store at a time.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          Would you like to clear your cart and start a new order with <strong>{newStoreName}</strong>?
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => resolveStoreConflict(false)}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-slate hover:bg-mist transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => resolveStoreConflict(true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-coral py-2.5 text-sm font-bold text-white shadow-md hover:bg-coral-hover transition-transform active:scale-98"
          >
            <Trash2 className="size-4" />
            <span>Clear & Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
