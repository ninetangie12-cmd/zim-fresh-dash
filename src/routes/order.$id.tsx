import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Copy, Loader2, MapPin, MessageCircle, Phone, Radio, ShieldCheck, Store, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Page } from "@/components/site/Page";
import { brand, formatUsd, whatsappLink } from "@/config/brand";
import { orderStatuses, paymentMethods, productById, storeById, zoneById } from "@/data/catalog";
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

export function OrderPage() {
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
    notes: order.deliveryNotes,
  };
  const zone = address.zoneId ? zoneById(address.zoneId) : undefined;

  // 4-Stage Visual Progress Tracker
  const TRACKER_STAGES = [
    {
      id: 1,
      title: "Order Placed / Payment Confirmed",
      description: "Order is registered and payment has been authorized",
      isComplete: (status: string, payStatus?: string) =>
        payStatus === "paid" ||
        [
          "Order received",
          "Payment approved",
          "Confirmed",
          "Store confirming stock",
          "Items being picked",
          "Rider assigned",
          "On the way",
          "Rider approaching",
          "Delivered",
        ].includes(status),
      isActive: (status: string, payStatus?: string) =>
        status === "Awaiting payment" ||
        status === "Order received" ||
        (status === "Payment approved" && payStatus !== "paid"),
    },
    {
      id: 2,
      title: "Store Preparing Order",
      description: "Store shoppers are selecting and bagging fresh items",
      isComplete: (status: string) =>
        ["Rider assigned", "On the way", "Rider approaching", "Delivered"].includes(status),
      isActive: (status: string) =>
        [
          "Store confirming stock",
          "Items being picked",
          "Packed",
          "Ready for pickup",
        ].includes(status),
    },
    {
      id: 3,
      title: "Out for Delivery",
      description: "Rider is dispatched and en route to your gate",
      isComplete: (status: string) => status === "Delivered",
      isActive: (status: string) =>
        ["Rider assigned", "On the way", "Rider approaching"].includes(status),
    },
    {
      id: 4,
      title: "Delivered",
      description: "Handover completed with one-time verification PIN",
      isComplete: (status: string) => status === "Delivered",
      isActive: (status: string) => status === "Delivered",
    },
  ];

  // Derive active stage index (0 to 3)
  const currentStageIndex = (() => {
    if (order.status === "Delivered") return 3;
    if (["Rider assigned", "On the way", "Rider approaching"].includes(order.status)) return 2;
    if (["Store confirming stock", "Items being picked", "Packed", "Ready for pickup"].includes(order.status))
      return 1;
    return 0;
  })();

  const method = paymentMethods.find((m) => m.id === order.paymentMethod);
  const isPaid = order.paymentStatus === "paid" || order.status === "Payment approved" || order.status === "Confirmed";
  const needsProof = order.paymentMethod !== "cod" && !isPaid && !order.proofUploaded;

  // Retrieve Store information
  const firstItem = order.items[0];
  const firstProduct = firstItem ? productById(firstItem.productId) : undefined;
  const storeId = firstItem?.storeId || firstProduct?.storeIds?.[0];
  const store = storeId ? storeById(storeId) : undefined;

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

  return (
    <Page
      title={`Order ${order.id}`}
      intro={
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold text-slate">{order.status}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live tracking
          </span>
        </span>
      }
      wide
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {needsProof ? (
            <div className="rounded-xl border border-warning/60 bg-warning-bg p-4 shadow-xs">
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

          {/* 4-Step Visual Progress Tracker */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div>
                <h2 className="font-heading text-lg font-bold text-slate">Order Progress</h2>
                <p className="text-xs text-slate-muted">Step {currentStageIndex + 1} of 4</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Radio className="size-3 text-emerald-600 animate-pulse" />
                Live Tracker
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {TRACKER_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex || (idx === 3 && order.status === "Delivered");
                const isCurrent = idx === currentStageIndex && order.status !== "Delivered";

                return (
                  <div key={stage.id} className="relative flex items-start gap-4">
                    {/* Connecting vertical line */}
                    {idx < TRACKER_STAGES.length - 1 && (
                      <div
                        className={`absolute left-4 top-9 -ml-[1px] h-[calc(100%-8px)] w-0.5 transition-colors ${
                          idx < currentStageIndex ? "bg-botanical" : "bg-border"
                        }`}
                      />
                    )}

                    {/* Step Icon / Number */}
                    <div
                      className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all ${
                        isCompleted
                          ? "bg-botanical text-white shadow-xs"
                          : isCurrent
                          ? "bg-coral text-white ring-4 ring-coral/20 animate-pulse"
                          : "bg-mist text-slate-muted border border-border"
                      }`}
                    >
                      {isCompleted ? <Check className="size-4 stroke-[3]" /> : stage.id}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3
                          className={`text-sm font-bold ${
                            isCurrent
                              ? "text-coral font-extrabold"
                              : isCompleted
                              ? "text-slate"
                              : "text-slate-muted"
                          }`}
                        >
                          {stage.title}
                        </h3>
                        {isCurrent && (
                          <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[11px] font-semibold text-coral">
                            In progress
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-muted">{stage.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Itemized Order Summary */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h2 className="font-heading text-base font-bold text-slate">
                Itemized Order ({order.items.reduce((acc, i) => acc + i.quantity, 0)} items)
              </h2>
              <span className="text-xs font-medium text-slate-muted">Denominated in USD</span>
            </div>
            <ul className="mt-4 divide-y divide-border text-sm">
              {order.items.map((i) => {
                const p = productById(i.productId);
                if (!p) return null;
                return (
                  <li key={i.productId} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-semibold text-slate truncate">{p.name}</p>
                      <p className="text-xs text-slate-muted">
                        {i.quantity} × {formatUsd(p.price)} · {p.packSize}
                      </p>
                    </div>
                    {order.hidePrices ? null : (
                      <span className="font-heading font-bold text-slate tabular-nums">
                        USD {formatUsd(p.price * i.quantity)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {!order.hidePrices && (
              <div className="mt-4 border-t border-border pt-3 space-y-1.5 text-xs text-slate-secondary">
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate">USD {formatUsd(order.deliveryFee ?? 0)}</span>
                </div>
                <div className="flex justify-between font-heading font-bold text-sm text-slate pt-2 border-t border-border/60">
                  <span>Total Paid / Due</span>
                  <span className="text-botanical font-black text-base">
                    USD {formatUsd(order.finalTotal ?? order.total)}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: Store Info, Delivery Details & Actions */}
        <aside className="space-y-5">
          {/* Store Contact Info */}
          {store && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                <Store className="size-4 text-botanical shrink-0" />
                <h2 className="font-heading text-sm font-bold text-slate">Fulfilling Merchant</h2>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <p className="font-bold text-slate text-sm">{store.name}</p>
                <p className="text-slate-muted">{store.pickup?.branch || "Main Branch"}</p>
                <p className="text-slate-secondary leading-relaxed">{store.pickup?.address}</p>
                {store.pickup?.phone && (
                  <p className="flex items-center gap-1.5 font-medium text-slate">
                    <Phone className="size-3 text-slate-muted" />
                    <span>{store.pickup.phone}</span>
                  </p>
                )}
                {store.pickup?.hours && (
                  <p className="flex items-center gap-1.5 text-slate-muted">
                    <Clock className="size-3" />
                    <span>{store.pickup.hours}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Delivery Details Card with Landmark & Suburb */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <MapPin className="size-4 text-botanical shrink-0" />
              <h2 className="font-heading text-sm font-bold text-slate">Delivery Details</h2>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-secondary">
              <div>
                <span className="font-semibold text-slate block">Street / Stand & Suburb:</span>
                <p className="text-slate-secondary font-medium">{address?.line || "Address not provided"}</p>
                {zone?.name && <p className="text-slate-muted">{zone.name}, Harare</p>}
              </div>

              {address?.landmark && (
                <div className="rounded-lg bg-mist/70 p-2.5 border border-border/60">
                  <span className="font-semibold text-slate block text-[11px] uppercase tracking-wider">
                    Nearest Landmark:
                  </span>
                  <p className="text-slate font-medium mt-0.5">{address.landmark}</p>
                </div>
              )}

              {(order.recipientName || order.recipientPhone) && (
                <div className="pt-2 border-t border-border/60">
                  <span className="font-semibold text-slate block">Recipient:</span>
                  <p className="font-medium text-slate">{order.recipientName || "Authorized recipient"}</p>
                  {order.recipientPhone && <p className="text-slate-muted">{order.recipientPhone}</p>}
                </div>
              )}

              {(order.deliveryNotes || address?.notes) && (
                <div className="pt-2 border-t border-border/60">
                  <span className="font-semibold text-slate block">Delivery Notes:</span>
                  <p className="italic text-slate-muted">{order.deliveryNotes || address?.notes}</p>
                </div>
              )}
            </div>

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
                Share this PIN with your rider upon physical handover.
              </p>
            </div>
          </div>

          {/* WhatsApp Support & Problem Action Links */}
          <div className="space-y-2.5">
            <a
              href={whatsappLink(`Hello, I need assistance with my ZimFresh order #${order.id}.`)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] py-3 text-center text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-[#20ba59] active:scale-[0.98]"
            >
              <MessageCircle className="size-4" />
              <span>Need Help? Contact Support</span>
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
