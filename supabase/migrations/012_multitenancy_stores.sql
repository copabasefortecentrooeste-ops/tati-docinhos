-- Tabela central de lojas (tenant)
CREATE TABLE IF NOT EXISTS stores (
  id           text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug         text        NOT NULL UNIQUE,
  name         text        NOT NULL,
  owner_email  text,
  segment      text        DEFAULT 'food',
  plan         text        NOT NULL DEFAULT 'trial'
                           CHECK (plan IN ('trial','basic','pro')),
  status       text        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','suspended','expired')),
  trial_ends_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_public_read" ON stores FOR SELECT USING (true);

-- Planos de assinatura
CREATE TABLE IF NOT EXISTS store_plans (
  id           text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         text        NOT NULL,
  price        numeric     NOT NULL DEFAULT 0,
  duration_days integer    NOT NULL DEFAULT 30,
  max_products integer     DEFAULT 999,
  features     jsonb       DEFAULT '{}',
  active       boolean     DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON store_plans FOR SELECT USING (true);

-- Slugs reservados (não podem ser usados como slug de loja)
CREATE TABLE IF NOT EXISTS reserved_slugs (
  slug text PRIMARY KEY
);
INSERT INTO reserved_slugs VALUES
  ('admin'),('login'),('master'),('api'),('planos'),
  ('contato'),('suporte'),('sobre'),('demo'),('catalogo'),
  ('carrinho'),('checkout'),('confirmacao'),('acompanhar'),
  ('minha-conta'),('perfil'),('termos'),('privacidade'),
  ('not-found'),('404')
ON CONFLICT DO NOTHING;

-- Seed: planos padrão
INSERT INTO store_plans (id, name, price, duration_days, max_products, features) VALUES
  ('plan-trial', 'Trial', 0, 14, 10, '{"whatsapp": false, "custom_domain": false}'),
  ('plan-basic', 'Básico', 97, 30, 50, '{"whatsapp": false, "custom_domain": false}'),
  ('plan-pro', 'Pro', 197, 30, 999, '{"whatsapp": true, "custom_domain": true}')
ON CONFLICT DO NOTHING;

-- Seed: Taty Docinhos como primeira loja
INSERT INTO stores (id, slug, name, owner_email, segment, plan, status, trial_ends_at) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'tatydocinhos', 'Taty Docinhos', 'admin@tatydocinhos.com.br', 'confeitaria', 'pro', 'active', NULL)
ON CONFLICT (id) DO NOTHING;
