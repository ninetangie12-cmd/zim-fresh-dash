// Cloud persistence helpers.
//
// The app works fully as a guest using local storage. Once a customer signs
// in, the same data lives in their account so addresses, favourites, lists,
// orders, payments and receipts follow them to any device.

import { supabase } from "@/integrations/supabase/client";
import { productById } from "@/data/catalog";
import type { Address, CartItem, Order, SavedList } from "@/lib/app-state-types";

export type CloudSnapshot = {
  addresses: Address[];
  favourites: string[];
  lists: SavedList[];
  orders: Order[];
  defaultSubstitution?: string;
  ageVerified?: boolean;
};

export async function loadSnapshot(userId: string): Promise<CloudSnapshot> {
  const [profile, addresses, favourites, lists, orders] = await Promise.all([
    supabase.from("profiles").select("default_substitution, age_verified").eq("id", userId).maybeSingle(),
    supabase.from("addresses").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("favourite_products").select("product_id").eq("user_id", userId),
    supabase.from("saved_lists").select("*").eq("user_id", userId).order("created_at"),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("placed_at", { ascending: false }),
  ]);

  return {
    addresses: (addresses.data ?? []).map((a) => ({
      id: a.id,
      label: (a.label as Address["label"]) ?? "Home",
      zoneId: a.zone_id,
      line: a.line,
      ...(a.landmark ? { landmark: a.landmark } : {}),
      ...(a.notes ? { notes: a.notes } : {}),
    })),
    favourites: (favourites.data ?? []).map((f) => f.product_id),
    lists: (lists.data ?? []).map((l) => ({ id: l.id, name: l.name, productIds: l.product_ids ?? [] })),
    orders: (orders.data ?? []).map(rowToOrder),
    ...(profile.data?.default_substitution ? { defaultSubstitution: profile.data.default_substitution } : {}),
    ...(profile.data ? { ageVerified: profile.data.age_verified } : {}),
  };
}

type OrderRow = {
  id: string;
  code: string;
  status: string;
  payment_method: string;
  payment_status: string;
  slot_id: string;
  address_line: string;
  address_zone: string;
  address_landmark: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  hide_prices: boolean;
  delivery_fee: string | number;
  total: string | number;
  final_total?: string | number | null;
  pin: string;
  placed_at: string;
  order_items?: Array<{
    product_id: string;
    store_id: string;
    quantity: number;
    substitution: string;
  }> | null;
  order_status_history?: Array<{
    id?: string;
    status: string;
    note?: string | null;
    created_at: string;
  }> | null;
};

