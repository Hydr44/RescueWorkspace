-- Tabella per audit log di sicurezza
-- Traccia eventi di autenticazione e sicurezza per compliance e debugging

CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('login_attempt', 'login_success', 'login_failed', 'logout', 'token_refresh', 'token_expired', 'suspicious_activity')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_email ON security_audit_log(email) WHERE email IS NOT NULL;

-- RLS policies
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo staff può leggere i log di sicurezza
CREATE POLICY "Staff can read security audit log"
  ON security_audit_log
  FOR SELECT
  TO authenticated
  USING (is_staff());

-- Sistema può inserire log (via service role)
CREATE POLICY "Service role can insert security audit log"
  ON security_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Funzione per cleanup automatico vecchi log (>90 giorni)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM security_audit_log
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- Commenti
COMMENT ON TABLE security_audit_log IS 'Log di eventi di sicurezza e autenticazione per audit e compliance';
COMMENT ON COLUMN security_audit_log.event_type IS 'Tipo di evento: login_attempt, login_success, login_failed, logout, token_refresh, token_expired, suspicious_activity';
COMMENT ON COLUMN security_audit_log.metadata IS 'Dati aggiuntivi specifici per tipo evento (metodo auth, errore, tentativi, ecc.)';
