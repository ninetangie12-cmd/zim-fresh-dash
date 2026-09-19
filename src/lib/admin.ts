// Administrator data layer.
//
// Everything here runs through the signed-in administrator's own session, so
// the database row-level policies (is_admin) are the real security boundary —
// a customer session simply cannot read or change these rows.

import { supabase } from "@/integrations/supabase/client";
import { productById } from "@/data/catalog";

export type AdminOrderItem = {
  id: string;
  productId: string;
  storeId: string;
  name: string;
  packSize: string | null;
  unitPrice: number;
  finalUnitPrice: number | null;
  quantity: number;
  substitution: string;
  status: string;
  lineTotal: number;
  pickedQuantity: number | null;
  finalWeightKg: number | null;
  shopperNote: string | null;
};

export type AdminOrder = {
  id: string;
  code: string;
  userId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  slotId: string;
  addressLine: string;
  addressZone: string;
  addressLandmark: string | null;
  deliveryNotes: string | null;
  handover: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  hidePrices: boolean;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  savings: number;
  total: number;
  finalTotal: number | null;
  pin: string;
  placedAt: string;
  shopperId: string | null;
  riderId: string | null;
  adminNote: string | null;
  collectedAt: string | null;
  deliveredAt: string | null;
  deliveryProofPath: string | null;
  deliveryFailedReason: string | null;
  idChecked: boolean | null;
  pinVerified: boolean;
  items: AdminOrderItem[];
};

export type StaffMember = {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  vehicle: string | null;
  active: boolean;
  linkCode: string | null;
  linked: boolean;
};

export const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "staff-farai-01",
    name: "Farai Moyo",
    phone: "+263 77 123 4567",
    role: "shopper",
    vehicle: null,
    active: true,
    linkCode: "TN-SHOP-1001",
    linked: true,
  },
  {
    id: "staff-tinashe-02",
    name: "Tinashe Chitepo",
    phone: "+263 71 987 6543",
    role: "rider",
    vehicle: "Honda Ace 125 (Motorcycle)",
    active: true,
    linkCode: "TN-RIDE-2002",
    linked: true,
  },
  {
    id: "staff-chipo-03",
    name: "Chipo Nyathi",
    phone: "+263 78 555 4321",
    role: "shopper",
    vehicle: null,
    active: true,
    linkCode: "TN-SHOP-3003",
    linked: true,
  },
  {
    id: "staff-kudzai-04",
    name: "Kudzai Marufu",
    phone: "+263 77 888 9999",
    role: "rider",
    vehicle: "Toyota Vitz (Car)",
    active: true,
    linkCode: "TN-RIDE-4004",
    linked: true,
  },
];

const n = (v: unknown) => Number(v ?? 0);

export type OrderRow = Record<string, unknown> & { order_items?: Record<string, unknown>[] | null };

export function toOrder(row: OrderRow): AdminOrder {
  return {
    id: String(row["id"]),
    code: String(row["code"]),
    userId: String(row["user_id"]),
    status: String(row["status"]),
    paymentMethod: String(row["payment_method"]),
    paymentStatus: String(row["payment_status"]),
    slotId: String(row["slot_id"]),
    addressLine: String(row["address_line"]),
    addressZone: String(row["address_zone"]),
    addressLandmark: (row["address_landmark"] as string | null) ?? null,
    deliveryNotes: (row["delivery_notes"] as string | null) ?? null,
    handover: (row["handover"] as string | null) ?? null,
    recipientName: (row["recipient_name"] as string | null) ?? null,
    recipientPhone: (row["recipient_phone"] as string | null) ?? null,
    hidePrices: Boolean(row["hide_prices"]),
    subtotal: n(row["subtotal"]),
    deliveryFee: n(row["delivery_fee"]),
    serviceFee: n(row["service_fee"]),
    savings: n(row["savings"]),
    total: n(row["total"]),
    finalTotal: row["final_total"] == null ? null : n(row["final_total"]),
    pin: String(row["pin"]),
    placedAt: String(row["placed_at"]),
    shopperId: (row["shopper_id"] as string | null) ?? null,
    riderId: (row["rider_id"] as string | null) ?? null,
    adminNote: (row["admin_note"] as string | null) ?? null,
    collectedAt: (row["collected_at"] as string | null) ?? null,
    deliveredAt: (row["delivered_at"] as string | null) ?? null,
    deliveryProofPath: (row["delivery_proof_path"] as string | null) ?? null,
    deliveryFailedReason: (row["delivery_failed_reason"] as string | null) ?? null,
    idChecked: (row["id_checked"] as boolean | null) ?? null,
    pinVerified: Boolean(row["pin_verified"]),
    items: (row.order_items ?? []).map((i) => ({
      id: String(i["id"]),
      productId: String(i["product_id"]),
      storeId: String(i["store_id"]),
      name: String(i["name"]),
      packSize: (i["pack_size"] as string | null) ?? null,
      unitPrice: n(i["unit_price"]),
      finalUnitPrice: i["final_unit_price"] == null ? null : n(i["final_unit_price"]),
      quantity: Number(i["quantity"] ?? 1),
      substitution: String(i["substitution"]),
      status: String(i["status"]),
      lineTotal: n(i["line_total"]),
      pickedQuantity: i["picked_quantity"] == null ? null : Number(i["picked_quantity"]),
      finalWeightKg: i["final_weight_kg"] == null ? null : n(i["final_weight_kg"]),
      shopperNote: (i["shopper_note"] as string | null) ?? null,
    })),
  };
}

