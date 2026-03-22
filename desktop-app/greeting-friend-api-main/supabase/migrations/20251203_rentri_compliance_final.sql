-- Migration: RENTRI Final Compliance - Solo NumIscrSito
-- Created: 2025-12-03
-- Description: Aggiungi solo i campi NumIscrSito mancanti

-- ==========================================
-- NumIscrSito - Numero Iscrizione Sito RENTRI
-- ==========================================

-- Registro: Aggiungi se non esiste
ALTER TABLE rentri_registri 
  ADD COLUMN IF NOT EXISTS num_iscr_sito VARCHAR(50);

-- Formulari: Aggiungi se non esistono
ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS produttore_num_iscr_sito VARCHAR(50),
  ADD COLUMN IF NOT EXISTS detentore_num_iscr_sito VARCHAR(50),
  ADD COLUMN IF NOT EXISTS destinatario_num_iscr_sito VARCHAR(50);

-- ==========================================
-- Commenti per documentazione
-- ==========================================

COMMENT ON COLUMN rentri_registri.num_iscr_sito IS 
  'Numero iscrizione unità locale su RENTRI - Pattern: ^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$ - Es: OP4293P62805657-BZ5072';

COMMENT ON COLUMN rentri_formulari.produttore_num_iscr_sito IS 
  'Numero iscrizione sito RENTRI del produttore - Identifica univocamente unità locale';

COMMENT ON COLUMN rentri_formulari.destinatario_num_iscr_sito IS 
  'Numero iscrizione sito RENTRI del destinatario - Identifica univocamente unità locale';

COMMENT ON COLUMN rentri_formulari.detentore_num_iscr_sito IS 
  'Numero iscrizione sito RENTRI del detentore (se diverso da produttore)';

-- ==========================================
-- Indici per Performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_rentri_registri_num_iscr_sito 
  ON rentri_registri(num_iscr_sito) WHERE num_iscr_sito IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rentri_formulari_prod_num_iscr 
  ON rentri_formulari(produttore_num_iscr_sito) WHERE produttore_num_iscr_sito IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rentri_formulari_dest_num_iscr 
  ON rentri_formulari(destinatario_num_iscr_sito) WHERE destinatario_num_iscr_sito IS NOT NULL;

-- ==========================================
-- FINE - Solo i campi essenziali
-- ==========================================

-- Nota: Gli altri campi (stato_fisico, caratteristiche_pericolo, esito)
-- sono già presenti dalle migration precedenti o gestiti in JS nel form
