-- Migration: Allineamento completo campi RENTRI Formulari
-- Created: 2026-02-13
-- Description: Allinea la tabella rentri_formulari con il modello NuovoFormularioModel
--              dell'API RENTRI (formulari-v1.0.json)
-- Ref: DatiPartenzaModel, DatiRifiutoModel, DatiTrasportoTerrestreModel,
--      DatiProduttoreFormularioModel, DatiDestinatarioFormularioModel,
--      DatiTrasportatoreFormularioModel, DatiIntermediariFormularioModel

-- ==========================================
-- 1. PRODUTTORE - Campi mancanti
-- ==========================================

-- Indirizzo strutturato (IndirizzoModel: citta/comune_id, indirizzo, civico, cap)
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS produttore_comune_id VARCHAR(6),
  ADD COLUMN IF NOT EXISTS produttore_civico VARCHAR(20),
  ADD COLUMN IF NOT EXISTS produttore_cap VARCHAR(20),
  ADD COLUMN IF NOT EXISTS produttore_nazione_id VARCHAR(2) DEFAULT 'IT';

COMMENT ON COLUMN rentri_formulari.produttore_comune_id IS 'Codice ISTAT comune produttore (IndirizzoModel.citta.comune_id)';
COMMENT ON COLUMN rentri_formulari.produttore_civico IS 'Numero civico produttore (IndirizzoModel.civico)';
COMMENT ON COLUMN rentri_formulari.produttore_cap IS 'CAP produttore (IndirizzoModel.cap)';
COMMENT ON COLUMN rentri_formulari.produttore_nazione_id IS 'Nazione produttore ISO 3166-1 alpha-2 (default IT)';

-- Luogo produzione strutturato (se diverso da indirizzo)
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS produttore_luogo_prod_indirizzo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS produttore_luogo_prod_civico VARCHAR(20),
  ADD COLUMN IF NOT EXISTS produttore_luogo_prod_comune_id VARCHAR(6),
  ADD COLUMN IF NOT EXISTS produttore_luogo_prod_cap VARCHAR(20);

COMMENT ON COLUMN rentri_formulari.produttore_luogo_prod_indirizzo IS 'Indirizzo luogo produzione se diverso da sede (IndirizzoModel)';

-- Autorizzazione produttore (AutorizzazioneModel)
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS produttore_autorizzazione_numero VARCHAR(50),
  ADD COLUMN IF NOT EXISTS produttore_autorizzazione_tipo VARCHAR(30);

COMMENT ON COLUMN rentri_formulari.produttore_autorizzazione_numero IS 'Numero autorizzazione produttore (AutorizzazioneModel.numero)';
COMMENT ON COLUMN rentri_formulari.produttore_autorizzazione_tipo IS 'Tipo autorizzazione produttore (TipiAutorizzazione enum)';

-- Detentore flag
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS produttore_detentore BOOLEAN DEFAULT false;

COMMENT ON COLUMN rentri_formulari.produttore_detentore IS 'true se il produttore è detentore del rifiuto';

-- Iscrizione Albo produttore
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS produttore_iscrizione_albo VARCHAR(10);

COMMENT ON COLUMN rentri_formulari.produttore_iscrizione_albo IS 'Iscrizione Albo produttore - pattern: XX/000000';

-- ==========================================
-- 2. DESTINATARIO - Campi mancanti
-- ==========================================

-- Indirizzo strutturato
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS destinatario_comune_id VARCHAR(6),
  ADD COLUMN IF NOT EXISTS destinatario_civico VARCHAR(20),
  ADD COLUMN IF NOT EXISTS destinatario_cap VARCHAR(20),
  ADD COLUMN IF NOT EXISTS destinatario_nazione_id VARCHAR(2) DEFAULT 'IT';

COMMENT ON COLUMN rentri_formulari.destinatario_comune_id IS 'Codice ISTAT comune destinatario (IndirizzoModel.citta.comune_id)';
COMMENT ON COLUMN rentri_formulari.destinatario_civico IS 'Numero civico destinatario';
COMMENT ON COLUMN rentri_formulari.destinatario_cap IS 'CAP destinatario';
COMMENT ON COLUMN rentri_formulari.destinatario_nazione_id IS 'Nazione destinatario ISO 3166-1 alpha-2 (default IT)';

