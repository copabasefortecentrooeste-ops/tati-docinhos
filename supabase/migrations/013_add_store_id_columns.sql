-- Adicionar store_id em todas as tabelas de dados do tenant
-- Estratégia: ADD COLUMN com DEFAULT, UPDATE dados existentes, depois trabalhar com o valor

-- store_config
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE store_config SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';
CREATE UNIQUE INDEX IF NOT EXISTS store_config_store_id_unique ON store_config (store_id);

-- categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE categories SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories (store_id);

-- products
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE products SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';
CREATE INDEX IF NOT EXISTS idx_products_store ON products (store_id);

-- neighborhoods
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE neighborhoods SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';
CREATE INDEX IF NOT EXISTS idx_neighborhoods_store ON neighborhoods (store_id);

-- coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE coupons SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';
CREATE INDEX IF NOT EXISTS idx_coupons_store ON coupons (store_id);

-- business_hours
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE business_hours SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';
CREATE INDEX IF NOT EXISTS idx_business_hours_store ON business_hours (store_id);

-- orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE orders SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders (store_id, created_at DESC);

-- stock_movements
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS store_id text DEFAULT 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE stock_movements SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id IS NULL OR store_id = '';

-- whatsapp tables (já têm store_id='default', atualizar para UUID real)
UPDATE whatsapp_connections SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id = 'default';
UPDATE whatsapp_templates SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id = 'default';
UPDATE whatsapp_automation_rules SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id = 'default';
UPDATE whatsapp_message_logs SET store_id = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE store_id = 'default';

-- RPC: resolver slug → store info (usado pelo frontend)
CREATE OR REPLACE FUNCTION resolve_store_slug(p_slug text)
RETURNS TABLE(store_id text, store_name text, plan text, status text, trial_ends_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT s.id, s.name, s.plan, s.status, s.trial_ends_at
  FROM stores s
  WHERE s.slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION resolve_store_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION resolve_store_slug(text) TO authenticated;
