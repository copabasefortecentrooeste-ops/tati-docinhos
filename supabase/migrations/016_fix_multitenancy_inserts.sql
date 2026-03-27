-- ============================================================
-- Migration 016: Corrige store_config e business_hours para
-- suportar INSERT de novas lojas (multi-tenant real).
--
-- Problemas resolvidos:
--   1. store_config tinha "constraint single_row check (id = 1)"
--      impedia inserir mais de uma linha (uma por tenant)
--   2. business_hours.id era text NOT NULL sem DEFAULT,
--      impossibilitando INSERT sem especificar id
-- ============================================================

-- ─── store_config: remover restrição de linha única ──────────────────────────

-- Volta do constraint legacy que impede mais de uma linha
ALTER TABLE store_config DROP CONSTRAINT IF EXISTS single_row;

-- Cria uma sequência para id, iniciando em 2 (a linha da Taty Docinhos é id=1)
CREATE SEQUENCE IF NOT EXISTS store_config_id_seq MINVALUE 2 START WITH 2;
ALTER TABLE store_config ALTER COLUMN id SET DEFAULT nextval('store_config_id_seq');

-- Garante que store_id tenha UNIQUE CONSTRAINT (necessário para upsert onConflict)
-- A migration 013 criou um índice único. Aqui promovemos para constraint formal.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'store_config_store_id_key'
      AND conrelid = 'store_config'::regclass
  ) THEN
    -- Se o índice existe, promove para constraint
    IF EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'store_config' AND indexname = 'store_config_store_id_unique'
    ) THEN
      ALTER TABLE store_config
        ADD CONSTRAINT store_config_store_id_key UNIQUE USING INDEX store_config_store_id_unique;
    ELSE
      -- Se o índice não existe, cria a constraint direto
      ALTER TABLE store_config ADD CONSTRAINT store_config_store_id_key UNIQUE (store_id);
    END IF;
  END IF;
END $$;

-- ─── business_hours: adicionar DEFAULT de UUID para id ───────────────────────
-- Permite INSERT sem especificar id — o banco gera um UUID automaticamente
ALTER TABLE business_hours ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
