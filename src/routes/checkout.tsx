import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EstimateNotice, IndependentNotice } from "@/components/site/Disclaimer";
import { Page } from "@/components/site/Page";
import { brand, formatUsd } from "@/config/brand";
import {
  deliverySlots,
  paymentMethods,
  productById,
  substitutionOptions,
  zoneById,
  type PaymentMethodId,
  type SubstitutionPreference,
} from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `Checkout — ${brand.name}` },
      { name: "description", content: "Confirm your address, delivery time, substitutions and payment method." },
      { property: "og:title", content: `Checkout — ${brand.name}` },
      { property: "og:description", content: "Complete your grocery delivery order." },
    ],
  }),
  component: Checkout,
});

const steps = [
  "Delivery address",
  "Delivery time",
  "Substitutions",
  "Recipient & instructions",
  "Payment",
  "Review order",
] as const;

function Checkout() {
  const navigate = useNavigate();
  const { state, totals, placeOrder, setActiveAddress, setDefaultSubstitution, activeAddress } = useApp();
  const [step, setStep] = useState(0);
  const [slotId, setSlotId] = useState("asap");
  const [payment, setPayment] = useState<PaymentMethodId>("ecocash");
  const [instructions, setInstructions] = useState("");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [hidePrices, setHidePrices] = useState(true);
  const [handover, setHandover] = useState("me");
  const [submitting, setSubmitting] = useState(false);

  const hasLiquor = state.cart.some((i) => productById(i.productId)?.liquor);

  if (!state.cart.length) {
    return (
      <Page title="Checkout" intro="Your basket is empty.">
        <Link to="/stores" className="inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white">
          Start shopping
        </Link>
      </Page>
    );
  }

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (submitting) return; // guards against duplicate orders
    if (!activeAddress) {
      toast.error("Add a delivery address first");
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const order = await placeOrder({
        items: state.cart,
        addressId: activeAddress.id,
        slotId,
        paymentMethod: payment,
        status: payment === "cod" ? "Order received" : "Awaiting payment",
        total: totals.total,
        deliveryFee: totals.deliveryFee,
        hidePrices: forSomeoneElse ? hidePrices : false,
        handover,
        ...(instructions ? { deliveryNotes: instructions } : {}),
        ...(forSomeoneElse ? { recipientName, recipientPhone } : {}),
      });
      toast.success(`Order ${order.id} received`);
      // Anything other than cash on delivery needs payment and proof first.
      if (payment === "cod") {
        navigate({ to: "/order/$id", params: { id: order.id } });
      } else {
        navigate({ to: "/payment/$id", params: { id: order.id } });
      }
    } catch {
      setSubmitting(false);
      toast.error("We couldn't place your order. Please try again.");
    }
  };

  return (
    <Page title="Checkout" intro={`Step ${step + 1} of ${steps.length}: ${steps[step]}`} wide>
      <ol className="mb-6 flex flex-wrap gap-1.5 text-xs">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${
              i < step ? "bg-botanical-tint text-botanical" : i === step ? "bg-botanical text-white" : "bg-mist text-slate-muted"
            }`}
          >
            {i < step ? <Check className="size-3" /> : null}
            {label}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-border bg-card p-4">
           {step === 0 ? (
            <div>
              <h2 className="type-card text-slate">Confirm delivery address</h2>
              <div className="mt-3 space-y-2">
                {state.addresses.map((a) => {
                  const zone = zoneById(a.zoneId);
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer gap-3 rounded-md border p-3 ${
                        a.id === activeAddress?.id ? "border-botanical bg-botanical-tint" : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={a.id === activeAddress?.id}
                        onChange={() => setActiveAddress(a.id)}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        <span className="block font-semibold text-slate">{a.label} · {zone?.name}</span>
                        <span className="block text-slate-secondary">{a.line}</span>
                        {a.landmark ? <span className="block text-xs text-slate-muted">Landmark: {a.landmark}</span> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
              <Link to="/addresses" className="mt-3 inline-block text-sm text-botanical underline">
                Add a new address
              </Link>
            </div>
          ) : null}

           {step === 1 ? (
            <div>
              <h2 className="type-card text-slate">Choose a delivery time</h2>
              <p className="mt-1 text-xs text-slate-muted">
                Slots are reserved while you check out and released if you leave.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {deliverySlots.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm ${
                      s.capacity === "full" ? "cursor-not-allowed border-border opacity-50" : slotId === s.id ? "border-botanical bg-botanical-tint" : "border-border"
                    }`}
                  >
                    <span>
                      <input
                        type="radio"
                        name="slot"
                        className="mr-2"
                        disabled={s.capacity === "full"}
                        checked={slotId === s.id}
                        onChange={() => setSlotId(s.id)}
                      />
                      <span className="font-medium text-slate">{s.day} · {s.label}</span>
                    </span>
                    <span className={s.capacity === "full" ? "text-xs text-error" : "text-xs text-success"}>
                      {s.capacity === "full" ? "Full" : "Available"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

           {step === 2 ? (
            <div>
              <h2 className="type-card text-slate">Confirm substitutions</h2>
              <p className="mt-1 text-sm text-slate-secondary">
                What should your shopper do when an item is unavailable?
              </p>
              <div className="mt-3 space-y-2">
                {substitutionOptions.map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm ${
                      state.defaultSubstitution === o.id ? "border-botanical bg-botanical-tint" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sub"
                      checked={state.defaultSubstitution === o.id}
                      onChange={() => setDefaultSubstitution(o.id as SubstitutionPreference)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-medium text-slate">{o.label}</span>
                      {"hint" in o && o.hint ? <span className="block text-xs text-slate-muted">{o.hint}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-muted">
                You can set a different preference for individual items in your basket.
              </p>
            </div>
          ) : null}

           {step === 3 ? (
            <div>
              <h2 className="type-card text-slate">Delivery instructions</h2>
               <label className="mt-3 block text-sm font-semibold text-slate" htmlFor="delivery-instructions">Delivery notes</label>
               <textarea
                 id="delivery-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Gate colour, landmark, who to call on arrival…"
                className="mt-2 w-full rounded-md border border-border bg-card p-3 text-sm"
              />

              <h3 className="mt-4 text-sm font-semibold text-slate">Handover</h3>
              <div className="mt-2 space-y-2 text-sm">
                {[
                  { id: "me", label: "Hand the order to me" },
                  { id: "other", label: "Hand to an authorised person" },
                  { id: "call", label: "Call on arrival" },
                  { id: "gate", label: "Leave at the gate where permitted" },
                ].map((o) => {
                  const blocked = o.id === "gate" && (hasLiquor || payment === "cod" || totals.total > 150);
                  return (
                    <label key={o.id} className={`flex items-center gap-2 ${blocked ? "opacity-50" : ""}`}>
                   <label className="block text-sm font-semibold text-slate" htmlFor="recipient-name">Recipient name</label>
                   <input
                     id="recipient-name"
                        type="radio"
                        name="handover"
                        disabled={blocked}
                        checked={handover === o.id}
                        onChange={() => setHandover(o.id)}
                      />
                      <span className="text-slate-secondary">{o.label}</span>
                      {blocked ? <span className="text-xs text-error">Not allowed for this order</span> : null}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-muted">
                Your rider will ask for a one-time delivery PIN. It appears on your tracking page.
              </p>

              <h3 className="mt-5 text-sm font-semibold text-slate">Ordering for someone else?</h3>
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-secondary">
                <input type="checkbox" checked={forSomeoneElse} onChange={(e) => setForSomeoneElse(e.target.checked)} />
                This delivery is for another person in Zimbabwe
              </label>
              {forSomeoneElse ? (
                <div className="mt-3 space-y-2">
                  <input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                     placeholder="e.g. Tariro Moyo"
                    maxLength={80}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  />
                   <label className="block text-sm font-semibold text-slate" htmlFor="recipient-phone">Zimbabwean phone number</label>
                   <input
                     id="recipient-phone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                     inputMode="tel"
                     autoComplete="tel"
                     placeholder="e.g. +263 77 123 4567"
                    maxLength={20}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-secondary">
                    <input type="checkbox" checked={hidePrices} onChange={(e) => setHidePrices(e.target.checked)} />
                    Hide prices from the recipient
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

           {step === 4 ? (
            <div>
              <h2 className="type-card text-slate">Choose payment</h2>
              <div className="mt-3 space-y-2">
                {paymentMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm ${
                      payment === m.id ? "border-botanical bg-botanical-tint" : "border-border"
                    }`}
                  >
                    <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} className="mt-0.5" />
                    <span>
                      <span className="block font-medium text-slate">{m.name}</span>
                      <span className="block text-xs text-slate-muted">{m.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 rounded-md bg-info-bg px-3 py-2 text-xs text-info">
                Your order is only marked as paid once an administrator approves your payment. For
                cash on delivery, have the exact amount ready.
              </p>
            </div>
          ) : null}

           {step === 5 ? (
            <div>
              <h2 className="type-card text-slate">Review and place your order</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Line label="Address" value={activeAddress?.line ?? "Not set"} />
                <Line label="Delivery" value={deliverySlots.find((s) => s.id === slotId)?.label ?? ""} />
                <Line label="Substitutions" value={substitutionOptions.find((o) => o.id === state.defaultSubstitution)?.label ?? ""} />
                <Line label="Payment" value={paymentMethods.find((m) => m.id === payment)?.name ?? ""} />
                <Line label="Instructions" value={instructions || "None"} />
                {forSomeoneElse ? <Line label="Recipient" value={`${recipientName} · ${recipientPhone}`} /> : null}
              </dl>
              {hasLiquor ? (
                <p className="mt-3 rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
                  This order contains alcohol. The recipient must be 18 or older and show
                  identification. Unattended delivery is not permitted.
                </p>
              ) : null}
              <IndependentNotice className="mt-3" />
               <button
                type="button"
                onClick={submit}
                disabled={submitting}
                 className="mt-4 min-h-12 w-full rounded-xl bg-coral px-4 text-[15px] font-bold text-primary-foreground hover:bg-coral-hover disabled:opacity-60"
              >
                {submitting ? "Placing your order…" : "Place order"}
              </button>
            </div>
          ) : null}

           <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
               className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-slate disabled:opacity-40"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                 className="min-h-11 rounded-xl bg-botanical px-5 text-sm font-semibold text-primary-foreground hover:bg-botanical-hover"
              >
                Continue
              </button>
            ) : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="type-card text-slate">Summary</h2>
            <div className="mt-3 space-y-2">
              <Line label="Estimated products" value={formatUsd(totals.subtotal)} />
              <Line label="Delivery fee" value={formatUsd(totals.deliveryFee)} />
              <Line label="Service fee" value={formatUsd(totals.serviceFee)} />
              {totals.savings > 0 ? <Line label="You save" value={`- ${formatUsd(totals.savings)}`} /> : null}
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 type-card text-slate">
              <span>Estimated total</span>
              <span>{formatUsd(totals.total)}</span>
            </div>
            <EstimateNotice className="mt-3" />
          </div>
        </aside>
      </div>
    </Page>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-secondary">{label}</dt>
      <dd className="text-right font-medium text-slate">{value}</dd>
    </div>
  );
}
