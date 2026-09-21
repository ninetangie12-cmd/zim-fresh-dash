import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItemInput {
  productId: string;
  storeId?: string;
  quantity: number;
}

interface InitiatePaynowRequest {
  items: CartItemInput[];
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

// Parse urlencoded response from Paynow
function parsePaynowResponse(text: string): Record<string, string> {
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
    const paynowId = Deno.env.get("PAYNOW_INTEGRATION_ID") || "MOCK_PAYNOW_ID";
    const paynowKey = Deno.env.get("PAYNOW_INTEGRATION_KEY") || "MOCK_PAYNOW_KEY";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: InitiatePaynowRequest = await req.json();
    const {
      items,
      customerEmail,
      customerPhone = "",
      deliveryAddress,
      deliveryFee = 3.5,
      deliveryNotes,
      paymentMethod,
      userId,
    } = body;

    if (!items || !items.length) {
      return new Response(JSON.stringify({ success: false, error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!customerEmail) {
      return new Response(JSON.stringify({ success: false, error: "Customer email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Recalculate product prices securely from the products table
    const productIds = items.map((i) => i.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, is_available, stock_quantity")
      .in("id", productIds);

    if (prodErr || !dbProducts) {
      return new Response(JSON.stringify({ success: false, error: "Failed to verify products" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subtotal = 0;
    const verifiedItems: Array<{
      product_id: string;
      name: string;
      unit_price: number;
      quantity: number;
      line_total: number;
      store_id: string;
    }> = [];

    for (const item of items) {
      const p = dbProducts.find((x) => x.id === item.productId);
      if (!p) {
        return new Response(
          JSON.stringify({ success: false, error: `Product not found: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const unitPrice = Number(p.price);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      subtotal += lineTotal;

      verifiedItems.push({
        product_id: p.id,
        name: p.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
        store_id: item.storeId || "default",
      });
    }

    const calculatedTotal = Number((subtotal + deliveryFee).toFixed(2));
    const orderCode = `TN-${Math.floor(10000 + Math.random() * 89999)}`;
    const pin = String(Math.floor(1000 + Math.random() * 8999));

    // 2. Determine Webhook Result URL and Return URL
    const appBaseUrl = req.headers.get("origin") || req.headers.get("referer") || "http://127.0.0.1:5173";
    const resultUrl = `${supabaseUrl}/functions/v1/paynow-webhook`;
    const returnUrl = `${appBaseUrl.replace(/\/+$/, "")}/orders/confirmation?orderId=${orderCode}`;

    // 3. Initiate with Paynow API
    let redirectUrl = "";
    let pollUrl = "";
    let paynowReference = "";
    let instructions = "";

    const isMock = paynowId === "MOCK_PAYNOW_ID" || paynowKey === "MOCK_PAYNOW_KEY";

    if (!isMock) {
      const isMobile = (paymentMethod === "ecocash" || paymentMethod === "onemoney") && Boolean(customerPhone);
      const paynowApiEndpoint = isMobile
        ? "https://www.paynow.co.zw/interface/remotetransaction"
        : "https://www.paynow.co.zw/interface/initiatetransaction";

      const paynowFields: Record<string, string> = {
        id: paynowId,
        reference: orderCode,
        amount: calculatedTotal.toFixed(2),
        additionalinfo: `TengaNow Order ${orderCode}`,
        returnurl: returnUrl,
        resulturl: resultUrl,
        authemail: customerEmail,
        status: "Message",
      };

      if (isMobile) {
        paynowFields["phone"] = customerPhone;
        paynowFields["method"] = paymentMethod;
      }

      paynowFields["hash"] = await generatePaynowHash(paynowFields, paynowKey);

      const paynowFormData = new URLSearchParams();
      for (const [k, v] of Object.entries(paynowFields)) {
        paynowFormData.append(k, v);
      }

      const paynowRes = await fetch(paynowApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: paynowFormData.toString(),
      });

      const paynowText = await paynowRes.text();
      const parsed = parsePaynowResponse(paynowText);

      if (parsed.status?.toLowerCase() === "ok" || parsed.status?.toLowerCase() === "success") {
        redirectUrl = parsed.browserurl || "";
        pollUrl = parsed.pollurl || "";
        paynowReference = parsed.paynowreference || orderCode;
        instructions = parsed.instructions || "Please check your mobile phone for authorization PIN prompt.";
      } else {
        console.error("Paynow API error response:", parsed);
        throw new Error(parsed.error || "Failed to initiate transaction with Paynow");
      }
    } else {
      // Mock flow for local dev / preview
      paynowReference = `MOCK-PN-${Date.now()}`;
      pollUrl = `${appBaseUrl}/api/paynow/poll?orderCode=${orderCode}`;
      redirectUrl = returnUrl;
      instructions = `Mock Paynow simulation: enter PIN 1234 on phone ${customerPhone || "EcoCash/OneMoney"}.`;
    }

    // 4. Insert order record as 'pending'
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        code: orderCode,
        user_id: userId || null,
        status: "Awaiting payment",
        payment_method: paymentMethod,
        payment_status: "pending",
        payment_reference: paynowReference,
        paynow_poll_url: pollUrl,
        slot_id: "asap",
        address_line: deliveryAddress.line,
        address_zone: deliveryAddress.zoneId || "cbd",
        address_landmark: deliveryAddress.landmark || null,
        delivery_notes: deliveryNotes || null,
        delivery_fee: deliveryFee,
        subtotal: subtotal,
        total: calculatedTotal,
        pin: pin,
      })
      .select("id")
      .single();

    if (orderErr) {
      console.error("Failed to insert order:", orderErr);
      throw orderErr;
    }

    // 5. Insert order items
    const orderItemsToInsert = verifiedItems.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      name: item.name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      line_total: item.line_total,
      store_id: item.store_id,
      substitution: "closest",
    }));

    await supabase.from("order_items").insert(orderItemsToInsert);

    // 6. Record status history
    await supabase.from("order_status_history").insert({
      order_id: newOrder.id,
      status: "Awaiting payment",
      note: `Payment initiated via Paynow (${paymentMethod})`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: newOrder.id,
        orderCode: orderCode,
        redirectUrl: redirectUrl,
        pollUrl: pollUrl,
        paynowReference: paynowReference,
        instructions: instructions,
        total: calculatedTotal,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("initiate-paynow handler error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
