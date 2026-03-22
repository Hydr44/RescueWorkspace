-- ==========================================
-- 🗑️ ELIMINA TUTTI I FIR TEST VECCHI
-- ==========================================
-- IMPORTANTE: Questo elimina TUTTI i FIR di test
-- con dati errati per ricominciare da zero
-- ==========================================

DELETE FROM rentri_formulari
WHERE org_id = '1ea3be12-a439-46ac-94d9-eaff1bb346c2'
AND numero_fir LIKE 'TEST-FIR-%';

-- Verifica quanti ne sono rimasti
SELECT 
  COUNT(*) as fir_rimasti,
  STRING_AGG(numero_fir, ', ') as numeri_fir
FROM rentri_formulari
WHERE org_id = '1ea3be12-a439-46ac-94d9-eaff1bb346c2';

-- Se fir_rimasti = 0, tutto è stato eliminato correttamente