export function localOrderToAdminOrder(o: any): AdminOrder {
  return {
    id: o.dbId || o.id,
    code: o.id,
    userId: o.userId || "local-user",
    status: o.status || "Order received",
    paymentMethod: o.paymentMethod || "ecocash",
    paymentStatus: o.paymentStatus || (o.paymentMethod === "cod" ? "cod" : o.proofUploaded ? "submitted" : "awaiting"),
    slotId: o.slotId || "asap",
    addressLine: o.addressLine || "Harare",
    addressZone: o.addressZone || "harare-central",
    addressLandmark: o.addressLandmark || null,
    deliveryNotes: o.deliveryNotes || null,
    handover: o.handover || null,
    recipientName: o.recipientName || null,
    recipientPhone: o.recipientPhone || null,
    hidePrices: Boolean(o.hidePrices),
    subtotal: Number(o.total || 0),
    deliveryFee: Number(o.deliveryFee || 0),
    serviceFee: 1.5,
    savings: 0,
    total: Number(o.total || 0),
    finalTotal: o.finalTotal != null ? Number(o.finalTotal) : null,
    pin: o.pin || "0000",
    placedAt: o.placedAt || new Date().toISOString(),
    shopperId: o.shopperId || null,
    riderId: o.riderId || null,
    adminNote: o.adminNote || null,
    collectedAt: o.collectedAt || null,
    deliveredAt: o.deliveredAt || null,
    deliveryProofPath: o.deliveryProofPath || null,
    deliveryFailedReason: null,
    idChecked: null,
    pinVerified: Boolean(o.pinVerified),
    items: (o.items || []).map((i: any, idx: number) => {
      const p = productById(i.productId);
      return {
        id: i.id || `item-${idx}`,
        productId: i.productId,
        storeId: i.storeId || "tm-pnp",
        name: p?.name || i.productId,
        packSize: p?.packSize || null,
        unitPrice: p?.priceUsd || 0,
        finalUnitPrice: i.finalUnitPrice != null ? Number(i.finalUnitPrice) : null,
        quantity: Number(i.quantity || 1),
        substitution: i.substitution || "closest",
        status: i.status || "pending",
        lineTotal: (p?.priceUsd || 0) * (i.quantity || 1),
        pickedQuantity: i.pickedQuantity != null ? Number(i.pickedQuantity) : null,
        finalWeightKg: i.finalWeightKg != null ? Number(i.finalWeightKg) : null,
        shopperNote: i.shopperNote || null,
      };
    }),
  };
}

