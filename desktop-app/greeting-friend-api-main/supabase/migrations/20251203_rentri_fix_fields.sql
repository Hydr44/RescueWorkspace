-- Migration: Fix RENTRI Fields per Compliance
-- Created: 2025-12-03
-- Description: Aggiunge campi obbligatori mancanti secondo spec RENTRI

-- ==========================================
-- FIX MOVIMENTI - Campi RENTRI Obbligatori
-- ==========================================

-- Aggiungi campi riferimenti (OBBLIGATORI per RENTRI)
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS anno INTEGER,
  ADD COLUMN IF NOT EXISTS progressivo INTEGER,
  ADD COLUMN IF NOT EXISTS data_ora_registrazione TIMESTAMP;

-- Aggiungi causale operazione (OBBLIGATORIA)
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS causale_operazione VARCHAR(10);

-- Rinomina descrizione → descrizione_eer (spec RENTRI)
ALTER TABLE rentri_movimenti 
  RENAME COLUMN descrizione TO descrizione_eer;

-- Aggiungi stato fisico (OBBLIGATORIO per rifiuto)
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS stato_fisico VARCHAR(10);

-- Aggiungi destinato_attivita (OBBLIGATORIO per rifiuto)
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS destinato_attivita VARCHAR(10);

-- Aggiungi provenienza codificata (non solo testo libero)
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS provenienza_codice VARCHAR(10);

-- Aggiungi caratteristiche pericolo (array per rifiuti pericolosi)
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS caratteristiche_pericolo TEXT[];

-- Aggiungi campi VFU (Veicoli Fuori Uso)
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS veicolo_fuori_uso BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vfu_numero_registro VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vfu_data_registro DATE;

-- Aggiungi campi integrazione FIR
ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS trasporto_transfrontaliero BOOLEAN,
  ADD COLUMN IF NOT EXISTS tipo_trasporto_transfrontaliero VARCHAR(10),
  ADD COLUMN IF NOT EXISTS peso_verificato_destino DECIMAL(12, 4);

-- Modifica quantita per supportare 4 decimali (spec RENTRI)
ALTER TABLE rentri_movimenti 
  ALTER COLUMN quantita TYPE DECIMAL(12, 4);

-- Aggiungi constraint per anno/progressivo
ALTER TABLE rentri_movimenti 
  ADD CONSTRAINT chk_anno CHECK (anno IS NULL OR (anno >= 1980 AND anno <= 2050)),
  ADD CONSTRAINT chk_progressivo CHECK (progressivo IS NULL OR progressivo >= 1);

-- ==========================================
-- FIX FORMULARI - Campi Aggiuntivi
-- ==========================================

-- Aggiungi campi mancanti per FIR completo
ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS produttore_pec VARCHAR(255),
  ADD COLUMN IF NOT EXISTS trasportatore_pec VARCHAR(255),
  ADD COLUMN IF NOT EXISTS destinatario_pec VARCHAR(255);

-- Aggiungi dati veicolo trasportatore
ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS trasportatore_rimorchio VARCHAR(20);

-- Aggiungi peso totale
ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS peso_totale_kg DECIMAL(12, 4);

-- Aggiungi numero colli
ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS numero_colli INTEGER;

-- Aggiungi tipo imballaggio
ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS tipo_imballaggio VARCHAR(50);

-- ==========================================
-- FIX REGISTRI - Campi Aggiuntivi
-- ==========================================

-- Aggiungi tipo registro secondo spec RENTRI
ALTER TABLE rentri_registri 
  ADD COLUMN IF NOT EXISTS tipo_registro VARCHAR(50);
  -- Valori: 'carico_scarico', 'carico', 'scarico', 'intermediazione', 'commercio'

-- Aggiungi dati unità locale completi
ALTER TABLE rentri_registri 
  ADD COLUMN IF NOT EXISTS unita_locale_indirizzo TEXT,
  ADD COLUMN IF NOT EXISTS unita_locale_comune VARCHAR(100),
  ADD COLUMN IF NOT EXISTS unita_locale_provincia VARCHAR(2),
  ADD COLUMN IF NOT EXISTS unita_locale_cap VARCHAR(5);

-- ==========================================
-- INDICI AGGIUNTIVI
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_rentri_movimenti_anno_prog 
  ON rentri_movimenti(registro_id, anno, progressivo);

CREATE INDEX IF NOT EXISTS idx_rentri_movimenti_causale 
  ON rentri_movimenti(causale_operazione);

CREATE INDEX IF NOT EXISTS idx_rentri_movimenti_data_ora 
  ON rentri_movimenti(data_ora_registrazione);

-- ==========================================
-- COMMENTI AGGIORNATI
-- ==========================================

COMMENT ON COLUMN rentri_movimenti.codice_eer IS 
  'Codice EER (European Waste List) a 6 cifre - es: 170101, 160104';

COMMENT ON COLUMN rentri_movimenti.causale_operazione IS 
  'Causale operazione RENTRI - es: aT (accettazione Trasporto), TR (Trasporto), PS (Produzione Scarico), GI (Giacenza)';

COMMENT ON COLUMN rentri_movimenti.stato_fisico IS 
  'Stato fisico rifiuto - Codifica RENTRI: solido, liquido, gassoso, fangoso';

COMMENT ON COLUMN rentri_movimenti.destinato_attivita IS 
  'Attività di recupero/smaltimento - Codifica RENTRI (es: R1, R3, D1, D15)';

COMMENT ON COLUMN rentri_movimenti.anno IS 
  'Anno registrazione movimento (>= 1980, <= 2050) - OBBLIGATORIO per RENTRI';

COMMENT ON COLUMN rentri_movimenti.progressivo IS 
  'Numero progressivo movimento nel registro - OBBLIGATORIO per RENTRI';

COMMENT ON COLUMN rentri_movimenti.data_ora_registrazione IS 
  'Data e ora registrazione movimento (ISO 8601 UTC) - OBBLIGATORIO per RENTRI';

