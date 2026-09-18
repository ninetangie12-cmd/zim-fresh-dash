import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { brand } from "@/config/brand";
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

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff", "me", user?.id],
    queryFn: () => myStaffRecord(user!.id),
    enabled: Boolean(user),
  });

  if (!hydrated || (user && isLoading))
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-sm text-slate-secondary">Loading…</div>
    );

  if (!user)
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="type-page text-slate">Shopper and rider app</h1>
        <p className="mt-2 text-sm text-slate-secondary">
          Sign in with your own account, then enter the join code your manager gave you.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover"
        >
          Sign in
        </Link>
      </div>
    );

  if (!staff)
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="type-page text-slate">Join your team</h1>
        <p className="mt-2 text-sm text-slate-secondary">
          Enter the join code your manager gave you. You only do this once on this account.
        </p>
        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setClaiming(true);
            try {
              const ok = await claimStaffCode(code);
              if (ok) {
                toast.success("You're linked. Your jobs will appear here.");
                await qc.invalidateQueries({ queryKey: ["staff"] });
              } else {
                toast.error("That code isn't valid or has already been used.");
              }
            } catch {
              toast.error("We couldn't check that code. Try again.");
            } finally {
              setClaiming(false);
            }
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. TN-SHOP-4821"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={claiming}
            className="w-full rounded-md bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
          >
            Link my account
          </button>
        </form>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-section text-slate">
            {staff.role === "rider" ? "Rider jobs" : "Picking jobs"}
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

      <Link to="/" className="mt-8 inline-block text-sm font-semibold text-botanical">
        Back to the shop
      </Link>
    </div>
  );
}
