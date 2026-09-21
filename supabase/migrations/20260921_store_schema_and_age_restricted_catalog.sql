-- ==============================================================================
-- Migration: 20260921_store_schema_and_age_restricted_catalog.sql
-- Description:
--   1. stores (id, name, slug, address, phone, logo_url, is_active)
--   2. categories (id, name, slug, is_age_restricted)
--   3. products (id, store_id, category_id, name, description, price, stock_quantity, image_url, is_available)
--   4. orders and order_items linked to user auth (auth.users)
--   5. Sample seed data with 'Liquor' category (is_age_restricted: true) and store products
--   6. RLS policies ensuring valid login session (auth.uid() IS NOT NULL) to view items belonging to age-restricted categories
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. STORES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_age_restricted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- (Note: If public.products already existed with partial columns, we alter it cleanly)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add any missing columns to products if table was created in an earlier migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='store_id') THEN
    ALTER TABLE public.products ADD COLUMN store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category_id') THEN
    ALTER TABLE public.products ADD COLUMN category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='description') THEN
    ALTER TABLE public.products ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='price') THEN
    ALTER TABLE public.products ADD COLUMN price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='image_url') THEN
    ALTER TABLE public.products ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ORDERS & ORDER_ITEMS TABLES (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Placed' CHECK (status IN ('Placed', 'Preparing', 'Ready for Collection', 'On the Way', 'Delivered', 'Cancelled')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  payment_method TEXT DEFAULT 'cod',
  payment_status TEXT DEFAULT 'awaiting',
  delivery_address TEXT,
  delivery_notes TEXT,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure foreign key from orders to auth.users exists if table already existed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'orders' 
      AND constraint_type = 'FOREIGN KEY' 
      AND constraint_name = 'orders_user_id_auth_users_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_auth_users_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN others THEN NULL;
    END;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(is_active);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_age_restricted ON public.categories(is_age_restricted);

CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Stores: Anyone can view active stores
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active stores"
  ON public.stores FOR SELECT
  USING (is_active = true OR (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role'));

-- Stores: Admin manage
DROP POLICY IF EXISTS "Admin manage stores" ON public.stores;
CREATE POLICY "Admin manage stores"
  ON public.stores FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- Categories:
-- Non-age-restricted categories are viewable by anyone.
-- Age-restricted categories require a valid login session (auth.uid() IS NOT NULL).
DROP POLICY IF EXISTS "Public view non-restricted categories" ON public.categories;
CREATE POLICY "Public view non-restricted categories"
  ON public.categories FOR SELECT
  USING (
    is_age_restricted = false
    OR auth.uid() IS NOT NULL
  );

-- Categories: Admin manage
DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- Products:
-- Viewable by anyone IF not in an age-restricted category.
-- Products in an age-restricted category REQUIRE a valid login session (auth.uid() IS NOT NULL).
DROP POLICY IF EXISTS "Public read access for products" ON public.products;
DROP POLICY IF EXISTS "Products view policy with age restriction" ON public.products;
CREATE POLICY "Products view policy with age restriction"
  ON public.products FOR SELECT
  USING (
    -- If product is not assigned a category, allow public read
    category_id IS NULL
    -- OR the category is not age-restricted
    OR EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = products.category_id
        AND c.is_age_restricted = false
    )
    -- OR user has a valid authenticated login session
    OR (
      auth.uid() IS NOT NULL
    )
  );

-- Products: Admin manage
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- Orders: Users can view and manage their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users or admins can update own orders" ON public.orders;
CREATE POLICY "Users or admins can update own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- Order Items: Users can view items belonging to their own orders
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role')
    )
  );

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 7. SEED DATA
-- ------------------------------------------------------------------------------

-- Seed Stores
INSERT INTO public.stores (id, name, slug, address, phone, logo_url, is_active)
VALUES
  ('tm-pnp', 'TM Pick n Pay', 'tm-pick-n-pay', 'Cnr King George Rd & Josiah Tongogara Ave, Avondale, Harare', '+263 77 000 0011', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80', true),
  ('sunset-liquors', 'Sunset Liquors', 'sunset-liquors', 'Shop 4, Belgravia Shopping Centre, Harare', '+263 77 000 0014', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80', true),
  ('belgravia-meats', 'Belgravia Meats', 'belgravia-meats', '12 Sam Nujoma St, Belgravia, Harare', '+263 77 000 0017', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  logo_url = EXCLUDED.logo_url,
  is_active = EXCLUDED.is_active;

-- Seed Categories (Including 'Liquor' with is_age_restricted: true)
INSERT INTO public.categories (id, name, slug, is_age_restricted)
VALUES
  ('fresh-produce', 'Fresh Produce', 'fresh-produce', false),
  ('meat-butchery', 'Meat & Butchery', 'meat-butchery', false),
  ('dairy-eggs', 'Dairy & Eggs', 'dairy-eggs', false),
  ('liquor', 'Liquor', 'liquor', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_age_restricted = EXCLUDED.is_age_restricted;

-- Seed Products
INSERT INTO public.products (id, store_id, category_id, name, description, price, stock_quantity, image_url, is_available)
VALUES
  -- Grocery / Fresh Products (Publicly viewable)
  (
    'fp-01',
    'tm-pnp',
    'fresh-produce',
    'Vine-Ripened Roma Tomatoes',
    'Plump, firm Roma tomatoes, ideal for rich stews, relishes, and fresh salads. 1 kg pack.',
    1.40,
    120,
    'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    'fp-02',
    'tm-pnp',
    'fresh-produce',
    'Crisp Royal Gala Apples',
    'Sweet, crisp Zimbabwean apples packed with crunch and natural orchard sweetness. 1.5 kg bag.',
    2.50,
    80,
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    'meat-01',
    'belgravia-meats',
    'meat-butchery',
    'Premium Beef Stewing Cuts',
    'Tender, well-trimmed prime Zimbabwean beef cuts prepared for hearty slow-cooked stews. 1 kg pack.',
    7.50,
    45,
    'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
    true
  ),
  -- Liquor Products (Age Restricted - requires valid login session to view)
  (
    'lq-01',
    'sunset-liquors',
    'liquor',
    'Zambezi Lager Beer 6-Pack',
    'Chilled national lager, crisp and golden malt finish. 6 x 375 ml cans. 18+ only.',
    8.40,
    60,
    'https://images.unsplash.com/photo-1608270170192-6f23dd5c115d?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    'lq-02',
    'sunset-liquors',
    'liquor',
    'Dry Red Cabernet Wine 750ml',
    'Medium-bodied dry red wine with rich berry aromas. Perfect for dinner pairings. 18+ only.',
    9.50,
    35,
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    'lq-03',
    'sunset-liquors',
    'liquor',
    'Blended Scottish Whisky 750ml',
    'Smooth rich blended whisky with subtle oak and peat notes. 18+ only.',
    22.00,
    20,
    'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  store_id = EXCLUDED.store_id,
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  image_url = EXCLUDED.image_url,
  is_available = EXCLUDED.is_available,
  updated_at = now();
