import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, Loader2, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
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
import { commitCartStock, reserveCartStock, type ShortageInfo } from "@/lib/inventory-client";
import { initiatePaynowPayment, pollPaynowStatus } from "@/lib/paynow-client";

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
  const { state, user, totals, placeOrder, setActiveAddress, setDefaultSubstitution, activeAddress, saveProfilePrefs } = useApp();
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
  const [stockShortages, setStockShortages] = useState<ShortageInfo[]>([]);

  // DOB Age Verification state
  const [dob, setDob] = useState(user?.dateOfBirth || "");
  const [dobConfirmed, setDobConfirmed] = useState(Boolean(user?.dobVerified));
  const [dobError, setDobError] = useState("");

  // Paynow mobile & modal states
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "customer@tenganow.co.zw");
  const [paynowModalOpen, setPaynowModalOpen] = useState(false);
  const [paynowStatusText, setPaynowStatusText] = useState("");
  const [paynowOrderCode, setPaynowOrderCode] = useState("");
  const [currentPollUrl, setCurrentPollUrl] = useState("");
  const [pollingActive, setPollingActive] = useState(false);
  const [manualChecking, setManualChecking] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(120);

  const hasLiquor = state.cart.some((i) => productById(i.productId)?.liquor);
  const isPaynowMethod = payment === "ecocash" || payment === "onemoney" || payment === "card";
  const isMobilePaynow = payment === "ecocash" || payment === "onemoney";

  // Countdown timer for mobile PIN authorization
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (pollingActive && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            setPollingActive(false);
            setPaynowStatusText("Payment prompt expired or timed out. You can re-verify or check your order tracking.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pollingActive, countdownSeconds]);

  // Helper to verify 18+
  const isAdult = (dobString: string): boolean => {
    if (!dobString) return false;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  // Manual fallback check button handler
  const handleManualStatusCheck = async () => {
    if (!currentPollUrl && !paynowOrderCode) return;
    setManualChecking(true);
    try {
      const pollRes = await pollPaynowStatus(currentPollUrl || paynowOrderCode);
      if (pollRes.paid) {
        setPollingActive(false);
        void commitCartStock(state.cart);
        toast.success("Payment confirmed! Redirecting to confirmation...");
        setTimeout(() => {
          navigate({
            to: "/orders/confirmation",
            search: { orderId: paynowOrderCode },
          });
        }, 800);
      } else {
        toast.info("Payment not confirmed yet. Please ensure your PIN was entered on your phone.");
      }
    } catch {
      toast.error("Could not reach payment gateway. Please try again in a moment.");
    } finally {
      setManualChecking(false);
    }
  };

  // Reserve items for 15 minutes when user enters checkout
  useEffect(() => {
    if (!state.cart.length) return;
    let isCurrent = true;
    reserveCartStock(state.cart).then((res) => {
      if (!isCurrent) return;
      if (!res.success && res.shortages && res.shortages.length > 0) {
        setStockShortages(res.shortages);
        toast.warning("Some items in your basket exceed currently available stock.");
      } else {
        setStockShortages([]);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [state.cart]);

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
      setStep(0);
      return;
    }

    // Liquor age verification check
    if (hasLiquor) {
      if (!isAdult(dob)) {
        setDobError("You must be at least 18 years of age to order alcohol.");
        toast.error("Age verification required: You must be 18 or older to purchase liquor.");
        return;
      }
      // Persist DOB verification to user profile
      if (user) {
        saveProfilePrefs({ date_of_birth: dob, dob_verified: true });
      }
    }

    if (isMobilePaynow && !mobileMoneyPhone.trim()) {
      toast.error("Please enter your EcoCash / OneMoney mobile number in the payment step.");
      setStep(4);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Re-validate inventory reservation
      const reserveRes = await reserveCartStock(state.cart);
      if (!reserveRes.success && reserveRes.shortages && reserveRes.shortages.length > 0) {
        setStockShortages(reserveRes.shortages);
        toast.error("Some items are no longer available in the requested quantity.");
        setSubmitting(false);
        return;
      }

      // 2. Handle Paynow payment flow
      if (isPaynowMethod) {
        setPaynowStatusText(
          isMobilePaynow
            ? `Payment prompt sent to ${mobileMoneyPhone}. Please enter your PIN on your phone.`
            : "Connecting to Paynow secure gateway..."
        );
        setPaynowModalOpen(true);
        setCountdownSeconds(120);

        const initResult = await initiatePaynowPayment({
          items: state.cart.map((c) => ({
            productId: c.productId,
            storeId: c.storeId,
            quantity: c.quantity,
          })),
          customerEmail: customerEmail || "customer@tenganow.co.zw",
          customerPhone: isMobilePaynow ? mobileMoneyPhone : undefined,
          deliveryAddress: {
            line: activeAddress.line,
            zoneId: activeAddress.zoneId,
            landmark: activeAddress.landmark,
          },
          deliveryFee: totals.deliveryFee,
          paymentMethod: payment as any,
          deliveryNotes: instructions,
          userId: user?.id,
        });

        if (!initResult.success) {
          setSubmitting(false);
          setPaynowModalOpen(false);
          toast.error(initResult.error || "Failed to initiate payment with Paynow.");
          return;
        }

        // Also save order in local state for seamless client-side viewing
        const localOrder = await placeOrder({
          items: state.cart,
          addressId: activeAddress.id,
          slotId,
          paymentMethod: payment,
          status: "Awaiting payment",
          total: totals.total,
          deliveryFee: totals.deliveryFee,
          hidePrices: forSomeoneElse ? hidePrices : false,
          handover,
          ...(instructions ? { deliveryNotes: instructions } : {}),
          ...(forSomeoneElse ? { recipientName, recipientPhone } : {}),
        });

        setPaynowOrderCode(initResult.orderCode || localOrder.id);
        if (initResult.pollUrl) {
          setCurrentPollUrl(initResult.pollUrl);
        }

        if (isMobilePaynow) {
          // Show USSD pin instructions and start polling
          setPaynowStatusText(
            `Payment prompt sent to ${mobileMoneyPhone}. Please enter your PIN on your phone.`
          );
          setPollingActive(true);

          // Poll periodically
          let attempts = 0;
          const maxAttempts = 40; // 40 * 3s = 120s
          const pollInterval = setInterval(async () => {
            attempts++;
            const pollRes = await pollPaynowStatus(initResult.pollUrl || initResult.orderCode || localOrder.id);
            if (pollRes.paid) {
              clearInterval(pollInterval);
              setPollingActive(false);
              void commitCartStock(state.cart);
              toast.success("Payment confirmed! Redirecting to confirmation...");
              setTimeout(() => {
                navigate({
                  to: "/orders/confirmation",
                  search: { orderId: initResult.orderCode || localOrder.id },
                });
              }, 1200);
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPollingActive(false);
              setPaynowStatusText("Waiting for payment. You can also track your order in your account.");
            }
          }, 3000);
          return;
        } else {
          // Card / Web redirect
          if (initResult.redirectUrl && initResult.redirectUrl.startsWith("http")) {
            window.location.href = initResult.redirectUrl;
            return;
          } else {
            navigate({
              to: "/orders/confirmation",
              search: { orderId: initResult.orderCode || localOrder.id },
            });
            return;
          }
        }
      }

      // 3. Fallback for COD / Manual Bank Transfer
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

      if (payment === "cod") {
        void commitCartStock(state.cart);
        toast.success(`Order ${order.id} received`);
        navigate({ to: "/order/$id", params: { id: order.id } });
      } else {
        toast.success(`Order ${order.id} placed`);
        navigate({ to: "/payment/$id", params: { id: order.id } });
      }
    } catch (err: any) {
      setSubmitting(false);
      setPaynowModalOpen(false);
      toast.error(err?.message || "We couldn't place your order. Please try again.");
    }
  };

  return (
    <Page title="Checkout" intro={`Step ${step + 1} of ${steps.length}: ${steps[step]}`} wide>
      {stockShortages.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-semibold">Stock shortage alert</p>
            <p className="text-xs text-amber-800">
              The following item{stockShortages.length > 1 ? "s exceed" : " exceeds"} currently available inventory:
            </p>
            <ul className="list-disc pl-4 text-xs font-medium">
              {stockShortages.map((s) => (
                <li key={s.product_id}>
                  {s.name}: requested {s.requested}, only {s.available} available
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
              <h2 className="type-card text-slate">Choose payment method</h2>
              <div className="mt-3 space-y-2">
                {paymentMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition-colors ${
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

              {/* EcoCash / OneMoney mobile phone input prompt */}
              {isMobilePaynow && (
                <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                    <Smartphone className="size-4 text-emerald-600" />
                    <span>Mobile Money Number</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-400">
                    A USSD prompt will be sent immediately to this phone to enter your PIN.
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-slate">
                      {payment === "ecocash" ? "EcoCash" : "OneMoney"} Phone Number (077 / 078 / 071)
                    </label>
                    <input
                      type="tel"
                      value={mobileMoneyPhone}
                      onChange={(e) => setMobileMoneyPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      maxLength={15}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium focus:border-botanical focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Email address for receipts */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate">Email Address for Receipt & Paynow Confirmation</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-botanical focus:outline-none"
                />
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-md bg-info-bg px-3 py-2 text-xs text-info">
                <ShieldCheck className="size-4 shrink-0" />
                <span>
                  {isPaynowMethod
                    ? "Secured by Paynow gateway. Transactions are encrypted and verified in real time."
                    : "For cash on delivery, please have the exact amount ready for the rider upon delivery."}
                </span>
              </div>
            </div>
          ) : null}

           {step === 5 ? (
            <div>
              <h2 className="type-card text-slate">Review and place your order</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Line label="Address" value={activeAddress?.line ?? "Not set"} />
                {activeAddress?.landmark ? <Line label="Landmark" value={activeAddress.landmark} /> : null}
                <Line label="Delivery" value={deliverySlots.find((s) => s.id === slotId)?.label ?? ""} />
                <Line label="Substitutions" value={substitutionOptions.find((o) => o.id === state.defaultSubstitution)?.label ?? ""} />
                <Line label="Payment" value={paymentMethods.find((m) => m.id === payment)?.name ?? ""} />
                <Line label="Instructions" value={instructions || "None"} />
                {forSomeoneElse ? <Line label="Recipient" value={`${recipientName} · ${recipientPhone}`} /> : null}
              </dl>

              {/* Age Compliance & Liquor Disclaimer */}
              {hasLiquor ? (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-700/60 dark:bg-amber-950/30">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Age-Restricted Items (18+)
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300 font-medium">
                        Notice: This order contains alcohol. A valid national ID or driver's license matching the recipient must be presented upon physical delivery.
                      </p>
                    </div>
                  </div>

                  {/* DOB input & check */}
                  <div className="mt-3.5 border-t border-amber-200/80 pt-3 dark:border-amber-800/50">
                    <label className="block text-xs font-semibold text-amber-950 dark:text-amber-200">
                      Date of Birth Verification (Must be 18 or older)
                    </label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <input
                        type="date"
                        value={dob}
                        max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                        onChange={(e) => {
                          setDob(e.target.value);
                          setDobError("");
                          if (isAdult(e.target.value)) {
                            setDobConfirmed(true);
                          } else {
                            setDobConfirmed(false);
                          }
                        }}
                        className="rounded-lg border border-amber-300 bg-card px-3 py-1.5 text-sm font-medium focus:border-amber-500 focus:outline-none dark:border-amber-700"
                        required
                      />
                      {dob && isAdult(dob) && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <Check className="size-3.5" />
                          Age Verified (18+)
                        </span>
                      )}
                    </div>
                    {dobError && <p className="mt-1.5 text-xs font-semibold text-rose-600">{dobError}</p>}
                    <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                      We securely record this verification against your profile to comply with liquor licensing regulations.
                    </p>
                  </div>
                </div>
              ) : null}

              <IndependentNotice className="mt-3" />
               <button
                type="button"
                onClick={submit}
                disabled={submitting || (hasLiquor && !isAdult(dob))}
                 className="mt-4 min-h-12 w-full rounded-xl bg-coral px-4 text-[15px] font-bold text-primary-foreground hover:bg-coral-hover disabled:opacity-60"
              >
                {submitting ? "Placing your order…" : `Place order · USD ${formatUsd(totals.total)}`}
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
              <span className="font-bold text-botanical">USD {formatUsd(totals.total)}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-muted">All prices and payments denominated in USD</p>
            <EstimateNotice className="mt-3" />
          </div>
        </aside>
      </div>

      {/* Paynow Processing & Live Polling Modal */}
      {paynowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="grid size-14 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                {pollingActive ? (
                  <Smartphone className="size-7 text-emerald-600 animate-bounce" />
                ) : (
                  <Loader2 className="size-7 text-emerald-600 animate-spin" />
                )}
              </div>

              <h3 className="mt-4 font-heading text-lg font-bold text-slate">
                {pollingActive ? "Awaiting PIN Authorization" : "Initiating Paynow Gateway"}
              </h3>

              {/* Amount clearly displayed in USD */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
                <span>Amount: USD {formatUsd(totals.total)}</span>
              </div>

              <p className="mt-2 text-sm text-slate-secondary">
                {paynowStatusText || "Connecting to secure payment gateway..."}
              </p>

              {pollingActive && (
                <div className="mt-4 w-full rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 text-left space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                      Live USSD prompt active
                    </span>
                    <span className="rounded bg-emerald-200/80 px-2 py-0.5 font-mono text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200">
                      {Math.floor(countdownSeconds / 60)}:{(countdownSeconds % 60).toString().padStart(2, "0")} remaining
                    </span>
                  </div>
                  <p>1. Check phone <strong>{mobileMoneyPhone}</strong>.</p>
                  <p>2. Enter your PIN on the pop-up prompt to confirm payment of <strong>USD {formatUsd(totals.total)}</strong>.</p>
                  <p>3. Do not close this screen. Your payment will automatically confirm here once approved.</p>
                </div>
              )}

              {/* Manual fallback status check button */}
              {pollingActive && (
                <div className="mt-4 w-full">
                  <button
                    type="button"
                    onClick={handleManualStatusCheck}
                    disabled={manualChecking}
                    className="w-full rounded-xl bg-botanical py-2.5 text-sm font-bold text-white shadow-xs hover:bg-botanical-hover disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {manualChecking ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verifying with Paynow...</span>
                      </>
                    ) : (
                      <span>I have entered my PIN, verify status now</span>
                    )}
                  </button>
                </div>
              )}

              <div className="mt-4 flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaynowModalOpen(false);
                    setPollingActive(false);
                    setSubmitting(false);
                    if (paynowOrderCode) {
                      navigate({ to: "/order/$id", params: { id: paynowOrderCode } });
                    }
                  }}
                  className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-slate hover:bg-mist transition-colors"
                >
                  {pollingActive ? "I'll track order later" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
