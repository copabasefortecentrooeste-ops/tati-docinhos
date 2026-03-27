-- Categories: sortOrder e active
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Products: controle de estoque completo
ALTER TABLE products ADD COLUMN IF NOT EXISTS manage_stock boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_alert_qty integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_sell_when_empty boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS empty_stock_behavior text DEFAULT 'unavailable' CHECK (empty_stock_behavior IN ('unavailable', 'whatsapp'));

-- Histórico de movimentações de estoque
CREATE TABLE IF NOT EXISTS stock_movements (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  qty integer NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_movements' AND policyname='stock_movements_all') THEN
    CREATE POLICY stock_movements_all ON stock_movements FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Store config: modo de entrega e pedido mínimo
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS delivery_fee_mode text DEFAULT 'by_neighborhood' CHECK (delivery_fee_mode IN ('flat', 'by_neighborhood'));
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS flat_delivery_fee numeric DEFAULT 0;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS min_order_value numeric DEFAULT 0;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS min_order_message text DEFAULT 'O valor mínimo do pedido para entrega é R$ {min}. Adicione mais itens ou escolha retirada.';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS pickup_no_min_order boolean DEFAULT true;
