import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useApp } from "@/lib/app-state";

export type FulfillmentMode = "delivery" | "collect";

type SuburbItem = {
  name: string;
  zoneId: string;
  area: string;
  eta: string;
  popular?: boolean;
};

type PickupHub = {
  id: string;
  name: string;
  address: string;
  readyTime: string;
  hours: string;
};

const popularSuburbs: SuburbItem[] = [
  { name: "Avondale", zoneId: "avondale", area: "Harare West", eta: "45–60 mins", popular: true },
  { name: "Borrowdale", zoneId: "borrowdale", area: "Harare North", eta: "55–75 mins", popular: true },
  { name: "Eastlea", zoneId: "eastlea", area: "Harare East", eta: "45–60 mins", popular: true },
  { name: "Mount Pleasant", zoneId: "borrowdale", area: "Harare North", eta: "50–70 mins", popular: true },
  { name: "Harare CBD", zoneId: "cbd", area: "Central Business District", eta: "40–55 mins", popular: true },
  { name: "Belgravia", zoneId: "avondale", area: "Harare Central", eta: "45–60 mins", popular: true },
  { name: "Highlands", zoneId: "highlands", area: "Harare East", eta: "50–75 mins", popular: true },
  { name: "Granary Park", zoneId: "cbd", area: "Greater Harare", eta: "55–80 mins", popular: true },
  { name: "Greendale", zoneId: "greendale", area: "Harare East", eta: "50–70 mins" },
  { name: "Belvedere", zoneId: "belvedere", area: "Harare West", eta: "45–65 mins" },
  { name: "Milton Park", zoneId: "milton-park", area: "Harare West", eta: "45–60 mins" },
  { name: "Newlands", zoneId: "highlands", area: "Harare East", eta: "45–65 mins" },
];

const pickupHubs: PickupHub[] = [
  {
    id: "hub-avondale",
    name: "Avondale Hub",
    address: "Bath Road Shopping Centre, Avondale, Harare",
    readyTime: "Ready in 25 mins",
    hours: "Open daily: 07:30 – 20:00",
  },
  {
    id: "hub-borrowdale",
    name: "Sam Levy's Village Pick-Up",
    address: "Piers Road Car Park B, Borrowdale, Harare",
    readyTime: "Ready in 25 mins",
    hours: "Open daily: 08:00 – 19:30",
  },
  {
    id: "hub-cbd",
    name: "CBD Central Hub",
    address: "First Street Mall & George Silundika Ave, Harare",
    readyTime: "Ready in 20 mins",
    hours: "Monday – Saturday: 07:00 – 19:00",
  },
  {
    id: "hub-eastlea",
    name: "Eastlea Hub",
    address: "Samora Machel Ave Express Point, Eastlea, Harare",
    readyTime: "Ready in 25 mins",
    hours: "Open daily: 07:30 – 20:00",
  },
];

