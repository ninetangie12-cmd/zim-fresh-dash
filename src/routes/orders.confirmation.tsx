import { Link, createFileRoute, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Page } from "@/components/site/Page";
import { brand, formatUsd } from "@/config/brand";
import { useApp } from "@/lib/app-state";
import * as cloud from "@/lib/cloud";
import type { Order } from "@/lib/app-state-types";

export const Route = createFileRoute("/orders/confirmation")({
  validateSearch: (search: Record<string, unknown>): { orderId?: string } => {
    return {
      orderId: typeof search["orderId"] === "string" ? search["orderId"] : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: `Order Confirmed — ${brand.name}` },
      { name: "description", content: "Your payment has been received and your order is confirmed." },
      { property: "og:title", content: `Order Confirmed — ${brand.name}` },
    ],
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { orderId } = useSearch({ from: "/orders/confirmation" });
  const { state } = useApp();
  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null);

  const localOrder = state.orders.find((o) => o.id === orderId || o.dbId === orderId);
  const order = localOrder ?? remoteOrder;

  useEffect(() => {
    if (orderId && !localOrder) {
      cloud.fetchOrderByCodeOrId(orderId).then((res) => {
        if (res) setRemoteOrder(res);
      }).catch((err) => console.warn("Could not fetch confirmed order:", err));
    }
  }, [orderId, localOrder]);

  const displayCode = order?.id || orderId || "Your Order";

  return (
    <Page title="Order Confirmed!" intro="Your Paynow payment has been received and verified." wide>
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="mt-5 font-heading text-2xl font-black text-slate md:text-3xl">
          Thank you! We're preparing your delivery
        </h1>

        <p className="mt-2 text-sm text-slate-secondary">
          Payment for order <span className="font-bold text-slate">{displayCode}</span> has been confirmed.
          Our personal shoppers have been notified and picking will start shortly.
        </p>

        {order && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-botanical">Order Reference</p>
                <p className="font-heading text-lg font-bold text-slate">{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-muted">Amount Paid</p>
                <p className="font-heading text-lg font-bold text-botanical">{formatUsd(order.total)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="size-4" />
              <span>Paid via Paynow ({order.paymentMethod.toUpperCase()}) · Transaction Verified</span>
            </div>

            {order.addressLine && (
              <div className="mt-3 border-t border-border pt-3 text-xs text-slate-secondary">
                <span className="font-semibold text-slate">Delivering to: </span>
                {order.addressLine}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/order/$id"
            params={{ id: order?.id || orderId || "" }}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-botanical px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-botanical-hover transition-transform active:scale-98"
          >
            <span>Live Order Tracking</span>
            <ArrowRight className="size-4" />
          </Link>

          <Link
            to="/stores"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-slate hover:bg-mist transition-colors"
          >
            <ShoppingBag className="size-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </Page>
  );
}
