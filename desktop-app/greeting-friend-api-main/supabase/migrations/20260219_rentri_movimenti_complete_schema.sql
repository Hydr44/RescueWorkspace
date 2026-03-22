-- =====================================================
-- RENTRI MOVIMENTI - Schema Completo
-- Aggiunge tutte le colonne usate dal form ma mancanti
-- =====================================================

DO $$
BEGIN

  -- ─── Rifiuto ───────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='stato_fisico') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN stato_fisico VARCHAR(5);
    COMMENT ON COLUMN rentri_movimenti.stato_fisico IS 'S=Solido, L=Liquido, F=Fangoso, G=Gassoso';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='destinato_attivita') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN destinato_attivita VARCHAR(10);
    COMMENT ON COLUMN rentri_movimenti.destinato_attivita IS 'Attività destinazione: R1-R13, D1-D15';
  END IF;

  -- ─── Caratteristiche pericolo HP ───────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='caratteristiche_pericolo') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN caratteristiche_pericolo TEXT[];
    COMMENT ON COLUMN rentri_movimenti.caratteristiche_pericolo IS 'Codici HP per rifiuti pericolosi (HP1-HP15)';
  END IF;

  -- ─── Categorie AEE/RAEE ────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='categorie_aee') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN categorie_aee TEXT[];
    COMMENT ON COLUMN rentri_movimenti.categorie_aee IS 'Categorie AEE per rifiuti RAEE';
  END IF;

  -- ─── Trasporto transfrontaliero ────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='trasporto_transfrontaliero') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN trasporto_transfrontaliero BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='tipo_trasporto_transfrontaliero') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN tipo_trasporto_transfrontaliero VARCHAR(50);
  END IF;

  -- ─── Esito conferimento ────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='peso_verificato_destino') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN peso_verificato_destino NUMERIC;
    COMMENT ON COLUMN rentri_movimenti.peso_verificato_destino IS 'Peso verificato a destinazione (per causali aT, T*aT)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='respingimento_tipo') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN respingimento_tipo VARCHAR(20);
    COMMENT ON COLUMN rentri_movimenti.respingimento_tipo IS 'Tipo respingimento: totale, parziale';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='respingimento_quantita') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN respingimento_quantita NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='respingimento_unita_misura') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN respingimento_unita_misura VARCHAR(10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='respingimento_causale') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN respingimento_causale VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='respingimento_causale_altro') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN respingimento_causale_altro TEXT;
  END IF;

  -- ─── Produttore ────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='produttore_denominazione') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN produttore_denominazione VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='produttore_codice_fiscale') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN produttore_codice_fiscale VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='produttore_indirizzo') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN produttore_indirizzo TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='produttore_comune_id') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN produttore_comune_id VARCHAR(10);
  END IF;

  -- ─── Trasportatore ─────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='trasportatore_denominazione') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN trasportatore_denominazione VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='trasportatore_codice_fiscale') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN trasportatore_codice_fiscale VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='trasportatore_num_iscrizione_albo') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN trasportatore_num_iscrizione_albo VARCHAR(100);
  END IF;

  -- ─── Destinatario ──────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='destinatario_denominazione') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN destinatario_denominazione VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='destinatario_codice_fiscale') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN destinatario_codice_fiscale VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='destinatario_num_autorizzazione') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN destinatario_num_autorizzazione VARCHAR(100);
  END IF;

  -- ─── Intermediario ─────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='intermediario_denominazione') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN intermediario_denominazione VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='intermediario_codice_fiscale') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN intermediario_codice_fiscale VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='intermediario_num_iscrizione_albo') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN intermediario_num_iscrizione_albo VARCHAR(100);
  END IF;

  -- ─── Annotazioni (separato da note interne) ────────
  -- annotazioni = campo RENTRI (max 500 char, trasmesso all'API)
  -- note = campo interno (non trasmesso)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_movimenti' AND column_name='annotazioni') THEN
    ALTER TABLE rentri_movimenti ADD COLUMN annotazioni TEXT;
    COMMENT ON COLUMN rentri_movimenti.annotazioni IS 'Annotazioni RENTRI (max 500 char, trasmesse API)';
  END IF;

  RAISE NOTICE 'rentri_movimenti: schema completo applicato';
END $$;

-- =====================================================
-- RENTRI REGISTRI - colonne mancanti
-- =====================================================

DO $$
BEGIN
  -- tipo_registro (alias di tipo, per compatibilità API RENTRI)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_registri' AND column_name='tipo_registro') THEN
    ALTER TABLE rentri_registri ADD COLUMN tipo_registro VARCHAR(50);
    COMMENT ON COLUMN rentri_registri.tipo_registro IS 'Tipo registro per API RENTRI (es: CaricoScarico)';
  END IF;

  -- unita_locale_indirizzo, comune, provincia, cap (strutturati)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_registri' AND column_name='unita_locale_indirizzo') THEN
    ALTER TABLE rentri_registri ADD COLUMN unita_locale_indirizzo TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_registri' AND column_name='unita_locale_comune') THEN
    ALTER TABLE rentri_registri ADD COLUMN unita_locale_comune VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_registri' AND column_name='unita_locale_provincia') THEN
    ALTER TABLE rentri_registri ADD COLUMN unita_locale_provincia VARCHAR(5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='rentri_registri' AND column_name='unita_locale_cap') THEN
    ALTER TABLE rentri_registri ADD COLUMN unita_locale_cap VARCHAR(10);
  END IF;

  RAISE NOTICE 'rentri_registri: schema aggiornato';
END $$;

-- =====================================================
-- REPORT
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RENTRI SCHEMA COMPLETO - APPLICATO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'rentri_movimenti: +stato_fisico, +destinato_attivita,';
  RAISE NOTICE '  +caratteristiche_pericolo, +categorie_aee,';
  RAISE NOTICE '  +trasporto_transfrontaliero, +tipo_trasporto_transfrontaliero,';
  RAISE NOTICE '  +peso_verificato_destino, +respingimento_*,';
  RAISE NOTICE '  +produttore_*, +trasportatore_*, +destinatario_*,';
  RAISE NOTICE '  +intermediario_*, +annotazioni';
  RAISE NOTICE 'rentri_registri: +tipo_registro, +unita_locale_*';
  RAISE NOTICE '========================================';
END $$;
