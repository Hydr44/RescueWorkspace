-- ==========================================
-- 🔧 FIX NUM_ISCR_SITO - LUNGHEZZA ESATTA 22
-- ==========================================
-- Pattern: OP[4cifre][3alfanum][6cifre]-[2lett][4cifre]
-- Totale: 2 + 4 + 3 + 6 + 1 + 2 + 4 = 22 caratteri
-- ==========================================

-- ESEMPIO CORRETTO:
-- OP1234X567890123-MI0001
-- OP ^^^^X^^^567890123-MI^^^^
--    4   3  6         2 4
-- Totale: 22 caratteri

-- ==========================================
-- CORREGGI CERTIFICATO (Root num_iscr_sito)
-- ==========================================

UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP1000A111340000-MI0001'
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- Verifica pattern e lunghezza
SELECT 
  num_iscr_sito,
  LENGTH(num_iscr_sito) as lunghezza,
  SUBSTRING(num_iscr_sito FROM 1 FOR 2) as prefisso,
  SUBSTRING(num_iscr_sito FROM 3 FOR 4) as parte1_4cifre,
  SUBSTRING(num_iscr_sito FROM 7 FOR 3) as parte2_3alfanum,
  SUBSTRING(num_iscr_sito FROM 10 FOR 6) as parte3_6cifre,
  SUBSTRING(num_iscr_sito FROM 16 FOR 1) as separatore,
  SUBSTRING(num_iscr_sito FROM 17 FOR 2) as provincia,
  SUBSTRING(num_iscr_sito FROM 19 FOR 4) as parte4_4cifre,
  CASE 
    WHEN num_iscr_sito ~ '^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$'
    THEN '✅ PATTERN VALIDO'
    ELSE '❌ PATTERN INVALIDO'
  END as validazione,
  CASE 
    WHEN LENGTH(num_iscr_sito) = 22 
    THEN '✅ LUNGHEZZA OK'
    ELSE '❌ LUNGHEZZA ERRATA'
  END as check_lunghezza
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- ==========================================
-- RISULTATO ATTESO:
-- lunghezza: 22
-- validazione: ✅ PATTERN VALIDO
-- check_lunghezza: ✅ LUNGHEZZA OK
-- ==========================================



