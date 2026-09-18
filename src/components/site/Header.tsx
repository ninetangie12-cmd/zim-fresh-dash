import { Link, useNavigate } from "@tanstack/react-router";
import { CircleHelp, MapPin, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/site/Wordmark";
import { QuickBasket } from "@/components/site/QuickBasket";
import { DeliveryLocationBar } from "@/components/site/DeliveryLocationBar";
import { zoneById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

const navLinks = [
  { to: "/stores", label: "Stores" },
  { to: "/shopping-list", label: "Send a list" },
  { to: "/lists", label: "My lists" },
  { to: "/favourites", label: "Favourites" },
  { to: "/orders", label: "Orders" },
  { to: "/help", label: "Help" },
] as const;

function getUserInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "U";
}

function UserAvatar({
  avatarUrl,
  name,
  initials,
  size = "md",
}: {
  avatarUrl?: string | null;
  name?: string | null;
  initials: string;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "size-5.5 text-[9px]" : "size-7 text-xs";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-foreground/35 bg-coral font-bold text-white shadow-xs ${sizeClasses}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "User avatar"}
          className="aspect-square size-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function Header() {
  const { totals, activeAddress, user, openAuthModal } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isDay, setIsDay] = useState(true);
  const [greetingTime, setGreetingTime] = useState<string>("Good day");
  const zone = activeAddress ? zoneById(activeAddress.zoneId) : undefined;

  // 1. Get the current hour & 2. Determine if it's day or night (hour >= 6 && hour < 18)
  useEffect(() => {
    const updateTimeAndDay = () => {
      const hour = new Date().getHours();
      setIsDay(hour >= 6 && hour < 18);

      if (hour >= 5 && hour < 12) {
        setGreetingTime("Good morning");
      } else if (hour >= 12 && hour < 17) {
        setGreetingTime("Good afternoon");
      } else {
        setGreetingTime("Good evening");
      }
    };

    updateTimeAndDay();

    // Recheck periodically in case time advances
    const timer = setInterval(updateTimeAndDay, 60000);
    return () => clearInterval(timer);
  }, []);

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || null;
  const initials = getUserInitials(user?.name, user?.email);

  return (
    <header className="sticky top-0 z-40 border-b border-botanical-mid bg-botanical text-primary-foreground shadow-sm">
      {/* Mobile Top Utility Banner: Greeting / Avatar & Auth Buttons */}
      <div className="flex items-center justify-between border-b border-primary-foreground/15 bg-botanical-hover/70 px-3 py-1.5 text-[11px] font-medium text-primary-foreground/90 md:hidden">
        {user ? (
          /* When logged in: replace greeting with user name & avatar */
          <Link
            to="/account"
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="My account"
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              name={displayName}
              initials={initials}
              size="sm"
            />
            <span className="max-w-[170px] truncate text-xs font-semibold text-primary-foreground">
              {displayName}
            </span>
          </Link>
        ) : (
          /* Fallback for guest state: Sun/Moon icon + generic greeting */
          <div className="flex min-w-0 items-center gap-1.5 pr-2">
            {isDay ? (
              <Sun className="size-3 text-amber-300 shrink-0 drop-shadow-xs" aria-hidden="true" />
            ) : (
              <Moon className="size-3 text-blue-200 shrink-0 drop-shadow-xs" aria-hidden="true" />
            )}
            <span className="truncate">{greetingTime}, Welcome!</span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {!user ? (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="text-xs font-medium text-primary-foreground/90 transition-colors hover:text-white"
              >
                Sign In
              </Link>
              <span className="text-primary-foreground/30">·</span>
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-coral-hover"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <Link
              to="/account"
              className="text-[11px] font-semibold text-primary-foreground/80 hover:text-white hover:underline"
            >
              Manage
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-2 md:px-6 md:py-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 md:grid-cols-[auto_auto_minmax(14rem,1fr)_auto] md:gap-4">
          <Link
            to="/"
            className="col-start-2 row-start-1 shrink-0 rounded-md px-1 md:col-start-1"
            aria-label="TengaNow home"
          >
            <Wordmark tone="light" className="text-xl md:text-[22px]" />
          </Link>

          <Link
            to="/addresses"
            className="col-start-1 row-start-1 flex min-w-0 items-center gap-1.5 rounded-lg py-1 pr-1 transition-colors hover:bg-primary-foreground/10 md:col-start-2 md:px-2"
          >
            <MapPin className="size-4 shrink-0 text-primary-foreground/75" />
            <span className="min-w-0">
              <span className="hidden text-xs text-primary-foreground/70 md:block">Deliver to</span>
              <span className="block max-w-28 truncate text-sm font-semibold text-primary-foreground md:max-w-40">
                {zone ? zone.name : "Set location"}
              </span>
            </span>
          </Link>

          <form
            className="col-span-3 col-start-1 row-start-2 flex min-h-11 items-center gap-2 rounded-full border border-primary-foreground/15 bg-card px-4 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary-foreground/40 md:col-span-1 md:col-start-3 md:row-start-1 md:mx-auto md:w-full md:max-w-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: { q: query } });
            }}
          >
            <Search className="size-[18px] shrink-0 text-slate-muted" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groceries and essentials"
              aria-label="Search products"
              className="w-full bg-transparent text-base text-slate outline-none placeholder:text-slate-muted"
            />
          </form>

          {/* Desktop Right Side: Dynamic Greeting or User Profile Avatar, Auth Buttons, Help & Basket */}
          <div className="col-start-3 row-start-1 flex items-center justify-end gap-1.5 md:col-start-4 sm:gap-2.5">
            {user ? (
              /* When logged in: replace greeting with user name & display avatar (with initials fallback) */
              <Link
                to="/account"
                className="hidden items-center gap-2.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 py-1 pr-3 pl-1.5 transition-all hover:bg-primary-foreground/20 hover:border-primary-foreground/35 md:inline-flex"
                aria-label={`Account profile for ${displayName || "User"}`}
              >
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  name={displayName}
                  initials={initials}
                  size="md"
                />
                <span className="max-w-[120px] truncate text-xs font-semibold text-primary-foreground lg:max-w-[150px]">
                  {displayName}
                </span>
              </Link>
            ) : (
              /* Fallback for guest state: Sun/Moon icon + generic greeting + Sign In / Sign Up */
              <>
                <div className="hidden items-center gap-1.5 lg:flex">
                  {isDay ? (
                    <Sun className="size-4 text-amber-300 drop-shadow-xs" aria-hidden="true" />
                  ) : (
                    <Moon className="size-4 text-blue-200 drop-shadow-xs" aria-hidden="true" />
                  )}
                  <span className="text-xs font-semibold text-primary-foreground tracking-tight">
                    {greetingTime}, Welcome!
                  </span>
                </div>

                <div className="hidden items-center gap-2 md:flex">
                  <Link
                    to="/auth"
                    search={{ mode: "signin" }}
                    className="inline-flex items-center justify-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all duration-150 hover:border-primary-foreground/45 hover:bg-primary-foreground/20 hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    search={{ mode: "register" }}
                    className="inline-flex items-center justify-center rounded-full bg-coral px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-coral-hover hover:shadow-md hover:scale-[1.02] active:bg-coral-pressed"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}

            <Link
              to="/help"
              aria-label="Help"
              className="hidden size-10 place-items-center rounded-full transition-colors hover:bg-primary-foreground/10 md:grid"
            >
              <CircleHelp className="size-5" />
            </Link>

            <div className="md:hidden">
              <QuickBasket />
            </div>

            <Link
              to="/basket"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  openAuthModal(() => {
                    navigate({ to: "/basket" });
                  });
                }
              }}
              aria-label={`Basket, ${totals.itemCount} items`}
              className="relative hidden size-10 place-items-center rounded-full transition-colors hover:bg-primary-foreground/10 md:grid"
            >
              <QuickBasketIcon />
              {totals.itemCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-coral px-1 text-xs font-bold tabular text-primary-foreground shadow-xs">
                  {totals.itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <nav className="hidden border-t border-primary-foreground/10 md:block">
        <div className="type-ui mx-auto flex max-w-7xl justify-center gap-1 px-6 py-1.5">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "bg-primary-foreground/15" }}
              className="rounded-md px-3 py-1.5 text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Checkers Sixty60-inspired Delivery Location Switcher Bar */}
      <DeliveryLocationBar />
    </header>
  );
}

function QuickBasketIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}