export function syncOrderToLocalStorage(orderCode: string, patch: Partial<AdminOrder>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("tenganow.state.v1");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed?.orders || !Array.isArray(parsed.orders)) return;

    let updated = false;
    parsed.orders = parsed.orders.map((o: any) => {
      if (
        o.id === orderCode ||
        o.dbId === orderCode ||
        (patch.id && (o.id === patch.id || o.dbId === patch.id))
      ) {
        updated = true;
        const mapped: any = { ...o };
        if (patch.status) mapped.status = patch.status;
        if (patch.paymentStatus) mapped.paymentStatus = patch.paymentStatus;
        if (patch.finalTotal != null) mapped.finalTotal = patch.finalTotal;
        if (patch.pinVerified != null) mapped.pinVerified = patch.pinVerified;
        if (patch.shopperId !== undefined) mapped.shopperId = patch.shopperId;
        if (patch.riderId !== undefined) mapped.riderId = patch.riderId;
        if (patch.adminNote !== undefined) mapped.adminNote = patch.adminNote;
        if (patch.deliveredAt !== undefined) mapped.deliveredAt = patch.deliveredAt;
        if (patch.collectedAt !== undefined) mapped.collectedAt = patch.collectedAt;
        if (patch.status) {
          mapped.statusHistory = [
            ...(mapped.statusHistory || []),
            { status: patch.status, timestamp: new Date().toISOString() },
          ];
        }
        return mapped;
      }
      return o;
    });

    if (updated) {
      localStorage.setItem("tenganow.state.v1", JSON.stringify(parsed));
      window.dispatchEvent(
        new CustomEvent("tenganow:order_updated", { detail: { code: orderCode, ...patch } })
      );
    }
  } catch (e) {
    console.warn("Could not sync order to localStorage:", e);
  }
}

export function subscribeToAdminOrders(onChange: () => void) {
  const channel = supabase
    .channel("admin-orders-stream")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_items" },
      () => onChange()
    )
    .subscribe();

  const handleLocal = () => onChange();
  if (typeof window !== "undefined") {
    window.addEventListener("tenganow:order_updated", handleLocal);
    window.addEventListener("storage", handleLocal);
  }

  return () => {
    supabase.removeChannel(channel);
    if (typeof window !== "undefined") {
      window.removeEventListener("tenganow:order_updated", handleLocal);
      window.removeEventListener("storage", handleLocal);
    }
  };
}

export async function isAdmin(userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) return false;
  return Boolean(data);
}

export async function listOrders(): Promise<AdminOrder[]> {
  let cloudOrders: AdminOrder[] = [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("placed_at", { ascending: false })
      .limit(200);
    if (!error && data) {
      cloudOrders = data.map((r) => toOrder(r as OrderRow));
    }
  } catch (e) {
    console.warn("Supabase listOrders warning:", e);
  }

  let localOrders: AdminOrder[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("tenganow.state.v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.orders && Array.isArray(parsed.orders)) {
          localOrders = parsed.orders.map(localOrderToAdminOrder);
        }
      }
    } catch {
      // ignore
    }
  }

  const map = new Map<string, AdminOrder>();
  for (const o of localOrders) {
    map.set(o.code, o);
  }
  for (const o of cloudOrders) {
    map.set(o.code, o);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
}

export async function getOrder(code: string): Promise<AdminOrder | null> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("code", code)
      .maybeSingle();
    if (!error && data) return toOrder(data as OrderRow);
  } catch {
    // continue to local
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("tenganow.state.v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        const match = parsed?.orders?.find((o: any) => o.id === code || o.dbId === code);
        if (match) return localOrderToAdminOrder(match);
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function listStaff(): Promise<StaffMember[]> {
  try {
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        role: s.role,
        vehicle: s.vehicle,
        active: s.active,
        linkCode: s.link_code,
        linked: Boolean(s.user_id),
      }));
    }
  } catch (e) {
    console.warn("Could not fetch staff from Supabase:", e);
  }
  return DEFAULT_STAFF;
}

export function makeLinkCode(role: "shopper" | "rider") {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `TN-${role === "rider" ? "RIDE" : "SHOP"}-${suffix}`;
}

export async function addStaff(input: {
  name: string;
  phone: string;
  role: "shopper" | "rider";
  vehicle?: string;
}) {
  const { error } = await supabase.from("staff_members").insert({
    name: input.name,
    phone: input.phone || null,
    role: input.role,
    vehicle: input.vehicle || null,
    link_code: makeLinkCode(input.role),
  });
  if (error) throw error;
}

export async function regenerateLinkCode(id: string, role: string) {
  const code = makeLinkCode(role === "rider" ? "rider" : "shopper");
  const { error } = await supabase
    .from("staff_members")
    .update({ link_code: code, user_id: null })
    .eq("id", id);
  if (error) throw error;
  return code;
}

export async function setStaffActive(id: string, active: boolean) {
  const { error } = await supabase.from("staff_members").update({ active }).eq("id", id);
  if (error) throw error;
}

/* ------------------------------- audit trail ------------------------------ */

