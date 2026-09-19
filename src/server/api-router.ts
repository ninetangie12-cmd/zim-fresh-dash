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
