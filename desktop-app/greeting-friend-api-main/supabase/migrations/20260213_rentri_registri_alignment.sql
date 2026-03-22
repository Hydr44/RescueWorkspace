-- Migration: Allineamento campi RENTRI Registri Cronologici
-- Created: 2026-02-13
-- Description: Aggiunge i campi obbligatori mancanti per la creazione registro su RENTRI API
-- Ref: POST /anagrafiche/v1.0/registri → { numIscrSito, attivita[], descrizione }

-- ==========================================
-- 1. ATTIVITA - Array attività legate al registro (obbligatorio RENTRI)
-- ==========================================

ALTER TABLE rentri_registri
  ADD COLUMN IF NOT EXISTS attivita TEXT[];

COMMENT ON COLUMN rentri_registri.attivita IS 'Array attività legate al registro RENTRI (obbligatorio). Valori: Produzione, Recupero, Smaltimento, Trasporto, Intermediazione, Commercio';

-- ==========================================
-- 2. DESCRIZIONE - Descrizione del registro (obbligatorio RENTRI)
-- ==========================================

ALTER TABLE rentri_registri
  ADD COLUMN IF NOT EXISTS descrizione VARCHAR(500);

COMMENT ON COLUMN rentri_registri.descrizione IS 'Descrizione del registro (obbligatorio per API RENTRI)';

-- ==========================================
-- 3. ENVIRONMENT - Campo ambiente (demo/produzione)
-- ==========================================

ALTER TABLE rentri_registri
  ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'demo';

COMMENT ON COLUMN rentri_registri.environment IS 'Ambiente RENTRI: demo o produzione';

-- Fine migration
