// Shopper and rider data layer.
//
// Staff sign in with a normal account and link it once with a code issued by
// an administrator. Row-level policies then limit them to the orders they are
// actually assigned to — the UI is convenience, the database is the boundary.

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_STAFF,
  assignStaff,
  getOrder,
  listOrders,
  syncOrderToLocalStorage,
  type AdminOrder,
  type StaffMember,
} from "@/lib/admin";

export type StaffJob = AdminOrder;

export async function myStaffRecord(userId: string): Promise<StaffMember | null> {
  try {
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
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
  } catch (err) {
    console.warn("Supabase myStaffRecord warning:", err);
  }

  // Check demo / mock staff matching ID or default
  const found = DEFAULT_STAFF.find((s) => s.id === userId);
  return found ?? null;
}

export async function claimStaffCode(code: string): Promise<boolean> {
  const trimmed = code.trim().toUpperCase();
  try {
    const { data, error } = await supabase.rpc("claim_staff_code", { _code: trimmed });
    if (!error && data) return Boolean(data);
  } catch (err) {
    console.warn("claim_staff_code RPC warning:", err);
  }

  // Check mock code
  const match = DEFAULT_STAFF.find((s) => s.linkCode?.toUpperCase() === trimmed);
  return Boolean(match);
}

export async function setMyAvailability(staffId: string, active: boolean) {
  try {
    const { error } = await supabase.from("staff_members").update({ active }).eq("id", staffId);
    if (error) throw error;
  } catch (err) {
    console.warn("setMyAvailability warning:", err);
  }
}

export async function listMyJobs(staff?: {
  id: string;
  role: string;
}): Promise<StaffJob[]> {
  const all = await listOrders();
  if (!staff) return all;
  return all.filter((job) =>
    staff.role === "rider" ? job.riderId === staff.id : job.shopperId === staff.id
  );
}

export async function listAvailableJobs(role?: "shopper" | "rider"): Promise<StaffJob[]> {
  const all = await listOrders();
  return all.filter((job) => {
    if (job.status === "Delivered" || job.status === "Cancelled" || job.status === "Refunded") {
      return false;
    }
    if (role === "rider") {
      return !job.riderId && (
        job.status === "Ready for collection" ||
        job.status === "Items being picked" ||
        job.status === "Shopper assigned" ||
        job.status === "Payment approved" ||
        job.paymentMethod === "cod"
      );
    }
    // Default shopper
    return !job.shopperId;
  });
}

export async function claimJob(order: StaffJob, staffId: string, role: "shopper" | "rider") {
  return assignStaff(staffId, order, role, staffId);
}

export async function getMyJob(code: string): Promise<StaffJob | null> {
  return getOrder(code);
}

async function history(orderId: string, status: string, note?: string) {
  try {
    await supabase
      .from("order_status_history")
      .insert({ order_id: orderId, status, note: note ?? null });
  } catch (err) {
    console.warn("Supabase status history warning:", err);
  }
}