export function rowToOrder(row: OrderRow): Order {
  return {
    id: row.code,
    dbId: row.id,
    placedAt: row.placed_at,
    items: (row.order_items ?? []).map((i) => ({
      productId: i.product_id,
      storeId: i.store_id,
      quantity: i.quantity,
      substitution: i.substitution as CartItem["substitution"],
    })),
    addressId: "",
    addressLine: row.address_line,
    addressZoneId: row.address_zone,
    ...(row.address_landmark ? { addressLandmark: row.address_landmark } : {}),
    slotId: row.slot_id,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    total: Number(row.total),
    deliveryFee: Number(row.delivery_fee),
    ...(row.final_total != null ? { finalTotal: Number(row.final_total) } : {}),
    pin: row.pin,
    hidePrices: row.hide_prices,
    proofUploaded: row.payment_status !== "awaiting",
    ...(row.recipient_name ? { recipientName: row.recipient_name } : {}),
    ...(row.recipient_phone ? { recipientPhone: row.recipient_phone } : {}),
    statusHistory: (row.order_status_history ?? [])
      .map((h) => ({
        id: h.id,
        status: h.status,
        note: h.note ?? null,
        createdAt: h.created_at,
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  };
}

/* ----------------------------- write helpers ----------------------------- */

export async function saveAddress(userId: string, a: Address) {
  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      label: a.label,
      zone_id: a.zoneId,
      line: a.line,
      landmark: a.landmark ?? null,
      notes: a.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function setFavourite(userId: string, productId: string, on: boolean) {
  if (on) {
    await supabase.from("favourite_products").insert({ user_id: userId, product_id: productId });
  } else {
    await supabase
      .from("favourite_products")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
  }
}

export async function saveList(userId: string, name: string, productIds: string[]) {
  const { data, error } = await supabase
    .from("saved_lists")
    .insert({ user_id: userId, name, product_ids: productIds })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function saveProfilePrefs(
  userId: string,
  prefs: { default_substitution?: string; age_verified?: boolean },
) {
  await supabase.from("profiles").upsert({ id: userId, ...prefs });
}

export type NewOrderInput = {
  code: string;
  pin: string;
  status: string;
  items: CartItem[];
  address: Address;
  slotId: string;
  paymentMethod: string;
  deliveryNotes?: string;
  handover?: string;
  recipientName?: string;
  recipientPhone?: string;
  hidePrices: boolean;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  savings: number;
  total: number;
};

/** Writes the order, its items, the payment record and the first status entry. */
export async function saveOrder(userId: string, input: NewOrderInput) {
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      code: input.code,
      user_id: userId,
      status: input.status,
      payment_method: input.paymentMethod,
      payment_status: input.paymentMethod === "cod" ? "on_delivery" : "awaiting",
      slot_id: input.slotId,
      address_line: input.address.line,
      address_zone: input.address.zoneId,
      address_landmark: input.address.landmark ?? null,
      delivery_notes: input.deliveryNotes ?? null,
      handover: input.handover ?? null,
      recipient_name: input.recipientName ?? null,
      recipient_phone: input.recipientPhone ?? null,
      hide_prices: input.hidePrices,
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      service_fee: input.serviceFee,
      savings: input.savings,
      total: input.total,
      pin: input.pin,
    })
    .select("id")
    .single();
  if (error) throw error;

  const items = input.items.flatMap((i) => {
    const p = productById(i.productId);
    if (!p) return [];
    return [
      {
        order_id: order.id,
        product_id: p.id,
        store_id: i.storeId,
        name: p.name,
        pack_size: p.packSize,
        unit_price: p.price,
        quantity: i.quantity,
        substitution: i.substitution,
        line_total: Number((p.price * i.quantity).toFixed(2)),
      },
    ];
  });
  if (items.length) await supabase.from("order_items").insert(items);

  await supabase.from("payments").insert({
    order_id: order.id,
    user_id: userId,
    method: input.paymentMethod,
    amount: input.total,
    status: input.paymentMethod === "cod" ? "on_delivery" : "awaiting",
  });

  await supabase
    .from("order_status_history")
    .insert({ order_id: order.id, status: input.status, note: "Order placed by customer" });

  return order.id;
}

/** Uploads a proof of payment file and records it against the order. */
export async function uploadPaymentProof(userId: string, orderDbId: string, file: File) {
  const path = `${userId}/${orderDbId}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file);
  if (uploadError) throw uploadError;

  await supabase.from("payment_proofs").insert({
    order_id: orderDbId,
    user_id: userId,
    file_path: path,
  });
  await supabase
    .from("orders")
    .update({ status: "Payment submitted", payment_status: "submitted" })
    .eq("id", orderDbId);
  await supabase
    .from("order_status_history")
    .insert({ order_id: orderDbId, status: "Payment submitted", note: "Proof of payment uploaded" });
}

export async function saveShoppingListRequest(
  userId: string,
  input: { body?: string; preference?: string; instructions?: string; imagePath?: string },
) {
  await supabase.from("shopping_list_requests").insert({
    user_id: userId,
    body: input.body ?? null,
    preference: input.preference ?? null,
    instructions: input.instructions ?? null,
    image_path: input.imagePath ?? null,
  });
}

/** Fetches a full order with its items and status history by order code or database UUID. */
export async function fetchOrderByCodeOrId(codeOrId: string): Promise<Order | null> {
  const clean = codeOrId.trim();
  if (!clean) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  const query = supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)");

  const { data, error } = await (isUuid ? query.eq("id", clean) : query.eq("code", clean)).maybeSingle();

  if (error || !data) return null;
  return rowToOrder(data as OrderRow);
}

/** Subscribes to real-time changes on an order and its status history entries. */
export function subscribeToOrder(
  orderDbId: string,
  callbacks: {
    onOrderUpdate?: (payload: Partial<Order>) => void;
    onHistoryInsert?: (entry: { id?: string; status: string; note: string | null; createdAt: string }) => void;
  },
) {
  if (!orderDbId) return () => {};

  const channel = supabase
    .channel(`order_live_${orderDbId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderDbId}`,
      },
      (payload) => {
        const row = payload.new as OrderRow;
        callbacks.onOrderUpdate?.({
          status: row.status,
          paymentStatus: row.payment_status,
          proofUploaded: row.payment_status !== "awaiting",
          finalTotal: row.final_total != null ? Number(row.final_total) : undefined,
        });
      },
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "order_status_history",
        filter: `order_id=eq.${orderDbId}`,
      },
      (payload) => {
        const row = payload.new as { id?: string; status: string; note?: string | null; created_at: string };
        callbacks.onHistoryInsert?.({
          id: row.id,
          status: row.status,
          note: row.note ?? null,
          createdAt: row.created_at,
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
