-- Migration 008: Order idempotency via request_id
-- Adds a client-generated request_id to orders to prevent duplicate submissions.
-- The frontend generates this UUID once when the checkout page loads.
-- Retrying the same submission with the same request_id hits the UNIQUE constraint
-- and is rejected by the DB, preventing ghost duplicate orders.

alter table orders
  add column if not exists request_id uuid;

-- Create unique index (allows NULLs for legacy orders, enforces uniqueness for new ones)
create unique index if not exists orders_request_id_key
  on orders (request_id)
  where request_id is not null;
