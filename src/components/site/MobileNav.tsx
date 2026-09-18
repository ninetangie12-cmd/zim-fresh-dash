import { Link } from "@tanstack/react-router";
import { Heart, Home, Package, Search, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/search", label: "Search", icon: Search, exact: false },
  { to: "/orders", label: "Orders", icon: Package, exact: false },
  { to: "/favourites", label: "Favourites", icon: Heart, exact: false },
  { to: "/account", label: "Account", icon: User, exact: false },
] as const;

export function MobileNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(23,43,53,0.08)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            activeProps={{ className: "text-botanical" }}
            inactiveProps={{ className: "text-slate-muted" }}
            className="relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <Icon className="size-5 shrink-0" strokeWidth={1.9} />
            <span className="truncate">{label}</span>
            <span className="absolute bottom-1.5 hidden h-0.5 w-5 rounded-full bg-botanical [[data-status=active]_&]:block" />
          </Link>
        ))}
      </div>
    </nav>
  );
}