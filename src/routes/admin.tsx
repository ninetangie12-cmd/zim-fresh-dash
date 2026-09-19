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
  const [devBypass, setDevBypass] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tenganow.devAdminBypass") === "true";
    }
    return false;
  });
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

  const toggleBypass = (val: boolean) => {
    setDevBypass(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("tenganow.devAdminBypass", String(val));
    }
  };

  if (allowed === null && !devBypass)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-secondary">
        Checking your access…
      </div>
    );

  if (!allowed && !devBypass)
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="type-page text-slate">Operations Portal</h1>
        <p className="mt-2 text-sm text-slate-secondary">
          {user
            ? "This account doesn't have operations access. Ask an administrator to add you."
            : "Sign in with your staff account to open the operations dashboard."}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            to="/auth"
            className="inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover"
          >
            {user ? "Switch account" : "Sign in"}
          </Link>
          <button
            onClick={() => toggleBypass(true)}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate hover:bg-mist"
          >
            🛠️ Preview Operations (Dev)
          </button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {devBypass && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-wider text-amber-800">🛠️ Dev Mode:</span>
            <span>Operations preview enabled without admin sign-in.</span>
          </div>
          <button
            onClick={() => toggleBypass(false)}
            className="font-semibold text-amber-900 underline hover:text-amber-950"
          >
            Lock Dashboard
          </button>
        </div>
      )}
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
