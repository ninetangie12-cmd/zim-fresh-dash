import { useState, useMemo } from "react";
import {
  Apple,
  Croissant,
  HeartPulse,
  ShoppingBag,
  Sparkles,
  Wine,
} from "lucide-react";

import { StoreCard } from "@/components/site/StoreCard";
import {
  type Store,
  type StoreCategoryFilter,
  storeFilterCategories,
  stores as allStores,
} from "@/data/catalog";

interface StoreCatalogProps {
  initialCategory?: StoreCategoryFilter;
  showTitle?: boolean;
}

const categoryIcons: Record<StoreCategoryFilter, React.ComponentType<{ className?: string }>> = {
  All: Sparkles,
  Supermarkets: ShoppingBag,
  "Fresh Produce & Butchery": Apple,
  "Liquor & Drinks": Wine,
  "Health & Pharmacy": HeartPulse,
  "Bakeries & Treats": Croissant,
};

export function StoreCatalog({
  initialCategory = "All",
  showTitle = true,
}: StoreCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<StoreCategoryFilter>(initialCategory);

  const filteredStores = useMemo(() => {
    if (activeCategory === "All") {
      return allStores;
    }
    return allStores.filter((store) => store.categoryFilter === activeCategory);
  }, [activeCategory]);

  return (
    <div className="w-full">
      {/* Sticky & Horizontally Scrollable Category Pill Filter Bar */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          {storeFilterCategories.map((cat) => {
            const Icon = categoryIcons[cat];
            const isActive = activeCategory === cat;

            // Count for each category
            const count =
              cat === "All"
                ? allStores.length
                : allStores.filter((s) => s.categoryFilter === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-botanical ${
                  isActive
                    ? "scale-[1.02] bg-botanical text-white shadow-md shadow-botanical/25"
                    : "border border-border bg-card text-slate hover:border-slate/30 hover:bg-mist"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-white" : "text-slate-muted"}`} />
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-mist text-slate-muted dark:bg-slate-800"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Status / Summary Header */}
      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          {showTitle && (
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate md:text-2xl">
              {activeCategory === "All" ? "All Harare Stores" : activeCategory}
            </h2>
          )}
          <p className="text-xs font-medium text-slate-secondary">
            Showing {filteredStores.length} {filteredStores.length === 1 ? "store" : "stores"} delivering to your area
          </p>
        </div>

        {activeCategory !== "All" && (
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className="text-xs font-semibold text-botanical hover:underline"
          >
            Clear filter ({allStores.length} total)
          </button>
        )}
      </div>

      {/* Store Cards Responsive Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
      {filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {filteredStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <div className="my-12 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-base font-semibold text-slate">No stores found in this category.</p>
          <p className="mt-1 text-sm text-slate-secondary">Try selecting "All" to browse our complete catalog.</p>
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className="mt-4 inline-flex items-center rounded-xl bg-botanical px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-botanical-hover"
          >
            Show all stores
          </button>
        </div>
      )}
    </div>
  );
}