export function DeliveryLocationBar() {
  const { activeAddress, setActiveAddress, addAddress } = useApp();

  // Mode state: 'delivery' (default) or 'collect'
  const [mode, setMode] = useState<FulfillmentMode>("delivery");
  // Suburb state (default Avondale, Harare or Borrowdale)
  const [selectedSuburb, setSelectedSuburb] = useState<string>("Avondale, Harare");
  // Selected collection hub
  const [selectedHub, setSelectedHub] = useState<PickupHub>(pickupHubs[0]!);

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<FulfillmentMode>("delivery");
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSuburb, setTempSuburb] = useState<string>("Avondale, Harare");
  const [tempHub, setTempHub] = useState<PickupHub>(pickupHubs[0]!);

  // Hydrate preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("tenganow.fulfillmentMode") as FulfillmentMode | null;
      if (savedMode === "delivery" || savedMode === "collect") {
        setMode(savedMode);
        setModalTab(savedMode);
      }

      const savedSuburb = localStorage.getItem("tenganow.suburb");
      if (savedSuburb) {
        setSelectedSuburb(savedSuburb);
        setTempSuburb(savedSuburb);
      } else if (activeAddress?.line) {
        const lineParts = activeAddress.line.split(",");
        const sub = lineParts[lineParts.length - 1]?.trim() || "Avondale";
        const formatted = `${sub}, Harare`;
        setSelectedSuburb(formatted);
        setTempSuburb(formatted);
      }

      const savedHubId = localStorage.getItem("tenganow.hubId");
      if (savedHubId) {
        const found = pickupHubs.find((h) => h.id === savedHubId);
        if (found) {
          setSelectedHub(found);
          setTempHub(found);
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }, [activeAddress]);

  const handleModeChange = (newMode: FulfillmentMode) => {
    setMode(newMode);
    setModalTab(newMode);
    try {
      localStorage.setItem("tenganow.fulfillmentMode", newMode);
    } catch {
      /* ignore */
    }
    toast.success(
      newMode === "delivery"
        ? "Switched to Rapid Delivery (45–60 mins)"
        : "Switched to Store Collection (Ready in 25 mins)",
    );
  };

  const handleOpenModal = () => {
    setModalTab(mode);
    setTempSuburb(selectedSuburb);
    setTempHub(selectedHub);
    setSearchQuery("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSearchQuery("");
  };

  const handleSelectSuburb = (suburbItem: SuburbItem) => {
    const formatted = `${suburbItem.name}, Harare`;
    setTempSuburb(formatted);
  };

  const handleConfirmLocation = async () => {
    if (modalTab === "delivery") {
      setSelectedSuburb(tempSuburb);
      setMode("delivery");
      try {
        localStorage.setItem("tenganow.suburb", tempSuburb);
        localStorage.setItem("tenganow.fulfillmentMode", "delivery");

        // Sync with app-state active address if matching suburb found
        const cleanName = tempSuburb.split(",")[0]?.trim().toLowerCase();
        const matched = popularSuburbs.find(
          (s) => s.name.toLowerCase() === cleanName || cleanName?.includes(s.name.toLowerCase()),
        );
        if (matched) {
          await addAddress({
            label: "Delivery Address",
            line: `${matched.name}, Harare`,
            zoneId: matched.zoneId,
            is_default: true,
          });
        }
      } catch {
        /* ignore */
      }
      toast.success(`Delivery address set to ${tempSuburb}`);
    } else {
      setSelectedHub(tempHub);
      setMode("collect");
      try {
        localStorage.setItem("tenganow.hubId", tempHub.id);
        localStorage.setItem("tenganow.fulfillmentMode", "collect");
      } catch {
        /* ignore */
      }
      toast.success(`Pickup hub set to ${tempHub.name}`);
    }
    setIsModalOpen(false);
  };

  const filteredSuburbs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return popularSuburbs;
    return popularSuburbs.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.area.toLowerCase().includes(query) ||
        s.zoneId.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  return (
    <>
      {/* -------------------- Desktop Location Switcher Bar -------------------- */}
      <div className="border-t border-primary-foreground/15 bg-botanical-hover/80 px-3 py-1.5 backdrop-blur-xs text-primary-foreground md:px-6">
        {/* Desktop Container */}
        <div className="mx-auto hidden max-w-7xl items-center justify-between gap-4 md:flex">
          {/* Left: Mode Switcher (Delivery vs Collect) */}
          <div className="flex items-center rounded-full border border-primary-foreground/20 bg-botanical/90 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => handleModeChange("delivery")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all duration-150 cursor-pointer ${
                mode === "delivery"
                  ? "bg-coral text-white shadow-xs"
                  : "text-primary-foreground/80 hover:text-white"
              }`}
            >
              <span>🛵</span>
              <span>Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("collect")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all duration-150 cursor-pointer ${
                mode === "collect"
                  ? "bg-coral text-white shadow-xs"
                  : "text-primary-foreground/80 hover:text-white"
              }`}
            >
              <span>🛍️</span>
              <span>Collect</span>
            </button>
          </div>

          {/* Middle: Clickable Location Pill */}
          <button
            type="button"
            onClick={handleOpenModal}
            aria-label="Change delivery location or collection hub"
            className="group flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-1 text-xs font-medium text-primary-foreground transition-all duration-150 hover:border-primary-foreground/50 hover:bg-primary-foreground/20 cursor-pointer shadow-xs"
          >
            <div className="grid size-5 place-items-center rounded-full bg-coral/25 text-coral shadow-xs group-hover:scale-110 transition-transform">
              <MapPin className="size-3" />
            </div>
            <span className="text-primary-foreground/80 font-normal">
              {mode === "delivery" ? "Deliver to:" : "Collect from:"}
            </span>
            <span className="max-w-[240px] truncate font-bold text-white">
              {mode === "delivery" ? selectedSuburb : selectedHub.name}
            </span>
            <ChevronDown className="size-3.5 text-primary-foreground/60 transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>

          {/* Right: Arrival ETA Badge */}
          <div className="flex items-center">
            {mode === "delivery" ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 shadow-xs">
                <span className="text-emerald-400">⚡</span>
                <span>Delivery in 45–60 mins</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/35 bg-teal-500/15 px-3 py-1 text-[11px] font-bold text-teal-300 shadow-xs">
                <Clock className="size-3 text-teal-400" />
                <span>Ready for pickup in 25 mins</span>
              </div>
            )}
          </div>
        </div>

        {/* -------------------- Mobile Location Switcher Bar (Condensed 1-Line) -------------------- */}
        <div className="flex items-center justify-between gap-2 text-xs md:hidden">
          {/* Segmented Mode Button */}
          <div className="flex items-center rounded-full border border-primary-foreground/20 bg-botanical/90 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleModeChange("delivery")}
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-all ${
                mode === "delivery" ? "bg-coral text-white shadow-xs" : "text-primary-foreground/75"
              }`}
            >
              🛵 Delivery
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("collect")}
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-all ${
                mode === "collect" ? "bg-coral text-white shadow-xs" : "text-primary-foreground/75"
              }`}
            >
              🛍️ Collect
            </button>
          </div>

          {/* Compact Location Pill with ETA */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex min-w-0 flex-1 items-center justify-end gap-1 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary-foreground/20 cursor-pointer"
          >
            <MapPin className="size-3 text-coral shrink-0" />
            <span className="truncate max-w-[100px]">
              {mode === "delivery" ? selectedSuburb.split(",")[0] : selectedHub.name.split(" ")[0]}
            </span>
            <span className="text-emerald-300 font-bold shrink-0">
              • {mode === "delivery" ? "45m" : "25m"}
            </span>
            <ChevronDown className="size-3 text-primary-foreground/70 shrink-0" />
          </button>
        </div>
      </div>

      {/* -------------------- Interactive Location & Hub Modal -------------------- */}
      {isModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate/60 backdrop-blur-xs animate-in fade-in duration-150 sm:p-4"
          onClick={handleCloseModal}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-border p-4 pb-3 sm:p-5 sm:pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-botanical-tint text-botanical">
                    <Navigation className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate">Choose Shopping Location</h3>
                    <p className="text-xs text-slate-muted">Deliver to your door or collect at a nearby hub</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Close location modal"
                  className="grid size-8 place-items-center rounded-full text-slate-muted transition-colors hover:bg-mist hover:text-slate cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Mode Toggle Tabs inside Modal */}
              <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-mist p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalTab("delivery")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all cursor-pointer ${
                    modalTab === "delivery"
                      ? "bg-card text-botanical shadow-xs"
                      : "text-slate-muted hover:text-slate"
                  }`}
                >
                  <span>🛵 Delivery Address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("collect")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all cursor-pointer ${
                    modalTab === "collect"
                      ? "bg-card text-botanical shadow-xs"
                      : "text-slate-muted hover:text-slate"
                  }`}
                >
                  <span>🛍️ Collection Hubs</span>
                </button>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {modalTab === "delivery" ? (
                <>
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search suburb, street, or landmark..."
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm text-slate outline-none placeholder:text-slate-muted focus:border-botanical focus:ring-1 focus:ring-botanical"
                    />
                  </div>

                  {/* Popular Harare Suburbs Quick-Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-secondary flex items-center gap-1">
                        <Sparkles className="size-3 text-coral" />
                        Popular Harare Suburbs
                      </span>
                      <span className="text-[11px] text-slate-muted">Tap to choose</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {popularSuburbs.map((suburb) => {
                        const isSelected = tempSuburb.toLowerCase().includes(suburb.name.toLowerCase());
                        return (
                          <button
                            key={suburb.name}
                            type="button"
                            onClick={() => handleSelectSuburb(suburb)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-botanical text-white shadow-xs"
                                : "bg-mist text-slate-secondary hover:bg-border/60 hover:text-slate"
                            }`}
                          >
                            {suburb.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suburb Selection List */}
                  <div>
                    <span className="block text-xs font-bold text-slate-secondary mb-2">
                      Available Delivery Suburbs ({filteredSuburbs.length})
                    </span>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {filteredSuburbs.map((suburb) => {
                        const isSelected = tempSuburb.toLowerCase().includes(suburb.name.toLowerCase());

                        return (
                          <div
                            key={suburb.name}
                            onClick={() => handleSelectSuburb(suburb)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-botanical bg-botanical-tint/40 shadow-xs"
                                : "border-border hover:border-botanical/50 hover:bg-mist/50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`grid size-7 place-items-center rounded-lg ${
                                  isSelected
                                    ? "bg-botanical text-white"
                                    : "bg-mist text-slate-muted"
                                }`}
                              >
                                <MapPin className="size-3.5" />
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate">
                                  {suburb.name}
                                </span>
                                <span className="block text-xs text-slate-muted">
                                  {suburb.area}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-emerald-600">
                                {suburb.eta}
                              </span>
                              {isSelected ? (
                                <Check className="size-4 text-botanical stroke-[2.5]" />
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Collection Hubs View */
                <div>
                  <div className="mb-3">
                    <span className="block text-xs font-bold text-slate-secondary">
                      Select Collection Pickup Hub
                    </span>
                    <p className="text-xs text-slate-muted mt-0.5">
                      Order online and collect your packaged grocery bags ready in 25 mins.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {pickupHubs.map((hub) => {
                      const isSelected = tempHub.id === hub.id;

                      return (
                        <div
                          key={hub.id}
                          onClick={() => setTempHub(hub)}
                          className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-botanical bg-botanical-tint/40 shadow-xs"
                              : "border-border hover:border-botanical/50 hover:bg-mist/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Store className={`size-4 ${isSelected ? "text-botanical" : "text-slate-muted"}`} />
                              <span className="text-sm font-bold text-slate">{hub.name}</span>
                            </div>
                            <span className="rounded-full bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 text-[10px] font-bold">
                              {hub.readyTime}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-secondary pl-6">{hub.address}</p>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-muted pl-6">
                            <span>{hub.hours}</span>
                            {isSelected ? (
                              <span className="flex items-center gap-1 text-botanical font-bold text-xs">
                                <Check className="size-3.5" /> Selected
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Confirm Action */}
            <div className="border-t border-border p-4 sm:p-5 flex items-center justify-between gap-3 bg-mist/30 rounded-b-2xl">
              <div className="min-w-0">
                <span className="block text-[11px] text-slate-muted">Current Selection</span>
                <span className="block text-xs font-bold text-slate truncate">
                  {modalTab === "delivery" ? tempSuburb : tempHub.name}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmLocation}
                className="inline-flex items-center justify-center rounded-xl bg-coral px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-coral-hover hover:shadow-md cursor-pointer active:scale-98"
              >
                {modalTab === "delivery" ? "Deliver to this address" : "Collect from this hub"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
