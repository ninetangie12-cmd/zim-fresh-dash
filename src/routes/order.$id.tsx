import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Copy, Loader2, Radio, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Page } from "@/components/site/Page";
import { brand, formatUsd, whatsappLink } from "@/config/brand";
import { orderStatuses, paymentMethods, productById, zoneById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";
import type { Order } from "@/lib/app-state-types";
import * as cloud from "@/lib/cloud";

export const Route = createFileRoute("/order/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.id} — ${brand.name}` },
      { name: "description", content: "Follow your delivery from picking to your gate." },
      { property: "og:title", content: `Order ${params.id} — ${brand.name}` },
      { property: "og:description", content: "Live order tracking." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { state, markProof, updateOrder, hydrated } = useApp();
  const localOrder = state.orders.find((o) => o.id === id || o.dbId === id);
  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  const order = localOrder ?? remoteOrder;

  // 1. Direct Supabase Lookup: Fetch from cloud if not present locally
  useEffect(() => {
    if (localOrder || loadingRemote || !hydrated) return;
    setLoadingRemote(true);
    cloud
      .fetchOrderByCodeOrId(id)
      .then((res) => {
        if (res) {
          setRemoteOrder(res);
          updateOrder(res.id, res);
        }
      })
      .catch((err) => console.warn("Failed to fetch order from cloud:", err))
      .finally(() => setLoadingRemote(false));
  }, [id, localOrder, hydrated, loadingRemote, updateOrder]);

  // 2. Real-time Supabase Subscription & 15-second heartbeat poll
  useEffect(() => {
    if (!order?.dbId) return;

    const unsubscribe = cloud.subscribeToOrder(order.dbId, {
      onOrderUpdate: (patch) => {
        if (patch.status && patch.status !== order.status) {
          toast.info(`Order updated: ${patch.status}`);
        }
        updateOrder(order.id, patch);
        setRemoteOrder((prev) => (prev ? { ...prev, ...patch } : prev));
      },
      onHistoryInsert: (entry) => {
        updateOrder(order.id, {
          statusHistory: [...(order.statusHistory ?? []), entry],
        });
        setRemoteOrder((prev) =>
          prev
            ? {
                ...prev,
                statusHistory: [...(prev.statusHistory ?? []), entry],
              }
            : prev,
        );
      },
    });

    // Fallback polling every 15s to guarantee freshness on mobile networks
    const timer = setInterval(() => {
      cloud
        .fetchOrderByCodeOrId(order.id)
        .then((fresh) => {
          if (fresh) {
            updateOrder(fresh.id, fresh);
            setRemoteOrder(fresh);
          }
        })
        .catch(() => undefined);
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [order?.dbId, order?.id, order?.status, order?.statusHistory, updateOrder]);

  if (!order) {
    if (!hydrated || loadingRemote) {
      return (
        <Page title="Loading your order…">
          <div className="flex items-center gap-2.5 text-sm text-slate-secondary">
            <Loader2 className="size-5 animate-spin text-botanical" />
            <span>One moment while we fetch your live order status...</span>
          </div>
        </Page>
      );
    }
    return (
      <Page title="Order not found" intro="We could not find this order.">
        <Link to="/stores" className="inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white">
          Return to stores
        </Link>
      </Page>
    );
  }

  const saved = state.addresses.find((a) => a.id === order.addressId);
  const address = saved ?? {
    line: order.addressLine ?? "",
    landmark: order.addressLandmark,
    zoneId: order.addressZoneId ?? "",
  };
  const zone = address.zoneId ? zoneById(address.zoneId) : undefined;
  const currentIndex = Math.max(orderStatuses.indexOf(order.status as (typeof orderStatuses)[number]), 0);
  const customerStatuses = [
    "Order received",
    "Payment approved",
    "Store confirming stock",
    "Items being picked",
    "Rider assigned",
    "On the way",
    "Rider approaching",
    "Delivered",
  ] as const;

  const activeCustomerIndex = customerStatuses.reduce((last, status, index) => {
    const statusIndex = orderStatuses.indexOf(status);
    return statusIndex <= currentIndex ? index : last;
  }, 0);

  const method = paymentMethods.find((m) => m.id === order.paymentMethod);
  const needsProof = order.paymentMethod !== "cod" && !order.proofUploaded;

  const copyPin = () => {
    void navigator.clipboard.writeText(order.pin);
    toast.success("Delivery PIN copied to clipboard");
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      await markProof(order.id, file);
      toast.success("Proof received. We'll confirm your payment shortly.");
    } catch {
      toast.error("That upload didn't go through. Please try again.");
    } finally {
      setUploadingProof(false);
    }
  };

  // Find timestamps for milestones from status history
  const getHistoryEntry = (statusName: string) => {
    return (order.statusHistory ?? []).find((h) => h.status.toLowerCase() === statusName.toLowerCase());
  };

  return (
    <Page
      title={`Order ${order.id}`}
      intro={
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold text-slate">{order.status}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live tracking
          </span>
        </span>
      }
      wide
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          {needsProof ? (
            <div className="mb-4 rounded-xl border border-warning/60 bg-warning-bg p-4 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-warning" />
                <h2 className="type-label text-warning">Payment confirmation needed</h2>
              </div>
              <p className="mt-1 text-xs text-warning">
                Pay with {method?.name} and upload your proof of payment. Your order will be confirmed as soon as our team verifies the transaction.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-coral-hover">
                  {uploadingProof ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  <span>{uploadingProof ? "Uploading proof…" : "Upload proof of payment"}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={uploadingProof}
                    onChange={handleProofUpload}
                  />
                </label>
                <Link
                  to="/payment/$id"
                  params={{ id: order.id }}
                  className="rounded-lg border border-warning px-4 py-2 text-sm font-semibold text-warning transition-colors hover:bg-warning/10"
                >
                  Payment instructions
                </Link>
              </div>
            </div>
          ) : null}

          {/* Live Timeline Section */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h2 className="type-card text-slate">Live Timeline</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-botanical">
                <Radio className="size-3.5 text-coral animate-pulse" />
                Real-time Sync
              </span>
            </div>

            <ol className="mt-4 space-y-0">
              {customerStatuses.map((status, i) => {
                const done = i < activeCustomerIndex;
                const active = i === activeCustomerIndex;
                const historyEntry = getHistoryEntry(status);
                const timeString = historyEntry?.createdAt
                  ? new Date(historyEntry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : i === 0 && order.placedAt
                  ? new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : null;

                return (
                  <li key={status} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid size-6 place-items-center rounded-full text-xs font-bold transition-colors ${
                          done
                            ? "bg-botanical text-white shadow-xs"
                            : active
                            ? "bg-coral text-white ring-4 ring-coral/20 animate-pulse"
                            : "bg-mist text-slate-muted"
                        }`}
                      >
                        {done ? <Check className="size-3.5 stroke-[3]" /> : i + 1}
                      </span>
                      {i < customerStatuses.length - 1 ? (
                        <span
                          className={`h-9 w-0.5 transition-colors ${
                            done ? "bg-botanical" : "bg-border"
                          }`}
                        />
                      ) : null}
                    </div>

                    <div className="pb-4 min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span
                          className={`text-sm leading-tight ${
                            active
                              ? "font-extrabold text-slate"
                              : done
                              ? "font-semibold text-slate-secondary"
                              : "text-slate-muted"
                          }`}
                        >
                          {status}
                        </span>
                        {timeString ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-slate-muted">
                            <Clock className="size-3" />
                            {timeString}
                          </span>
                        ) : null}
                      </div>
                      {historyEntry?.note ? (
                        <p className="mt-0.5 text-xs text-slate-muted">
                          {historyEntry.note}
                        </p>
                      ) : active && i === 0 ? (
                        <p className="mt-0.5 text-xs text-slate-muted">
                          Order received and awaiting store confirmation.
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Items Section */}
          <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="type-card text-slate">Items Ordered ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {order.items.map((i) => {
                const p = productById(i.productId);
                if (!p) return null;
                return (
                  <li key={i.productId} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-semibold text-slate truncate">{p.name}</p>
                      <p className="text-xs text-slate-muted">{i.quantity} × {formatUsd(p.price)} · {p.packSize}</p>
                    </div>
                    {order.hidePrices ? null : (
                      <span className="font-heading font-bold text-slate tabular-nums">
                        {formatUsd(p.price * i.quantity)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Sidebar Delivery & PIN Details */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs text-sm">
            <h2 className="type-card text-slate">Delivery Details</h2>
            <p className="mt-2 font-medium text-slate-secondary">{address?.line}</p>
            {address?.landmark ? (
              <p className="text-xs text-slate-muted">Landmark: {address.landmark}</p>
            ) : null}
            <p className="mt-2 text-xs font-semibold text-botanical">
              Estimated delivery: {zone ? `${zone.etaMinutes[0]}–${zone.etaMinutes[1]} minutes` : "45–70 minutes"}
            </p>

            {/* One-time Delivery PIN Box */}
            <div className="mt-4 rounded-xl border border-emerald-300/60 bg-botanical-tint p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-botanical">One-Time Delivery PIN</p>
                <button
                  type="button"
                  onClick={copyPin}
                  title="Copy PIN"
                  className="grid size-7 place-items-center rounded-md bg-botanical text-white shadow-xs transition-colors hover:bg-botanical-hover"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              <p className="mt-2 font-display text-3xl font-black tracking-widest tabular text-botanical">
                {order.pin}
              </p>
              <p className="mt-1 text-xs text-botanical/80">
                Share this PIN with your rider upon delivery to confirm handover.
              </p>
            </div>

            {/* Rider Status */}
            <div className="mt-4 rounded-xl border border-border bg-mist/60 p-3.5 text-xs text-slate-secondary">
              <p className="font-bold text-slate">Rider Assignment</p>
              <p className="mt-1">
                {order.riderName
                  ? `Assigned rider: ${order.riderName}`
                  : "A nearby dispatch rider will be assigned once shopping is complete."}
              </p>
            </div>
          </div>

          {/* Pricing Summary */}
          {order.hidePrices ? null : (
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs text-sm">
              <div className="flex justify-between font-heading font-extrabold text-base text-slate">
                <span>{order.finalTotal != null ? "Final Total" : "Estimated Total"}</span>
                <span className="tabular-nums">{formatUsd(order.finalTotal ?? order.total)}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-muted">
                {order.finalTotal != null
                  ? "Adjusted after picking and weighing in store."
                  : "Final total confirmed once items are picked and weighed."}
              </p>
            </div>
          )}

          {/* Action Links */}
          <div className="space-y-2">
            <a
              href={whatsappLink(`Hello, I need help with order ${order.id}.`)}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-transform active:scale-98 hover:bg-emerald-700"
            >
              WhatsApp Support
            </a>
            <Link
              to="/receipt/$id"
              params={{ id: order.id }}
              className="block w-full rounded-xl border border-border bg-card py-2.5 text-center text-sm font-semibold text-slate transition-colors hover:border-botanical-mid"
            >
              View Digital Receipt
            </Link>
            <Link
              to="/problem"
              className="block w-full rounded-xl border border-border bg-card py-2.5 text-center text-sm font-semibold text-slate-secondary transition-colors hover:border-botanical-mid"
            >
              Report a Problem
            </Link>
          </div>
        </aside>
      </div>
    </Page>
  );
}
