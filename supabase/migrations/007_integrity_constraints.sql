-- Migration 007: Integrity Constraints
-- Etapa 2: Add DB-level integrity constraints for reliability.
-- IMPORTANT: Run pre-check queries below before executing to ensure
-- existing data does not violate the new constraints.
--
-- Pre-checks:
-- SELECT id, code, status FROM orders WHERE status NOT IN ('received','analyzing','production','delivery','delivered','cancelled');
-- SELECT id, total FROM orders WHERE total < 0;
-- SELECT id, name, base_price FROM products WHERE base_price <= 0;
-- SELECT day_of_week, COUNT(*) FROM business_hours GROUP BY day_of_week HAVING COUNT(*) > 1;
-- SELECT name, COUNT(*) FROM neighborhoods GROUP BY name HAVING COUNT(*) > 1;

-- ─── orders ───────────────────────────────────────────────────────────────
alter table orders
  add constraint orders_status_valid
    check (status in ('received','analyzing','production','delivery','delivered','cancelled')),
  add constraint orders_total_nonneg
    check (total >= 0),
  add constraint orders_subtotal_nonneg
    check (subtotal >= 0),
  add constraint orders_delivery_fee_nonneg
    check (delivery_fee >= 0),
  add constraint orders_discount_nonneg
    check (discount >= 0),
  add constraint orders_payment_method_valid
    check (payment_method in ('pix','cartao','dinheiro')),
  add constraint orders_items_nonempty
    check (jsonb_array_length(items) > 0),
  add constraint orders_scheduled_date_format
    check (scheduled_date is null or scheduled_date ~ '^\d{4}-\d{2}-\d{2}$'),
  add constraint orders_scheduled_time_format
    check (scheduled_time is null or scheduled_time ~ '^\d{2}:\d{2}$');

-- ─── products ─────────────────────────────────────────────────────────────
alter table products
  add constraint products_base_price_positive
    check (base_price > 0),
  add constraint products_min_quantity_valid
    check (min_quantity >= 1);

-- Change FK behavior: prevent orphan products when category deleted
alter table products
  drop constraint if exists products_category_id_fkey;
alter table products
  add constraint products_category_id_fkey
    foreign key (category_id) references categories(id)
    on delete restrict;

-- ─── categories ───────────────────────────────────────────────────────────
alter table categories
  add constraint categories_name_nonempty
    check (length(trim(name)) > 0),
  add constraint categories_slug_format
    check (slug ~ '^[a-z0-9-]+$');

-- ─── business_hours ───────────────────────────────────────────────────────
alter table business_hours
  add constraint business_hours_open_time_format
    check (open_time ~ '^\d{2}:\d{2}$'),
  add constraint business_hours_close_time_format
    check (close_time ~ '^\d{2}:\d{2}$');

-- Unique day_of_week: only add if no duplicates exist
-- (check pre-condition above first)
alter table business_hours
  add constraint business_hours_day_unique
    unique (day_of_week);

-- ─── store_config ─────────────────────────────────────────────────────────
alter table store_config
  add constraint store_config_delivery_mode_valid
    check (delivery_mode in ('city_only','free')),
  add constraint store_config_name_nonempty
    check (length(trim(name)) > 0);

-- ─── coupons ──────────────────────────────────────────────────────────────
alter table coupons
  add constraint coupons_value_positive
    check (value > 0),
  add constraint coupons_percentage_max
    check (not (type = 'percentage' and value > 100)),
  add constraint coupons_min_order_nonneg
    check (min_order is null or min_order >= 0);

-- ─── neighborhoods ────────────────────────────────────────────────────────
alter table neighborhoods
  add constraint neighborhoods_fee_nonneg
    check (fee >= 0);

-- Unique name: only add if no duplicates exist
alter table neighborhoods
  add constraint neighborhoods_name_unique
    unique (name);

-- ─── customers ────────────────────────────────────────────────────────────
alter table customers
  add constraint customers_cep_format
    check (cep ~ '^\d{5}-\d{3}$');
