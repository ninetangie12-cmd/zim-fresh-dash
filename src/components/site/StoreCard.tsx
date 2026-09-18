import { Link } from "@tanstack/react-router";
import {
  Beer,
  Clock,
  Flame,
  HeartPulse,
  Leaf,
  MapPin,
  Sparkles,
  Star,
  Store as StoreIcon,
  Truck,
  UtensilsCrossed,
  Wine,
} from "lucide-react";

import { formatUsd } from "@/config/brand";
import type { Store } from "@/data/catalog";

function StoreLogoIcon({ type, name }: { type?: Store["logoType"]; name: string }) {
  switch (type) {
    case "farm":
      return <Leaf className="size-7 text-white drop-shadow-sm" />;
    case "meat":
      return <Flame className="size-7 text-white drop-shadow-sm" />;
    case "wine":
      return <Wine className="size-7 text-white drop-shadow-sm" />;
    case "liquor":
      return <Beer className="size-7 text-white drop-shadow-sm" />;
    case "pharmacy":
      return <HeartPulse className="size-7 text-white drop-shadow-sm" />;
    case "bakery":
      return <UtensilsCrossed className="size-7 text-white drop-shadow-sm" />;
    case "shopper":
      return <Sparkles className="size-7 text-white drop-shadow-sm" />;
    case "supermarket":
    default:
      return <StoreIcon className="size-7 text-white drop-shadow-sm" />;
  }
}

export function StoreCard({ store }: { store: Store }) {
  const isOpen = store.status === "open";

  return (
    <Link
      to="/store/$slug"
      params={{ slug: store.slug }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-botanical/30 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-botanical focus-visible:outline-hidden"
    >
      {/* Banner Cover Image Container */}
      <div className="relative h-44 w-full overflow-hidden bg-mist md:h-48">
        <img
          src={store.coverImage}
          alt={`${store.name} storefront banner`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />

        {/* Floating Badges */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 pointer-events-none">
          {/* Top-left Promo Badge */}
          {store.promoBadge ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-xs font-extrabold text-white shadow-md backdrop-blur-xs">
              <Sparkles className="size-3 shrink-0" />
              <span>{store.promoBadge}</span>
            </span>
          ) : (
            <span />
          )}

          {/* Top-right Delivery ETA Pill */}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate/85 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
            <span className="text-amber-300">⚡</span>
            <span>
              {store.etaMinutes[0]}–{store.etaMinutes[1]} min
            </span>
          </span>
        </div>
      </div>

      {/* Store Logo Overlapping Image */}
      <div className="relative z-10 -mt-7 ml-4 flex items-end justify-between pr-4">
        <div
          className={`grid size-14 place-items-center rounded-2xl ring-4 ring-card shadow-md transition-transform duration-200 group-hover:scale-105 ${
            store.logoBg || "bg-botanical"
          }`}
        >
          <StoreLogoIcon type={store.logoType} name={store.name} />
        </div>

        {/* Live Status Badge */}
        <div className="mb-1 flex items-center">
          {isOpen ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300">
              <span className="size-2 rounded-full bg-slate-400"></span>
              {store.statusText || "Opens at 8 AM"}
            </span>
          )}
        </div>
      </div>

      {/* Store Details */}
      <div className="flex flex-1 flex-col p-4 pt-2">
        <h3 className="font-heading text-lg font-bold tracking-tight text-slate transition-colors group-hover:text-botanical">
          {store.name}
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-slate-secondary">
          {store.primaryCategories || store.categories.join(" • ")}
        </p>

        {/* Bottom Info Bar */}
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs font-medium text-slate-secondary">
          {/* Rating */}
          <div className="flex items-center gap-1 font-bold text-slate">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{store.rating.toFixed(1)}</span>
            <span className="font-normal text-slate-muted">({store.reviewCount})</span>
          </div>

          <span className="text-border">•</span>

          {/* Delivery Fee */}
          <div className="flex items-center gap-1">
            <Truck className="size-3.5 text-slate-muted" />
            <span
              className={
                store.deliveryFee === 0
                  ? "font-bold text-emerald-600 dark:text-emerald-400"
                  : "text-slate"
              }
            >
              {store.deliveryFee === 0 ? "Free Delivery" : `${formatUsd(store.deliveryFee)} Delivery`}
            </span>
          </div>

          <span className="text-border">•</span>

          {/* Distance */}
          <div className="flex items-center gap-1">
            <MapPin className="size-3.5 text-slate-muted" />
            <span>{store.distance}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
