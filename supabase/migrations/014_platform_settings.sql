-- ============================================================
-- 014 — Tabela de configurações da landing page da plataforma
-- Permite ao master_admin editar hero, planos, FAQ, WhatsApp, etc.
-- sem necessidade de alterar código-fonte.
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id   int  PRIMARY KEY DEFAULT 1,
  config jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Garante que exista sempre exatamente uma linha
INSERT INTO platform_settings (id, config)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_platform_settings_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_platform_settings_ts ON platform_settings;
CREATE TRIGGER trg_platform_settings_ts
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_platform_settings_ts();

-- RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'public_read_platform_settings'
  ) THEN
    CREATE POLICY public_read_platform_settings
      ON platform_settings FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'master_write_platform_settings'
  ) THEN
    CREATE POLICY master_write_platform_settings
      ON platform_settings FOR UPDATE
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'master_admin')
      WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'master_admin');
  END IF;
END $$;
