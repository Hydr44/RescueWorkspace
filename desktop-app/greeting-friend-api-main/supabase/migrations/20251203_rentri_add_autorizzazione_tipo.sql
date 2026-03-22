-- ============================================
-- Aggiungi campi TIPO autorizzazione per FIR
-- ============================================

-- Aggiungi tipo autorizzazione destinatario
ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS destinatario_autorizzazione_tipo VARCHAR(50);

-- Aggiungi tipo autorizzazione produttore (se serve in futuro)
ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS produttore_autorizzazione_tipo VARCHAR(50);

-- Commenti
COMMENT ON COLUMN rentri_formulari.destinatario_autorizzazione_tipo IS 'Tipo autorizzazione destinatario: AIA, AUA, AU, Ordinaria, Semplificata, etc.';
COMMENT ON COLUMN rentri_formulari.produttore_autorizzazione_tipo IS 'Tipo autorizzazione produttore (se applicabile)';

-- Verifica
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rentri_formulari'
AND column_name LIKE '%autorizzazione%'
ORDER BY column_name;

