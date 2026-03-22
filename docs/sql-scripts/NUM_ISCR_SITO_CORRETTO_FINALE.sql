-- ==========================================
-- ✅ NUM_ISCR_SITO PATTERN CORRETTO DEFINITIVO
-- ==========================================
-- Pattern RENTRI: ^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$
--
-- Struttura:
-- OP + 4cifre + 3alfanum + 6cifre + - + 2lettere + 4cifre
-- 
-- Esempio: OP1234ABC567890-MI0001
--          OP ^^^^ ^^^ ^^^^^^  ^^ ^^^^
--             4    3   6       2  4
--          
-- Totale: 22 caratteri
-- ==========================================

UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP1000ABC123456-MI0001'
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- Verifica dettagliata
SELECT 
  num_iscr_sito,
  LENGTH(num_iscr_sito) as lunghezza,
  -- Scomponi le parti
  SUBSTRING(num_iscr_sito, 1, 2) as part_OP,
  SUBSTRING(num_iscr_sito, 3, 4) as part_4cifre,
  SUBSTRING(num_iscr_sito, 7, 3) as part_3alfanum,
  SUBSTRING(num_iscr_sito, 10, 6) as part_6cifre,
  SUBSTRING(num_iscr_sito, 16, 1) as part_trattino,
  SUBSTRING(num_iscr_sito, 17, 2) as part_2lettere,
  SUBSTRING(num_iscr_sito, 19, 4) as part_4cifre_finale,
  -- Validazione
  CASE 
    WHEN num_iscr_sito ~ '^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$'
    THEN '✅ VALIDO'
    ELSE '❌ INVALIDO'
  END as validazione_pattern,
  CASE 
    WHEN LENGTH(num_iscr_sito) = 22 
    THEN '✅ OK'
    ELSE '❌ ERRATO (' || LENGTH(num_iscr_sito) || ')'
  END as validazione_lunghezza
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- ==========================================
-- RISULTATO ATTESO:
-- num_iscr_sito: OP1000ABC123456-MI0001
-- lunghezza: 22
-- validazione_pattern: ✅ VALIDO
-- validazione_lunghezza: ✅ OK
-- ==========================================



