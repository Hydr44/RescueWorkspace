-- Migrazione: Creazione tabella org_settings per dati aziendali
-- Questa tabella contiene le impostazioni e i dati fiscali di ogni organizzazione

-- Crea tabella org_settings
CREATE TABLE IF NOT EXISTS org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Dati aziendali
  company_name TEXT,
  vat TEXT, -- P.IVA
  tax_code TEXT, -- Codice Fiscale
  
  -- Indirizzo sede legale
  address JSONB, -- { street, city, zip, province, country }
  
  -- Dati fiscali
  regime_fiscale TEXT DEFAULT 'RF01', -- Regime fiscale (RF01 = ordinario)
  
  -- Contatti
  phone TEXT,
  email TEXT,
  pec TEXT,
  website TEXT,
  
  -- Dati bancari
  iban TEXT,
  bank_name TEXT,
  
  -- Logo e branding
  logo_url TEXT,
  primary_color TEXT,
  
  -- Impostazioni fatturazione
  invoice_prefix TEXT, -- Prefisso numero fattura (es: "FATT-")
  invoice_footer TEXT, -- Testo piè di pagina fatture
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: una sola riga per org
  UNIQUE(org_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_org_settings_org_id ON org_settings(org_id);

-- RLS
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- Policy: membri org possono leggere
CREATE POLICY "org_settings_select" ON org_settings
  FOR SELECT
  USING (is_member(org_id));

-- Policy: admin org possono inserire
CREATE POLICY "org_settings_insert" ON org_settings
  FOR INSERT
  WITH CHECK (is_org_admin(org_id));

-- Policy: admin org possono aggiornare
CREATE POLICY "org_settings_update" ON org_settings
  FOR UPDATE
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

-- Policy: owner org possono eliminare
CREATE POLICY "org_settings_delete" ON org_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_settings.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'owner'
    )
  );

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_org_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_settings_updated_at
  BEFORE UPDATE ON org_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_org_settings_updated_at();

-- Commento
COMMENT ON TABLE org_settings IS 'Impostazioni e dati fiscali delle organizzazioni per fatturazione e AI assistant';
