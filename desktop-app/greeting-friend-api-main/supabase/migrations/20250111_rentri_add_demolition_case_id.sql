-- Migration: Aggiunge campo demolition_case_id a rentri_movimenti per collegare rifiuti a demolizioni
-- File: supabase/migrations/20250111_rentri_add_demolition_case_id.sql

-- Aggiungi colonna demolition_case_id se non esiste
ALTER TABLE rentri_movimenti 
ADD COLUMN IF NOT EXISTS demolition_case_id UUID REFERENCES demolition_cases(id) ON DELETE SET NULL;

-- Crea indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_rentri_movimenti_demolition_case_id 
  ON rentri_movimenti(demolition_case_id);

-- Commento per documentazione
COMMENT ON COLUMN rentri_movimenti.demolition_case_id IS 
  'Collegamento opzionale con la pratica di demolizione che ha generato questo rifiuto (per autodemolitori)';

