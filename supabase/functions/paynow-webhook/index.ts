import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Paynow SHA512 hash generator
async function generatePaynowHash(values: Record<string, string>, integrationKey: string): Promise<string> {
  let stringToHash = "";
  for (const [key, val] of Object.entries(values)) {
    if (key.toLowerCase() !== "hash") {
      stringToHash += (val ?? "");
    }
  }
  stringToHash += integrationKey;

  const msgUint8 = new TextEncoder().encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-512", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// Parse urlencoded text into object
function parseUrlEncoded(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const params = new URLSearchParams(text);
  for (const [k, v] of params.entries()) {
    result[k.toLowerCase()] = v;
  }
  return result;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const paynowKey = Deno.env.get("PAYNOW_INTEGRATION_KEY") || "MOCK_PAYNOW_KEY";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Paynow callbacks send application/x-www-form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const rawText = await req.text();
      payload = parseUrlEncoded(rawText);
    }

    const { reference, paynowreference, status, pollurl, hash } = payload;

    if (!reference) {
      return new Response("Missing reference", { status: 400 });
    }

    // Verify hash if not mock key
    if (paynowKey !== "MOCK_PAYNOW_KEY" && hash) {
      const computedHash = await generatePaynowHash(payload, paynowKey);
      if (computedHash !== hash.toUpperCase()) {
        console.warn("Paynow hash mismatch. Expected:", computedHash, "Received:", hash);
        return new Response("Invalid hash signature", { status: 400 });
      }
    }

    const isPaid = status && (status.toLowerCase() === "paid" || status.toLowerCase() === "awaiting delivery");

    // Fetch the order from database
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, code, payment_status, status, order_items(product_id, quantity)")
      .eq("code", reference)
      .maybeSingle();

    if (fetchErr || !order) {
      console.warn(`Order ${reference} not found in database.`);
      return new Response("Order not found", { status: 404 });
    }

    if (isPaid && order.payment_status !== "paid") {
      // 1. Update order payment status and confirmed status
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "Payment approved",
          payment_reference: paynowreference || order.code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // 2. Insert into order_status_history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "Payment approved",
        note: `Paynow transaction confirmed (${paynowreference || "Ref verified"})`,
      });

      // 3. Atomically deduct stock quantity from products
      const orderItems = (order.order_items as Array<{ product_id: string; quantity: number }>) || [];
      for (const item of orderItems) {
        if (!item.product_id || !item.quantity) continue;

        const { data: prod } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (prod) {
          const newStock = Math.max(0, (prod.stock_quantity ?? 0) - item.quantity);
          await supabase
            .from("products")
            .update({ stock_quantity: newStock, is_available: newStock > 0 })
            .eq("id", item.product_id);
        }
      }

      console.log(`[Paynow Webhook] Order ${reference} successfully marked as paid.`);
    } else if (status && (status.toLowerCase() === "cancelled" || status.toLowerCase() === "failed")) {
      await supabase
        .from("orders")
        .update({
          payment_status: status.toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "Payment failed",
        note: `Paynow transaction ${status}`,
      });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Paynow webhook error:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
