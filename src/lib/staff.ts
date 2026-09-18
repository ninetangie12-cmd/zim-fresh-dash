// Shopper and rider data layer.
//
// Staff sign in with a normal account and link it once with a code issued by
// an administrator. Row-level policies then limit them to the orders they are
// actually assigned to — the UI is convenience, the database is the boundary.

import { supabase } from "@/integrations/supabase/client";
import { toOrder, type AdminOrder, type OrderRow, type StaffMember } from "@/lib/admin";

export type StaffJob = AdminOrder;

export async function myStaffRecord(userId: string): Promise<StaffMember | null> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    role: data.role,
    vehicle: data.vehicle,
    active: data.active,
    linkCode: data.link_code,
    linked: true,
  };
}

export async function claimStaffCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_staff_code", { _code: code.trim() });
  if (error) throw error;
  return Boolean(data);
}

export async function setMyAvailability(staffId: string, active: boolean) {
  const { error } = await supabase.from("staff_members").update({ active }).eq("id", staffId);
  if (error) throw error;
}

export async function listMyJobs(staff?: {
  id: string;
  role: string;
}): Promise<StaffJob[]> {
  let q = supabase.from("orders").select("*, order_items(*)");
  if (staff) {
    q = staff.role === "rider" ? q.eq("rider_id", staff.id) : q.eq("shopper_id", staff.id);
  }
  const { data, error } = await q.order("placed_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => toOrder(r as OrderRow));
}

export async function getMyJob(code: string): Promise<StaffJob | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as OrderRow) : null;
}

async function history(orderId: string, status: string, note?: string) {
  await supabase
    .from("order_status_history")
    .insert({ order_id: orderId, status, note: note ?? null });
}

export async function advanceStatus(order: StaffJob, status: string, note?: string) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
  if (error) throw error;
  await history(order.id, status, note);
}

/* --------------------------------- picking -------------------------------- */

export type PickingUpdate = {
  status: "picked" | "removed" | "substituted" | "pending";
  pickedQuantity?: number | null;
  finalUnitPrice?: number | null;
  finalWeightKg?: number | null;
  note?: string | null;
};

export async function savePicking(order: StaffJob, itemId: string, update: PickingUpdate) {
  const { error } = await supabase
    .from("order_items")
    .update({
      status: update.status,
      picked_quantity: update.pickedQuantity ?? null,
      final_unit_price: update.finalUnitPrice ?? null,
      final_weight_kg: update.finalWeightKg ?? null,
      shopper_note: update.note ?? null,
    })
    .eq("id", itemId);
  if (error) throw error;
}

/** Recalculates the final total from whatever the shopper recorded so far. */
export async function recalculateTotal(order: StaffJob) {
  const fresh = await getMyJob(order.code);
  if (!fresh) return order.total;
  const products = fresh.items.reduce((sum, i) => {
    if (i.status === "removed") return sum;
    const unit = i.finalUnitPrice ?? i.unitPrice;
    const qty = i.pickedQuantity ?? i.quantity;
    const weighted = i.finalWeightKg != null ? unit * i.finalWeightKg : unit * qty;
    return sum + weighted;
  }, 0);
  const finalTotal = Number(
    (products + fresh.deliveryFee + fresh.serviceFee - fresh.savings).toFixed(2),
  );
  const needsApproval = finalTotal > fresh.total + 1;
  const { error } = await supabase
    .from("orders")
    .update({
      final_total: finalTotal,
      ...(needsApproval ? { status: "Price approval required" } : {}),
    })
    .eq("id", fresh.id);
  if (error) throw error;
  if (needsApproval)
    await history(
      fresh.id,
      "Price approval required",
      `Final price $${finalTotal.toFixed(2)} — waiting for the customer to approve`,
    );
  return finalTotal;
}

export async function markReadyForCollection(order: StaffJob) {
  await recalculateTotal(order);
  await advanceStatus(order, "Ready for collection", "Picking finished and packed.");
}

/* -------------------------------- delivery -------------------------------- */

export async function confirmPickup(order: StaffJob) {
  const { error } = await supabase
    .from("orders")
    .update({ status: "Collected", collected_at: new Date().toISOString() })
    .eq("id", order.id);
  if (error) throw error;
  await history(order.id, "Collected", "Rider collected the order from the store.");
}

export async function verifyPin(order: StaffJob, pin: string) {
  if (pin.trim() !== order.pin) return false;
  const { error } = await supabase
    .from("orders")
    .update({ pin_verified: true })
    .eq("id", order.id);
  if (error) throw error;
  return true;
}

export async function uploadDeliveryProof(order: StaffJob, file: File) {
  const path = `${order.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("delivery-proofs").upload(path, file);
  if (error) throw error;
  await supabase.from("orders").update({ delivery_proof_path: path }).eq("id", order.id);
  return path;
}

export async function completeDelivery(
  order: StaffJob,
  input: { idChecked?: boolean | null; note?: string },
) {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "Delivered",
      delivered_at: new Date().toISOString(),
      id_checked: input.idChecked ?? null,
    })
    .eq("id", order.id);
  if (error) throw error;
  await history(order.id, "Delivered", input.note ?? "Handed over to the customer.");
}

export async function reportFailedDelivery(order: StaffJob, reason: string) {
  const { error } = await supabase
    .from("orders")
    .update({ delivery_failed_reason: reason })
    .eq("id", order.id);
  if (error) throw error;
  await history(order.id, order.status, `Delivery attempt failed: ${reason}`);
}

export async function deliveryProofUrl(path: string | null) {
  if (!path) return null;
  const signed = await supabase.storage.from("delivery-proofs").createSignedUrl(path, 600);
  return signed.data?.signedUrl ?? null;
}
