import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock, FileText, MapPin, RotateCcw, Sparkles } from "lucide-react";

import { IndependentNotice } from "@/components/site/Disclaimer";
import { CategoryRail } from "@/components/site/CategoryRail";
import { FreshPicksSection } from "@/components/site/FreshPicksSection";
import { HomeHero } from "@/components/site/HomeHero";
import { ProductGrid } from "@/components/site/ProductCard";
import { Section } from "@/components/site/Page";
import { StoreCard } from "@/components/site/StoreCard";
import { ValueAddedServices } from "@/components/site/ValueAddedServices";
import { brand } from "@/config/brand";
import {
  popularProducts,
  productById,
  promotionProducts,
  stores,
  zoneById,
} from "@/data/catalog";
import { useApp } from "@/lib/app-state";

// Redesigned modern Sixty60-inspired homepage layout
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${brand.name} — grocery and liquor delivery in Harare` },
      {
        name: "description",
        content:
          "Shop groceries, fresh produce and liquor for delivery across Harare in under 90 minutes. Send us your shopping list and we'll do the rest.",
      },
      { property: "og:title", content: `${brand.name} — ${brand.tagline}` },
      {
        property: "og:description",
        content: "Rapid grocery and liquor delivery across Harare. Everyday shopping, delivered.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { state, activeAddress } = useApp();
  const zone = activeAddress ? zoneById(activeAddress.zoneId) : undefined;
  const lastOrder = state.orders[0];
  const buyAgain = [...new Set(state.orders.flatMap((o) => o.items.map((i) => i.productId)))]
    .map(productById)
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <HomeHero />

      <Link to="/addresses" className="mt-3 flex min-h-14 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-botanical-mid">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-botanical-tint text-botanical">
            <MapPin className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate">{activeAddress ? activeAddress.line : "Choose a delivery address"}</span>
            <span className="block text-xs text-slate-muted">
              {zone ? `${zone.etaMinutes[0]}–${zone.etaMinutes[1]} min delivery` : "Set your location for an estimate"}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-slate-muted" />
      </Link>

      <div className="mt-8 md:mt-10">
        <FreshPicksSection />
      </div>

      <Section title="Shop by category"><CategoryRail /></Section>

      <Section
        title="Choose where we shop"
        action={
          <Link
            to="/stores"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-botanical hover:underline"
          >
            All {stores.length} stores <ArrowRight className="size-4" />
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {stores.slice(0, 6).map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      </Section>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mt-12">
        <QuickAction to="/shopping-list" icon={<FileText className="size-5" />} label="Send a list" hint="Type or photograph it" />
        <QuickAction to="/lists" icon={<Sparkles className="size-5" />} label="Saved lists" hint="Reuse your usual shop" />
        <QuickAction to="/orders" icon={<RotateCcw className="size-5" />} label="Previous order" hint={lastOrder ? lastOrder.id : "No orders yet"} />
        <QuickAction to="/liquor" icon={<Clock className="size-5" />} label="Liquor 18+" hint="Age check required" />
      </div>

      {buyAgain.length ? (
        <Section title="Buy again">
          <ProductGrid products={(buyAgain as NonNullable<(typeof buyAgain)[number]>[]).slice(0, 5)} />
        </Section>
      ) : null}

      <Section title="Popular near you" action={<Link to="/search" search={{ q: "" }} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-botanical">See all <ArrowRight className="size-4" /></Link>}>
        <ProductGrid products={popularProducts().slice(0, 5)} />
      </Section>

      <IndependentNotice className="mt-6" />

      {/* Value-Added Services Hub (ZESA, Airtime, Tickets, Travel, Insurance, Wallets) */}
      <ValueAddedServices />
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
  hint,
}: {
  to: "/shopping-list" | "/lists" | "/orders" | "/liquor";
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link to={to} className="rounded-lg border border-border bg-card p-3 hover:border-botanical-mid">
      <span className="grid size-9 place-items-center rounded-md bg-botanical-tint text-botanical">
        {icon}
      </span>
      <span className="mt-2 block text-sm font-semibold text-slate">{label}</span>
      <span className="block text-xs text-slate-muted">{hint}</span>
    </Link>
  );
}
