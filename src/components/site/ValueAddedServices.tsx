import { useState } from "react";
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { brand } from "@/config/brand";

type ServiceItem = {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: typeof Zap;
  colorBg: string;
  colorText: string;
  badgeStyle: string;
  providers: string[];
  fieldLabel: string;
  fieldPlaceholder: string;
};

const services: ServiceItem[] = [
  {
    id: "zesa",
    title: "ZESA & Bills",
    description: "Prepaid electricity tokens and utility accounts",
    badge: "Instant Token",
    icon: Zap,
    colorBg: "bg-amber-500/10 text-amber-600",
    colorText: "text-amber-600",
    badgeStyle: "bg-amber-100 text-amber-800 border-amber-200",
    providers: ["ZESA Powertel", "City of Harare", "TelOne Voice"],
    fieldLabel: "Meter or Account Number",
    fieldPlaceholder: "e.g. 0412 3456 7890",
  },
  {
    id: "airtime",
    title: "Airtime & Data",
    description: "Econet, NetOne, and Telecel bundles",
    badge: "Instant Top-Up",
    icon: Smartphone,
    colorBg: "bg-emerald-500/10 text-emerald-600",
    colorText: "text-emerald-600",
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
    providers: ["Econet Buddie", "NetOne OneFusion", "Telecel", "Liquid Home"],
    fieldLabel: "Recipient Mobile Number",
    fieldPlaceholder: "e.g. 077 123 4567",
  },
  {
    id: "tickets",
    title: "Events & Tickets",
    description: "Concerts, festivals, and football matches",
    badge: "E-Tickets",
    icon: Ticket,
    colorBg: "bg-purple-500/10 text-purple-600",
    colorText: "text-purple-600",
    badgeStyle: "bg-purple-100 text-purple-800 border-purple-200",
    providers: ["Castle Lager PSL", "HICC Concerts", "Shoko Fest", "Theatre in the Park"],
    fieldLabel: "Event Name or Team",
    fieldPlaceholder: "e.g. Dynamos vs CAPS United (2 Tickets)",
  },
  {
    id: "travel",
    title: "Bus & Travel",
    description: "Regional and intercity coach bookings",
    badge: "Reserve Seat",
    icon: Bus,
    colorBg: "bg-blue-500/10 text-blue-600",
    colorText: "text-blue-600",
    badgeStyle: "bg-blue-100 text-blue-800 border-blue-200",
    providers: ["Intercape Coach", "CAG Travellers", "City Bus", "Bravo Coaches"],
    fieldLabel: "Travel Route & Date",
    fieldPlaceholder: "e.g. Harare to Bulawayo (Next Friday)",
  },
  {
    id: "insurance",
    title: "Micro-Insurance",
    description: "Funeral, vehicle licensing, and health cover",
    badge: "Affordable Cover",
    icon: ShieldCheck,
    colorBg: "bg-rose-500/10 text-rose-600",
    colorText: "text-rose-600",
    badgeStyle: "bg-rose-100 text-rose-800 border-rose-200",
    providers: ["ZINARA Road & Radio", "Old Mutual", "Nyaradzo Sahwira", "EcoSure"],
    fieldLabel: "Vehicle Reg or Policy Reference",
    fieldPlaceholder: "e.g. AFH 2345 / Policy 8821",
  },
  {
    id: "wallets",
    title: "Bill Pay & Wallets",
    description: "EcoCash, InnBucks, and bank transfer support",
    badge: "Fast Settle",
    icon: Wallet,
    colorBg: "bg-teal-500/10 text-teal-600",
    colorText: "text-teal-600",
    badgeStyle: "bg-teal-100 text-teal-800 border-teal-200",
    providers: ["EcoCash USD / ZiG", "InnBucks Pay", "Omari Wallet", "ZimSwitch ZIPIT"],
    fieldLabel: "Biller or Merchant Code",
    fieldPlaceholder: "e.g. Merchant Code or Bill Reference",
  },
];

