-- ==========================================
-- ✅ AGGIORNA NUM_ISCR_SITO REALE
-- ==========================================
-- Valore REALE dal portale RENTRI DEMO:
-- OP2512HTM066432-CL0001
-- ==========================================

UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP2512HTM066432-CL0001'
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- Verifica
SELECT 
  cf_operatore,
  num_iscr_sito,
  LENGTH(num_iscr_sito) as lunghezza,
  CASE 
    WHEN num_iscr_sito ~ '^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$'
    THEN '✅ VALIDO'
    ELSE '❌ INVALIDO'
  END as validazione
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- ==========================================
-- RISULTATO ATTESO:
-- num_iscr_sito: OP2512HTM066432-CL0001
-- lunghezza: 22
-- validazione: ✅ VALIDO
-- ==========================================



