-- ==============================================================================
-- Migration: 20260921_enhanced_delivery_and_dob_schema.sql
-- Description:
--   1. Add local delivery fields to public.orders:
--      - recipient_name TEXT
--      - recipient_phone TEXT
--      - suburb TEXT
--      - street_address TEXT
--      - landmark TEXT
--      - delivery_notes TEXT
--      - store_id TEXT (FK to stores)
--   2. Add Date of Birth and age verification to public.profiles:
--      - date_of_birth DATE
--      - dob_verified BOOLEAN DEFAULT false
-- ==============================================================================

DO $$
BEGIN
  -- 1. Orders table delivery columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'suburb'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN suburb TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'street_address'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN street_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'landmark'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN landmark TEXT;
  END IF;

  -- 2. Profiles table date_of_birth and dob_verified columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'date_of_birth'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'dob_verified'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN dob_verified BOOLEAN DEFAULT false;
    END IF;
  END IF;

  -- 3. Addresses table suburb, street_address, landmarks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addresses') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'suburb'
    ) THEN
      ALTER TABLE public.addresses ADD COLUMN suburb TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'street_address'
    ) THEN
      ALTER TABLE public.addresses ADD COLUMN street_address TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'recipient_name'
    ) THEN
      ALTER TABLE public.addresses ADD COLUMN recipient_name TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'recipient_phone'
    ) THEN
      ALTER TABLE public.addresses ADD COLUMN recipient_phone TEXT;
    END IF;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_suburb ON public.orders(suburb);
CREATE INDEX IF NOT EXISTS idx_orders_landmark ON public.orders(landmark);
