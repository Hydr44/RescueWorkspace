-- =====================================================
-- RENTRI FORMULARI - colonne mancanti
-- Aggiunge tutte le colonne usate dal form FIR
-- ma non presenti nella tabella rentri_formulari
-- =====================================================

DO $$
BEGIN
  -- Luogo produzione (se diverso da indirizzo produttore)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='luogo_prod_indirizzo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN luogo_prod_indirizzo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='luogo_prod_civico') THEN
    ALTER TABLE rentri_formulari ADD COLUMN luogo_prod_civico VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='luogo_prod_comune_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN luogo_prod_comune_id VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='luogo_prod_cap') THEN
    ALTER TABLE rentri_formulari ADD COLUMN luogo_prod_cap VARCHAR(5);
  END IF;

  -- Produttore campi aggiuntivi
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_civico') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_civico VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_comune_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_comune_id VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_cap') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_cap VARCHAR(5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_nazione_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_nazione_id VARCHAR(2) DEFAULT 'IT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_pec') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_pec VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_num_iscr_sito') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_num_iscr_sito VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_iscrizione_albo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_iscrizione_albo VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_autorizzazione_numero') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_autorizzazione_numero VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_autorizzazione_tipo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_autorizzazione_tipo VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='produttore_detentore') THEN
    ALTER TABLE rentri_formulari ADD COLUMN produttore_detentore BOOLEAN DEFAULT FALSE;
  END IF;

  -- Destinatario campi aggiuntivi
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_civico') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_civico VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_comune_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_comune_id VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_cap') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_cap VARCHAR(5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_nazione_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_nazione_id VARCHAR(2) DEFAULT 'IT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_pec') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_pec VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_num_iscr_sito') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_num_iscr_sito VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_iscrizione_albo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_iscrizione_albo VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='destinatario_autorizzazione_tipo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN destinatario_autorizzazione_tipo VARCHAR(50) DEFAULT 'RecSmalArt208';
  END IF;

  -- Trasportatore campi aggiuntivi
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='tipo_trasporto') THEN
    ALTER TABLE rentri_formulari ADD COLUMN tipo_trasporto VARCHAR(20) DEFAULT 'Terrestre';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='trasportatore_nazione_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN trasportatore_nazione_id VARCHAR(2) DEFAULT 'IT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='trasportatore_pec') THEN
    ALTER TABLE rentri_formulari ADD COLUMN trasportatore_pec VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='trasportatore_num_iscr_sito') THEN
    ALTER TABLE rentri_formulari ADD COLUMN trasportatore_num_iscr_sito VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='trasportatore_rimorchio') THEN
    ALTER TABLE rentri_formulari ADD COLUMN trasportatore_rimorchio VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='trasporto_percorso') THEN
    ALTER TABLE rentri_formulari ADD COLUMN trasporto_percorso TEXT;
  END IF;

  -- Conducente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='conducente_nome') THEN
    ALTER TABLE rentri_formulari ADD COLUMN conducente_nome VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='conducente_cognome') THEN
    ALTER TABLE rentri_formulari ADD COLUMN conducente_cognome VARCHAR(100);
  END IF;

  -- Detentore (se diverso dal produttore)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_cf') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_cf VARCHAR(16);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_nome') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_nome VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_indirizzo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_indirizzo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_civico') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_civico VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_comune_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_comune_id VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_cap') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_cap VARCHAR(5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_nazione_id') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_nazione_id VARCHAR(2) DEFAULT 'IT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='detentore_iscrizione_albo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN detentore_iscrizione_albo VARCHAR(100);
  END IF;

  -- Intermediario
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='intermediario_cf') THEN
    ALTER TABLE rentri_formulari ADD COLUMN intermediario_cf VARCHAR(16);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='intermediario_nome') THEN
    ALTER TABLE rentri_formulari ADD COLUMN intermediario_nome VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='intermediario_albo') THEN
    ALTER TABLE rentri_formulari ADD COLUMN intermediario_albo VARCHAR(100);
  END IF;

  -- Rifiuto
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='rifiuto_provenienza') THEN
    ALTER TABLE rentri_formulari ADD COLUMN rifiuto_provenienza VARCHAR(1) DEFAULT 'S';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='codici_eer') THEN
    ALTER TABLE rentri_formulari ADD COLUMN codici_eer JSONB DEFAULT '[]';
  END IF;

  -- Ora inizio trasporto (separata dalla data)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='ora_inizio_trasporto') THEN
    ALTER TABLE rentri_formulari ADD COLUMN ora_inizio_trasporto VARCHAR(5);
  END IF;

  -- Annotazioni e note
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='annotazioni') THEN
    ALTER TABLE rentri_formulari ADD COLUMN annotazioni TEXT;
  END IF;

  -- N. iscrizione sito (top-level)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='num_iscr_sito') THEN
    ALTER TABLE rentri_formulari ADD COLUMN num_iscr_sito VARCHAR(100);
  END IF;

  -- Environment (demo/prod)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentri_formulari' AND column_name='environment') THEN
    ALTER TABLE rentri_formulari ADD COLUMN environment VARCHAR(10) DEFAULT 'demo';
  END IF;

END $$;

