import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { formatUsd } from "@/config/brand";
import { storeById } from "@/data/catalog";
import { DEFAULT_STAFF, subscribeToAdminOrders } from "@/lib/admin";
import { useApp } from "@/lib/app-state";
import { claimJob, listAvailableJobs, listMyJobs, myStaffRecord, type StaffJob } from "@/lib/staff";

export const Route = createFileRoute("/staff/")({
  head: () => ({ meta: [
    { title: "My jobs — TengaNow staff" },
    { name: "description", content: "Assigned TengaNow shopping and delivery jobs." },
    { property: "og:title", content: "My jobs — TengaNow staff" },
    { property: "og:description", content: "Assigned TengaNow shopping and delivery jobs." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: JobList,
});

function pickupStore(job: StaffJob) {
  const id = job.items[0]?.storeId;
  return id ? storeById(id) : undefined;
}

function JobList() {
  const { user } = useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"mine" | "available">("mine");

  const [demoStaffId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tenganow.activeStaff") || "staff-farai-01";
    }
    return "staff-farai-01";
  });

  const { data: realStaff } = useQuery({
    queryKey: ["staff", "me", user?.id],
    queryFn: () => myStaffRecord(user!.id),
    enabled: Boolean(user),
  });

  const staff = realStaff || DEFAULT_STAFF.find((s) => s.id === demoStaffId) || DEFAULT_STAFF[0];

  // Subscribe to live realtime order changes
  useEffect(() => {
    const unsub = subscribeToAdminOrders(() => {
      void qc.invalidateQueries({ queryKey: ["staff"] });
    });
    return () => unsub();
  }, [qc]);

  const { data: myJobs, isLoading, error } = useQuery({
    queryKey: ["staff", "jobs", staff.id, staff.role],
    queryFn: () => listMyJobs({ id: staff.id, role: staff.role }),
    refetchInterval: 15000,
  });

  const { data: availableJobs } = useQuery({
    queryKey: ["staff", "available", staff.role],
    queryFn: () => listAvailableJobs(staff.role as "shopper" | "rider"),
    refetchInterval: 15000,
  });

  const claimMutation = useMutation({
    mutationFn: (job: StaffJob) =>
      claimJob(job, staff.id, staff.role as "shopper" | "rider"),
    onSuccess: (_d, job) => {
      toast.success(`Claimed order ${job.code}`);
      void qc.invalidateQueries({ queryKey: ["staff"] });
      void navigate({ to: "/staff/$code", params: { code: job.code } });
    },
    onError: () => toast.error("Could not claim order."),
  });

  if (isLoading) return <p className="text-sm text-slate-secondary">Loading your jobs…</p>;
  if (error) return <p className="text-sm text-error">We couldn't load your jobs. Try again.</p>;

  const jobs = myJobs ?? [];
  const openPool = availableJobs ?? [];
  const done = (j: StaffJob) =>
    staff.role === "rider" ? j.status === "Delivered" : j.status === "Ready for collection";
  const open = jobs.filter((j) => !done(j) && j.status !== "Cancelled");
  const finished = jobs.filter(done);

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex border-b border-border text-sm font-semibold">
        <button
          onClick={() => setTab("mine")}
          className={`border-b-2 px-4 py-2.5 transition-colors ${
            tab === "mine"
              ? "border-botanical text-botanical"
              : "border-transparent text-slate-secondary hover:text-slate"
          }`}
        >
          My Assigned Jobs ({open.length})
        </button>
        <button
          onClick={() => setTab("available")}
          className={`relative border-b-2 px-4 py-2.5 transition-colors ${
            tab === "available"
              ? "border-botanical text-botanical"
              : "border-transparent text-slate-secondary hover:text-slate"
          }`}
        >
          Open Pool ({openPool.length})
          {openPool.length > 0 && (
            <span className="ml-1.5 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
              {openPool.length} new
            </span>
          )}
        </button>
      </div>

      {tab === "mine" ? (
        <>
          {jobs.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-sm text-slate-secondary font-medium">
                Nothing assigned to you right now.
              </p>
              <p className="mt-1 text-xs text-slate-muted">
                You can pick up an order directly from the Open Pool.
              </p>
              {openPool.length > 0 && (
                <button
                  onClick={() => setTab("available")}
                  className="mt-3 inline-block rounded-md bg-botanical px-4 py-1.5 text-xs font-semibold text-white hover:bg-botanical-hover"
                >
                  View {openPool.length} Open {staff.role === "rider" ? "Delivery" : "Picking"} Job{openPool.length === 1 ? "" : "s"}
                </button>
              )}
            </div>
          ) : (
            <>
              <Section title="Active to do" jobs={open} role={staff.role} />
              {finished.length ? (
                <Section title="Completed" jobs={finished} role={staff.role} muted />
              ) : null}
            </>
          )}
        </>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="type-card text-slate">
              Available {staff.role === "rider" ? "Deliveries" : "Picking Orders"}
            </h2>
            <span className="text-xs text-slate-muted">Self-dispatch pool</span>
          </div>

          {openPool.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-slate-muted">
              No unassigned orders waiting right now. When customer orders come in, they appear here instantly.
            </div>
          ) : (
            <ul className="space-y-3">
              {openPool.map((j) => {
                const store = pickupStore(j);
                return (
                  <li
                    key={j.id}
                    className="rounded-lg border border-border bg-card p-4 transition-all hover:border-botanical-mid shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-slate">{j.code}</span>
                        <span className="rounded-full bg-botanical-tint px-2 py-0.5 text-xs font-semibold text-botanical">
                          {j.status}
                        </span>
                      </div>
                      <button
                        onClick={() => claimMutation.mutate(j)}
                        disabled={claimMutation.isPending}
                        className="rounded-md bg-coral px-3 py-1.5 text-xs font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
                      >
                        {staff.role === "rider" ? "🛵 Accept Delivery" : "🛒 Claim Order"}
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-slate-secondary">
                      {staff.role === "rider"
                        ? `Collect from ${store?.pickup.branch ?? "the store"} · Deliver to ${j.addressLine}`
                        : `${j.items.length} item${j.items.length === 1 ? "" : "s"} at ${
                            store?.name ?? "TM Pick n Pay"
                          }`}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-muted">
                      <span>Value: <strong className="text-slate">{formatUsd(j.finalTotal ?? j.total)}</strong></span>
                      <span>Payment: <strong className="text-slate capitalize">{j.paymentMethod}</strong></span>
                      <span>Slot: {j.slotId === "asap" ? "ASAP" : j.slotId}</span>
                      {j.items.some((i) => i.name.toLowerCase().includes("beer") || i.name.toLowerCase().includes("wine")) && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">
                          18+ Alcohol
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  jobs,
  role,
  muted,
}: {
  title: string;
  jobs: StaffJob[];
  role: string;
  muted?: boolean;
}) {
  if (!jobs.length)
    return (
      <section className="mb-5">
        <h2 className="type-card text-slate">{title}</h2>
        <p className="mt-2 text-sm text-slate-muted">Nothing here.</p>
      </section>
    );

  return (
    <section className="mb-5">
      <h2 className="type-card text-slate">{title}</h2>
      <ul className="mt-2 space-y-2">
        {jobs.map((j) => {
          const store = pickupStore(j);
          return (
            <li key={j.id}>
              <Link
                to="/staff/$code"
                params={{ code: j.code }}
                className={`block rounded-lg border border-border bg-card p-4 transition-all hover:border-botanical-mid ${
                  muted ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-slate">{j.code}</span>
                  <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-botanical">
                    {j.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-secondary">
                  {role === "rider"
                    ? `Collect from ${store?.pickup.branch ?? "the store"} · deliver to ${j.addressLine}`
                    : `${j.items.length} item${j.items.length === 1 ? "" : "s"} at ${
                        store?.name ?? "the store"
                      }`}
                </p>
                <p className="mt-0.5 text-xs text-slate-muted">
                  {formatUsd(j.finalTotal ?? j.total)} · payment {j.paymentStatus}
                  {j.items.some((i) => i.name.toLowerCase().includes("beer")) ? " · 18+ order" : ""}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
