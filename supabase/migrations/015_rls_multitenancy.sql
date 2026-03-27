-- ============================================================
-- Migration 015: RLS Multi-Tenant Real
-- Substitui políticas simples is_admin() por políticas com
-- isolamento por store_id derivado do JWT (app_metadata).
--
-- Modelo de autorização:
--   master_admin  → acessa tudo (todas as lojas)
--   admin         → acessa apenas sua própria loja (store_id do JWT)
--   anon/público  → leitura de dados públicos da loja (cardápio, horários, etc.)
--   authenticated → pode inserir pedidos
--
-- O store_id NUNCA é confiado a partir do cliente diretamente.
-- Ele é lido do JWT (app_metadata.store_id) — controlado pelo servidor.
-- ============================================================

-- ─── Funções auxiliares ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'master_admin',
    false
  );
$$;

-- is_admin() agora retorna true para admin de loja (não master_admin)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Retorna o store_id do admin logado (de app_metadata no JWT)
-- master_admin não tem store_id — retorna NULL
CREATE OR REPLACE FUNCTION current_store_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'store_id';
$$;

-- ─── TABELA: stores ──────────────────────────────────────────────────────────
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_all_stores"         ON stores;
DROP POLICY IF EXISTS "admin_select_own_store"    ON stores;

-- master_admin gerencia todas as lojas
CREATE POLICY "master_all_stores"
  ON stores FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

-- admin vê apenas a própria loja (ex: para exibir nome/plano no painel)
CREATE POLICY "admin_select_own_store"
  ON stores FOR SELECT
  USING (is_admin() AND id = current_store_id());

-- ─── TABELA: store_config ────────────────────────────────────────────────────
-- store_config já tem RLS habilitado (migration 002/004)

DROP POLICY IF EXISTS "public_read_store_config"   ON store_config;
DROP POLICY IF EXISTS "admin_write_store_config"   ON store_config;
DROP POLICY IF EXISTS "master_store_config"        ON store_config;
DROP POLICY IF EXISTS "tenant_store_config"        ON store_config;

-- Storefront público lê config da loja (nome, logo, horário, etc.)
CREATE POLICY "public_read_store_config"
  ON store_config FOR SELECT
  USING (true);

-- master_admin gerencia tudo
CREATE POLICY "master_store_config"
  ON store_config FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

-- admin só acessa sua própria loja
CREATE POLICY "tenant_store_config"
  ON store_config FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: categories ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_categories"   ON categories;
DROP POLICY IF EXISTS "admin_write_categories"   ON categories;
DROP POLICY IF EXISTS "master_categories"        ON categories;
DROP POLICY IF EXISTS "tenant_categories"        ON categories;

CREATE POLICY "public_read_categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "master_categories"
  ON categories FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_categories"
  ON categories FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: products ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_products"   ON products;
DROP POLICY IF EXISTS "admin_write_products"   ON products;
DROP POLICY IF EXISTS "master_products"        ON products;
DROP POLICY IF EXISTS "tenant_products"        ON products;

CREATE POLICY "public_read_products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "master_products"
  ON products FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_products"
  ON products FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: neighborhoods ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_neighborhoods"   ON neighborhoods;
DROP POLICY IF EXISTS "admin_all_neighborhoods"     ON neighborhoods;
DROP POLICY IF EXISTS "master_neighborhoods"        ON neighborhoods;
DROP POLICY IF EXISTS "tenant_neighborhoods"        ON neighborhoods;

-- Storefront exibe apenas bairros ativos
CREATE POLICY "public_read_neighborhoods"
  ON neighborhoods FOR SELECT
  USING (active = true);

CREATE POLICY "master_neighborhoods"
  ON neighborhoods FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_neighborhoods"
  ON neighborhoods FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: coupons ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_active_coupons"  ON coupons;
DROP POLICY IF EXISTS "admin_all_coupons"            ON coupons;
DROP POLICY IF EXISTS "master_coupons"               ON coupons;
DROP POLICY IF EXISTS "tenant_coupons"               ON coupons;

-- Storefront valida cupons ativos (precisa de SELECT por código + store_id)
CREATE POLICY "public_read_active_coupons"
  ON coupons FOR SELECT
  USING (active = true);

