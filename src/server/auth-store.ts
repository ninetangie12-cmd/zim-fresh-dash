import crypto from "crypto";
import fs from "fs";
import path from "path";

export type UserRole = "customer" | "admin";

export type User = {
  id: string;
  phone_number: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  suburb: string;
  street_address: string;
  landmarks: string | null;
  is_default: boolean;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type OtpSession = {
  id: string;
  phone_number: string;
  code_hash: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
};

type DbState = {
  users: User[];
  addresses: Address[];
  otpSessions: OtpSession[];
};

const DB_FILE = path.resolve(process.cwd(), ".auth-store.json");
const JWT_SECRET = process.env["JWT_SECRET"] || "tenganow-secret-key-zim-fresh-dash-2026";

function loadDb(): DbState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[AuthStore] Failed to read db file, initializing empty:", err);
  }
  return { users: [], addresses: [], otpSessions: [] };
}

function saveDb(state: DbState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AuthStore] Failed to write db file:", err);
  }
}

// In-memory state initialized from file
let state: DbState = loadDb();

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("263")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+263${digits.slice(1)}`;
  }
  if (digits.length >= 9) {
    return `+263${digits}`;
  }
  return `+${digits}`;
}

export function createJwt(user: User): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      phone_number: user.phone_number,
      role: user.role,
      name: user.full_name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    }),
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export function verifyJwt(token: string): { sub: string; phone_number: string; role: UserRole } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return data;
  } catch {
    return null;
  }
}

/* ----------------------------- Store Actions ----------------------------- */

export function createOtpSession(phone: string, code: string): OtpSession {
  const normalized = normalizePhone(phone);
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 mins

  const session: OtpSession = {
    id: crypto.randomUUID(),
    phone_number: normalized,
    code_hash: codeHash,
    expires_at: expiresAt,
    verified: false,
    created_at: new Date().toISOString(),
  };

  // Invalidate previous unverified sessions for this phone
  state.otpSessions = state.otpSessions.filter(
    (s) => s.phone_number !== normalized || s.verified,
  );
  state.otpSessions.push(session);
  saveDb(state);

  return session;
}

export function verifyOtp(phone: string, code: string): boolean {
  const normalized = normalizePhone(phone);
  const codeHash = hashOtp(code);
  const now = new Date().toISOString();

  // Look for active session matching phone and code
  const session = state.otpSessions
    .filter((s) => s.phone_number === normalized && !s.verified && s.expires_at > now)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!session) return false;
  if (session.code_hash !== codeHash) return false;

  session.verified = true;
  saveDb(state);
  return true;
}

export function getOrCreateUser(phone: string, fullName?: string | null): User {
  const normalized = normalizePhone(phone);
  let user = state.users.find((u) => u.phone_number === normalized);

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      phone_number: normalized,
      full_name: fullName || null,
      role: normalized.endsWith("8888") || normalized.endsWith("0001") ? "admin" : "customer",
      created_at: new Date().toISOString(),
    };
    state.users.push(user);
    saveDb(state);
  } else if (fullName && !user.full_name) {
    user.full_name = fullName;
    saveDb(state);
  }

  return user;
}

export function getUserById(id: string): User | null {
  return state.users.find((u) => u.id === id) ?? null;
}

export function getUserAddresses(userId: string): Address[] {
  return state.addresses
    .filter((a) => a.user_id === userId)
    .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
}

export function addUserAddress(
  userId: string,
  input: {
    suburb: string;
    street_address: string;
    landmarks?: string | null;
    is_default?: boolean;
    lat?: number | null;
    lng?: number | null;
  },
): Address {
  const isDefault = Boolean(input.is_default);

  if (isDefault) {
    // Demote any existing default addresses for this user
    for (const a of state.addresses) {
      if (a.user_id === userId) {
        a.is_default = false;
      }
    }
  }

  const address: Address = {
    id: crypto.randomUUID(),
    user_id: userId,
    suburb: input.suburb.trim(),
    street_address: input.street_address.trim(),
    landmarks: input.landmarks?.trim() || null,
    is_default: isDefault || state.addresses.filter((a) => a.user_id === userId).length === 0,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    created_at: new Date().toISOString(),
  };

  state.addresses.push(address);
  saveDb(state);

  return address;
}
