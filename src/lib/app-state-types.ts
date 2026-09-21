import type { SubstitutionPreference } from "@/data/catalog";

export type CartItem = {
  productId: string;
  storeId: string;
  quantity: number;
  substitution: SubstitutionPreference;
  note?: string;
};

export type Address = {
  id: string;
  label: "Home" | "Work" | "Other";
  zoneId: string;
  line: string;
  landmark?: string;
  notes?: string;
};

export type SavedList = { id: string; name: string; productIds: string[] };

export type Order = {
  id: string;
  /** Database identifier once the order is saved to the customer's account. */
  dbId?: string;
  placedAt: string;
  items: CartItem[];
  addressId: string;
  addressLine?: string;
  addressZoneId?: string;
  addressLandmark?: string;
  slotId: string;
  paymentMethod: string;
  status: string;
  total: number;
  deliveryFee: number;
  pin: string;
  recipientName?: string;
  recipientPhone?: string;
  hidePrices?: boolean;
  proofUploaded?: boolean;
  paymentStatus?: string;
  paymentReference?: string;
  paynowPollUrl?: string;
  finalTotal?: number;
  riderName?: string;
  shopperName?: string;
  statusHistory?: {
    id?: string;
    status: string;
    note: string | null;
    createdAt: string;
  }[];
};