export async function logAction(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  detail?: Record<string, unknown>,
) {
  await supabase
    .from("audit_logs")
    .insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      detail: (detail ?? null) as never,
    });
}

export type AuditEntry = {
  id: string;
  action: string;
  entityId: string | null;
  detail: unknown;
  createdAt: string;
};

export async function listAudit(entityId?: string): Promise<AuditEntry[]> {
  let q = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (entityId) q = q.eq("entity_id", entityId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    entityId: a.entity_id,
    detail: a.detail,
    createdAt: a.created_at,
  }));
}

/* -------------------------------- mutations ------------------------------- */

async function addHistory(orderId: string, status: string, note?: string) {
  await supabase
    .from("order_status_history")
    .insert({ order_id: orderId, status, note: note ?? null });
}

export async function setOrderStatus(
  actorId: string,
  order: AdminOrder,
  status: string,
  note?: string,
) {
  try {
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (!error) {
      await addHistory(order.id, status, note);
      await logAction(actorId, "status_change", "order", order.id, { code: order.code, status });
    }
  } catch (err) {
    console.warn("Supabase setOrderStatus warning:", err);
  }
  syncOrderToLocalStorage(order.code, { status });
}

/** Records the shelf prices the shopper found and recalculates the final total. */
export async function confirmPrices(
  actorId: string,
  order: AdminOrder,
  finals: Record<string, number | null>,
) {
  for (const item of order.items) {
    const price = finals[item.id];
    if (price === undefined) continue;
    const removed = price === null;
    try {
      await supabase
        .from("order_items")
        .update({
          final_unit_price: removed ? null : price,
          status: removed ? "removed" : "confirmed",
        })
        .eq("id", item.id);
    } catch {
      // ignore
    }
  }

  const productsTotal = order.items.reduce((sum, item) => {
    const price = finals[item.id];
    if (price === null) return sum;
    const unit = price ?? item.finalUnitPrice ?? item.unitPrice;
    return sum + unit * item.quantity;
  }, 0);
  const finalTotal = Number(
    (productsTotal + order.deliveryFee + order.serviceFee - order.savings).toFixed(2),
  );

  const meaningfulIncrease = finalTotal > order.total + 1;
  const status = meaningfulIncrease ? "Price approval required" : order.status;

  try {
    await supabase
      .from("orders")
      .update({ final_total: finalTotal, status })
      .eq("id", order.id);

    await addHistory(
      order.id,
      status,
      meaningfulIncrease
        ? `Final price $${finalTotal.toFixed(2)} — customer approval requested`
        : `Prices confirmed at $${finalTotal.toFixed(2)}`,
    );
    await logAction(actorId, "confirm_prices", "order", order.id, {
      code: order.code,
      finalTotal,
      estimate: order.total,
    });
  } catch (err) {
    console.warn("Supabase confirmPrices warning:", err);
  }

  syncOrderToLocalStorage(order.code, { status, finalTotal });
  return { finalTotal, meaningfulIncrease };
}

export async function decidePayment(
  actorId: string,
  order: AdminOrder,
  approve: boolean,
  reason?: string,
) {
  const paymentStatus = approve ? "approved" : "rejected";
  const status = approve ? "Payment approved" : "Awaiting payment";

  try {
    await supabase
      .from("payments")
      .update({
        status: paymentStatus,
        approved_by: actorId || null,
        approved_at: new Date().toISOString(),
      })
      .eq("order_id", order.id);

    await supabase
      .from("orders")
      .update({ payment_status: paymentStatus, status })
      .eq("id", order.id);

    await addHistory(order.id, status, reason);
    await logAction(actorId, approve ? "payment_approved" : "payment_rejected", "order", order.id, {
      code: order.code,
      amount: order.finalTotal ?? order.total,
      reason: reason ?? null,
    });

    // Commit stock reservations permanently and deduct from stock_quantity on payment approval
    if (approve) {
      try {
        const items = order.items?.map((it: any) => ({
          product_id: it.productId || it.product_id || it.id,
          quantity: it.quantity,
        }));
        await fetch("/api/cart/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: order.code,
            items,
          }),
        });
      } catch (commitErr) {
        console.warn("Failed to commit stock reservation upon payment approval:", commitErr);
      }
    }
  } catch (err) {
    console.warn("Supabase decidePayment warning:", err);
  }

  syncOrderToLocalStorage(order.code, { status, paymentStatus });
}

