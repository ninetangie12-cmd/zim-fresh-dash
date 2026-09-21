import { supabase } from "@/integrations/supabase/client";

export interface InitiatePaynowInput {
  items: Array<{ productId: string; storeId?: string; quantity: number }>;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: {
    line: string;
    zoneId?: string;
    landmark?: string;
  };
  deliveryFee?: number;
  deliveryNotes?: string;
  paymentMethod: "ecocash" | "onemoney" | "card" | "web";
  userId?: string;
}

export interface InitiatePaynowResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  redirectUrl?: string;
  pollUrl?: string;
  paynowReference?: string;
  instructions?: string;
  total?: number;
  error?: string;
}

export interface PaynowPollResult {
  paid: boolean;
  status: "pending" | "paid" | "failed" | "cancelled";
  error?: string;
}

/**
 * Initiates Paynow payment by first trying Supabase Edge Function `initiate-paynow`.
 * If running locally without deployed edge functions, falls back gracefully to `/api/paynow/initiate`.
 */
export async function initiatePaynowPayment(input: InitiatePaynowInput): Promise<InitiatePaynowResult> {
  try {
    // 1. Try Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("initiate-paynow", {
      body: input,
    });

    if (!error && data?.success) {
      return data;
    }
  } catch (edgeErr) {
    console.warn("[Paynow] Edge function failed or unavailable, trying local fallback:", edgeErr);
  }

  // 2. Fallback to local dev middleware
  try {
    const res = await fetch("/api/paynow/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("[Paynow] Both edge function and local API failed:", err);
    return {
      success: false,
      error: err.message || "Failed to contact Paynow gateway.",
    };
  }
}

/**
 * Polls payment status given a pollUrl or order code.
 */
export async function pollPaynowStatus(pollUrlOrCode: string): Promise<PaynowPollResult> {
  try {
    const url = pollUrlOrCode.startsWith("http") || pollUrlOrCode.startsWith("/")
      ? pollUrlOrCode
      : `/api/paynow/poll?orderCode=${encodeURIComponent(pollUrlOrCode)}`;

    const res = await fetch(url);
    if (!res.ok) {
      return { paid: false, status: "pending" };
    }
    const data = await res.json();
    const isPaid = data.paid === true || data.status?.toLowerCase() === "paid";
    return {
      paid: isPaid,
      status: isPaid ? "paid" : data.status || "pending",
    };
  } catch (err: any) {
    console.warn("Poll error:", err);
    return { paid: false, status: "pending", error: err.message };
  }
}
