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
      <div className="group relative min-h-[420px] md:h-[540px] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl flex flex-col justify-center">
        {/* Full-Lifestyle Grocery & Delivery Background Image (Absolute Background) */}
        <img
          src={imgSrc}
          onError={() => {
            if (imgSrc !== heroDelivery) setImgSrc(heroDelivery);
          }}
          alt="On-demand grocery and essentials delivery across Harare, Zimbabwe"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] md:object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Dark Gradient Overlay for Maximum Text Legibility: Bottom-up on mobile, left-to-right on desktop */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-black/30 md:bg-gradient-to-r md:from-black/90 md:via-black/60 md:to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Overlaid Text (Positioned on top of image and gradient) */}
        <div className="relative z-20 flex h-full max-w-2xl lg:max-w-3xl flex-col justify-center p-6 md:p-14">
          {/* Pill Tag: ⚡ FAST ON-DEMAND DELIVERY & SERVICES */}
          <div className="mb-3 sm:mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/60 px-3.5 py-1 text-xs sm:text-sm font-bold tracking-wide text-emerald-200 shadow-md backdrop-blur-md">
              <span>⚡</span> FAST ON-DEMAND DELIVERY & SERVICES
            </span>
          </div>

          {/* Main Headline: Responsive mobile-to-desktop typography */}
          <h1
            id="home-hero-title"
            className="font-heading text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] md:leading-[1.08] drop-shadow-sm"
          >
            Everything You Need, Delivered in Minutes.
          </h1>

          {/* Subtitle: Clean Off-White/Gray Readable Text */}
          <p className="mt-3 md:mt-4 max-w-xl text-sm sm:text-base md:text-lg font-normal leading-relaxed text-white/90 drop-shadow-xs">
            Fresh farm produce, supermarket essentials, and instant daily services—straight to your door with zero hassle.
          </p>

          {/* Buttons Inside the Overlay (Left-Aligned Row) */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {/* Button 1: Solid Brand Accent Color, Rounded-xl */}
            <a
              href="#fresh-picks-title"
              onClick={handleStartShopping}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3 text-base font-bold text-white shadow-lg shadow-coral/30 transition-all duration-200 hover:scale-105 hover:bg-coral-hover active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-coral"
            >
              <span>Start Shopping 🛒</span>
            </a>

            {/* Button 2: Frosted Glass / Translucent White Border */}
            <a
              href="#value-added-services"
              onClick={handlePayBills}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-6 py-3 text-base font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 hover:border-white/50 hover:bg-white/25 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <Zap className="size-4 text-amber-300" />
              <span>Pay Bills & Services ⚡</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
