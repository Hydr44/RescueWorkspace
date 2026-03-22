-- Migration: Company Cache per OpenAPI.it
-- Created: 2026-01-19
-- Description: Cache persistente per dati azienda da OpenAPI.it per ridurre costi API

-- ==========================================
-- TABELLA CACHE DATI AZIENDA
-- ==========================================

CREATE TABLE IF NOT EXISTS company_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vat_code VARCHAR(11) UNIQUE NOT NULL,
  company_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_company_cache_vat ON company_cache(vat_code);
CREATE INDEX IF NOT EXISTS idx_company_cache_expires ON company_cache(expires_at);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_company_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_cache_updated_at
  BEFORE UPDATE ON company_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_company_cache_updated_at();

-- RLS: tutti possono leggere e scrivere (cache pubblica)
ALTER TABLE company_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_cache_select" ON company_cache
  FOR SELECT USING (true);

CREATE POLICY "company_cache_insert" ON company_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "company_cache_update" ON company_cache
  FOR UPDATE USING (true);

CREATE POLICY "company_cache_delete" ON company_cache
  FOR DELETE USING (true);

-- Funzione per pulire cache scaduta (può essere chiamata da cron)
CREATE OR REPLACE FUNCTION cleanup_expired_company_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM company_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commenti per documentazione
COMMENT ON TABLE company_cache IS 'Cache persistente per dati azienda da OpenAPI.it. Riduce costi API evitando chiamate duplicate.';
COMMENT ON COLUMN company_cache.vat_code IS 'P.IVA normalizzata (11 caratteri, senza prefisso IT)';
COMMENT ON COLUMN company_cache.company_data IS 'Dati completi azienda in formato JSONB';
COMMENT ON COLUMN company_cache.expires_at IS 'Data di scadenza cache (default 30 giorni)';
