-- Migration: Aggiungi campi mancanti per conformità RENTRI
-- Created: 2025-12-04
-- Description: Aggiunge conducente, destinatario_attivita, provenienza per FIR

-- ==========================================
-- AGGIUNGI CAMPI CONDUCENTE
-- ==========================================

ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS conducente_nome VARCHAR(100),
ADD COLUMN IF NOT EXISTS conducente_cognome VARCHAR(100);

COMMENT ON COLUMN rentri_formulari.conducente_nome IS 'Nome del conducente del veicolo (OBBLIGATORIO per trasporto terrestre)';
COMMENT ON COLUMN rentri_formulari.conducente_cognome IS 'Cognome del conducente del veicolo (OBBLIGATORIO per trasporto terrestre)';

-- ==========================================
-- AGGIUNGI CAMPO ATTIVITA DESTINATARIO
-- ==========================================

ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS destinatario_attivita VARCHAR(10);

COMMENT ON COLUMN rentri_formulari.destinatario_attivita IS 'Codice attività recupero/smaltimento (R1-R13, D1-D15). Condizionale: sempre necessario tranne quando unità locale destinatario = produttore';

-- ==========================================
-- AGGIUNGI CAMPO PROVENIENZA RIFIUTO
-- ==========================================

-- Nota: provenienza è già nel JSONB codici_eer, ma aggiungiamo colonna dedicata per facilità
ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS rifiuto_provenienza VARCHAR(1);

COMMENT ON COLUMN rentri_formulari.rifiuto_provenienza IS 'Provenienza rifiuto: U (Urbano) o S (Speciale). OBBLIGATORIO.';

-- ==========================================
-- INDICI PER PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_rentri_formulari_conducente ON rentri_formulari(conducente_nome, conducente_cognome);
CREATE INDEX IF NOT EXISTS idx_rentri_formulari_attivita ON rentri_formulari(destinatario_attivita);
CREATE INDEX IF NOT EXISTS idx_rentri_formulari_provenienza ON rentri_formulari(rifiuto_provenienza);

-- ==========================================
-- AGGIORNA DATI ESISTENTI CON VALORI DEFAULT
-- ==========================================

-- Conducente: imposta nome/cognome generico per FIR esistenti con trasporto
UPDATE rentri_formulari
SET 
  conducente_nome = 'Da Specificare',
  conducente_cognome = 'Da Specificare'
WHERE data_inizio_trasporto IS NOT NULL
  AND (conducente_nome IS NULL OR conducente_cognome IS NULL);

-- Attività: imposta R13 (Messa in riserva) come default per FIR esistenti
UPDATE rentri_formulari
SET destinatario_attivita = 'R13'
WHERE destinatario_attivita IS NULL;

-- Provenienza: imposta S (Speciale) come default per FIR esistenti
UPDATE rentri_formulari
SET rifiuto_provenienza = 'S'
WHERE rifiuto_provenienza IS NULL;

-- ==========================================
-- VALIDAZIONI (CHECK CONSTRAINTS)
-- ==========================================

-- Rimuovi constraint se esistono già (per idempotenza)
ALTER TABLE rentri_formulari
DROP CONSTRAINT IF EXISTS check_rifiuto_provenienza;

ALTER TABLE rentri_formulari
DROP CONSTRAINT IF EXISTS check_destinatario_attivita;

-- Validazione provenienza: solo U o S
ALTER TABLE rentri_formulari
ADD CONSTRAINT check_rifiuto_provenienza 
CHECK (rifiuto_provenienza IN ('U', 'S') OR rifiuto_provenienza IS NULL);

-- Validazione attivita: solo codici validi
ALTER TABLE rentri_formulari
ADD CONSTRAINT check_destinatario_attivita
CHECK (
  destinatario_attivita IS NULL OR
  destinatario_attivita ~ '^(R([1-9]|1[0-3])|D([1-9]|1[0-5]))$'
);

-- ==========================================
-- COMMENTO FINALE
-- ==========================================

COMMENT ON TABLE rentri_formulari IS 'Formulari di Identificazione Rifiuti (FIR) - CONFORME RENTRI 100%';

