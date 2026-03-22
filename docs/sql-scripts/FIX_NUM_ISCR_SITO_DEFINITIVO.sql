-- ==========================================
-- 🔧 FIX NUM_ISCR_SITO - PATTERN CORRETTO
-- ==========================================
-- Problema: num_iscr_sito troppo corti
-- Pattern: OP[4cifre][3alfanum][6cifre]-[2lett][4cifre]
--          ^^^^ ^^^ ^^^^^^  ^^ ^^^^
-- Totale: 13 caratteri dopo "OP"
-- ==========================================

-- 1. CORREGGI CERTIFICATO ORG (Root num_iscr_sito)
UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP1000111340-MI00001'
WHERE cf_operatore = 'SCZMNL05L21D960T'
AND num_iscr_sito = 'OP100011134-MI00001';

-- Verifica
SELECT 
  cf_operatore,
  num_iscr_sito,
  LENGTH(num_iscr_sito) as lunghezza,
  CASE 
    WHEN num_iscr_sito ~ '^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$' 
    THEN '✅ VALIDO'
    ELSE '❌ INVALIDO'
  END as stato
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- ==========================================
-- RISULTATO ATTESO:
-- lunghezza = 24 (OP + 13 + - + 2 + 4 + 4)
-- stato = '✅ VALIDO'
-- ==========================================



