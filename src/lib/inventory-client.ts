/**
 * Client helper for Inventory & Stock Reservation
 */

export function getClientSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  const STORAGE_KEY = "tenganow.client_session_id";
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = "guest_" + (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11));
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("tenganow.auth_token");
  const headers: Record<string, string> = {
    "x-session-id": getClientSessionId(),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export type StockInfo = {
  product_id: string;
  name: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  is_available: boolean;
};

export type ShortageInfo = {
  product_id: string;
  name: string;
  requested: number;
  available: number;
};

export async function fetchProductStock(productId?: string): Promise<{
  success: boolean;
  stock?: StockInfo;
  products?: StockInfo[];
}> {
  try {
    const url = productId
      ? `/api/inventory/status?productId=${encodeURIComponent(productId)}`
      : `/api/inventory/status`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.warn("fetchProductStock error:", err);
    return { success: false };
  }
}

export async function reserveCartStock(
  items: Array<{ productId?: string; product_id?: string; quantity: number }>,
): Promise<{
  success: boolean;
  message?: string;
  expires_at?: string;
  shortages?: ShortageInfo[];
  error?: string;
}> {
  try {
    const sessionId = getClientSessionId();
    const res = await fetch("/api/cart/reserve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        sessionId,
        items,
      }),
    });

    const data = await res.json();
    return {
      success: res.ok && data.success,
      ...data,
    };
  } catch (err) {
    console.warn("reserveCartStock error:", err);
    return { success: false, error: "Network error reserving stock" };
  }
}

export async function releaseCartStock(productId?: string): Promise<{
  success: boolean;
  released_count?: number;
}> {
  try {
    const sessionId = getClientSessionId();
    const res = await fetch("/api/cart/release", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        sessionId,
        productId,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn("releaseCartStock error:", err);
    return { success: false };
  }
}

export async function commitCartStock(
  items?: Array<{ productId?: string; product_id?: string; quantity: number }>,
): Promise<{
  success: boolean;
  committed_count?: number;
}> {
  try {
    const sessionId = getClientSessionId();
    const res = await fetch("/api/cart/commit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        sessionId,
        items,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn("commitCartStock error:", err);
    return { success: false };
  }
}
