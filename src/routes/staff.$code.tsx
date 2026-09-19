import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { formatUsd } from "@/config/brand";
import { productById, storeById, zoneById } from "@/data/catalog";
import { DEFAULT_STAFF, subscribeToAdminOrders } from "@/lib/admin";
import { useApp } from "@/lib/app-state";
import {
  advanceStatus,
  completeDelivery,
  confirmPickup,
  getMyJob,
  markReadyForCollection,
  myStaffRecord,
  recalculateTotal,
  reportFailedDelivery,
  savePicking,
  uploadDeliveryProof,
  verifyPin,
  type StaffJob,
} from "@/lib/staff";

export const Route = createFileRoute("/staff/$code")({
  head: ({ params }) => ({ meta: [
    { title: `Job ${params.code} — TengaNow staff` },
    { name: "description", content: "TengaNow picking and delivery job details." },
    { property: "og:title", content: `Job ${params.code} — TengaNow staff` },
    { property: "og:description", content: "TengaNow picking and delivery job details." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: JobDetail,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="type-card text-slate">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const isLiquorOrder = (job: StaffJob) =>
  job.items.some((i) => productById(i.productId)?.liquor || i.storeId === "liquor-supplies");

function JobDetail() {
  const { code } = Route.useParams();
  const { user } = useApp();
  const qc = useQueryClient();

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

  const { data: job, isLoading } = useQuery({
    queryKey: ["staff", "job", code],
    queryFn: () => getMyJob(code),
    refetchInterval: 15000,
  });

  const isOrderInDeliveryPhase =
    job?.status === "Ready for collection" ||
    job?.status === "Collected" ||
    job?.status === "On the way" ||
    job?.status === "Rider approaching" ||
    job?.status === "Delivered";

  const [activeView, setActiveView] = useState<"shopper" | "rider">(() =>
    staff.role === "rider" || isOrderInDeliveryPhase ? "rider" : "shopper"
  );

  // Auto-switch to rider mode if order transitions to ready for collection
  useEffect(() => {
    if (isOrderInDeliveryPhase && activeView === "shopper" && staff.role === "rider") {
      setActiveView("rider");
    }
  }, [isOrderInDeliveryPhase, activeView, staff.role]);

  // Subscribe to live realtime order updates
  useEffect(() => {
    const unsub = subscribeToAdminOrders(() => {
      void qc.invalidateQueries({ queryKey: ["staff"] });
    });
    return () => unsub();
  }, [qc]);

  const refresh = () => void qc.invalidateQueries({ queryKey: ["staff"] });

  if (isLoading) return <p className="text-sm text-slate-secondary">Loading job…</p>;
  if (!job)
    return (
      <div>
        <p className="text-sm text-slate-secondary">
          This job isn't found or has been completed.
        </p>
        <Link to="/staff" className="mt-3 inline-block text-sm font-semibold text-botanical">
          Back to my jobs
        </Link>
      </div>
    );

  const store = storeById(job.items[0]?.storeId ?? "tm-pnp");
  const isRiderView = activeView === "rider";

  return (
    <div className="space-y-4">
      {/* Top Bar with Status & Role View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="type-card text-slate">Order {job.code}</h2>
            <span className="rounded-full bg-botanical-tint px-2.5 py-0.5 text-xs font-semibold text-botanical">
              {job.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-muted">
            PIN: <strong className="text-slate font-mono tracking-wider">{job.pin}</strong>
            {job.pinVerified ? " (Verified ✓)" : ""}
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center rounded-lg border border-border bg-mist/50 p-1 text-xs">
          <button
            onClick={() => setActiveView("shopper")}
            className={`rounded-md px-3 py-1 font-semibold transition-colors ${
              activeView === "shopper"
                ? "bg-white text-botanical shadow-2xs"
                : "text-slate-secondary hover:text-slate"
            }`}
          >
            🛒 Shopper View
          </button>
          <button
            onClick={() => setActiveView("rider")}
            className={`rounded-md px-3 py-1 font-semibold transition-colors ${
              activeView === "rider"
                ? "bg-white text-botanical shadow-2xs"
                : "text-slate-secondary hover:text-slate"
            }`}
          >
            🛵 Rider View
          </button>
        </div>
      </div>

      {store ? (
        <Card title={isRiderView ? "Collect from" : "Store"}>
          <p className="text-sm font-semibold text-slate">
            {store.name} — {store.pickup.branch}
          </p>
          <p className="text-sm text-slate-secondary">{store.pickup.address}</p>
          <p className="mt-1 text-sm text-slate-muted">{store.pickup.collectionPoint}</p>
          <p className="text-sm text-slate-muted">
            {store.pickup.hours} · {store.pickup.phone}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                store.pickup.mapQuery,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-botanical"
            >
              Open in maps
            </a>
            <a
              href={`tel:${store.pickup.phone.replace(/\s/g, "")}`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-botanical"
            >
              Call the store
            </a>
          </div>
        </Card>
      ) : null}

      {isRiderView ? (
        <RiderPanel job={job} onDone={refresh} />
      ) : (
        <ShopperPanel job={job} onDone={refresh} />
      )}
    </div>
  );
}

/* --------------------------------- shopper -------------------------------- */

function ShopperPanel({ job, onDone }: { job: StaffJob; onDone: () => void }) {
  const total = job.items.reduce((s, i) => {
    if (i.status === "removed") return s;
    const unit = i.finalUnitPrice ?? i.unitPrice;
    return s + (i.finalWeightKg != null ? unit * i.finalWeightKg : unit * (i.pickedQuantity ?? i.quantity));
  }, 0);

  const ready = useMutation({
    mutationFn: () => markReadyForCollection(job),
    onSuccess: () => {
      toast.success("Marked ready for collection");
      onDone();
    },
    onError: () => toast.error("We couldn't update that."),
  });

  const start = useMutation({
    mutationFn: () => advanceStatus(job, "Items being picked", "Shopper started picking."),
    onSuccess: () => {
      toast.success("Picking started");
      onDone();
    },
    onError: () => toast.error("We couldn't update that."),
  });

  return (
    <>
      <Card title="Picking list">
        <ul className="space-y-2">
          {job.items.map((item) => (
            <PickRow key={item.id} job={job} item={item} onDone={onDone} />
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-secondary">
          Running total (items only): <span className="font-semibold text-slate">{formatUsd(total)}</span>{" "}
          · estimate was {formatUsd(job.subtotal)}
        </p>
      </Card>

      <Card title="Customer instructions">
        <p className="text-sm text-slate-secondary">
          {job.deliveryNotes || "No special instructions."}
        </p>
        <p className="mt-1 text-xs text-slate-muted">
          Substitution preference is shown on each line. Prices stay estimates until you enter what
          you actually paid.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => start.mutate()}
          disabled={start.isPending}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate"
        >
          Start picking
        </button>
        <button
          onClick={() => ready.mutate()}
          disabled={ready.isPending}
          className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
        >
          Packed — ready for collection
        </button>
      </div>
    </>
  );
}

function PickRow({
  job,
  item,
  onDone,
}: {
  job: StaffJob;
  item: StaffJob["items"][number];
  onDone: () => void;
}) {
  const product = productById(item.productId);
  const weighted = Boolean(product?.weighted);
  const [price, setPrice] = useState(String((item.finalUnitPrice ?? item.unitPrice).toFixed(2)));
  const [qty, setQty] = useState(String(item.pickedQuantity ?? item.quantity));
  const [weight, setWeight] = useState(
    item.finalWeightKg != null ? String(item.finalWeightKg) : "",
  );
  const [note, setNote] = useState(item.shopperNote ?? "");
  const [barcode, setBarcode] = useState("");

  const save = useMutation({
    mutationFn: (status: "picked" | "removed" | "substituted") =>
      savePicking(job, item.id, {
        status,
        pickedQuantity: status === "removed" ? 0 : Number(qty),
        finalUnitPrice: status === "removed" ? null : Number(price),
        finalWeightKg: weighted && weight ? Number(weight) : null,
        note: note || null,
      }).then(() => recalculateTotal(job)),
    onSuccess: (_d, status) => {
      toast.success(status === "removed" ? "Marked not available" : "Item saved");
      onDone();
    },
    onError: () => toast.error("We couldn't save that item."),
  });

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate">{item.name}</p>
          <p className="text-xs text-slate-muted">
            Need {item.quantity}
            {item.packSize ? ` × ${item.packSize}` : ""} · est. {formatUsd(item.unitPrice)}
            {weighted && product?.pricePerKg ? ` · ${formatUsd(product.pricePerKg)}/kg` : ""}
          </p>
          <p className="text-xs text-slate-muted">If missing: {item.substitution}</p>
        </div>
        {item.status !== "pending" ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              item.status === "removed" ? "bg-error-bg text-error" : "bg-success-bg text-success"
            }`}
          >
            {item.status}
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="text-xs text-slate-secondary">
          Quantity found
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-slate-secondary">
          Shelf price
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        {weighted ? (
          <label className="text-xs text-slate-secondary">
            Packed weight (kg)
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </label>
        ) : null}
        <label className="text-xs text-slate-secondary">
          Barcode
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan later"
            className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note for the office (replacement, damage, size)"
        className="mt-2 w-full rounded-md border border-border px-2 py-1.5 text-sm"
      />

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => save.mutate("picked")}
          disabled={save.isPending}
          className="rounded-md bg-botanical px-3 py-1.5 text-xs font-semibold text-white"
        >
          Found it
        </button>
        <button
          onClick={() => save.mutate("substituted")}
          disabled={save.isPending}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate"
        >
          Replaced
        </button>
        <button
          onClick={() => save.mutate("removed")}
          disabled={save.isPending}
          className="rounded-md border border-error px-3 py-1.5 text-xs font-semibold text-error"
        >
          Not available
        </button>
      </div>
    </li>
  );
}

/* ---------------------------------- rider --------------------------------- */

function RiderPanel({ job, onDone }: { job: StaffJob; onDone: () => void }) {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(job.pinVerified);
  const [idChecked, setIdChecked] = useState(job.idChecked ?? false);
  const [failReason, setFailReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const liquor = isLiquorOrder(job);
  const cash = job.paymentMethod === "cod";
  const unattendedBlocked = liquor || cash || (job.finalTotal ?? job.total) > 100;

  const pickup = useMutation({
    mutationFn: () => confirmPickup(job),
    onSuccess: () => {
      toast.success("Collection confirmed");
      onDone();
    },
    onError: () => toast.error("We couldn't confirm that."),
  });

  const deliver = useMutation({
    mutationFn: () => completeDelivery(job, { idChecked: liquor ? idChecked : null }),
    onSuccess: () => {
      toast.success("Delivery completed");
      onDone();
    },
    onError: () => toast.error("We couldn't complete that delivery."),
  });

  const fail = useMutation({
    mutationFn: () => reportFailedDelivery(job, failReason),
    onSuccess: () => {
      toast.success("Failed attempt reported");
      setFailReason("");
      onDone();
    },
    onError: () => toast.error("We couldn't report that."),
  });

  return (
    <>
      <Card title="Deliver to">
        <p className="text-sm font-semibold text-slate">
          {job.recipientName || "The customer"}
          {job.recipientPhone ? ` · ${job.recipientPhone}` : ""}
        </p>
        <p className="text-sm text-slate-secondary">{job.addressLine}</p>
        {job.addressLandmark ? (
          <p className="text-sm text-slate-muted">Landmark: {job.addressLandmark}</p>
        ) : null}
        <p className="text-sm text-slate-muted">
          Zone: {zoneById(job.addressZone)?.name ?? job.addressZone}
        </p>
        {job.deliveryNotes ? (
          <p className="mt-2 text-sm text-slate-secondary">Notes: {job.deliveryNotes}</p>
        ) : null}
        {job.handover ? (
          <p className="text-sm text-slate-muted">Handover: {job.handover}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              job.addressLine,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-botanical"
          >
            Navigate
          </a>
          {job.recipientPhone ? (
            <a
              href={`tel:${job.recipientPhone.replace(/\s/g, "")}`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-botanical"
            >
              Call
            </a>
          ) : null}
        </div>
      </Card>

      <Card title="Money and checks">
        <p className="text-sm text-slate-secondary">
          Order value: <span className="font-semibold text-slate">{formatUsd(job.finalTotal ?? job.total)}</span>{" "}
          · payment {job.paymentStatus}
        </p>
        {cash ? (
          <p className="mt-2 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
            Cash on delivery — collect {formatUsd(job.finalTotal ?? job.total)} before handing over.
          </p>
        ) : null}
        {liquor ? (
          <div className="mt-2 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
            <p>Alcohol order — check an ID showing the customer is 18 or older.</p>
            <label className="mt-2 flex items-center gap-2 text-sm text-slate">
              <input
                type="checkbox"
                checked={idChecked}
                onChange={(e) => setIdChecked(e.target.checked)}
              />
              I checked the ID and the customer is 18 or older
            </label>
          </div>
        ) : null}
        {unattendedBlocked ? (
          <p className="mt-2 text-xs text-slate-muted">
            This order may not be left unattended. Hand it to a person or return it to the store.
          </p>
        ) : null}
      </Card>

      <Card title="Delivery PIN">
        {verified ? (
          <p className="text-sm font-semibold text-success">PIN confirmed. You can hand over.</p>
        ) : (
          <>
            <p className="text-sm text-slate-secondary">
              Ask the customer for their four-digit PIN and enter it here.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder="0000"
                className="w-28 rounded-md border border-border px-3 py-2 text-center text-lg tracking-widest"
              />
              <button
                onClick={async () => {
                  const ok = await verifyPin(job, pin);
                  if (ok) {
                    setVerified(true);
                    toast.success("PIN confirmed");
                    onDone();
                  } else {
                    toast.error("That PIN doesn't match.");
                  }
                }}
                className="rounded-md bg-botanical px-4 py-2 text-sm font-semibold text-white"
              >
                Check PIN
              </button>
            </div>
          </>
        )}
      </Card>

      <Card title="Proof of delivery">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              await uploadDeliveryProof(job, file);
              toast.success("Photo uploaded");
              onDone();
            } catch {
              toast.error("We couldn't upload that photo.");
            } finally {
              setUploading(false);
            }
          }}
          className="block w-full text-sm"
        />
        <p className="mt-1 text-xs text-slate-muted">
          {uploading
            ? "Uploading…"
            : job.deliveryProofPath
              ? "A photo is already saved for this delivery."
              : "Take a photo of the handover or the parcel at the door."}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => pickup.mutate()}
          disabled={pickup.isPending || Boolean(job.collectedAt)}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate disabled:opacity-50"
        >
          {job.collectedAt ? "Collected" : "Confirm collection"}
        </button>
        <button
          onClick={() => advanceStatus(job, "On the way").then(onDone)}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate"
        >
          On the way
        </button>
        <button
          onClick={() => advanceStatus(job, "Rider approaching").then(onDone)}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate"
        >
          Almost there
        </button>
        <button
          onClick={() => {
            if (!verified) {
              toast.error("Confirm the delivery PIN first.");
              return;
            }
            if (liquor && !idChecked) {
              toast.error("Confirm the ID check first.");
              return;
            }
            deliver.mutate();
          }}
          disabled={deliver.isPending || job.status === "Delivered"}
          className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
        >
          Delivered
        </button>
      </div>

      <Card title="Couldn't deliver">
        <div className="flex flex-wrap gap-2">
          <input
            value={failReason}
            onChange={(e) => setFailReason(e.target.value)}
            placeholder="Nobody home, wrong address, customer refused…"
            className="min-w-[200px] flex-1 rounded-md border border-border px-3 py-2 text-sm"
          />
          <button
            onClick={() => failReason.trim() && fail.mutate()}
            disabled={fail.isPending}
            className="rounded-md border border-error px-4 py-2 text-sm font-semibold text-error"
          >
            Report attempt
          </button>
        </div>
      </Card>
    </>
  );
}
