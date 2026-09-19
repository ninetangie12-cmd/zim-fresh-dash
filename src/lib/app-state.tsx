import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  SERVICE_FEE,
  productById,
  zoneById,
  type SubstitutionPreference,
} from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import * as cloud from "@/lib/cloud";
import type { Address, CartItem, Order, SavedList } from "@/lib/app-state-types";

export type { Address, CartItem, Order, SavedList } from "@/lib/app-state-types";

/* --------------------------------- state --------------------------------- */

type State = {
  cart: CartItem[];
  addresses: Address[];
  activeAddressId: string | null;
  favourites: string[];
  lists: SavedList[];
  orders: Order[];
  ageVerified: boolean;
  defaultSubstitution: SubstitutionPreference;
  deliveryNotes: string;
};

const STORAGE_KEY = "tenganow.state.v1";

const seedLists: SavedList[] = [
  { id: "l1", name: "Monthly Groceries", productIds: ["pa-01", "pa-03", "pa-04", "de-01", "bk-01", "hh-01"] },
  { id: "l2", name: "Baby Essentials", productIds: ["bb-01", "bb-03", "bb-04"] },
  { id: "l3", name: "Braai Supplies", productIds: ["mb-03", "mb-01", "sd-01", "fp-01"] },
  { id: "l4", name: "Cleaning Supplies", productIds: ["hh-01", "hh-02", "hh-03", "hh-05"] },
  { id: "l5", name: "Party Drinks", productIds: ["lq-01", "lq-08", "sd-01"] },
];

const seedOrders: Order[] = [
  {
    id: "TN-24081",
    placedAt: "2026-09-15T09:20:00Z",
    items: [
      { productId: "pa-01", storeId: "tm-pnp", quantity: 1, substitution: "closest" },
      { productId: "de-01", storeId: "tm-pnp", quantity: 2, substitution: "closest" },
      { productId: "bk-01", storeId: "tm-pnp", quantity: 2, substitution: "contact" },
    ],
    addressId: "a1",
    slotId: "t-1214",
    paymentMethod: "ecocash",
    status: "Delivered",
    total: 16.8,
    deliveryFee: 3.5,
    pin: "4821",
  },
  {
    id: "TN-24096",
    placedAt: "2026-09-17T07:05:00Z",
    items: [
      { productId: "mb-02", storeId: "tm-pnp", quantity: 1, substitution: "same_or_less" },
      { productId: "fp-03", storeId: "tm-pnp", quantity: 1, substitution: "closest" },
      { productId: "hh-04", storeId: "tm-pnp", quantity: 1, substitution: "closest" },
    ],
    addressId: "a1",
    slotId: "asap",
    paymentMethod: "ecocash",
    status: "On the way",
    total: 20.1,
    deliveryFee: 3.5,
    pin: "7390",
    proofUploaded: true,
  },
];

const initialState: State = {
  cart: [],
  addresses: [
    { id: "a1", label: "Home", zoneId: "avondale", line: "14 King George Road, Avondale", landmark: "Opposite the shops", notes: "Green gate" },
  ],
  activeAddressId: "a1",
  favourites: ["pa-01", "de-02", "fp-05"],
  lists: seedLists,
  orders: seedOrders,
  ageVerified: false,
  defaultSubstitution: "contact",
  deliveryNotes: "",
};

/* -------------------------------- context -------------------------------- */

export type SignedInUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl?: string | null;
};

