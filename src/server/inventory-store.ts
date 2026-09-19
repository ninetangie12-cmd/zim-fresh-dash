import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type ReservationStatus = "reserved" | "committed" | "released";

export type ProductInventory = {
  id: string;
  name: string;
  stock_quantity: number;
  is_available: boolean;
  updated_at: string;
};

export type StockReservation = {
  id: string;
  product_id: string;
  quantity: number;
  user_or_session_id: string;
  expires_at: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
};

type InventoryDbState = {
  products: ProductInventory[];
  reservations: StockReservation[];
};

const DB_FILE = path.resolve(process.cwd(), ".inventory-store.json");

// Default initial catalogue stock
const SEED_PRODUCTS: ProductInventory[] = [
  { id: "fp-01", name: "Fresh Roma Tomatoes", stock_quantity: 25, is_available: true, updated_at: new Date().toISOString() },
  { id: "fp-07", name: "Crisp Red Gala Apples", stock_quantity: 30, is_available: true, updated_at: new Date().toISOString() },
  { id: "fp-09", name: "Fresh Hass Avocados", stock_quantity: 20, is_available: true, updated_at: new Date().toISOString() },
  { id: "fp-04", name: "Sweet Golden Bananas", stock_quantity: 40, is_available: true, updated_at: new Date().toISOString() },
  { id: "fp-10", name: "Orange Flesh Sweet Potatoes", stock_quantity: 35, is_available: true, updated_at: new Date().toISOString() },
  { id: "fp-11", name: "Crisp Baby Spinach 250g", stock_quantity: 15, is_available: true, updated_at: new Date().toISOString() },
  { id: "de-01", name: "Farm Fresh Full Cream Milk", stock_quantity: 25, is_available: true, updated_at: new Date().toISOString() },
  { id: "bk-06", name: "Artisan Sourdough Loaf", stock_quantity: 12, is_available: true, updated_at: new Date().toISOString() },
  { id: "de-02", name: "Eggs (30 Tray)", stock_quantity: 18, is_available: true, updated_at: new Date().toISOString() },
  { id: "pa-01", name: "Roller Mealie Meal 10kg", stock_quantity: 50, is_available: true, updated_at: new Date().toISOString() },
];

function loadDb(): InventoryDbState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.reservations)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[InventoryStore] Could not read db file, initializing with defaults:", err);
  }
  return { products: [...SEED_PRODUCTS], reservations: [] };
}

function saveDb(data: InventoryDbState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[InventoryStore] Failed to write db file:", err);
  }
}

let state: InventoryDbState = loadDb();

/**
 * Automatically releases any reservation whose expires_at has passed
 */
export function autoReleaseExpiredReservations(): number {
  const now = Date.now();
  let releasedCount = 0;

  for (const res of state.reservations) {
    if (res.status === "reserved" && new Date(res.expires_at).getTime() <= now) {
      res.status = "released";
      res.updated_at = new Date().toISOString();
      releasedCount++;
    }
  }

  if (releasedCount > 0) {
    saveDb(state);
  }
  return releasedCount;
}

/**
 * Calculates current reserved quantity for a product (excluding expired or released)
 */
export function getActiveReservedQuantity(productId: string, excludeSessionId?: string): number {
  autoReleaseExpiredReservations();
  const now = Date.now();

  return state.reservations
    .filter(
      (r) =>
        r.product_id === productId &&
        r.status === "reserved" &&
        new Date(r.expires_at).getTime() > now &&
        (excludeSessionId ? r.user_or_session_id !== excludeSessionId : true),
    )
    .reduce((sum, r) => sum + r.quantity, 0);
}

/**
 * Gets stock and availability for a single product
 */
export function getProductStock(productId: string, excludeSessionId?: string) {
  autoReleaseExpiredReservations();
  let product = state.products.find((p) => p.id === productId);

  if (!product) {
    // Dynamically initialize product with default stock if not in store
    product = {
      id: productId,
      name: `Product ${productId}`,
      stock_quantity: 30,
      is_available: true,
      updated_at: new Date().toISOString(),
    };
    state.products.push(product);
    saveDb(state);
  }

  const reserved = getActiveReservedQuantity(productId, excludeSessionId);
  const available = Math.max(0, product.stock_quantity - reserved);

  return {
    product_id: product.id,
    name: product.name,
    stock_quantity: product.stock_quantity,
    reserved_quantity: reserved,
    available_quantity: available,
    is_available: product.is_available && available > 0,
  };
}

/**
 * Returns stock status for all tracked products
 */
export function getAllProductsStock() {
  autoReleaseExpiredReservations();
  return state.products.map((p) => {
    const reserved = getActiveReservedQuantity(p.id);
    const available = Math.max(0, p.stock_quantity - reserved);
    return {
      product_id: p.id,
      name: p.name,
      stock_quantity: p.stock_quantity,
      reserved_quantity: reserved,
      available_quantity: available,
      is_available: p.is_available && available > 0,
    };
  });
}

/**
 * POST /api/cart/reserve
 * Validates requested quantities against available stock (stock_quantity - active reservations).
 * If valid, locks the items for 15 minutes during checkout.
 */
