-- ============================================================
-- Migration 010: WhatsApp Module + Stock Management
-- Multi-tenant ready (store_id defaults to 'default')
-- ============================================================

-- ── Products: add stock management ──────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock  boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty  int;
ALTER TABLE products ADD COLUMN IF NOT EXISTS active    boolean NOT NULL DEFAULT true;

-- ── WhatsApp connections (one per tenant/store) ──────────────
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                  text        NOT NULL DEFAULT 'default',
  provider_name             text        NOT NULL DEFAULT 'fallback_link',
  is_enabled                boolean     NOT NULL DEFAULT false,
  display_phone             text        NOT NULL DEFAULT '',
  business_phone_number_id  text,
  -- access_token is intentionally NOT stored here.
  -- Use server-side env var WHATSAPP_ACCESS_TOKEN.
  verify_token              text,
  webhook_url               text,
  default_country_code      text        NOT NULL DEFAULT '55',
  use_official_api          boolean     NOT NULL DEFAULT false,
  fallback_whatsapp_number  text,
  fallback_message_template text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

-- ── WhatsApp message templates ───────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    text        NOT NULL DEFAULT 'default',
  event_key   text        NOT NULL,
  name        text        NOT NULL,
  body        text        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, event_key)
);

-- ── Automation rules (event → template) ─────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    text        NOT NULL DEFAULT 'default',
  event_key   text        NOT NULL,
  template_id uuid        REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  is_active   boolean     NOT NULL DEFAULT false,
  send_mode   text        NOT NULL DEFAULT 'auto' CHECK (send_mode IN ('auto','manual')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, event_key)
);

-- ── Message logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        text        NOT NULL DEFAULT 'default',
  order_id        text,       -- text (not uuid) – matches orders.id type; no FK
  order_code      text,
  recipient_phone text        NOT NULL,
  event_key       text,
  template_id     uuid        REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  message_body    text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','sent','failed','fallback')),
  provider        text,
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_logs_store_created
  ON whatsapp_message_logs (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_logs_order
  ON whatsapp_message_logs (order_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE whatsapp_connections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs    ENABLE ROW LEVEL SECURITY;

-- Admin-only write; no public read (idempotent)
DO $$ BEGIN
  CREATE POLICY "admin_all_wa_connections"
    ON whatsapp_connections FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_wa_templates"
    ON whatsapp_templates FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_wa_rules"
    ON whatsapp_automation_rules FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_wa_logs"
    ON whatsapp_message_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Seed: default connection placeholder ────────────────────
INSERT INTO whatsapp_connections (store_id) VALUES ('default')
  ON CONFLICT (store_id) DO NOTHING;

-- ── Seed: default templates ──────────────────────────────────
INSERT INTO whatsapp_templates (store_id, event_key, name, body) VALUES
  ('default','order_created',         'Pedido Recebido',      'Olá, {{nome}}! Recebemos seu pedido *{{codigo}}* no {{loja}}. Acompanhe em: {{link_pedido}}'),
  ('default','order_confirmed',       'Pedido Confirmado',    'Seu pedido *{{codigo}}* foi confirmado! Em breve iniciamos a produção. 🍬'),
  ('default','order_in_analysis',     'Em Análise',           'Seu pedido *{{codigo}}* está sendo analisado. Avisaremos em instantes.'),
  ('default','order_in_production',   'Em Produção',          'Seu pedido *{{codigo}}* está sendo preparado com carinho. 🎉'),
  ('default','order_ready',           'Pronto para Retirada', 'Seu pedido *{{codigo}}* está pronto! Pode vir buscar ou aguarde a saída para entrega.'),
  ('default','order_out_for_delivery','Saiu para Entrega',    'Seu pedido *{{codigo}}* saiu para entrega! 🛵 Aguarde em casa.'),
  ('default','order_delivered',       'Entregue',             'Seu pedido *{{codigo}}* foi entregue! Obrigado por comprar no {{loja}}. 💕'),
  ('default','order_cancelled',       'Cancelado',            'Seu pedido *{{codigo}}* foi cancelado. Dúvidas? Fale conosco: {{telefone_loja}}'),
  ('default','payment_confirmed',     'Pagamento Confirmado', 'Pagamento do pedido *{{codigo}}* confirmado! Valor: {{valor_total}}.'),
  ('default','out_of_stock',          'Produto Indisponível', 'Olá! O item *{{produto}}* está indisponível agora. Fale conosco para verificar disponibilidade ou substituição.')
ON CONFLICT (store_id, event_key) DO NOTHING;

-- ── Seed: default automation rules ───────────────────────────
INSERT INTO whatsapp_automation_rules (store_id, event_key, template_id, is_active, send_mode)
SELECT 'default', t.event_key, t.id, false, 'auto'
FROM whatsapp_templates t
WHERE t.store_id = 'default'
ON CONFLICT (store_id, event_key) DO NOTHING;

-- ── Helper: update updated_at automatically ──────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_wa_connections_updated_at
    BEFORE UPDATE ON whatsapp_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_wa_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