export function ValueAddedServices() {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [referenceInput, setReferenceInput] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleOpenModal = (service: ServiceItem) => {
    setSelectedService(service);
    setSelectedProvider(service.providers[0] || "");
    setReferenceInput("");
    setAmountInput("");
    setIsSuccess(false);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setIsSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) {
      toast.error(`Please enter your ${selectedService?.fieldLabel.toLowerCase() || "details"}.`);
      return;
    }
    setIsSuccess(true);
    toast.success(`${selectedService?.title} request submitted successfully!`);
  };

  const generateWhatsAppUrl = () => {
    if (!selectedService) return "#";
    const text = `Hello ${brand.name}, I would like assistance with ${selectedService.title} (${selectedProvider || "Service"}). Details: ${referenceInput || "General inquiry"}, Amount: ${amountInput || "Standard"}.`;
    return `https://wa.me/${brand.contact.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section
      id="value-added-services"
      className="my-10 md:my-14 rounded-3xl border border-border/80 bg-mist/50 p-5 sm:p-7 md:p-8 shadow-xs dark:bg-card/60 scroll-mt-24"
      aria-labelledby="vas-heading"
    >
      {/* Header & Subtitle */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-botanical-tint px-3 py-1 text-xs font-extrabold text-botanical">
              <Sparkles className="size-3.5" /> Value-Added Services Hub
            </span>
          </div>
          <h2 id="vas-heading" className="font-heading text-xl md:text-2xl font-black text-slate mt-2">
            More Than Just Shopping
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-secondary">
            Pay bills, buy tickets, top up airtime, and secure coverage in seconds.
          </p>
        </div>
      </div>

      {/* Modern Scannable Card Grid: 2 cols mobile, 3 tablet, 6 desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {services.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpenModal(item)}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-botanical/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-botanical cursor-pointer sm:p-4"
            >
              <div>
                {/* Icon & Badge Row */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className={`grid size-10 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${item.colorBg}`}>
                    <Icon className="size-5" />
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${item.badgeStyle}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="mt-3 text-sm font-bold text-slate group-hover:text-botanical transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-muted">
                  {item.description}
                </p>
              </div>

              {/* Action Hint */}
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-botanical opacity-90 group-hover:opacity-100">
                <span>Express Service</span>
                <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Express Service Modal */}
      {selectedService ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close modal"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-slate-muted transition-colors hover:bg-mist hover:text-slate cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 pr-8">
              <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${selectedService.colorBg}`}>
                <selectedService.icon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate">{selectedService.title}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${selectedService.badgeStyle}`}>
                    {selectedService.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-muted mt-0.5">{selectedService.description}</p>
              </div>
            </div>

            {isSuccess ? (
              /* Success Confirmation View */
              <div className="mt-6 text-center py-4">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-7" />
                </div>
                <h4 className="mt-3 text-base font-bold text-slate">Request Received</h4>
                <p className="mt-1 text-xs text-slate-secondary">
                  Your reference is <strong className="text-botanical font-mono">TN-VAS-{Math.floor(1000 + Math.random() * 9000)}</strong>. Our desk is processing your order and will confirm via SMS / WhatsApp.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg bg-botanical px-5 py-2 text-xs font-semibold text-white hover:bg-botanical-hover"
                  >
                    Done
                  </button>
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-slate hover:bg-mist"
                  >
                    <MessageSquare className="size-3.5 text-emerald-600" />
                    Open WhatsApp Desk
                  </a>
                </div>
              </div>
            ) : (
              /* Express Form */
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Select Provider Pill selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-secondary">
                    Select Provider or Network
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedService.providers.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedProvider(p)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          selectedProvider === p
                            ? "bg-botanical text-white font-semibold shadow-xs"
                            : "bg-mist text-slate-secondary hover:bg-border/60"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference / Input Field */}
                <div>
                  <label htmlFor="vas-ref" className="block text-xs font-semibold text-slate">
                    {selectedService.fieldLabel}
                  </label>
                  <input
                    id="vas-ref"
                    type="text"
                    required
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    placeholder={selectedService.fieldPlaceholder}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-slate outline-none placeholder:text-slate-muted focus:border-botanical focus:ring-1 focus:ring-botanical"
                  />
                </div>

                {/* Amount Field */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="vas-amount" className="block text-xs font-semibold text-slate">
                      Amount (USD or ZiG)
                    </label>
                    <input
                      id="vas-amount"
                      type="text"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder="e.g. $10.00 / 265 ZiG"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-slate outline-none placeholder:text-slate-muted focus:border-botanical focus:ring-1 focus:ring-botanical"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-secondary">
                      Settlement Speed
                    </label>
                    <div className="mt-1 flex min-h-9 items-center rounded-lg border border-border bg-mist/60 px-3 text-xs font-medium text-slate">
                      ⚡ Instant Delivery
                    </div>
                  </div>
                </div>

                {/* Submit & WhatsApp Actions */}
                <div className="pt-2 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-coral py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-coral-hover cursor-pointer"
                  >
                    Process Instant Request
                  </button>
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 px-4 text-xs font-semibold text-slate hover:bg-mist transition-colors"
                  >
                    <MessageSquare className="size-3.5 text-emerald-600" />
                    Order via WhatsApp
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
