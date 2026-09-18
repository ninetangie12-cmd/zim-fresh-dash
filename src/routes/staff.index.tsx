import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { formatUsd } from "@/config/brand";
import { storeById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";
import { listMyJobs, myStaffRecord, type StaffJob } from "@/lib/staff";

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
  const { data: staff } = useQuery({
    queryKey: ["staff", "me", user?.id],
    queryFn: () => myStaffRecord(user!.id),
    enabled: Boolean(user),
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", "jobs", staff?.id],
    queryFn: () => listMyJobs({ id: staff!.id, role: staff!.role }),
    enabled: Boolean(staff),
  });

  if (isLoading) return <p className="text-sm text-slate-secondary">Loading your jobs…</p>;
  if (error) return <p className="text-sm text-error">We couldn't load your jobs. Try again.</p>;

  const jobs = data ?? [];
  const done = (j: StaffJob) =>
    staff?.role === "rider" ? j.status === "Delivered" : j.status === "Ready for collection";
  const open = jobs.filter((j) => !done(j) && j.status !== "Cancelled");
  const finished = jobs.filter(done);

  if (jobs.length === 0)
    return (
      <p className="rounded-lg border border-border bg-card p-5 text-sm text-slate-muted">
        Nothing assigned to you right now. New jobs appear here as soon as the office assigns them.
      </p>
    );

  return (
    <>
      <Section title="To do" jobs={open} role={staff?.role ?? "shopper"} />
      {finished.length ? (
        <Section title="Finished" jobs={finished} role={staff?.role ?? "shopper"} muted />
      ) : null}
    </>
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
                className={`block rounded-lg border border-border bg-card p-4 hover:border-botanical-mid ${
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
