-- Migration 009: Enable Supabase Realtime on the orders table.
-- This allows the admin panel to receive live INSERT/UPDATE events via
-- postgres_changes subscriptions without a manual page refresh.
--
-- Safe to run multiple times: the DO block silently ignores
-- "duplicate_object" (table already in publication).

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- already in publication, nothing to do
END $$;
