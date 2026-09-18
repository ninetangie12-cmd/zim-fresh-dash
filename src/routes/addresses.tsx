import { createFileRoute } from "@tanstack/react-router";
import { Crosshair, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Page } from "@/components/site/Page";
import { brand } from "@/config/brand";
import { activeZones, zoneById, zones } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/addresses")({
  head: () => ({
    meta: [
      { title: `Delivery addresses — ${brand.name}` },
      { name: "description", content: "Save your Harare delivery addresses with landmarks and gate instructions." },
      { property: "og:title", content: `Delivery addresses — ${brand.name}` },
      { property: "og:description", content: "Manage where we deliver." },
    ],
  }),
  component: Addresses,
});

function Addresses() {
  const { state, addAddress, setActiveAddress } = useApp();
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [zoneId, setZoneId] = useState("avondale");
  const [line, setLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [notes, setNotes] = useState("");
  const [waitlistArea, setWaitlistArea] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);

  const inactive = zones.filter((z) => !z.active);

  return (
    <Page title="Delivery addresses" intro="We deliver across Harare. Landmarks help our riders find you.">
      <section className="space-y-2">
        {state.addresses.map((a) => {
          const zone = zoneById(a.zoneId);
          const active = a.id === state.activeAddressId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setActiveAddress(a.id)}
              className={`flex w-full gap-3 rounded-lg border p-4 text-left ${
                active ? "border-botanical bg-botanical-tint" : "border-border bg-card"
              }`}
            >
              <MapPin className="mt-0.5 size-5 shrink-0 text-botanical" />
              <span className="text-sm">
                <span className="block font-semibold text-slate">
                  {a.label} · {zone?.name}
                  {active ? <span className="ml-2 text-xs text-botanical">Current</span> : null}
                </span>
                <span className="block text-slate-secondary">{a.line}</span>
                {a.landmark ? <span className="block text-xs text-slate-muted">Landmark: {a.landmark}</span> : null}
                {a.notes ? <span className="block text-xs text-slate-muted">Notes: {a.notes}</span> : null}
              </span>
            </button>
          );
        })}
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="type-card text-slate">Add an address</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!("geolocation" in navigator)) {
                toast.error("Your device can't share its location");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) =>
                  setLine(
                    `Pinned location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
                  ),
                () => toast.error("We couldn't get your location. Type your address instead."),
              );
            }}
            className="inline-flex items-center gap-2 rounded-md border border-botanical px-3 py-2 text-sm font-semibold text-botanical"
          >
            <Crosshair className="size-4" /> Use my current location
          </button>
          <button
            type="button"
            onClick={() => toast.info("Drop a pin on the map — coming with live rider tracking.")}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-slate"
          >
            Drop a pin on a map
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!line.trim()) return;
            addAddress({ label, zoneId, line: line.trim(), landmark, notes });
            setLine("");
            setLandmark("");
            setNotes("");
            toast.success("Address saved");
          }}
        >
          <div className="flex gap-2">
            {(["Home", "Work", "Other"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLabel(l)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  label === l ? "bg-botanical text-white" : "border border-border bg-card text-slate-secondary"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <select
            aria-label="Delivery area"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            {activeZones().map((z) => (
              <option key={z.id} value={z.id}>{z.name}, {z.city}</option>
            ))}
          </select>

          <input
            value={line}
            onChange={(e) => setLine(e.target.value)}
            maxLength={120}
            placeholder="Street address, suburb"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            maxLength={120}
            placeholder="Nearest landmark (e.g. opposite the clinic)"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            placeholder="Delivery notes (gate colour, dogs, who to call)"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />

          <button type="submit" className="w-full rounded-md bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-hover">
            Save address
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="type-card text-slate">Not in our delivery area yet?</h2>
        <p className="mt-1 text-sm text-slate-secondary">
          We currently deliver in Harare only. Join the waiting list for {inactive.map((z) => z.city).join(", ")} and
          other towns.
        </p>
        {waitlisted ? (
          <p className="mt-3 rounded-md bg-success-bg px-3 py-2 text-sm text-success">
            Thank you — we'll let you know when we open in your area.
          </p>
        ) : (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!waitlistArea.trim()) return;
              setWaitlisted(true);
            }}
          >
            <input
              value={waitlistArea}
              onChange={(e) => setWaitlistArea(e.target.value)}
              maxLength={80}
              placeholder="Your town or suburb"
              className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md bg-botanical px-4 py-2 text-sm font-semibold text-white">
              Join waiting list
            </button>
          </form>
        )}
      </section>
    </Page>
  );
}