export async function assignStaff(
  actorId: string,
  order: AdminOrder,
  field: "shopper" | "rider",
  staffId: string | null,
) {
  const patch =
    field === "shopper" ? { shopper_id: staffId } : { rider_id: staffId };
  try {
    const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
    if (!error && staffId && field === "rider" && order.status !== "Rider assigned") {
      await supabase.from("orders").update({ status: "Rider assigned" }).eq("id", order.id);
      await addHistory(order.id, "Rider assigned");
    }
    await logAction(actorId, `assign_${field}`, "order", order.id, {
      code: order.code,
      staffId,
    });
  } catch (err) {
    console.warn("Supabase assignStaff warning:", err);
  }

  const localPatch: Partial<AdminOrder> = field === "shopper" ? { shopperId: staffId } : { riderId: staffId };
  if (staffId && field === "rider" && order.status !== "Rider assigned") {
    localPatch.status = "Rider assigned";
  } else if (staffId && field === "shopper" && (order.status === "Payment approved" || order.status === "Order received")) {
    localPatch.status = "Shopper assigned";
  }
  syncOrderToLocalStorage(order.code, localPatch);
}

export async function saveAdminNote(actorId: string, order: AdminOrder, note: string) {
  try {
    await supabase
      .from("orders")
      .update({ admin_note: note || null })
      .eq("id", order.id);
    await logAction(actorId, "note", "order", order.id, { code: order.code });
  } catch (err) {
    console.warn("Supabase saveAdminNote warning:", err);
  }
  syncOrderToLocalStorage(order.code, { adminNote: note || null });
}

export async function proofUrl(orderId: string) {
  const { data } = await supabase
    .from("payment_proofs")
    .select("file_path, reference, note, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.file_path) return null;
  const signed = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(data.file_path, 60 * 10);
  return signed.data?.signedUrl ?? null;
}

/* --------------------------------- reports -------------------------------- */

export type AdminStats = {
  ordersToday: number;
  grossToday: number;
  grossAll: number;
  pendingPayments: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageBasket: number;
  substitutionRate: number;
  returningCustomers: number;
  byStatus: { status: string; count: number }[];
  topStores: { storeId: string; count: number }[];
  topProducts: { name: string; quantity: number }[];
};

export function buildStats(orders: AdminOrder[]): AdminStats {
  const today = new Date().toISOString().slice(0, 10);
  const todays = orders.filter((o) => o.placedAt.slice(0, 10) === today);
  const value = (o: AdminOrder) => o.finalTotal ?? o.total;

  const byStatus = new Map<string, number>();
  const byStore = new Map<string, number>();
  const byProduct = new Map<string, number>();
  const byCustomer = new Map<string, number>();
  let itemCount = 0;
  let substituted = 0;

  for (const o of orders) {
    byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
    byCustomer.set(o.userId, (byCustomer.get(o.userId) ?? 0) + 1);
    for (const i of o.items) {
      byStore.set(i.storeId, (byStore.get(i.storeId) ?? 0) + 1);
      byProduct.set(i.name, (byProduct.get(i.name) ?? 0) + i.quantity);
      itemCount += 1;
      if (i.status === "substituted" || i.status === "removed") substituted += 1;
    }
  }

  const completed = orders.filter((o) => o.status === "Delivered").length;
  const cancelled = orders.filter((o) => o.status === "Cancelled").length;

  return {
    ordersToday: todays.length,
    grossToday: todays.reduce((s, o) => s + value(o), 0),
    grossAll: orders.reduce((s, o) => s + value(o), 0),
    pendingPayments: orders.filter(
      (o) => o.paymentStatus === "submitted" || o.paymentStatus === "awaiting",
    ).length,
    activeOrders: orders.filter(
      (o) => o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "Refunded",
    ).length,
    completedOrders: completed,
    cancelledOrders: cancelled,
    averageBasket: orders.length ? orders.reduce((s, o) => s + value(o), 0) / orders.length : 0,
    substitutionRate: itemCount ? (substituted / itemCount) * 100 : 0,
    returningCustomers: [...byCustomer.values()].filter((c) => c > 1).length,
    byStatus: [...byStatus.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    topStores: [...byStore.entries()]
      .map(([storeId, count]) => ({ storeId, count }))
      .sort((a, b) => b.count - a.count),
    topProducts: [...byProduct.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8),
  };
}
