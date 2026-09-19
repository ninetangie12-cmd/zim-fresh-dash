import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { formatUsd } from "@/config/brand";
import { orderStatuses, paymentMethods, storeById, zoneById } from "@/data/catalog";
import {
  assignStaff,
  confirmPrices,
  decidePayment,
  getOrder,
  listAudit,
  listStaff,
  proofUrl,
  saveAdminNote,
  setOrderStatus,
  subscribeToAdminOrders,
  type AdminOrder,
} from "@/lib/admin";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/admin/orders/$code")({
  head: ({ params }) => ({ meta: [
    { title: `Order ${params.code} — TengaNow operations` },
    { name: "description", content: "Review pricing, payment, assignments and fulfilment for this TengaNow order." },
    { property: "og:title", content: `Order ${params.code} — TengaNow operations` },
    { property: "og:description", content: "Review pricing, payment, assignments and fulfilment for this TengaNow order." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: OrderDetail,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="type-card text-slate">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function OrderDetail() {
  const { code } = Route.useParams();
  const { user } = useApp();
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = subscribeToAdminOrders(() => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    });
    return () => unsub();
  }, [qc]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "order", code],
    queryFn: () => getOrder(code),
    refetchInterval: 15000,
  });
  const { data: staff } = useQuery({ queryKey: ["admin", "staff"], queryFn: listStaff });
  const { data: audit } = useQuery({
    queryKey: ["admin", "audit", order?.id],
    queryFn: () => listAudit(order?.id),
    enabled: Boolean(order?.id),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
  };

  if (isLoading) return <p className="text-sm text-slate-secondary">Loading order…</p>;
  if (!order)
    return (
      <div>
        <p className="text-sm text-slate-secondary">We can't find that order.</p>
        <Link to="/admin/orders" className="mt-3 inline-block text-sm font-semibold text-botanical">
          Back to orders
        </Link>
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <PriceCard order={order} actorId={user?.id ?? ""} onDone={refresh} />
        <PaymentCard order={order} actorId={user?.id ?? ""} onDone={refresh} />
        <AssignCard
          order={order}
          staff={staff ?? []}
          actorId={user?.id ?? ""}
          onDone={refresh}
        />
        <StatusCard order={order} actorId={user?.id ?? ""} onDone={refresh} />
      </div>

      <div className="space-y-4">
        <Card title={`Order ${order.code}`}>
          <dl className="space-y-1.5 text-sm">
            <Row label="Placed" value={new Date(order.placedAt).toLocaleString()} />
            <Row label="Status" value={order.status} />
            <Row
              label="Payment"
              value={`${
                paymentMethods.find((m) => m.id === order.paymentMethod)?.name ??
                order.paymentMethod
              } (${order.paymentStatus})`}
            />
            <Row label="Estimate" value={formatUsd(order.total)} />
            <Row
              label="Final"
              value={order.finalTotal == null ? "Not confirmed" : formatUsd(order.finalTotal)}
            />
            <Row label="Delivery PIN" value={order.pin} />
          </dl>
        </Card>

        <Card title="Delivery">
          <p className="text-sm text-slate-secondary">{order.addressLine}</p>
          {order.addressLandmark ? (
            <p className="text-sm text-slate-muted">Landmark: {order.addressLandmark}</p>
          ) : null}
          <p className="text-sm text-slate-muted">
            Zone: {zoneById(order.addressZone)?.name ?? order.addressZone}
          </p>
          {order.deliveryNotes ? (
            <p className="mt-2 text-sm text-slate-secondary">Notes: {order.deliveryNotes}</p>
          ) : null}
          {order.handover ? (
            <p className="text-sm text-slate-muted">Handover: {order.handover}</p>
          ) : null}
          {order.recipientName ? (
            <p className="mt-2 text-sm text-slate-secondary">
              For {order.recipientName} · {order.recipientPhone}
              {order.hidePrices ? " · prices hidden from recipient" : ""}
            </p>
          ) : null}
        </Card>

        <NoteCard order={order} actorId={user?.id ?? ""} onDone={refresh} />

        <Card title="Audit trail">
          {audit && audit.length ? (
            <ul className="space-y-2 text-xs text-slate-secondary">
              {audit.map((a) => (
                <li key={a.id}>
                  <span className="font-semibold text-slate">{a.action.replace(/_/g, " ")}</span> ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-muted">No actions recorded yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-muted">{label}</dt>
      <dd className="text-right font-medium text-slate">{value}</dd>
    </div>
  );
}

/* ------------------------------ price confirm ----------------------------- */

function PriceCard({
  order,
  actorId,
  onDone,
}: {
  order: AdminOrder;
  actorId: string;
  onDone: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      order.items.map((i) => [i.id, String((i.finalUnitPrice ?? i.unitPrice).toFixed(2))]),
    ),
  );
  const [removed, setRemoved] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(order.items.map((i) => [i.id, i.status === "removed"])),
  );

  const mutation = useMutation({
    mutationFn: () => {
      const finals: Record<string, number | null> = {};
      for (const item of order.items) {
        finals[item.id] = removed[item.id] ? null : Number(values[item.id] ?? item.unitPrice);
      }
      return confirmPrices(actorId, order, finals);
    },
    onSuccess: (res) => {
      toast.success(
        res.meaningfulIncrease
          ? `Final ${formatUsd(res.finalTotal)} — customer approval requested`
          : `Prices confirmed at ${formatUsd(res.finalTotal)}`,
      );
      onDone();
    },
    onError: () => toast.error("We couldn't save those prices."),
  });

  const runningTotal = order.items.reduce(
    (sum, i) => (removed[i.id] ? sum : sum + Number(values[i.id] ?? 0) * i.quantity),
    0,
  );
  const finalTotal = runningTotal + order.deliveryFee + order.serviceFee - order.savings;

  return (
    <Card title="Shelf prices">
      <p className="text-sm text-slate-secondary">
        Enter the price the shopper actually paid per item. Removed items drop off the final total.
      </p>
      <ul className="mt-3 space-y-2">
        {order.items.map((i) => (
          <li
            key={i.id}
            className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2.5"
          >
            <div className="min-w-[45%] flex-1">
              <p className="text-sm font-semibold text-slate">{i.name}</p>
              <p className="text-xs text-slate-muted">
                {i.quantity} × est. {formatUsd(i.unitPrice)}
                {i.packSize ? ` · ${i.packSize}` : ""} ·{" "}
                {storeById(i.storeId)?.name ?? i.storeId}
              </p>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              aria-label={`Shelf price for ${i.name}`}
              disabled={removed[i.id]}
              value={values[i.id] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [i.id]: e.target.value }))}
              className="w-24 rounded-md border border-border px-2 py-1.5 text-sm disabled:opacity-40"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-secondary">
              <input
                type="checkbox"
                checked={Boolean(removed[i.id])}
                onChange={(e) => setRemoved((r) => ({ ...r, [i.id]: e.target.checked }))}
              />
              Not available
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-secondary">
          New final total:{" "}
          <span className="font-semibold text-slate">{formatUsd(finalTotal)}</span> · estimate was{" "}
          {formatUsd(order.total)}
        </p>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
        >
          Confirm prices
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-muted">
        If the final total is more than $1 above the estimate the order moves to "Price approval
        required" so the customer can approve it.
      </p>
    </Card>
  );
}

/* -------------------------------- payments -------------------------------- */

function PaymentCard({
  order,
  actorId,
  onDone,
}: {
  order: AdminOrder;
  actorId: string;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const { data: proof } = useQuery({
    queryKey: ["admin", "proof", order.id],
    queryFn: () => proofUrl(order.id),
  });

  const mutation = useMutation({
    mutationFn: (approve: boolean) => decidePayment(actorId, order, approve, reason || undefined),
    onSuccess: (_d, approve) => {
      toast.success(approve ? "Payment approved" : "Payment rejected");
      onDone();
    },
    onError: () => toast.error("We couldn't record that decision."),
  });

  return (
    <Card title="Payment">
      <p className="text-sm text-slate-secondary">
        Amount due: {formatUsd(order.finalTotal ?? order.total)} ·{" "}
        {paymentMethods.find((m) => m.id === order.paymentMethod)?.name ?? order.paymentMethod} ·
        currently {order.paymentStatus}
      </p>
      {proof ? (
        <a
          href={proof}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-botanical"
        >
          View proof of payment
        </a>
      ) : (
        <p className="mt-2 text-sm text-slate-muted">No proof uploaded yet.</p>
      )}
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Note or reason (saved to the audit trail)"
        className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => mutation.mutate(true)}
          disabled={mutation.isPending || order.paymentStatus === "approved"}
          className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"
        >
          Approve payment
        </button>
        <button
          onClick={() => mutation.mutate(false)}
          disabled={mutation.isPending}
          className="rounded-md border border-error px-4 py-2 text-sm font-semibold text-error"
        >
          Reject
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-muted">
        Shopping only starts once payment is approved, except for approved cash-on-delivery orders.
      </p>
    </Card>
  );
}

/* ------------------------------- assignment ------------------------------- */

function AssignCard({
  order,
  staff,
  actorId,
  onDone,
}: {
  order: AdminOrder;
  staff: { id: string; name: string; role: string; active: boolean }[];
  actorId: string;
  onDone: () => void;
}) {
  const mutation = useMutation({
    mutationFn: (input: { field: "shopper" | "rider"; id: string | null }) =>
      assignStaff(actorId, order, input.field, input.id),
    onSuccess: () => {
      toast.success("Assignment saved");
      onDone();
    },
    onError: () => toast.error("We couldn't save that assignment."),
  });

  const options = (role: string) => staff.filter((s) => s.role === role && s.active);

  return (
    <Card title="Shopper and rider">
      <div className="grid gap-3 sm:grid-cols-2">
        {(["shopper", "rider"] as const).map((role) => (
          <label key={role} className="block text-sm">
            <span className="font-semibold capitalize text-slate">{role}</span>
            <select
              value={(role === "shopper" ? order.shopperId : order.riderId) ?? ""}
              onChange={(e) =>
                mutation.mutate({ field: role, id: e.target.value || null })
              }
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="">Not assigned</option>
              {options(role).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {options("shopper").length === 0 || options("rider").length === 0 ? (
        <p className="mt-3 text-xs text-slate-muted">
          Add people on the Shoppers &amp; riders tab to see them here.
        </p>
      ) : null}
    </Card>
  );
}

/* --------------------------------- status --------------------------------- */

function StatusCard({
  order,
  actorId,
  onDone,
}: {
  order: AdminOrder;
  actorId: string;
  onDone: () => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: () => setOrderStatus(actorId, order, status, note || undefined),
    onSuccess: () => {
      toast.success(`Order marked as "${status}"`);
      setNote("");
      onDone();
    },
    onError: () => toast.error("We couldn't update the status."),
  });

  return (
    <Card title="Order status">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          {[...orderStatuses, "Cancelled", "Refunded"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the customer timeline"
          className="min-w-[200px] flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-md bg-botanical px-4 py-2 text-sm font-semibold text-white hover:bg-botanical-hover disabled:opacity-50"
        >
          Update
        </button>
      </div>
    </Card>
  );
}

function NoteCard({
  order,
  actorId,
  onDone,
}: {
  order: AdminOrder;
  actorId: string;
  onDone: () => void;
}) {
  const [note, setNote] = useState(order.adminNote ?? "");
  const mutation = useMutation({
    mutationFn: () => saveAdminNote(actorId, order, note),
    onSuccess: () => {
      toast.success("Note saved");
      onDone();
    },
    onError: () => toast.error("We couldn't save that note."),
  });

  return (
    <Card title="Internal note">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Only your team sees this."
        className="w-full rounded-md border border-border px-3 py-2 text-sm"
      />
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-slate"
      >
        Save note
      </button>
    </Card>
  );
}
