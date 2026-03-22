-- Migration: RENTRI Multi-Certificate Architecture
-- Created: 2025-12-03
-- Description: Sistema certificati RENTRI per multi-tenant (più aziende)

-- ==========================================
-- CERTIFICATI PER ORGANIZZAZIONE
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_org_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificazione operatore RENTRI
  cf_operatore VARCHAR(16) NOT NULL,
  ragione_sociale VARCHAR(255),
  rentri_id VARCHAR(100), -- ID operatore su RENTRI (es: RENTRI-100011134)
  
  -- Certificato (stored encrypted - da implementare encryption layer)
  certificate_pem TEXT NOT NULL,
  private_key_pem TEXT NOT NULL,
  ca_chain_pem TEXT,
  
  -- Password certificato (encrypted)
  certificate_password TEXT,
  
  -- Metadati certificato
  serial_number VARCHAR(100),
  subject_dn TEXT, -- Distinguished Name completo
  issuer_dn TEXT,
  
  -- Ambiente
  environment VARCHAR(10) DEFAULT 'demo', -- 'demo' o 'prod'
  
  -- Validità
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Un solo certificato default per org+environment
  
  -- Notifiche scadenza
  expiry_notified_at TIMESTAMP, -- Quando è stato inviato reminder scadenza
  
  -- Note
  note TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(cf_operatore, environment),
  CHECK (environment IN ('demo', 'prod')),
  CHECK (expires_at > issued_at)
);

-- Un solo certificato default per org+environment
CREATE UNIQUE INDEX idx_rentri_org_cert_default 
  ON rentri_org_certificates(org_id, environment) 
  WHERE is_default = true;

CREATE INDEX idx_rentri_org_cert_org ON rentri_org_certificates(org_id);
CREATE INDEX idx_rentri_org_cert_cf ON rentri_org_certificates(cf_operatore);
CREATE INDEX idx_rentri_org_cert_expires ON rentri_org_certificates(expires_at);
CREATE INDEX idx_rentri_org_cert_active ON rentri_org_certificates(is_active, environment);

-- ==========================================
-- AGGIORNA TABELLE ESISTENTI
-- ==========================================

-- Aggiungi riferimento certificato usato (opzionale, per audit)
ALTER TABLE rentri_registri 
  ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES rentri_org_certificates(id);

ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES rentri_org_certificates(id);

ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES rentri_org_certificates(id);

-- Aggiungi campo environment per distinguere demo vs prod
ALTER TABLE rentri_registri 
  ADD COLUMN IF NOT EXISTS environment VARCHAR(10) DEFAULT 'demo';

ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS environment VARCHAR(10) DEFAULT 'demo';

ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS environment VARCHAR(10) DEFAULT 'demo';

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE rentri_org_certificates ENABLE ROW LEVEL SECURITY;

-- Solo utenti dell'org possono vedere i propri certificati
CREATE POLICY "Users can view certificates of their org"
  ON rentri_org_certificates FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Solo admin org possono inserire certificati
CREATE POLICY "Admins can insert certificates"
  ON rentri_org_certificates FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Solo admin org possono modificare certificati
CREATE POLICY "Admins can update certificates"
  ON rentri_org_certificates FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Solo admin org possono eliminare certificati
CREATE POLICY "Admins can delete certificates"
  ON rentri_org_certificates FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- TRIGGER updated_at
-- ==========================================

CREATE TRIGGER update_rentri_org_certificates_updated_at
  BEFORE UPDATE ON rentri_org_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_updated_at();

-- ==========================================
-- FUNZIONI HELPER
-- ==========================================

-- Funzione per ottenere certificato attivo per org
CREATE OR REPLACE FUNCTION get_active_rentri_cert(
  p_org_id UUID,
  p_environment VARCHAR(10) DEFAULT 'demo'
)
RETURNS rentri_org_certificates AS $$
DECLARE
  v_cert rentri_org_certificates;
BEGIN
  SELECT * INTO v_cert
  FROM rentri_org_certificates
  WHERE org_id = p_org_id
    AND environment = p_environment
    AND is_active = true
    AND is_default = true
    AND expires_at > NOW()
  LIMIT 1;
  
  RETURN v_cert;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare scadenze imminenti
CREATE OR REPLACE FUNCTION check_expiring_rentri_certificates(
  days_before INTEGER DEFAULT 30
)
RETURNS TABLE (
  org_id UUID,
  org_name TEXT,
  cf_operatore VARCHAR,
  expires_at TIMESTAMP,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.org_id,
    o.name as org_name,
    c.cf_operatore,
    c.expires_at,
    EXTRACT(DAY FROM c.expires_at - NOW())::INTEGER as days_remaining
  FROM rentri_org_certificates c
  JOIN orgs o ON o.id = c.org_id
  WHERE c.is_active = true
    AND c.expires_at <= NOW() + (days_before || ' days')::INTERVAL
    AND c.expires_at > NOW()
    AND (c.expiry_notified_at IS NULL OR c.expiry_notified_at < NOW() - INTERVAL '7 days')
  ORDER BY c.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- SEED DATA: Certificato DEMO Attuale
-- ==========================================

-- Inserisci certificato DEMO esistente per riferimento
-- NOTA: Sostituire org_id con il tuo org_id reale
-- NOTA: I valori certificate_pem e private_key_pem vanno popolati con i dati reali

INSERT INTO rentri_org_certificates (
  org_id,
  cf_operatore,
  ragione_sociale,
  rentri_id,
  certificate_pem,
  private_key_pem,
  environment,
  issued_at,
  expires_at,
  is_active,
  is_default,
  note
) VALUES (
  (SELECT id FROM orgs LIMIT 1), -- SOSTITUIRE con org_id reale
  'SCZMNL05L21D960T',
  'SCOZZARINI EMMANUEL SALVATORE',
  'RENTRI-100011134',
  '-----BEGIN CERTIFICATE-----
-- SOSTITUIRE con certificato reale da SCZMNL05L21D960T-cert.pem
-----END CERTIFICATE-----',
  '-----BEGIN PRIVATE KEY-----
-- SOSTITUIRE con chiave privata reale da SCZMNL05L21D960T-key.pem
-----END PRIVATE KEY-----',
  'demo',
  '2025-12-03 14:12:12',
  '2027-12-03 14:12:12',
  true,
  true,
  'Certificato DEMO iniziale - Configurato 3 dic 2025'
) ON CONFLICT DO NOTHING;

-- ==========================================
-- COMMENTI
-- ==========================================

COMMENT ON TABLE rentri_org_certificates IS 
  'Certificati RENTRI per ogni organizzazione - supporta multi-tenant con identificazione separata';

COMMENT ON COLUMN rentri_org_certificates.cf_operatore IS 
  'Codice Fiscale operatore RENTRI - usato come JWT issuer';

COMMENT ON COLUMN rentri_org_certificates.is_default IS 
  'Certificato di default per org+environment (solo uno attivo)';

COMMENT ON COLUMN rentri_org_certificates.environment IS 
  'Ambiente: demo (test) o prod (operatività reale)';

COMMENT ON FUNCTION get_active_rentri_cert IS 
  'Recupera certificato attivo e valido per organizzazione';

COMMENT ON FUNCTION check_expiring_rentri_certificates IS 
  'Trova certificati in scadenza per invio notifiche (default 30gg prima)';

