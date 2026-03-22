-- ==========================================
-- 🗑️ ELIMINA TUTTI I FIR DI TEST VECCHI
-- ==========================================
-- ESEGUI QUESTO SQL SU SUPABASE ADESSO!
-- ==========================================

DELETE FROM rentri_formulari
WHERE org_id = '1ea3be12-a439-46ac-94d9-eaff1bb346c2';

-- Verifica che siano stati eliminati
SELECT COUNT(*) as fir_rimanenti
FROM rentri_formulari
WHERE org_id = '1ea3be12-a439-46ac-94d9-eaff1bb346c2';

-- ==========================================
-- RISULTATO ATTESO:
-- fir_rimanenti: 0
-- ==========================================

-- ⚠️ IMPORTANTE:
-- Dopo questo SQL:
-- 1. Cmd+Q (chiudi app)
-- 2. Attendi 10 secondi
-- 3. Riapri app
-- 4. Nuovo FIR → Riempi Dati Test
-- 5. Trasmetti a RENTRI
-- ==========================================



