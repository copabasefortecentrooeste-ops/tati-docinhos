-- Migration 018: Phone login lookup + admin customer access

-- ── RPC: lookup email by phone (for phone-based login) ─────────────────────
CREATE OR REPLACE FUNCTION get_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Normalize: keep only digits for comparison
  SELECT email INTO v_email
  FROM customers
  WHERE regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  LIMIT 1;
  RETURN v_email;
END;
$$;

-- ── RLS: allow admins to SELECT/UPDATE/DELETE any customer ──────────────────
-- (so admin panel can list customers)

CREATE POLICY customers_admin_select ON customers
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'master_admin')
  );

CREATE POLICY customers_admin_update ON customers
  FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'master_admin')
  )
  WITH CHECK (true);

CREATE POLICY customers_admin_delete ON customers
  FOR DELETE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'master_admin')
  );
