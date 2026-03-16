-- Migration 004: RLS Hardening
-- Remove all permissive anon write/read policies and replace with
-- properly scoped policies. Admin is identified by Supabase Auth email.
-- Replace 'admin@tatydocinhos.com.br' with the actual admin email if different.

-- ─── DROP existing permissive policies ────────────────────────────────────
drop policy if exists "public_read_store_config"   on store_config;
drop policy if exists "public_read_categories"     on categories;
drop policy if exists "public_read_products"       on products;
drop policy if exists "public_read_neighborhoods"  on neighborhoods;
drop policy if exists "public_read_coupons"        on coupons;
drop policy if exists "public_read_hours"          on business_hours;
drop policy if exists "public_read_orders"         on orders;

drop policy if exists "anon_write_store_config"    on store_config;
drop policy if exists "anon_write_categories"      on categories;
drop policy if exists "anon_write_products"        on products;
drop policy if exists "anon_write_neighborhoods"   on neighborhoods;
drop policy if exists "anon_write_coupons"         on coupons;
drop policy if exists "anon_write_hours"           on business_hours;
drop policy if exists "anon_write_orders"          on orders;

-- ─── store_config ─────────────────────────────────────────────────────────
create policy "public_read_store_config"
  on store_config for select
  using (true);

create policy "admin_write_store_config"
  on store_config for all
  using (auth.email() = 'admin@tatydocinhos.com.br')
  with check (auth.email() = 'admin@tatydocinhos.com.br');

-- ─── categories ───────────────────────────────────────────────────────────
create policy "public_read_categories"
  on categories for select
  using (true);

create policy "admin_write_categories"
  on categories for all
  using (auth.email() = 'admin@tatydocinhos.com.br')
  with check (auth.email() = 'admin@tatydocinhos.com.br');

-- ─── products ─────────────────────────────────────────────────────────────
create policy "public_read_products"
  on products for select
  using (true);

create policy "admin_write_products"
  on products for all
  using (auth.email() = 'admin@tatydocinhos.com.br')
  with check (auth.email() = 'admin@tatydocinhos.com.br');

-- ─── neighborhoods ────────────────────────────────────────────────────────
create policy "public_read_neighborhoods"
  on neighborhoods for select
  using (active = true);

create policy "admin_all_neighborhoods"
  on neighborhoods for all
  using (auth.email() = 'admin@tatydocinhos.com.br')
  with check (auth.email() = 'admin@tatydocinhos.com.br');

-- ─── coupons ──────────────────────────────────────────────────────────────
-- Public can only read active coupons (prevents scraping inactive codes).
create policy "public_read_active_coupons"
  on coupons for select
  using (active = true);

create policy "admin_all_coupons"
  on coupons for all
  using (auth.email() = 'admin@tatydocinhos.com.br')
  with check (auth.email() = 'admin@tatydocinhos.com.br');

-- ─── business_hours ───────────────────────────────────────────────────────
create policy "public_read_hours"
  on business_hours for select
  using (true);

create policy "admin_write_hours"
  on business_hours for all
  using (auth.email() = 'admin@tatydocinhos.com.br')
  with check (auth.email() = 'admin@tatydocinhos.com.br');

-- ─── orders ───────────────────────────────────────────────────────────────
-- Public can INSERT (place an order) but NOT SELECT.
-- Order lookup for customers goes through the get_order_by_code_phone RPC only.
create policy "anon_insert_orders"
  on orders for insert
  with check (true);

create policy "admin_all_orders"
  on orders for all
  using (auth.email() = 'admin@tatydocinhos.com.br')
  with check (auth.email() = 'admin@tatydocinhos.com.br');
