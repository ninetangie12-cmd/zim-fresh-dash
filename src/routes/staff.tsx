import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { brand } from "@/config/brand";
import { DEFAULT_STAFF } from "@/lib/admin";
import { useApp } from "@/lib/app-state";
import { claimStaffCode, myStaffRecord, setMyAvailability } from "@/lib/staff";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Shopper and rider app — ${brand.name}` },
      {
        name: "description",
        content:
          "Picking lists, store collection addresses, delivery PINs and proof of delivery for shoppers and riders.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffLayout,
});

function StaffLayout() {
  const { user, hydrated } = useApp();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [demoStaffId, setDemoStaffId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tenganow.activeStaff") || "staff-farai-01";
    }
    return "staff-farai-01";
  });

  const { data: realStaff, isLoading } = useQuery({
    queryKey: ["staff", "me", user?.id],
    queryFn: () => myStaffRecord(user!.id),
    enabled: Boolean(user),
  });

  const staff = realStaff || DEFAULT_STAFF.find((s) => s.id === demoStaffId) || DEFAULT_STAFF[0];

  const setDemoStaff = (id: string) => {
    setDemoStaffId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("tenganow.activeStaff", id);
    }
    void qc.invalidateQueries({ queryKey: ["staff"] });
  };

  if (!hydrated || (user && isLoading))
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-sm text-slate-secondary">Loading…</div>
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5">
      {/* Dev / Demo Staff Switcher Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900">
        <div className="flex items-center gap-1.5">
          <span className="font-bold uppercase tracking-wider text-amber-800">Staff Mode:</span>
          <span>Operating as <strong>{staff.name}</strong> ({staff.role.toUpperCase()})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {DEFAULT_STAFF.map((s) => (
            <button
              key={s.id}
              onClick={() => setDemoStaff(s.id)}
              className={`rounded px-2 py-1 font-semibold transition-colors ${
                staff.id === s.id
                  ? "bg-amber-700 text-white shadow-xs"
                  : "bg-amber-100/80 text-amber-900 hover:bg-amber-200"
              }`}
            >
              {s.role === "shopper" ? "🛒 Shopper" : "🛵 Rider"}: {s.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-section text-slate">
            {staff.role === "rider" ? "Rider Delivery App" : "Shopper Picking App"}
          </h1>
          <p className="text-sm text-slate-secondary">
            {staff.name}
            {staff.vehicle ? ` · ${staff.vehicle}` : ""}
          </p>
        </div>
        <button
          onClick={async () => {
            await setMyAvailability(staff.id, !staff.active);
            await qc.invalidateQueries({ queryKey: ["staff"] });
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            staff.active ? "bg-success-bg text-success" : "bg-mist text-slate-muted"
          }`}
        >
          {staff.active ? "Available · tap to go off duty" : "Off duty · tap to go available"}
        </button>
      </div>

      <div className="mt-4">
        <Outlet />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between border-t border-border pt-4 text-xs text-slate-muted">
        <Link to="/" className="font-semibold text-botanical hover:underline">
          ← Back to the store
        </Link>
        <Link to="/admin/orders" className="font-semibold text-slate-secondary hover:underline">
          Operations portal →
        </Link>
      </div>
    </div>
  );
}