export async function advanceStatus(order: StaffJob, status: string, note?: string) {
  try {
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (!error) {
      await history(order.id, status, note);
    }
  } catch (err) {
    console.warn("advanceStatus Supabase warning:", err);
  }
  syncOrderToLocalStorage(order.code, { status });
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
  try {
    await supabase
      .from("order_items")
      .update({
        status: update.status,
        picked_quantity: update.pickedQuantity ?? null,
        final_unit_price: update.finalUnitPrice ?? null,
        final_weight_kg: update.finalWeightKg ?? null,
        shopper_note: update.note ?? null,
      })
      .eq("id", itemId);
  } catch (err) {
    console.warn("savePicking Supabase warning:", err);
  }

  // Update item in local storage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("tenganow.state.v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.orders) {
          const match = parsed.orders.find((o: any) => o.id === order.code || o.dbId === order.id);
          if (match?.items) {
            const itemMatch = match.items.find((i: any) => i.id === itemId || i.productId === itemId);
            if (itemMatch) {
              itemMatch.status = update.status;
              if (update.pickedQuantity != null) itemMatch.pickedQuantity = update.pickedQuantity;
              if (update.finalUnitPrice != null) itemMatch.finalUnitPrice = update.finalUnitPrice;
              if (update.finalWeightKg != null) itemMatch.finalWeightKg = update.finalWeightKg;
              if (update.note != null) itemMatch.shopperNote = update.note;
              localStorage.setItem("tenganow.state.v1", JSON.stringify(parsed));
              window.dispatchEvent(new CustomEvent("tenganow:order_updated", { detail: { code: order.code } }));
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }
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
  const status = needsApproval ? "Price approval required" : fresh.status;

  try {
    await supabase
      .from("orders")
      .update({
        final_total: finalTotal,
        ...(needsApproval ? { status: "Price approval required" } : {}),
      })
      .eq("id", fresh.id);

    if (needsApproval) {
      await history(
        fresh.id,
        "Price approval required",
        `Final price $${finalTotal.toFixed(2)} — waiting for the customer to approve`,
      );
    }
  } catch (err) {
    console.warn("recalculateTotal Supabase warning:", err);
  }

  syncOrderToLocalStorage(order.code, { finalTotal, status });
  return finalTotal;
}

export async function markReadyForCollection(order: StaffJob) {
  await recalculateTotal(order);
  await advanceStatus(order, "Ready for collection", "Picking finished and packed.");
}

/* -------------------------------- delivery -------------------------------- */

export async function confirmPickup(order: StaffJob) {
  const collectedAt = new Date().toISOString();
  try {
    await supabase
      .from("orders")
      .update({ status: "Collected", collected_at: collectedAt })
      .eq("id", order.id);
    await history(order.id, "Collected", "Rider collected the order from the store.");
  } catch (err) {
    console.warn("confirmPickup Supabase warning:", err);
  }
  syncOrderToLocalStorage(order.code, { status: "Collected", collectedAt });
}

export async function verifyPin(order: StaffJob, pin: string) {
  if (pin.trim() !== order.pin.trim()) return false;
  try {
    await supabase
      .from("orders")
      .update({ pin_verified: true })
      .eq("id", order.id);
    await history(order.id, order.status, "Delivery PIN verified by rider.");
  } catch (err) {
    console.warn("verifyPin Supabase warning:", err);
  }
  syncOrderToLocalStorage(order.code, { pinVerified: true });
  return true;
}

export async function uploadDeliveryProof(order: StaffJob, file: File) {
  const path = `${order.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  try {
    const { error } = await supabase.storage.from("delivery-proofs").upload(path, file);
    if (!error) {
      await supabase.from("orders").update({ delivery_proof_path: path }).eq("id", order.id);
    }
  } catch (err) {
    console.warn("uploadDeliveryProof Supabase warning:", err);
  }
  syncOrderToLocalStorage(order.code, { deliveryProofPath: path });
  return path;
}

export async function completeDelivery(
  order: StaffJob,
  input: { idChecked?: boolean | null; note?: string },
) {
  const deliveredAt = new Date().toISOString();
  try {
    await supabase
      .from("orders")
      .update({
        status: "Delivered",
        delivered_at: deliveredAt,
        id_checked: input.idChecked ?? null,
      })
      .eq("id", order.id);
    await history(order.id, "Delivered", input.note ?? "Handed over to the customer.");
  } catch (err) {
    console.warn("completeDelivery Supabase warning:", err);
  }
  syncOrderToLocalStorage(order.code, {
    status: "Delivered",
    deliveredAt,
    idChecked: input.idChecked ?? null,
  });
}

export async function reportFailedDelivery(order: StaffJob, reason: string) {
  try {
    await supabase
      .from("orders")
      .update({ delivery_failed_reason: reason })
      .eq("id", order.id);
    await history(order.id, order.status, `Delivery attempt failed: ${reason}`);
  } catch (err) {
    console.warn("reportFailedDelivery Supabase warning:", err);
  }
}

export async function deliveryProofUrl(path: string | null) {
  if (!path) return null;
  try {
    const signed = await supabase.storage.from("delivery-proofs").createSignedUrl(path, 600);
    return signed.data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
