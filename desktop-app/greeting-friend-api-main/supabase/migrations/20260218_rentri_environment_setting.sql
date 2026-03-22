-- Migration: RENTRI Environment Setting
-- Created: 2026-02-18
-- Description: Aggiunge colonna rentri_environment a org_settings per toggle TEST/PROD

-- Aggiungi colonna per ambiente RENTRI
ALTER TABLE org_settings 
  ADD COLUMN IF NOT EXISTS rentri_environment VARCHAR(10) DEFAULT 'demo';

-- Constraint per valori validi (usa DO block per IF NOT EXISTS)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_rentri_environment' 
    AND conrelid = 'org_settings'::regclass
  ) THEN
    ALTER TABLE org_settings 
      ADD CONSTRAINT chk_rentri_environment 
      CHECK (rentri_environment IN ('demo', 'prod'));
  END IF;
END $$;

COMMENT ON COLUMN org_settings.rentri_environment IS 
  'Ambiente RENTRI attivo: demo (test) o prod (produzione reale)';