-- Iscrizione Albo destinatario
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS destinatario_iscrizione_albo VARCHAR(10);

COMMENT ON COLUMN rentri_formulari.destinatario_iscrizione_albo IS 'Iscrizione Albo destinatario - pattern: XX/000000';

-- ==========================================
-- 3. TRASPORTATORE - Campi mancanti
-- ==========================================

-- Tipo trasporto (required in RENTRI)
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS trasportatore_tipo_trasporto VARCHAR(15) DEFAULT 'Terrestre';

COMMENT ON COLUMN rentri_formulari.trasportatore_tipo_trasporto IS 'Tipo trasporto: Terrestre, Ferroviario, Marittimo (TipoTrasporto enum)';

-- Nazione trasportatore
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS trasportatore_nazione_id VARCHAR(2) DEFAULT 'IT';

COMMENT ON COLUMN rentri_formulari.trasportatore_nazione_id IS 'Nazione trasportatore ISO 3166-1 alpha-2';

-- Num iscrizione sito trasportatore
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS trasportatore_num_iscr_sito VARCHAR(50);

COMMENT ON COLUMN rentri_formulari.trasportatore_num_iscr_sito IS 'Numero iscrizione sito RENTRI del trasportatore';

-- Percorso (se diverso dal più breve)
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS trasporto_percorso VARCHAR(250);

COMMENT ON COLUMN rentri_formulari.trasporto_percorso IS 'Percorso trasporto se diverso dal più breve (max 250 chars)';

-- ==========================================
-- 4. INTERMEDIARI (sezione completamente nuova)
-- ==========================================

ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS intermediari JSONB;

COMMENT ON COLUMN rentri_formulari.intermediari IS 'Array intermediari [{denominazione, codice_fiscale, nazione_id, numero_iscrizione_albo}]';

-- ==========================================
-- 5. RIFIUTO - Campi mancanti nel JSONB codici_eer
--    (questi campi vanno dentro il JSONB, ma aggiungiamo
--     anche colonne top-level per i campi globali del rifiuto)
-- ==========================================

-- Caratteristiche chimico-fisiche
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS rifiuto_caratteristiche_chimico_fisiche VARCHAR(500);

COMMENT ON COLUMN rentri_formulari.rifiuto_caratteristiche_chimico_fisiche IS 'Caratteristiche chimico fisiche del rifiuto (DatiRifiutoModel.caratteristiche_chimico_fisiche)';

-- ADR
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS rifiuto_trasporto_adr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rifiuto_adr_numero_onu VARCHAR(20),
  ADD COLUMN IF NOT EXISTS rifiuto_adr_classe VARCHAR(20),
  ADD COLUMN IF NOT EXISTS rifiuto_adr_note VARCHAR(500);

COMMENT ON COLUMN rentri_formulari.rifiuto_trasporto_adr IS 'true se trasporto soggetto a normativa ADR';
COMMENT ON COLUMN rentri_formulari.rifiuto_adr_numero_onu IS 'Numero ONU ADR (NormativaADRModel.numero_onu)';
COMMENT ON COLUMN rentri_formulari.rifiuto_adr_classe IS 'Classe ADR (NormativaADRModel.classe)';
COMMENT ON COLUMN rentri_formulari.rifiuto_adr_note IS 'Note ADR (NormativaADRModel.note)';

-- Analisi/Classificazione
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS rifiuto_analisi_tipo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS rifiuto_analisi_numero VARCHAR(50),
  ADD COLUMN IF NOT EXISTS rifiuto_analisi_data DATE;

COMMENT ON COLUMN rentri_formulari.rifiuto_analisi_tipo IS 'Tipo: Analisi o Classificazione (AnalisiClassificazioneModel.tipo)';
COMMENT ON COLUMN rentri_formulari.rifiuto_analisi_numero IS 'Numero analisi/classificazione (AnalisiClassificazioneModel.numero)';
COMMENT ON COLUMN rentri_formulari.rifiuto_analisi_data IS 'Data analisi/classificazione';

-- Numero colli (già aggiunto in fix_fields come INTEGER, RENTRI lo vuole VARCHAR(50))
-- Rinfusa
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS rifiuto_rinfusa BOOLEAN;