export function reserveStock(
  userOrSessionId: string,
  items: Array<{ product_id: string; quantity: number }>,
  expiresInSeconds = 15 * 60,
): {
  success: boolean;
  message?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  reservations?: StockReservation[];
  shortages?: Array<{ product_id: string; name: string; requested: number; available: number }>;
  error?: string;
} {
  if (!userOrSessionId?.trim()) {
    return { success: false, error: "user_or_session_id is required." };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: "items array with product_id and quantity is required." };
  }

  autoReleaseExpiredReservations();

  // 1. First pass: Validate stock availability for all items
  const shortages: Array<{ product_id: string; name: string; requested: number; available: number }> = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    if (!item.product_id || isNaN(qty) || qty <= 0) {
      return { success: false, error: `Invalid item or quantity for product ${item.product_id}` };
    }

    const info = getProductStock(item.product_id, userOrSessionId);
    if (!info.is_available || qty > info.available_quantity) {
      shortages.push({
        product_id: item.product_id,
        name: info.name,
        requested: qty,
        available: info.available_quantity,
      });
    }
  }

  if (shortages.length > 0) {
    return {
      success: false,
      error: "Some items in your basket exceed currently available stock.",
      shortages,
    };
  }

  // 2. Second pass: All valid -> Lock items for requested seconds (default 15 minutes)
  const duration = Math.max(1, Number(expiresInSeconds) || 15 * 60);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 1000).toISOString();
  const createdOrUpdated: StockReservation[] = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    let existing = state.reservations.find(
      (r) =>
        r.user_or_session_id === userOrSessionId &&
        r.product_id === item.product_id &&
        r.status === "reserved",
    );

    if (existing) {
      existing.quantity = qty;
      existing.expires_at = expiresAt;
      existing.updated_at = now.toISOString();
      createdOrUpdated.push(existing);
    } else {
      const newRes: StockReservation = {
        id: crypto.randomUUID(),
        product_id: item.product_id,
        quantity: qty,
        user_or_session_id: userOrSessionId,
        expires_at: expiresAt,
        status: "reserved",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      state.reservations.push(newRes);
      createdOrUpdated.push(newRes);
    }
  }

  saveDb(state);

  return {
    success: true,
    message: "Stock successfully reserved for 15 minutes.",
    expires_at: expiresAt,
    expires_in_seconds: 900,
    reservations: createdOrUpdated,
  };
}

/**
 * POST /api/cart/release
 * Frees the reserved stock if the user empties their cart or abandons checkout.
 */
export function releaseStock(
  userOrSessionId: string,
  productId?: string,
): { success: boolean; released_count: number } {
  if (!userOrSessionId?.trim()) {
    return { success: false, released_count: 0 };
  }

  autoReleaseExpiredReservations();
  let releasedCount = 0;
  const now = new Date().toISOString();

  for (const r of state.reservations) {
    if (
      r.user_or_session_id === userOrSessionId &&
      r.status === "reserved" &&
      (productId ? r.product_id === productId : true)
    ) {
      r.status = "released";
      r.updated_at = now;
      releasedCount++;
    }
  }

  if (releasedCount > 0) {
    saveDb(state);
  }

  return { success: true, released_count: releasedCount };
}

/**
 * Commits reservations and permanently deducts from stock_quantity when order is paid/approved
 */
export function commitStock(
  userOrSessionId: string,
  items?: Array<{ product_id: string; quantity: number }>,
): {
  success: boolean;
  committed_count: number;
  deductions: Array<{ product_id: string; deducted: number; remaining: number }>;
} {
  autoReleaseExpiredReservations();
  const now = new Date().toISOString();
  let committedCount = 0;
  const deductions: Array<{ product_id: string; deducted: number; remaining: number }> = [];

  // Find active reservations for this user/session
  const activeReservations = state.reservations.filter(
    (r) => r.user_or_session_id === userOrSessionId && r.status === "reserved",
  );

  if (activeReservations.length > 0) {
    for (const r of activeReservations) {
      r.status = "committed";
      r.updated_at = now;
      committedCount++;

      // Permanently deduct from stock_quantity
      const prod = state.products.find((p) => p.id === r.product_id);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - r.quantity);
        if (prod.stock_quantity === 0) {
          prod.is_available = false;
        }
        prod.updated_at = now;
        deductions.push({ product_id: prod.id, deducted: r.quantity, remaining: prod.stock_quantity });
      }
    }
  } else if (items && items.length > 0) {
    // Direct deduction fallback if no active reservation was held
    for (const item of items) {
      const prod = state.products.find((p) => p.id === item.product_id);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        if (prod.stock_quantity === 0) {
          prod.is_available = false;
        }
        prod.updated_at = now;
        committedCount++;
        deductions.push({ product_id: prod.id, deducted: item.quantity, remaining: prod.stock_quantity });
      }
    }
  }

  if (committedCount > 0) {
    saveDb(state);
  }

  return { success: true, committed_count: committedCount, deductions };
}

/**
 * Test helper to reset product stock to a known quantity
 */
export function setProductStock(productId: string, stockQuantity: number, isAvailable = true) {
  let prod = state.products.find((p) => p.id === productId);
  const now = new Date().toISOString();
  if (prod) {
    prod.stock_quantity = stockQuantity;
    prod.is_available = isAvailable && stockQuantity > 0;
    prod.updated_at = now;
  } else {
    prod = {
      id: productId,
      name: `Product ${productId}`,
      stock_quantity: stockQuantity,
      is_available: isAvailable && stockQuantity > 0,
      updated_at: now,
    };
    state.products.push(prod);
  }

  // Clear any existing active reservations for this product so test starts clean
  for (const r of state.reservations) {
    if (r.product_id === productId && r.status === "reserved") {
      r.status = "released";
      r.updated_at = now;
    }
  }

  saveDb(state);
  return prod;
}

// Background cleaner: periodically auto-release expired reservations (every 30 seconds)
if (typeof setInterval !== "undefined") {
  const cleanerInterval = setInterval(() => {
    try {
      autoReleaseExpiredReservations();
    } catch (err) {
      console.error("[InventoryStore] Error in background cleaner:", err);
    }
  }, 30_000);
  if (typeof (cleanerInterval as any).unref === "function") {
    (cleanerInterval as any).unref();
  }
}