CREATE POLICY "master_coupons"
  ON coupons FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_coupons"
  ON coupons FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: business_hours ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_hours"   ON business_hours;
DROP POLICY IF EXISTS "admin_write_hours"   ON business_hours;
DROP POLICY IF EXISTS "master_hours"        ON business_hours;
DROP POLICY IF EXISTS "tenant_hours"        ON business_hours;

CREATE POLICY "public_read_hours"
  ON business_hours FOR SELECT
  USING (true);

CREATE POLICY "master_hours"
  ON business_hours FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_hours"
  ON business_hours FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: orders ──────────────────────────────────────────────────────────
-- orders já tem RLS habilitado
DROP POLICY IF EXISTS "admin_all_orders"               ON orders;
DROP POLICY IF EXISTS "anon_insert_orders"             ON orders;
DROP POLICY IF EXISTS "authenticated_insert_orders"    ON orders;
DROP POLICY IF EXISTS "master_orders"                  ON orders;
DROP POLICY IF EXISTS "tenant_orders"                  ON orders;
DROP POLICY IF EXISTS "customer_insert_orders"         ON orders;

-- master_admin vê tudo
CREATE POLICY "master_orders"
  ON orders FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

-- admin vê apenas pedidos da própria loja
CREATE POLICY "tenant_orders"
  ON orders FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- Clientes autenticados inserem pedidos (checkout requer login)
-- store_id é validado pela app; o admin da loja errada não vê o pedido de qualquer forma
CREATE POLICY "customer_insert_orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── TABELA: stock_movements ─────────────────────────────────────────────────
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_stock"   ON stock_movements;
DROP POLICY IF EXISTS "tenant_stock"   ON stock_movements;

CREATE POLICY "master_stock"
  ON stock_movements FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_stock"
  ON stock_movements FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: whatsapp_connections ────────────────────────────────────────────
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_wa_connections"   ON whatsapp_connections;
DROP POLICY IF EXISTS "tenant_wa_connections"   ON whatsapp_connections;

CREATE POLICY "master_wa_connections"
  ON whatsapp_connections FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_wa_connections"
  ON whatsapp_connections FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: whatsapp_templates ──────────────────────────────────────────────
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_wa_templates"   ON whatsapp_templates;
DROP POLICY IF EXISTS "tenant_wa_templates"   ON whatsapp_templates;

CREATE POLICY "master_wa_templates"
  ON whatsapp_templates FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_wa_templates"
  ON whatsapp_templates FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: whatsapp_automation_rules ───────────────────────────────────────
ALTER TABLE whatsapp_automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_wa_rules"   ON whatsapp_automation_rules;
DROP POLICY IF EXISTS "tenant_wa_rules"   ON whatsapp_automation_rules;

CREATE POLICY "master_wa_rules"
  ON whatsapp_automation_rules FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "tenant_wa_rules"
  ON whatsapp_automation_rules FOR ALL
  USING (is_admin() AND store_id = current_store_id())
  WITH CHECK (is_admin() AND store_id = current_store_id());

-- ─── TABELA: whatsapp_message_logs ───────────────────────────────────────────
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_wa_logs"   ON whatsapp_message_logs;
DROP POLICY IF EXISTS "tenant_wa_logs"   ON whatsapp_message_logs;

CREATE POLICY "master_wa_logs"
  ON whatsapp_message_logs FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

-- Admin só lê logs da própria loja (sem DELETE — logs são auditoria)
CREATE POLICY "tenant_wa_logs"
  ON whatsapp_message_logs FOR SELECT
  USING (is_admin() AND store_id = current_store_id());

-- ─── TABELA: platform_settings ───────────────────────────────────────────────
-- Criada em migration 014. Garantir RLS correto aqui também.
ALTER TABLE IF EXISTS platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_platform_settings"   ON platform_settings;
DROP POLICY IF EXISTS "master_write_platform_settings"  ON platform_settings;

CREATE POLICY "public_read_platform_settings"
  ON platform_settings FOR SELECT
  USING (true);

CREATE POLICY "master_write_platform_settings"
  ON platform_settings FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

-- ─── Garantir RLS habilitado nas tabelas principais ───────────────────────────
-- (caso alguma migration anterior tenha pulado o ALTER TABLE ENABLE)
ALTER TABLE store_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
