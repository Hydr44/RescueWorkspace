-- =====================================================
-- RENTRI SCHEMA UPDATE - Allineamento con Supabase
-- =====================================================
-- Aggiunge colonne mancanti alle tabelle RENTRI
-- =====================================================

-- =====================================================
-- AGGIORNAMENTO rentri_movimenti
-- =====================================================

-- Aggiungi colonne mancanti se non esistono
DO $$ 
BEGIN
  -- Provenienza codice
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_movimenti' AND column_name='provenienza_codice') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN provenienza_codice VARCHAR(10);
  END IF;

  -- Annotazioni (max 500 caratteri per RENTRI)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_movimenti' AND column_name='annotazioni') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN annotazioni TEXT;
  END IF;

  -- Numero FIR
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_movimenti' AND column_name='numero_fir') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN numero_fir VARCHAR(20);
  END IF;

  -- Data inizio trasporto
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_movimenti' AND column_name='data_inizio_trasporto') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN data_inizio_trasporto TIMESTAMP;
  END IF;

  -- Data fine trasporto
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_movimenti' AND column_name='data_fine_trasporto') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN data_fine_trasporto TIMESTAMP;
  END IF;

  -- Riferimento FIR (nostro)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_movimenti' AND column_name='riferimento_fir') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN riferimento_fir VARCHAR(100);
  END IF;

  -- Descrizione EER
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_movimenti' AND column_name='descrizione_eer') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN descrizione_eer TEXT;
  END IF;

  RAISE NOTICE 'Colonne rentri_movimenti aggiornate';
END $$;

-- =====================================================
-- AGGIORNAMENTO rentri_registri
-- =====================================================

DO $$ 
BEGIN
  -- Attività (array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_registri' AND column_name='attivita') THEN
    ALTER TABLE rentri_registri ADD COLUMN attivita TEXT[];
  END IF;

  -- Descrizione
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_registri' AND column_name='descrizione') THEN
    ALTER TABLE rentri_registri ADD COLUMN descrizione VARCHAR(255);
  END IF;

  -- Numero iscrizione sito
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_registri' AND column_name='num_iscr_sito') THEN
    ALTER TABLE rentri_registri ADD COLUMN num_iscr_sito VARCHAR(100);
  END IF;

  -- Note
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_registri' AND column_name='note') THEN
    ALTER TABLE rentri_registri ADD COLUMN note TEXT;
  END IF;

  RAISE NOTICE 'Colonne rentri_registri aggiornate';
END $$;

-- =====================================================
-- AGGIORNAMENTO rentri_formulari
-- =====================================================

DO $$ 
BEGIN
  -- Produttore comune ID
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_formulari' AND column_name='produttore_comune_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_comune_id VARCHAR(10);
  END IF;

  -- Destinatario comune ID
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_formulari' AND column_name='destinatario_comune_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_comune_id VARCHAR(10);
  END IF;

  -- Trasporto transfrontaliero
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_formulari' AND column_name='trasporto_transfrontaliero') THEN
    ALTER TABLE rentri_formulari ADD COLUMN trasporto_transfrontaliero BOOLEAN DEFAULT false;
  END IF;

  -- Tipo trasporto transfrontaliero
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='rentri_formulari' AND column_name='tipo_trasporto_transfrontaliero') THEN
    ALTER TABLE rentri_formulari ADD COLUMN tipo_trasporto_transfrontaliero VARCHAR(10);
  END IF;

  RAISE NOTICE 'Colonne rentri_formulari aggiornate';
END $$;

-- =====================================================
-- COMMENTI
-- =====================================================

COMMENT ON COLUMN rentri_movimenti.provenienza_codice IS 'Codice provenienza da tabella RENTRI';
COMMENT ON COLUMN rentri_movimenti.annotazioni IS 'Annotazioni (max 500 caratteri per RENTRI)';
COMMENT ON COLUMN rentri_movimenti.numero_fir IS 'Numero formulario';
COMMENT ON COLUMN rentri_movimenti.data_inizio_trasporto IS 'Data inizio trasporto (ISO 8601 UTC)';
COMMENT ON COLUMN rentri_movimenti.data_fine_trasporto IS 'Data fine trasporto (ISO 8601 UTC)';
COMMENT ON COLUMN rentri_movimenti.riferimento_fir IS 'Riferimento formulario (nostro)';
COMMENT ON COLUMN rentri_movimenti.descrizione_eer IS 'Descrizione EER (obbligatoria se EER finisce con .99)';

COMMENT ON COLUMN rentri_registri.attivita IS 'Array di attività (Produzione, Recupero, Smaltimento, ecc.)';
COMMENT ON COLUMN rentri_registri.descrizione IS 'Descrizione registro';
COMMENT ON COLUMN rentri_registri.num_iscr_sito IS 'Numero iscrizione sito';
COMMENT ON COLUMN rentri_registri.note IS 'Note interne';

-- =====================================================
-- REPORT FINALE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RENTRI SCHEMA UPDATE - COMPLETATO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabella rentri_movimenti aggiornata';
  RAISE NOTICE 'Tabella rentri_registri aggiornata';
  RAISE NOTICE 'Tabella rentri_formulari aggiornata';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Ora puoi applicare i dati di test!';
  RAISE NOTICE '========================================';
END $$;