type Ctx = {
  state: State;
  hydrated: boolean;
  user: SignedInUser | null;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (pendingAction?: () => void) => void;
  closeAuthModal: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  simulateSignIn: (identifier: string, name?: string) => void;
  loginWithToken: (
    user: { id: string; phone_number: string; full_name?: string | null; role: "customer" | "admin" },
    token: string,
  ) => Promise<void>;
  addToCart: (productId: string, storeId: string, quantity?: number, options?: { openDrawer?: boolean }) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setItemSubstitution: (productId: string, pref: SubstitutionPreference) => void;
  toggleFavourite: (productId: string) => void;
  addAddress: (a: Omit<Address, "id">) => Promise<string>;
  setActiveAddress: (id: string) => void;
  addList: (name: string, productIds: string[]) => void;
  listToCart: (listId: string) => void;
  setDefaultSubstitution: (pref: SubstitutionPreference) => void;
  setDeliveryNotes: (notes: string) => void;
  verifyAge: () => void;
  placeOrder: (o: PlaceOrderInput) => Promise<Order>;
  markProof: (orderId: string, file?: File) => Promise<void>;
  updateOrder: (orderId: string, patch: Partial<Order>) => void;
  refreshOrder: (codeOrId: string) => Promise<Order | null>;
  totals: {
    itemCount: number;
    subtotal: number;
    deliveryFee: number;
    baseDeliveryFee?: number;
    isFreeDelivery?: boolean;
    freeDeliveryThreshold?: number;
    amountToFreeDelivery?: number;
    serviceFee: number;
    savings: number;
    total: number;
  };
  activeAddress: Address | null;
};

export type PlaceOrderInput = {
  items: CartItem[];
  addressId: string;
  slotId: string;
  paymentMethod: string;
  status: string;
  total: number;
  deliveryFee: number;
  hidePrices?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  deliveryNotes?: string;
  handover?: string;
};

const AppContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<SignedInUser | null>(null);
  // False until we know whether there is an account and its data has arrived,
  // so order pages don't flash "not found" while the account loads.
  const [accountReady, setAccountReady] = useState(false);
  const loadedFor = useRef<string | null>(null);

  const update = useCallback((fn: (s: State) => State) => setState((s) => fn(s)), []);

  // Auth intercept modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pendingAuthAction = useRef<(() => void) | null>(null);

  const openAuthModal = useCallback((pendingAction?: () => void) => {
    pendingAuthAction.current = pendingAction ?? null;
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    pendingAuthAction.current = null;
  }, []);

  // Cart drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const simulateSignIn = useCallback((identifier: string, name?: string) => {
    const isEmail = identifier.includes("@");
    const cleaned = identifier.trim();
    const fallbackName = name || (isEmail ? cleaned.split("@")[0] : `Customer (${cleaned.slice(-4)})`);
    const nextUser: SignedInUser = {
      id: `u_${Date.now()}`,
      email: isEmail ? cleaned : `${cleaned.replace(/\D/g, "")}@phone.tenganow.local`,
      name: fallbackName,
      avatarUrl: null,
    };
    setUser(nextUser);
    try {
      localStorage.setItem("tenganow.simulated_user", JSON.stringify(nextUser));
    } catch {}
    setIsAuthModalOpen(false);

    if (pendingAuthAction.current) {
      const action = pendingAuthAction.current;
      pendingAuthAction.current = null;
      try {
        action();
      } catch (err) {
        console.error("Error executing pending auth action:", err);
      }
    }
  }, []);

  const loginWithToken = useCallback<Ctx["loginWithToken"]>(
    async (serviceUser, token) => {
      const nextUser: SignedInUser = {
        id: serviceUser.id,
        email: serviceUser.phone_number,
        name: serviceUser.full_name || `Customer (${serviceUser.phone_number.slice(-4)})`,
        avatarUrl: null,
      };
      setUser(nextUser);
      try {
        localStorage.setItem("tenganow.auth_token", token);
        localStorage.setItem("tenganow.simulated_user", JSON.stringify(nextUser));
      } catch {}
      setIsAuthModalOpen(false);

      // Fetch user addresses from backend service
      try {
        const res = await fetch("/api/user/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
          const fetchedAddresses: Address[] = data.addresses.map((a: any) => ({
            id: a.id,
            label: (a.suburb || "Saved Address") as "Home" | "Work" | "Other",
            line: a.street_address,
            landmark: a.landmarks || undefined,
            zoneId: "avondale",
          }));
          update((s) => {
            const existingIds = new Set(s.addresses.map((addr) => addr.id));
            const newOnes = fetchedAddresses.filter((addr) => !existingIds.has(addr.id));
            const merged = [...s.addresses, ...newOnes];
            return {
              ...s,
              addresses: merged,
              activeAddressId: s.activeAddressId || merged[0]?.id || null,
            };
          });
        }
      } catch (err) {
        console.warn("Failed to fetch user addresses after login:", err);
      }

      if (pendingAuthAction.current) {
        const action = pendingAuthAction.current;
        pendingAuthAction.current = null;
        try {
          action();
        } catch (err) {
          console.error("Error executing pending auth action:", err);
        }
      }
    },
    [update],
  );

  // Persist the basket and preferences so nothing is lost on refresh,
  // reconnect or a return visit on the same device.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as State) });
      const savedUser = localStorage.getItem("tenganow.simulated_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) setUser(parsed);
      }
      const token = localStorage.getItem("tenganow.auth_token");
      if (token) {
        fetch("/api/user/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
              const fetchedAddresses: Address[] = data.addresses.map((a: any) => ({
                id: a.id,
                label: (a.suburb || "Saved Address") as "Home" | "Work" | "Other",
                line: a.street_address,
                landmark: a.landmarks || undefined,
                zoneId: "avondale",
              }));
              update((s) => {
                const existingIds = new Set(s.addresses.map((addr) => addr.id));
                const newOnes = fetchedAddresses.filter((addr) => !existingIds.has(addr.id));
                return { ...s, addresses: [...s.addresses, ...newOnes] };
              });
            }
          })
          .catch(() => {});
      }
    } catch {
      /* corrupted storage — start fresh */
    }
    setHydrated(true);
  }, [update]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked */
    }
  }, [state, hydrated]);

  /* ------------------------------ account sync ----------------------------- */

  const pullAccount = useCallback(async (u: SignedInUser) => {
    if (loadedFor.current === u.id) return;
    loadedFor.current = u.id;
    try {
      const snap = await cloud.loadSnapshot(u.id);

      // First sign-in on this device: carry anything saved locally up to the
      // account so nothing the customer already set up is lost.
      let addresses = snap.addresses;
      let lists = snap.lists;
      let favourites = snap.favourites;

      if (!addresses.length) {
        const local = stateRef.current.addresses;
        const created: Address[] = [];
        for (const a of local) {
          try {
            created.push({ ...a, id: await cloud.saveAddress(u.id, a) });
          } catch {
            /* keep going — a failed copy is not worth blocking sign-in */
          }
        }
        addresses = created;
      }
      if (!lists.length) {
        const created: SavedList[] = [];
        for (const l of stateRef.current.lists) {
          try {
            created.push({ ...l, id: await cloud.saveList(u.id, l.name, l.productIds) });
          } catch {
            /* ignore */
          }
        }
        lists = created;
      }
      if (!favourites.length && stateRef.current.favourites.length) {
        favourites = stateRef.current.favourites;
        for (const pid of favourites) {
          try {
            await cloud.setFavourite(u.id, pid, true);
          } catch {
            /* ignore */
          }
        }
      }

      setState((s) => ({
        ...s,
        addresses,
        lists,
        favourites,
        orders: snap.orders,
        activeAddressId: addresses[0]?.id ?? null,
        defaultSubstitution: (snap.defaultSubstitution as SubstitutionPreference) ?? s.defaultSubstitution,
        ageVerified: snap.ageVerified ?? s.ageVerified,
      }));
    } catch {
      loadedFor.current = null;
    } finally {
      setAccountReady(true);
    }
  }, []);

  // Keep a ref so the sync routine can read the latest local data without
  // re-running every time the basket changes.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const su = session?.user;
      if (!su) {
        setUser(null);
        loadedFor.current = null;
        setAccountReady(true);
        return;
      }
      const next: SignedInUser = {
        id: su.id,
        email: su.email ?? null,
        name:
          (su.user_metadata?.["full_name"] as string | undefined) ??
          (su.user_metadata?.["name"] as string | undefined) ??
          null,
        avatarUrl:
          (su.user_metadata?.["avatar_url"] as string | undefined) ??
          (su.user_metadata?.["picture"] as string | undefined) ??
          null,
      };
      setUser(next);
      void pullAccount(next);
    });

    void supabase.auth.getSession().then(({ data }) => {
      const su = data.session?.user;
      if (!su) {
        setAccountReady(true);
        return;
      }
      const next: SignedInUser = {
        id: su.id,
        email: su.email ?? null,
        name:
          (su.user_metadata?.["full_name"] as string | undefined) ??
          (su.user_metadata?.["name"] as string | undefined) ??
          null,
        avatarUrl:
          (su.user_metadata?.["avatar_url"] as string | undefined) ??
          (su.user_metadata?.["picture"] as string | undefined) ??
          null,
      };
      setUser(next);
      void pullAccount(next);
    });

    return () => sub.subscription.unsubscribe();
  }, [pullAccount]);

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem("tenganow.simulated_user");
      localStorage.removeItem("tenganow.auth_token");
    } catch {}
    await supabase.auth.signOut().catch(() => undefined);
    setUser(null);
    loadedFor.current = null;
    setState((s) => ({
      ...initialState,
      cart: s.cart,
      deliveryNotes: s.deliveryNotes,
    }));
  }, []);

  /* -------------------------------- basket -------------------------------- */

  const addToCart = useCallback(
    (productId: string, storeId: string, quantity = 1, options?: { openDrawer?: boolean }) => {
      const isFirstItem = stateRef.current.cart.length === 0;
      update((s) => {
        const existing = s.cart.find((i) => i.productId === productId);
        if (existing) {
          return {
            ...s,
            cart: s.cart.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i,
            ),
          };
        }
        return {
          ...s,
          cart: [...s.cart, { productId, storeId, quantity, substitution: s.defaultSubstitution }],
        };
      });
      if (options?.openDrawer ?? isFirstItem) {
        setIsCartOpen(true);
      }
    },
    [update],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) =>
      update((s) => ({
        ...s,
        cart:
          quantity <= 0
            ? s.cart.filter((i) => i.productId !== productId)
            : s.cart.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      })),
    [update],
  );

  const removeFromCart = useCallback(
    (productId: string) =>
      update((s) => ({ ...s, cart: s.cart.filter((i) => i.productId !== productId) })),
    [update],
  );

  const clearCart = useCallback(() => update((s) => ({ ...s, cart: [] })), [update]);

  const setItemSubstitution = useCallback(
    (productId: string, pref: SubstitutionPreference) =>
      update((s) => ({
        ...s,
        cart: s.cart.map((i) => (i.productId === productId ? { ...i, substitution: pref } : i)),
      })),
    [update],
  );

  /* ---------------------------- saved preferences --------------------------- */

  const toggleFavourite = useCallback(
    (productId: string) => {
      const on = !stateRef.current.favourites.includes(productId);
      update((s) => ({
        ...s,
        favourites: on ? [...s.favourites, productId] : s.favourites.filter((f) => f !== productId),
      }));
      if (user) void cloud.setFavourite(user.id, productId, on).catch(() => undefined);
    },
    [update, user],
  );

  const addAddress = useCallback<Ctx["addAddress"]>(
    async (a) => {
      let id = `a${Date.now()}`;
      const token = typeof window !== "undefined" ? localStorage.getItem("tenganow.auth_token") : null;
      if (token) {
        try {
          const res = await fetch("/api/user/addresses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              suburb: a.label || "Harare",
              street_address: a.line,
              landmarks: a.landmark || null,
              is_default: true,
            }),
          });
          const data = await res.json();
          if (data.success && data.address?.id) {
            id = data.address.id;
          }
        } catch (err) {
          console.warn("Could not save address to API service:", err);
        }
      } else if (user) {
        try {
          id = await cloud.saveAddress(user.id, { ...a, id });
        } catch {
          /* fall back to a local address */
        }
      }
      update((s) => ({ ...s, addresses: [...s.addresses, { ...a, id }], activeAddressId: id }));
      return id;
    },
    [update, user],
  );

  const setActiveAddress = useCallback(
    (id: string) => update((s) => ({ ...s, activeAddressId: id })),
    [update],
  );

  const addList = useCallback(
    (name: string, productIds: string[]) => {
      const id = `l${Date.now()}`;
      update((s) => ({ ...s, lists: [...s.lists, { id, name, productIds }] }));
      if (user) {
        void cloud
          .saveList(user.id, name, productIds)
          .then((dbId) =>
            update((s) => ({
              ...s,
              lists: s.lists.map((l) => (l.id === id ? { ...l, id: dbId } : l)),
            })),
          )
          .catch(() => undefined);
      }
    },
    [update, user],
  );

  const listToCart = useCallback(
    (listId: string) =>
      update((s) => {
        const list = s.lists.find((l) => l.id === listId);
        if (!list) return s;
        const cart = [...s.cart];
        for (const pid of list.productIds) {
          const product = productById(pid);
          if (!product) continue;
          const existing = cart.find((i) => i.productId === pid);
          if (existing) existing.quantity += 1;
          else
            cart.push({
              productId: pid,
              storeId: product.storeIds[0]!,
              quantity: 1,
              substitution: s.defaultSubstitution,
            });
        }
        return { ...s, cart };
      }),
    [update],
  );

  const setDefaultSubstitution = useCallback(
    (pref: SubstitutionPreference) => {
      update((s) => ({ ...s, defaultSubstitution: pref }));
      if (user) void cloud.saveProfilePrefs(user.id, { default_substitution: pref }).catch(() => undefined);
    },
    [update, user],
  );

  const setDeliveryNotes = useCallback(
    (deliveryNotes: string) => update((s) => ({ ...s, deliveryNotes })),
    [update],
  );

  const verifyAge = useCallback(() => {
    update((s) => ({ ...s, ageVerified: true }));
    if (user) void cloud.saveProfilePrefs(user.id, { age_verified: true }).catch(() => undefined);
  }, [update, user]);

  /* -------------------------------- orders -------------------------------- */

  const placeOrder = useCallback<Ctx["placeOrder"]>(
    async (o) => {
      const address =
        stateRef.current.addresses.find((a) => a.id === o.addressId) ?? stateRef.current.addresses[0];
      const now = new Date().toISOString();
      const order: Order = {
        items: o.items,
        addressId: o.addressId,
        slotId: o.slotId,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentMethod === "cod" ? "on_delivery" : "awaiting",
        status: o.status,
        total: o.total,
        deliveryFee: o.deliveryFee,
        ...(o.hidePrices ? { hidePrices: true } : {}),
        ...(o.recipientName ? { recipientName: o.recipientName } : {}),
        ...(o.recipientPhone ? { recipientPhone: o.recipientPhone } : {}),
        ...(address
          ? {
              addressLine: address.line,
              addressZoneId: address.zoneId,
              ...(address.landmark ? { addressLandmark: address.landmark } : {}),
            }
          : {}),
        id: `TN-${Math.floor(10000 + Math.random() * 89999)}`,
        placedAt: now,
        pin: String(Math.floor(1000 + Math.random() * 8999)),
        statusHistory: [
          {
            status: o.status,
            note: "Order placed by customer",
            createdAt: now,
          },
        ],
      };

      if (user && address) {
        const totalsNow = computeTotals(o.items, address);
        try {
          order.dbId = await cloud.saveOrder(user.id, {
            code: order.id,
            pin: order.pin,
            status: order.status,
            items: o.items,
            address,
            slotId: o.slotId,
            paymentMethod: o.paymentMethod,
            ...(o.deliveryNotes ? { deliveryNotes: o.deliveryNotes } : {}),
            ...(o.handover ? { handover: o.handover } : {}),
            ...(o.recipientName ? { recipientName: o.recipientName } : {}),
            ...(o.recipientPhone ? { recipientPhone: o.recipientPhone } : {}),
            hidePrices: Boolean(o.hidePrices),
            subtotal: totalsNow.subtotal,
            deliveryFee: o.deliveryFee,
            serviceFee: totalsNow.serviceFee,
            savings: totalsNow.savings,
            total: o.total,
          });
        } catch (err) {
          console.warn("Could not save order to cloud:", err);
          /* keep the order visible locally even if the save failed */
        }
      }

      update((s) => ({ ...s, orders: [order, ...s.orders], cart: [] }));
      return order;
    },
    [update, user],
  );

  const markProof = useCallback<Ctx["markProof"]>(
    async (orderId, file) => {
      const order = stateRef.current.orders.find((o) => o.id === orderId || o.dbId === orderId);
      const now = new Date().toISOString();
      if (user && order?.dbId && file) {
        try {
          await cloud.uploadPaymentProof(user.id, order.dbId, file);
        } catch (err) {
          console.warn("Could not upload payment proof to cloud:", err);
        }
      }
      update((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId || o.dbId === orderId
            ? {
                ...o,
                proofUploaded: true,
                status: "Payment submitted",
                paymentStatus: "submitted",
                statusHistory: [
                  ...(o.statusHistory ?? []),
                  {
                    status: "Payment submitted",
                    note: "Proof of payment uploaded",
                    createdAt: now,
                  },
                ],
              }
            : o,
        ),
      }));
    },
    [update, user],
  );

  const updateOrder = useCallback(
    (orderId: string, patch: Partial<Order>) => {
      update((s) => ({
        ...s,
        orders: s.orders.map((o) => (o.id === orderId || o.dbId === orderId ? { ...o, ...patch } : o)),
      }));
    },
    [update],
  );

  const refreshOrder = useCallback(
    async (codeOrId: string) => {
      try {
        const order = await cloud.fetchOrderByCodeOrId(codeOrId);
        if (order) {
          update((s) => {
            const exists = s.orders.some((o) => o.id === order.id || o.dbId === order.dbId);
            return {
              ...s,
              orders: exists
                ? s.orders.map((o) => (o.id === order.id || o.dbId === order.dbId ? { ...o, ...order } : o))
                : [order, ...s.orders],
            };
          });
          return order;
        }
      } catch (err) {
        console.warn("Could not refresh order:", err);
      }
      return null;
    },
    [update],
  );

  /* -------------------------------- derived -------------------------------- */

  const activeAddress =
    state.addresses.find((a) => a.id === state.activeAddressId) ?? state.addresses[0] ?? null;

  const totals = useMemo(() => computeTotals(state.cart, activeAddress), [state.cart, activeAddress]);

  const value: Ctx = {
    state,
    hydrated: hydrated && accountReady,
    user,
    signOut,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    simulateSignIn,
    loginWithToken,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
    setItemSubstitution,
    toggleFavourite,
    addAddress,
    setActiveAddress,
    addList,
    listToCart,
    setDefaultSubstitution,
    setDeliveryNotes,
    verifyAge,
    placeOrder,
    markProof,
    updateOrder,
    refreshOrder,
    totals,
    activeAddress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function computeTotals(cart: CartItem[], address: Address | null | undefined) {
  let subtotal = 0;
  let savings = 0;
  let itemCount = 0;
  for (const item of cart) {
    const product = productById(item.productId);
    if (!product) continue;
    subtotal += product.price * item.quantity;
    itemCount += item.quantity;
    if (product.wasPrice) savings += (product.wasPrice - product.price) * item.quantity;
  }
  const storeCount = new Set(cart.map((i) => i.storeId)).size;
  const zone = address ? zoneById(address.zoneId) : undefined;
  const baseFee = zone?.deliveryFee ?? 3.5;
  const FREE_DELIVERY_THRESHOLD = 25;
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const baseDeliveryFee = cart.length ? baseFee * Math.max(storeCount, 1) : 0;
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const serviceFee = cart.length ? SERVICE_FEE : 0;
  return {
    itemCount,
    subtotal,
    deliveryFee,
    baseDeliveryFee,
    isFreeDelivery,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    amountToFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal),
    serviceFee,
    savings,
    total: subtotal + deliveryFee + serviceFee,
  };
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}
