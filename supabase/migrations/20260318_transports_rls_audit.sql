-- ============================================================================
-- FASE 3: RLS + Audit Log per Modulo Trasporti
-- Data: 18 Marzo 2026
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS su tabella transports
-- ============================================================================

ALTER TABLE transports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view transports from their organization
CREATE POLICY "Users can view transports from their org"
  ON transports FOR SELECT
  USING (
    org_id = (
      SELECT org_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only insert transports in their organization
CREATE POLICY "Users can insert transports in their org"
  ON transports FOR INSERT
  WITH CHECK (
    org_id = (
      SELECT org_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only update transports in their organization
CREATE POLICY "Users can update transports in their org"
  ON transports FOR UPDATE
  USING (
    org_id = (
      SELECT org_id FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id = (
      SELECT org_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only delete transports in their organization
CREATE POLICY "Users can delete transports in their org"
  ON transports FOR DELETE
  USING (
    org_id = (
      SELECT org_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 2. AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tracciamento operazione
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  
  -- Dati prima/dopo
  old_data JSONB,
  new_data JSONB,
  
  -- Chi ha fatto l'azione
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  
  -- Organizzazione
  org_id UUID NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indici per query veloce
  CONSTRAINT audit_log_org_id_idx UNIQUE (id, org_id)
);

-- Indici per performance
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- RLS su audit_log: users possono vedere solo audit della loro org
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs from their org"
  ON audit_log FOR SELECT
  USING (
    org_id = (
      SELECT org_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 3. FUNCTION: Log Audit Trail
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Determina org_id e user_id
  v_org_id := COALESCE(NEW.org_id, OLD.org_id);
  v_user_id := auth.uid();
  
  -- Recupera email utente
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Insert nel audit_log
  INSERT INTO audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    user_id,
    user_email,
    org_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    v_user_id,
    v_user_email,
    v_org_id
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. TRIGGERS: Audit per transports
-- ============================================================================

DROP TRIGGER IF EXISTS audit_transports_changes ON transports;

CREATE TRIGGER audit_transports_changes
  AFTER INSERT OR UPDATE OR DELETE ON transports
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

-- ============================================================================
-- 5. FUNCTION: Get Audit History per Transport
-- ============================================================================

CREATE OR REPLACE FUNCTION get_transport_audit_history(p_transport_id UUID)
RETURNS TABLE (
  action TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ,
  changes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    audit_log.action,
    audit_log.user_email,
    audit_log.created_at,
    CASE 
      WHEN audit_log.action = 'INSERT' THEN audit_log.new_data
      WHEN audit_log.action = 'UPDATE' THEN jsonb_build_object(
        'old', audit_log.old_data,
        'new', audit_log.new_data
      )
      WHEN audit_log.action = 'DELETE' THEN audit_log.old_data
    END as changes
  FROM audit_log
  WHERE 
    table_name = 'transports'
    AND record_id = p_transport_id
    AND org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. VIEW: Audit Summary per Organization
-- ============================================================================

CREATE OR REPLACE VIEW audit_summary_by_org AS
SELECT 
  org_id,
  table_name,
  action,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as first_action,
  MAX(created_at) as last_action
FROM audit_log
GROUP BY org_id, table_name, action;

-- RLS su view
ALTER VIEW audit_summary_by_org OWNER TO postgres;

-- ============================================================================
-- 7. FUNCTION: Cleanup Old Audit Logs (retention policy)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_days_retention INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - (p_days_retention || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. GRANTS: Permessi per audit_log
-- ============================================================================

GRANT SELECT ON audit_log TO authenticated;
GRANT SELECT ON audit_summary_by_org TO authenticated;
GRANT EXECUTE ON FUNCTION get_transport_audit_history TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO authenticated;

-- ============================================================================
-- 9. COMMENTS: Documentazione
-- ============================================================================

COMMENT ON TABLE audit_log IS 'Audit trail per tutte le operazioni CRUD. Retention: 90 giorni.';
COMMENT ON COLUMN audit_log.action IS 'INSERT, UPDATE, o DELETE';
COMMENT ON COLUMN audit_log.old_data IS 'Snapshot dei dati prima della modifica (NULL per INSERT)';
COMMENT ON COLUMN audit_log.new_data IS 'Snapshot dei dati dopo la modifica (NULL per DELETE)';
COMMENT ON FUNCTION log_audit_trail() IS 'Trigger function che registra tutte le modifiche nel audit_log';
COMMENT ON FUNCTION get_transport_audit_history(UUID) IS 'Recupera lo storico di modifiche per un trasporto specifico';
COMMENT ON FUNCTION cleanup_old_audit_logs(INT) IS 'Elimina audit logs più vecchi di N giorni (default 90)';
