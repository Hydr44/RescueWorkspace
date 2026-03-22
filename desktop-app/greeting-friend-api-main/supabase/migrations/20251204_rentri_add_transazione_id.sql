-- ==========================================
-- Aggiungi colonna per transazione_id RENTRI
-- ==========================================
-- RENTRI usa API asincrone: restituisce solo transazione_id
-- I dati completi vanno recuperati dopo
-- ==========================================

ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS rentri_transazione_id UUID;

COMMENT ON COLUMN rentri_formulari.rentri_transazione_id IS 
'ID transazione asincrona RENTRI (pattern NONBLOCK_PULL_REST)';

-- ==========================================
-- Questo campo serve per:
-- 1. Tracciare la transazione asincrona
-- 2. Recuperare lo stato finale con GET /transazioni/v1.0/{transazione_id}
-- ==========================================



