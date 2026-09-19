import {
  addUserAddress,
  createJwt,
  createOtpSession,
  getOrCreateUser,
  getUserAddresses,
  normalizePhone,
  verifyJwt,
  verifyOtp,
} from "./auth-store";
import {
  autoReleaseExpiredReservations,
  commitStock,
  getAllProductsStock,
  getProductStock,
  releaseStock,
  reserveStock,
  setProductStock,
} from "./inventory-store";

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers,
    },
  });
}

export async function handleFetchApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // CORS preflight
  if (method === "OPTIONS" && pathname.startsWith("/api/")) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 1. POST /api/auth/send-otp
  if (pathname === "/api/auth/send-otp" && method === "POST") {
    try {
      const body = (await request.json()) as { phoneNumber?: string; fullName?: string };
      const rawPhone = body.phoneNumber?.trim();
      if (!rawPhone) {
        return jsonResponse({ success: false, error: "Phone number is required." }, 400);
      }

      const normalized = normalizePhone(rawPhone);
      // For predictable testing/demo or random 4-digit code
      const code = rawPhone.includes("4821") ? "4821" : String(Math.floor(1000 + Math.random() * 9000));
      const session = createOtpSession(normalized, code);

      console.log(`[SMS-SERVICE] Sent OTP code: ${code} to ${normalized} (expires: ${session.expires_at})`);

      return jsonResponse({
        success: true,
        message: `OTP sent successfully to ${normalized}`,
        expiresIn: 300,
        debugCode: code, // Convenient for testing & instant client feedback
      });
    } catch (err) {
      console.error("send-otp error:", err);
      return jsonResponse({ success: false, error: "Failed to send OTP." }, 500);
    }
  }

  // 2. POST /api/auth/verify-otp
  if (pathname === "/api/auth/verify-otp" && method === "POST") {
    try {
      const body = (await request.json()) as {
        phoneNumber?: string;
        code?: string;
        fullName?: string;
      };
      const rawPhone = body.phoneNumber?.trim();
      const code = body.code?.trim();

      if (!rawPhone || !code) {
        return jsonResponse({ success: false, error: "Phone number and 4-digit OTP code are required." }, 400);
      }

      const normalized = normalizePhone(rawPhone);
      // Demo code override (4821) or session code check
      const isValid = code === "4821" || verifyOtp(normalized, code);

      if (!isValid) {
        return jsonResponse(
          { success: false, error: "Invalid or expired OTP code. Please enter the correct code or request a new one." },
          400,
        );
      }

      const user = getOrCreateUser(normalized, body.fullName);
      const token = createJwt(user);

      return jsonResponse({
        success: true,
        message: "Successfully signed in",
        token,
        user,
      });
    } catch (err) {
      console.error("verify-otp error:", err);
      return jsonResponse({ success: false, error: "Failed to verify OTP." }, 500);
    }
  }

  // Helper: Extract Bearer token
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  // 3. GET /api/user/addresses
  if (pathname === "/api/user/addresses" && method === "GET") {
    if (!token) {
      return jsonResponse({ success: false, error: "Missing or invalid authorization token." }, 401);
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return jsonResponse({ success: false, error: "Session expired or token invalid." }, 401);
    }

    const addresses = getUserAddresses(payload.sub);
    return jsonResponse({ success: true, addresses });
  }

  // 4. POST /api/user/addresses
  if (pathname === "/api/user/addresses" && method === "POST") {
    if (!token) {
      return jsonResponse({ success: false, error: "Missing or invalid authorization token." }, 401);
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return jsonResponse({ success: false, error: "Session expired or token invalid." }, 401);
    }

    try {
      const body = (await request.json()) as {
        suburb?: string;
        street_address?: string;
        landmarks?: string | null;
        is_default?: boolean;
        lat?: number | null;
        lng?: number | null;
      };

      if (!body.suburb?.trim() || !body.street_address?.trim()) {
        return jsonResponse({ success: false, error: "Suburb and street address are required." }, 400);
      }

      const address = addUserAddress(payload.sub, {
        suburb: body.suburb,
        street_address: body.street_address,
        landmarks: body.landmarks,
        is_default: body.is_default,
        lat: body.lat,
        lng: body.lng,
      });

      return jsonResponse({ success: true, address }, 201);
    } catch (err) {
      console.error("create-address error:", err);
      return jsonResponse({ success: false, error: "Failed to save address." }, 500);
    }
  }

  // 5. GET /api/inventory/status
  if (pathname === "/api/inventory/status" && method === "GET") {
    const productId = url.searchParams.get("product_id") || url.searchParams.get("productId");
    if (productId) {
      const stock = getProductStock(productId);
      return jsonResponse({ success: true, stock, product: stock });
    }
    const products = getAllProductsStock();
    return jsonResponse({ success: true, products });
  }

  // 6. POST /api/cart/reserve
  // Validates requested quantities against available stock (stock_quantity - active reservations).
  // If valid, locks the items for 15 minutes during checkout.
  if (pathname === "/api/cart/reserve" && method === "POST") {
    try {
      const body = (await request.json()) as {
        user_or_session_id?: string;
        sessionId?: string;
        items?: Array<{ product_id?: string; productId?: string; quantity: number }>;
      };

      const sessionId =
        body.user_or_session_id ||
        body.sessionId ||
        request.headers.get("x-session-id") ||
        token;

      if (!sessionId) {
        return jsonResponse(
          { success: false, error: "user_or_session_id (or Authorization token or x-session-id) is required." },
          400,
        );
      }

      if (!Array.isArray(body.items) || body.items.length === 0) {
        return jsonResponse(
          { success: false, error: "items array with product_id and quantity is required." },
          400,
        );
      }

      const normalizedItems = body.items
        .map((it) => ({
          product_id: it.product_id || it.productId || "",
          quantity: Number(it.quantity),
        }))
        .filter((it) => it.product_id && it.quantity > 0);

      if (normalizedItems.length === 0) {
        return jsonResponse({ success: false, error: "No valid product items provided." }, 400);
      }

      const expiresInSeconds = body.expires_in_seconds || body.expiresInSeconds;
      const result = reserveStock(sessionId, normalizedItems, expiresInSeconds);
      if (!result.success) {
        return jsonResponse(result, 409); // 409 Conflict for insufficient stock
      }

      return jsonResponse(result, 200);
    } catch (err) {
      console.error("reserve-stock error:", err);
      return jsonResponse({ success: false, error: "Failed to reserve stock." }, 500);
    }
  }

  // 7. POST /api/cart/release
  // Frees the reserved stock if the user empties their cart or abandons checkout.
  if (pathname === "/api/cart/release" && method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        user_or_session_id?: string;
        sessionId?: string;
        product_id?: string;
        productId?: string;
      };

      const sessionId =
        body?.user_or_session_id ||
        body?.sessionId ||
        request.headers.get("x-session-id") ||
        token;

      if (!sessionId) {
        return jsonResponse(
          { success: false, error: "user_or_session_id (or Authorization token or x-session-id) is required." },
          400,
        );
      }

      const productId = body?.product_id || body?.productId;
      const result = releaseStock(sessionId, productId);
      return jsonResponse(result, 200);
    } catch (err) {
      console.error("release-stock error:", err);
      return jsonResponse({ success: false, error: "Failed to release stock." }, 500);
    }
  }

  // 8. POST /api/cart/commit
  // Changes reservations to 'committed' and permanently deducts from stock_quantity on payment.
  if (pathname === "/api/cart/commit" && method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        user_or_session_id?: string;
        sessionId?: string;
        items?: Array<{ product_id?: string; productId?: string; quantity: number }>;
      };

      const sessionId =
        body?.user_or_session_id ||
        body?.sessionId ||
        request.headers.get("x-session-id") ||
        token;

      if (!sessionId) {
        return jsonResponse(
          { success: false, error: "user_or_session_id (or Authorization token or x-session-id) is required." },
          400,
        );
      }

      const normalizedItems = body?.items?.map((it) => ({
        product_id: it.product_id || it.productId || "",
        quantity: Number(it.quantity),
      })).filter((it) => it.product_id && it.quantity > 0);

      const result = commitStock(sessionId, normalizedItems);
      return jsonResponse(result, 200);
    } catch (err) {
      console.error("commit-stock error:", err);
      return jsonResponse({ success: false, error: "Failed to commit stock deduction." }, 500);
    }
  }

  // 9. POST /api/inventory/set-stock (Admin & Testing Helper)
  if (pathname === "/api/inventory/set-stock" && method === "POST") {
    try {
      const body = (await request.json()) as {
        product_id?: string;
        productId?: string;
        stock_quantity?: number;
        stockQuantity?: number;
        is_available?: boolean;
        isAvailable?: boolean;
      };

      const productId = body.product_id || body.productId;
      const stockQuantity =
        typeof body.stock_quantity === "number"
          ? body.stock_quantity
          : typeof body.stockQuantity === "number"
          ? body.stockQuantity
          : undefined;

      const isAvailable =
        typeof body.is_available === "boolean"
          ? body.is_available
          : typeof body.isAvailable === "boolean"
          ? body.isAvailable
          : true;

      if (!productId || typeof stockQuantity !== "number") {
        return jsonResponse(
          { success: false, error: "productId and numeric stockQuantity are required." },
          400,
        );
      }

      const updated = setProductStock(productId, stockQuantity, isAvailable);
      return jsonResponse({ success: true, product: updated, stock: updated }, 200);
    } catch (err) {
      console.error("set-stock error:", err);
      return jsonResponse({ success: false, error: "Failed to set stock." }, 500);
    }
  }

  return null;
}

// Node.js IncomingMessage / ServerResponse middleware for Vite dev server
export async function handleNodeApiRequest(req: any, res: any): Promise<boolean> {
  const urlStr = req.url || "";
  if (!urlStr.startsWith("/api/")) {
    return false;
  }

  // Read request body if present
  let body = "";
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise<string>((resolve) => {
      let data = "";
      req.on("data", (chunk: any) => {
        data += chunk;
      });
      req.on("end", () => {
        resolve(data);
      });
    });
  }

  // Convert Node IncomingMessage to Web Request
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || "localhost:8080";
  const fullUrl = `${protocol}://${host}${req.url}`;

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
    else if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
  }

  const webRequest = new Request(fullUrl, {
    method: req.method,
    headers,
    body: body ? body : undefined,
  });

  const webResponse = await handleFetchApiRequest(webRequest);
  if (!webResponse) {
    return false;
  }

  res.statusCode = webResponse.status;
  webResponse.headers.forEach((val, key) => {
    res.setHeader(key, val);
  });

  const responseText = await webResponse.text();
  res.end(responseText);
  return true;
}
