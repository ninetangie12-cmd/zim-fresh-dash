// Administrator data layer.
//
// Everything here runs through the signed-in administrator's own session, so
// the database row-level policies (is_admin) are the real security boundary —
// a customer session simply cannot read or change these rows.

import { supabase } from "@/integrations/supabase/client";

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

export async function isAdmin(userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) return false;
  return Boolean(data);
}

export async function listOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("placed_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => toOrder(r as OrderRow));
}

export async function getOrder(code: string): Promise<AdminOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as OrderRow) : null;
}

export async function listStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((s) => ({
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
  const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
  if (error) throw error;
  await addHistory(order.id, status, note);
  await logAction(actorId, "status_change", "order", order.id, { code: order.code, status });
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
    const { error } = await supabase
      .from("order_items")
      .update({
        final_unit_price: removed ? null : price,
        status: removed ? "removed" : "confirmed",
      })
      .eq("id", item.id);
    if (error) throw error;
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

  const { error } = await supabase
    .from("orders")
    .update({ final_total: finalTotal, status })
    .eq("id", order.id);
  if (error) throw error;

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

  const { error: payErr } = await supabase
    .from("payments")
    .update({
      status: paymentStatus,
      approved_by: actorId,
      approved_at: new Date().toISOString(),
    })
    .eq("order_id", order.id);
  if (payErr) throw payErr;

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus, status })
    .eq("id", order.id);
  if (error) throw error;

  await addHistory(order.id, status, reason);
  await logAction(actorId, approve ? "payment_approved" : "payment_rejected", "order", order.id, {
    code: order.code,
    amount: order.finalTotal ?? order.total,
    reason: reason ?? null,
  });
}

export async function assignStaff(
  actorId: string,
  order: AdminOrder,
  field: "shopper" | "rider",
  staffId: string | null,
) {
  const patch =
    field === "shopper" ? { shopper_id: staffId } : { rider_id: staffId };
  const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
  if (error) throw error;

  if (staffId && field === "rider" && order.status !== "Rider assigned") {
    await supabase.from("orders").update({ status: "Rider assigned" }).eq("id", order.id);
    await addHistory(order.id, "Rider assigned");
  }
  await logAction(actorId, `assign_${field}`, "order", order.id, {
    code: order.code,
    staffId,
  });
}

export async function saveAdminNote(actorId: string, order: AdminOrder, note: string) {
  const { error } = await supabase
    .from("orders")
    .update({ admin_note: note || null })
    .eq("id", order.id);
  if (error) throw error;
  await logAction(actorId, "note", "order", order.id, { code: order.code });
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
