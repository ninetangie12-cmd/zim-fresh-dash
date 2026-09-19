import { useState } from "react";
import { Zap } from "lucide-react";

import heroMarketplace from "@/assets/hero-marketplace.jpg";
import heroDelivery from "@/assets/hero-delivery.jpg";
import { useApp } from "@/lib/app-state";

export function HomeHero() {
  const { user, openAuthModal } = useApp();
  const [imgSrc, setImgSrc] = useState<string>(heroMarketplace);

  const handleStartShopping = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal(() => {
        const el = document.getElementById("fresh-picks-title");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        else window.location.hash = "fresh-picks-title";
      });
    }
  };

  const handlePayBills = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal(() => {
        const el = document.getElementById("value-added-services");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        else window.location.hash = "value-added-services";
      });
    }
  };

  return (
    <section
      className="relative w-full py-2 md:py-4"
      aria-labelledby="home-hero-title"
    >
      {/* Edge-to-Edge Full-Width Hero Container */}
      <div className="group relative min-h-[460px] sm:min-h-[480px] md:h-[540px] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-950 shadow-2xl flex flex-col justify-center">
        {/* Full-Lifestyle Grocery & Delivery Background Image (Absolute Background) */}
        <img
          src={imgSrc}
          onError={() => {
            if (imgSrc !== heroDelivery) setImgSrc(heroDelivery);
          }}
          alt="On-demand grocery and essentials delivery across Harare, Zimbabwe"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_25%] md:object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Dark Gradient Overlay for Maximum Text Legibility: Strong contrast on mobile, left-to-right on desktop */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/80 to-black/35 sm:via-black/65 sm:to-black/30 md:bg-gradient-to-r md:from-black/95 md:via-black/75 md:to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Overlaid Text (Positioned on top of image and gradient) */}
        <div className="relative z-20 flex h-full max-w-2xl lg:max-w-3xl flex-col justify-center p-5 sm:p-8 md:p-14">
          {/* Pill Tag: ⚡ FAST ON-DEMAND DELIVERY & SERVICES */}
          <div className="mb-3 sm:mb-4 md:mb-5">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-400/35 bg-emerald-950/80 px-2.5 sm:px-3.5 py-1 text-[10.5px] sm:text-xs md:text-sm font-bold tracking-wide text-emerald-200 shadow-md backdrop-blur-md">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400"></span>
              </span>
              <span className="whitespace-nowrap">⚡ FAST ON-DEMAND DELIVERY & SERVICES</span>
            </span>
          </div>

          {/* Main Headline: Responsive mobile-to-desktop typography */}
          <h1
            id="home-hero-title"
            className="font-heading text-[25px] sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.14] md:leading-[1.08] drop-shadow-sm"
          >
            Everything You Need, Delivered in Minutes.
          </h1>

          {/* Subtitle: Clean Off-White/Gray Readable Text */}
          <p className="mt-2.5 sm:mt-3 md:mt-4 max-w-xl text-xs sm:text-base md:text-lg font-normal leading-relaxed text-white/85 drop-shadow-xs">
            Fresh farm produce, supermarket essentials, and instant daily services—straight to your door with zero hassle.
          </p>

          {/* Buttons Inside the Overlay: Full-width stacked on mobile, row on tablet/desktop */}
          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 w-full sm:w-auto">
            {/* Button 1: Solid Brand Accent Color, Rounded-xl */}
            <a
              href="#fresh-picks-title"
              onClick={handleStartShopping}
              className="inline-flex min-h-[46px] sm:min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-coral px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-coral/30 transition-all duration-200 hover:scale-[1.02] sm:hover:scale-105 hover:bg-coral-hover active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-coral"
            >
              <span>Start Shopping 🛒</span>
            </a>

            {/* Button 2: Frosted Glass / Translucent White Border */}
            <a
              href="#value-added-services"
              onClick={handlePayBills}
              className="inline-flex min-h-[46px] sm:min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 hover:border-white/50 hover:bg-white/25 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <Zap className="size-4 text-amber-300" />
              <span>Pay Bills & Services ⚡</span>
            </a>
          </div>

          {/* Trust Chips Row: Fits neatly on mobile and desktop */}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-white/75">
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="text-emerald-400">⏱️</span> 30–45 min delivery
            </span>
            <span className="text-white/30 hidden xs:inline">•</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="text-emerald-400">🛡️</span> Verified Harare stores
            </span>
            <span className="text-white/30 hidden xs:inline">•</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="text-emerald-400">💵</span> USD & ZiG
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
