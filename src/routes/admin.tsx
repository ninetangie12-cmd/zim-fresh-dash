import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { brand } from "@/config/brand";
import { useApp } from "@/lib/app-state";
import { isAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Operations dashboard — ${brand.name}` },
      {
        name: "description",
        content:
          "Internal operations dashboard: confirm shelf prices, approve payments, assign shoppers and riders, and track sales.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const tabs: { to: string; label: string; exact?: boolean }[] = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/staff", label: "Shoppers & riders" },
  { to: "/admin/requests", label: "Shopping lists" },
];

function AdminLayout() {
  const { user, hydrated } = useApp();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let live = true;
    if (!user) {
      if (hydrated) setAllowed(false);
      return;
    }
    void isAdmin(user.id).then((ok) => {
      if (live) setAllowed(ok);
    });
    return () => {
      live = false;
    };
  }, [user, hydrated]);

  if (allowed === null)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-secondary">
        Checking your access…
      </div>
    );

  if (!allowed)
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="type-page text-slate">Staff area</h1>
        <p className="mt-2 text-sm text-slate-secondary">
          {user
            ? "This account doesn't have operations access. Ask an administrator to add you."
            : "Sign in with your staff account to open the operations dashboard."}
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover"
        >
          {user ? "Switch account" : "Sign in"}
        </Link>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-page text-slate">Operations</h1>
          <p className="text-sm text-slate-secondary">
            Prices, payments, assignments and performance.
          </p>
        </div>
        <Link to="/" className="text-sm font-semibold text-botanical hover:underline">
          Back to the shop
        </Link>
      </div>

      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto border-b border-border pb-px">
        {tabs.map((t) => {
          const active = t.exact ? path === t.to : path.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to as "/admin"}
              className={`whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-semibold ${
                active
                  ? "border-b-2 border-botanical text-botanical"
                  : "text-slate-secondary hover:text-slate"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5">
        <Outlet />
      </div>
    </div>
  );
}
