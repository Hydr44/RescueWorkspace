-- Migration: Tipo certificato RENTRI (interoperabilità/firma) + num_iscr_sito + notifiche
-- Created: 2026-02-24
-- Description: Supporto 2 tipi certificato per autodemolitore + endpoint notifiche PUSH

-- ==========================================
-- 1. TIPO CERTIFICATO (interoperabilita / firma_remota)
-- ==========================================
ALTER TABLE rentri_org_certificates
  ADD COLUMN IF NOT EXISTS tipo_certificato VARCHAR(30) DEFAULT 'interoperabilita'
  CHECK (tipo_certificato IN ('interoperabilita', 'firma_remota'));

COMMENT ON COLUMN rentri_org_certificates.tipo_certificato IS 
  'interoperabilita = API RENTRI (JWT, trasmissioni). firma_remota = firma digitale XAdES per FIR digitali';

-- Aggiorna constraint UNIQUE: ora per cf + environment + tipo
-- Prima rimuovi il vecchio constraint
ALTER TABLE rentri_org_certificates DROP CONSTRAINT IF EXISTS rentri_org_certificates_cf_operatore_environment_key;

-- Nuovo unique: cf_operatore + environment + tipo_certificato
ALTER TABLE rentri_org_certificates 
  ADD CONSTRAINT rentri_org_cert_cf_env_tipo_key UNIQUE (cf_operatore, environment, tipo_certificato);

-- Aggiorna indice default: un solo default per org + environment + tipo
DROP INDEX IF EXISTS idx_rentri_org_cert_default;
CREATE UNIQUE INDEX idx_rentri_org_cert_default 
  ON rentri_org_certificates(org_id, environment, tipo_certificato) 
  WHERE is_default = true;

-- ==========================================
-- 2. NUM ISCR SITO su certificato
-- ==========================================
ALTER TABLE rentri_org_certificates
  ADD COLUMN IF NOT EXISTS num_iscr_sito VARCHAR(50);

COMMENT ON COLUMN rentri_org_certificates.num_iscr_sito IS 
  'Numero iscrizione sito RENTRI associato a questo certificato (es: OP2512HTM066432-CL0001)';

-- ==========================================
-- 3. TABELLA NOTIFICHE RENTRI PUSH
-- ==========================================
CREATE TABLE IF NOT EXISTS rentri_notifiche (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo notifica
  tipo VARCHAR(50) NOT NULL, -- 'copia_fir_restituita', 'firma_completata', 'annullamento', etc.
  
  -- Riferimento FIR
  numero_fir VARCHAR(100),
  codice_blocco VARCHAR(50),
  
  -- Payload RENTRI originale
  payload JSONB,
  
  -- Stato elaborazione
  stato VARCHAR(20) DEFAULT 'ricevuta' CHECK (stato IN ('ricevuta', 'elaborata', 'errore')),
  
  -- Timestamp
  ricevuta_at TIMESTAMP DEFAULT NOW(),
  elaborata_at TIMESTAMP,
  
  -- Errore elaborazione
  errore TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rentri_notifiche_org ON rentri_notifiche(org_id);
CREATE INDEX idx_rentri_notifiche_tipo ON rentri_notifiche(tipo);
CREATE INDEX idx_rentri_notifiche_fir ON rentri_notifiche(numero_fir);
CREATE INDEX idx_rentri_notifiche_stato ON rentri_notifiche(stato);

-- RLS
ALTER TABLE rentri_notifiche ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications of their org"
  ON rentri_notifiche FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert notifications"
  ON rentri_notifiche FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
  ON rentri_notifiche FOR UPDATE
  USING (true);
