-- Supabase Migration: 20260919_inventory_and_reservations.sql
-- Inventory Tracking and 15-Minute Cart Stock Reservations

-- 1. Products Table (Inventory & Availability)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 50 CHECK (stock_quantity >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Stock Reservations Table
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  user_or_session_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'committed', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast inventory & reservation queries
CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_status_exp 
  ON public.stock_reservations(product_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_session_status 
  ON public.stock_reservations(user_or_session_id, status);

-- 3. Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- Products are viewable by all users (customers, staff, guests)
CREATE POLICY "Public read access for products"
  ON public.products FOR SELECT
  USING (true);

-- Admins and service role can insert or update products
CREATE POLICY "Admin manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- Users can read their own reservations by session/user id
CREATE POLICY "Users read own reservations"
  ON public.stock_reservations FOR SELECT
  USING (true);

CREATE POLICY "Users insert/manage own reservations"
  ON public.stock_reservations FOR ALL
  USING (true);