COMMENT ON COLUMN rentri_formulari.rifiuto_rinfusa IS 'true se rifiuto trasportato alla rinfusa';

-- Verificato in partenza
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS rifiuto_verificato_in_partenza BOOLEAN;

COMMENT ON COLUMN rentri_formulari.rifiuto_verificato_in_partenza IS 'true se quantità verificata in partenza';

-- ==========================================
-- 6. ANNOTAZIONI (campo dati_partenza.annotazioni, diverso da note)
-- ==========================================

ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS annotazioni TEXT;

COMMENT ON COLUMN rentri_formulari.annotazioni IS 'Annotazioni ufficiali FIR (DatiPartenzaModel.annotazioni) - diverso da note interne';

-- ==========================================
-- 7. FIX FORMATI ESISTENTI
-- ==========================================

-- CF: estendi da 16 a 20 chars (RENTRI supporta P.IVA estera 5-20 chars)
ALTER TABLE rentri_formulari
  ALTER COLUMN produttore_cf TYPE VARCHAR(20),
  ALTER COLUMN trasportatore_cf TYPE VARCHAR(20),
  ALTER COLUMN destinatario_cf TYPE VARCHAR(20);

-- numero_colli: cambia da INTEGER a VARCHAR(50) per conformità RENTRI
ALTER TABLE rentri_formulari
  ALTER COLUMN numero_colli TYPE VARCHAR(50) USING numero_colli::VARCHAR(50);

-- trasportatore_albo: RENTRI pattern ^([A-Za-z]{2})/([0-9]{6})$ max 10
-- Non restringiamo il campo esistente per non rompere dati, ma aggiungiamo commento
COMMENT ON COLUMN rentri_formulari.trasportatore_albo IS 'Iscrizione Albo trasportatore - RENTRI pattern: XX/000000 (max 10 chars)';

-- ==========================================
-- 8. NUM_ISCR_SITO del formulario (top-level, required in NuovoFormularioModel)
-- ==========================================

ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS num_iscr_sito VARCHAR(50);

COMMENT ON COLUMN rentri_formulari.num_iscr_sito IS 'Numero iscrizione unità locale di riferimento FIR (NuovoFormularioModel.num_iscr_sito) - pattern: OP...';

-- ==========================================
-- 9. CONSTRAINT DI VALIDAZIONE
-- ==========================================

ALTER TABLE rentri_formulari
  DROP CONSTRAINT IF EXISTS check_tipo_trasporto;

ALTER TABLE rentri_formulari
  ADD CONSTRAINT check_tipo_trasporto
  CHECK (trasportatore_tipo_trasporto IS NULL OR trasportatore_tipo_trasporto IN ('Terrestre', 'Ferroviario', 'Marittimo'));

ALTER TABLE rentri_formulari
  DROP CONSTRAINT IF EXISTS check_analisi_tipo;

ALTER TABLE rentri_formulari
  ADD CONSTRAINT check_analisi_tipo
  CHECK (rifiuto_analisi_tipo IS NULL OR rifiuto_analisi_tipo IN ('Analisi', 'Classificazione'));

ALTER TABLE rentri_formulari
  DROP CONSTRAINT IF EXISTS check_produttore_aut_tipo;

ALTER TABLE rentri_formulari
  ADD CONSTRAINT check_produttore_aut_tipo
  CHECK (produttore_autorizzazione_tipo IS NULL OR produttore_autorizzazione_tipo IN (
    'RecSmalArt208', 'RecSmalImpMobiliArt208', 'RicercaSperimentazione', 'AIA',
    'RecProcSemplificata', 'OpBonifica', 'Straordinario',
    'ComTrattamentoAcqueReflue', 'AutTrattamentoAcqueReflue'
  ));

-- ==========================================
-- 10. INDICI
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_rentri_formulari_num_iscr_sito
  ON rentri_formulari(num_iscr_sito) WHERE num_iscr_sito IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rentri_formulari_trasp_num_iscr
  ON rentri_formulari(trasportatore_num_iscr_sito) WHERE trasportatore_num_iscr_sito IS NOT NULL;

-- Fine migration
