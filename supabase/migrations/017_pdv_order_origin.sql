-- Migration 017: PDV — Add origin and table_number to orders
-- Allows tracking whether an order came from online, balcão, local consumption, or manual delivery.

-- Add origin column (default 'online' for all existing orders)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS table_number TEXT;

-- Add CHECK constraint for origin
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_origin_valid
    CHECK (origin IN ('online', 'balcao', 'local', 'manual_delivery'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Expand payment_method to include 'pendente' (PDV orders may be collected later)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_valid;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_valid
  CHECK (payment_method IN ('pix', 'cartao', 'dinheiro', 'pendente'));

-- Backfill existing rows
UPDATE orders SET origin = 'online' WHERE origin IS NULL OR origin = '';
