-- Migration 005: Secure Order Tracking RPC
-- Creates a SECURITY DEFINER function that allows customers to look up
-- their own order by code + phone without exposing the full orders table.

create or replace function get_order_by_code_phone(
  p_code  text,
  p_phone text
)
returns json
language sql
security definer
set search_path = public
as $$
  select row_to_json(t)
  from (
    select
      id,
      code,
      status,
      total,
      delivery_fee,
      is_pickup,
      scheduled_date,
      scheduled_time,
      created_at,
      (customer->>'neighborhood') as customer_neighborhood,
      items
    from orders
    where
      code = p_code
      and customer->>'phone' = p_phone
    limit 1
  ) t;
$$;

-- Grant execute to anonymous callers (they cannot SELECT orders directly).
grant execute on function get_order_by_code_phone(text, text) to anon;
grant execute on function get_order_by_code_phone(text, text) to authenticated;
