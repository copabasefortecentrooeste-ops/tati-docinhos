-- Migration 006: RLS Hardening 1B
-- 1. Replace auth.email() policy checks with app_metadata-based is_admin() helper.
--    app_metadata can only be set via the service-role key (server-side).
--    It is immune to email changes and cannot be forged by the user.
-- 2. Lock order INSERT to authenticated users only (checkout requires login).
-- 3. Harden get_order_by_code_phone: empty search_path, explicit schema, revoke from public.
--
-- MANUAL STEP REQUIRED before running this migration:
--   In Supabase Dashboard → Authentication → Users → select admin user → App Metadata:
--   Set: {"role": "admin"}
--   This grants the admin flag via JWT. Without this step, admin will be locked out.

-- ─── 1. is_admin() helper ────────────────────────────────────────────────────
-- Reads app_metadata.role from the current request's JWT.
-- No SECURITY DEFINER needed — just reads auth.jwt() which is always in scope.
-- 'stable' tells Postgres the result is constant within a single SQL statement.
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ─── 2. Replace email-based admin policies with is_admin() ──────────────────

-- store_config
drop policy if exists "admin_write_store_config" on store_config;
create policy "admin_write_store_config"
  on store_config for all
  using (is_admin())
  with check (is_admin());

-- categories
drop policy if exists "admin_write_categories" on categories;
create policy "admin_write_categories"
  on categories for all
  using (is_admin())
  with check (is_admin());

-- products
drop policy if exists "admin_write_products" on products;
create policy "admin_write_products"
  on products for all
  using (is_admin())
  with check (is_admin());

-- neighborhoods
drop policy if exists "admin_all_neighborhoods" on neighborhoods;
create policy "admin_all_neighborhoods"
  on neighborhoods for all
  using (is_admin())
  with check (is_admin());

-- coupons
drop policy if exists "admin_all_coupons" on coupons;
create policy "admin_all_coupons"
  on coupons for all
  using (is_admin())
  with check (is_admin());

-- business_hours
drop policy if exists "admin_write_hours" on business_hours;
create policy "admin_write_hours"
  on business_hours for all
  using (is_admin())
  with check (is_admin());

-- orders
drop policy if exists "admin_all_orders" on orders;
create policy "admin_all_orders"
  on orders for all
  using (is_admin())
  with check (is_admin());

-- ─── 3. Lock order INSERT to authenticated users only ────────────────────────
-- Checkout.tsx has a hard session gate (line 167: if (!session) return auth gate).
-- Anonymous users cannot reach the checkout form — anon insert is never needed.
drop policy if exists "anon_insert_orders" on orders;
create policy "authenticated_insert_orders"
  on orders for insert
  to authenticated
  with check (true);

-- ─── 4. Harden get_order_by_code_phone ──────────────────────────────────────
-- Changes from migration 005:
--   - search_path = '' (empty) forces all table refs to be fully schema-qualified
--   - Tables referenced as public.orders explicitly (no implicit resolution)
--   - Revoke execute from public role (defense in depth)
--   - Re-grant only to anon and authenticated
drop function if exists get_order_by_code_phone(text, text);

create function get_order_by_code_phone(
  p_code  text,
  p_phone text
)
returns json
language sql
security definer
set search_path = ''
as $$
  select row_to_json(t)
  from (
    select
      o.id,
      o.code,
      o.status,
      o.total,
      o.delivery_fee,
      o.is_pickup,
      o.scheduled_date,
      o.scheduled_time,
      o.created_at,
      (o.customer->>'neighborhood') as customer_neighborhood,
      o.items
    from public.orders o
    where
      o.code = p_code
      and o.customer->>'phone' = p_phone
    limit 1
  ) t;
$$;

-- Revoke from public (Postgres grants execute to public by default on new functions)
revoke execute on function get_order_by_code_phone(text, text) from public;

-- Grant explicitly only to the roles that need tracking lookup
grant execute on function get_order_by_code_phone(text, text) to anon;
grant execute on function get_order_by_code_phone(text, text) to authenticated;
