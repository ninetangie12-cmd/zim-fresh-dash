-- ==============================================================================
-- Migration: 20260921_paynow_orders_schema.sql
-- Description:
--   Add columns to the `orders` table:
--     - payment_reference (text)
--     - paynow_poll_url (text)
--     - payment_status (text / enum check: 'pending', 'paid', 'failed', 'cancelled')
-- ==============================================================================

DO $$
BEGIN
  -- 1. Add payment_reference column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'orders' 
      AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_reference TEXT;
  END IF;

  -- 2. Add paynow_poll_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'orders' 
      AND column_name = 'paynow_poll_url'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN paynow_poll_url TEXT;
  END IF;

  -- 3. Ensure payment_status column exists and supports 'pending', 'paid', 'failed', 'cancelled'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'orders' 
      AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
  ELSE
    -- Set default to 'pending'
    ALTER TABLE public.orders ALTER COLUMN payment_status SET DEFAULT 'pending';
  END IF;

  -- Add CHECK constraint for payment_status if it doesn't already have one
  BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'awaiting', 'submitted', 'approved', 'rejected', 'on_delivery'));
  EXCEPTION
    WHEN others THEN NULL;
  END;

END $$;

-- 4. Create Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON public.orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_paynow_poll_url ON public.orders(paynow_poll_url);
