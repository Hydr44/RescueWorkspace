-- ============================================
-- Aggiungi NumIscrSito ai certificati RENTRI
-- ============================================

-- Aggiungi colonna num_iscr_sito
ALTER TABLE rentri_org_certificates
ADD COLUMN IF NOT EXISTS num_iscr_sito VARCHAR(50);

-- Aggiorna certificato esistente con NumIscrSito dedotto dal RENTRI ID
-- Formato: OP + RENTRI_ID + -MI00001 (MI = provincia sede, 00001 = sito)
UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP100011134-MI00001'
WHERE cf_operatore = 'SCZMNL05L21D960T'
AND environment = 'demo';

-- Verifica
SELECT 
  cf_operatore,
  num_iscr_sito,
  environment,
  is_active
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- Dovrebbe mostrare: num_iscr_sito = 'OP100011134-MI00001'

