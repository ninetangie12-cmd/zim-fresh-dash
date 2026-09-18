import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";

import { EstimateNotice } from "@/components/site/Disclaimer";
import { Page } from "@/components/site/Page";
import { brand, formatSecondary, formatUsd, whatsappLink } from "@/config/brand";
import { paymentMethods } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/payment/$id")({
  head: () => ({
    meta: [
      { title: `Confirm your payment — ${brand.name}` },
      {
        name: "description",
        content:
          "Pay for your grocery delivery and upload your proof of payment. Orders are marked paid once our team approves the payment.",
      },
      { property: "og:title", content: `Confirm your payment — ${brand.name}` },
      {
        property: "og:description",
        content: "Upload your proof of payment and we'll confirm it before shopping starts.",
      },
    ],
  }),
  component: PaymentConfirmation,
});

function PaymentConfirmation() {
  const { id } = Route.useParams();
  const { state, markProof, hydrated } = useApp();
  const order = state.orders.find((o) => o.id === id);

  if (!order && !hydrated)
    return (
      <Page title="Loading your payment details…">
        <p className="text-sm text-slate-secondary">One moment.</p>
      </Page>
    );
  if (!order) throw notFound();

  const method = paymentMethods.find((m) => m.id === order.paymentMethod);
  const isCod = order.paymentMethod === "cod";

  return (
    <Page
       title={isCod ? `Order ${order.id} received` : "Payment confirmation pending"}
      intro={
        isCod
          ? "You chose cash on delivery. Please have the exact amount ready for your rider."
          : `Pay with ${method?.name ?? "your chosen method"} and send us the proof.`
      }
    >
       <div className="rounded-xl border border-border bg-card p-5">
         <p className="type-eyebrow text-botanical-mid">Order {order.id}</p>
        <p className="text-sm text-slate-secondary">Amount to pay (estimated)</p>
        <p className="type-price-lg text-botanical">{formatUsd(order.total)}</p>
        {brand.currency.showSecondary ? (
          <p className="text-sm text-slate-muted">≈ {formatSecondary(order.total)}</p>
        ) : null}
        <div className="mt-3">
          <EstimateNotice />
        </div>
      </div>

      {isCod ? (
        <div className="mt-5 rounded-lg border border-information bg-information-bg p-4 text-sm text-information">
          Your rider will collect payment on arrival. Cash-on-delivery orders cannot be left
          unattended, so please be there to receive your delivery.
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-lg border border-border bg-card p-5">
            <h2 className="type-card text-slate">How to pay</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-secondary">
              <li>
                1. Message us on WhatsApp for the current {method?.name ?? "payment"} details. We
                send these per order so the reference always matches.
              </li>
              <li>2. Pay the estimated amount shown above.</li>
              <li>3. Upload your proof of payment below, or send it on WhatsApp.</li>
            </ol>
            <a
              href={whatsappLink(`Hello, I'd like the payment details for order ${order.id}.`)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate hover:border-botanical-mid"
            >
              Request payment details on WhatsApp
            </a>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-card p-5">
            {order.proofUploaded ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-success" />
                <div>
                  <p className="type-card text-success">
                    Proof of payment received
                  </p>
                  <p className="mt-1 text-sm text-slate-secondary">
                    Your order is marked as paid only once our team approves the payment. We'll
                    notify you as soon as that happens.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="type-card text-slate">
                  Upload proof of payment
                </h2>
                <p className="mt-1 text-sm text-slate-secondary">
                  A screenshot or photo of the confirmation message is enough.
                </p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover">
                  <Upload className="size-4" />
                  Choose file
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      void markProof(order.id, file)
                        .then(() =>
                          toast.success("Proof received. We'll confirm your payment shortly."),
                        )
                        .catch(() =>
                          toast.error("That upload didn't go through. Please try again."),
                        );
                    }}
                  />
                </label>
              </>
            )}
          </div>
        </>
      )}

      <Link
        to="/order/$id"
        params={{ id: order.id }}
        className="mt-6 inline-block rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate hover:border-botanical-mid"
      >
        Track this order
      </Link>
    </Page>
  );
}
