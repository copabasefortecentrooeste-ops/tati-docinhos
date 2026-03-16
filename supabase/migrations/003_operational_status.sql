-- ============================================================
-- 003_operational_status.sql
-- Adds operational status fields to store_config
-- Adds outside_hours flag to orders
-- ============================================================

-- store_config: manual status override
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS manual_status TEXT DEFAULT NULL
    CHECK (manual_status IN ('open', 'closed', 'paused') OR manual_status IS NULL),
  ADD COLUMN IF NOT EXISTS block_orders_outside_hours BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS closed_message TEXT NOT NULL DEFAULT 'Estamos fechados no momento.',
  ADD COLUMN IF NOT EXISTS operational_message TEXT NOT NULL DEFAULT '';

-- orders: flag set when order was placed outside normal hours
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS outside_hours BOOLEAN NOT NULL DEFAULT FALSE;
