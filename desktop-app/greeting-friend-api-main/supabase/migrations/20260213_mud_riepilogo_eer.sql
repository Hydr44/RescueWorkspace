-- Add riepilogo_eer column to rentri_mud table
-- Stores per-EER code breakdown (carico/scarico kg) as JSONB array

ALTER TABLE rentri_mud ADD COLUMN IF NOT EXISTS riepilogo_eer jsonb DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN rentri_mud.riepilogo_eer IS 'Riepilogo per codice EER: [{codice, descrizione, carico, scarico}]';
