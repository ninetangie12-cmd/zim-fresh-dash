import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { addStaff, listStaff, regenerateLinkCode, setStaffActive } from "@/lib/admin";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({ meta: [
    { title: "Staff — TengaNow operations" },
    { name: "description", content: "Manage TengaNow shoppers and delivery riders." },
    { property: "og:title", content: "Staff — TengaNow operations" },
    { property: "og:description", content: "Manage TengaNow shoppers and delivery riders." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: StaffPage,
});

function StaffPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "staff"], queryFn: listStaff });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"shopper" | "rider">("shopper");
  const [vehicle, setVehicle] = useState("");

  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin", "staff"] });

  const create = useMutation({
    mutationFn: () => addStaff({ name, phone, role, vehicle }),
    onSuccess: () => {
      toast.success(`${name} added`);
      setName("");
      setPhone("");
      setVehicle("");
      refresh();
    },
    onError: () => toast.error("We couldn't add that person."),
  });

  const toggle = useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      setStaffActive(input.id, input.active),
    onSuccess: refresh,
    onError: () => toast.error("We couldn't change their availability."),
  });

  const regen = useMutation({
    mutationFn: (input: { id: string; role: string; name: string }) =>
      regenerateLinkCode(input.id, input.role),
    onSuccess: (code, input) => {
      toast.success(`New join code for ${input.name}: ${code}`);
      refresh();
    },
    onError: () => toast.error("We couldn't issue a new code."),
  });

  const staff = data ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="type-card text-slate">Your team</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-slate-secondary">Loading…</p>
        ) : staff.length === 0 ? (
          <p className="mt-3 text-sm text-slate-muted">
            No shoppers or riders yet. Add your first one on the right.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {staff.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate">{s.name}</p>
                  <p className="text-xs text-slate-muted">
                    {s.role === "rider" ? "Rider" : "Shopper"}
                    {s.phone ? ` · ${s.phone}` : ""}
                    {s.vehicle ? ` · ${s.vehicle}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-secondary">
                    {s.linked ? (
                      "Account linked — they can open the staff app."
                    ) : (
                      <>
                        Join code:{" "}
                        <span className="font-semibold text-slate">
                          {s.linkCode ?? "not issued yet"}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() =>
                        regen.mutate({ id: s.id, role: s.role, name: s.name })
                      }
                      className="ml-2 font-semibold text-botanical hover:underline"
                    >
                      {s.linked ? "Unlink and issue a new code" : "New code"}
                    </button>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      s.active ? "bg-success-bg text-success" : "bg-mist text-slate-muted"
                    }`}
                  >
                    {s.active ? "Available" : "Off duty"}
                  </span>
                  <button
                    onClick={() => toggle.mutate({ id: s.id, active: !s.active })}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate"
                  >
                    {s.active ? "Set off duty" : "Set available"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="type-card text-slate">Add someone</h2>
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            create.mutate();
          }}
        >
          <label className="block text-sm">
            <span className="font-semibold text-slate">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+263…"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "shopper" | "rider")}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="shopper">Shopper (picks the order in store)</option>
              <option value="rider">Rider (delivers the order)</option>
            </select>
          </label>
          {role === "rider" ? (
            <label className="block text-sm">
              <span className="font-semibold text-slate">Vehicle</span>
              <input
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Motorbike, small car…"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          ) : null}
          <button
            type="submit"
            disabled={create.isPending}
            className="w-full rounded-md bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
          >
            Add to team
          </button>
        </form>
      </section>
    </div>
  );
}
