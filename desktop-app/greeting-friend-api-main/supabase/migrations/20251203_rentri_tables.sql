-- Migration: RENTRI Tables
-- Created: 2025-12-03
-- Description: Tabelle per modulo gestione rifiuti RENTRI

-- ==========================================
-- REGISTRI CRONOLOGICI
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_registri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  -- Dati registro
  anno INTEGER NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'carico', 'scarico', 'carico_scarico'
  numero_registro VARCHAR(100),
  
  -- Unità locale
  unita_locale VARCHAR(100),
  autorizzazione VARCHAR(200),
  
  -- Stati
  stato VARCHAR(30) DEFAULT 'bozza', -- 'bozza', 'attivo', 'vidimato', 'chiuso'
  vidimato_at TIMESTAMP,
  
  -- Sincronizzazione RENTRI
  rentri_id VARCHAR(100), -- ID del registro su RENTRI
  sync_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'synced', 'error'
  sync_at TIMESTAMP,
  sync_error TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_rentri_registri_org ON rentri_registri(org_id);
CREATE INDEX idx_rentri_registri_anno ON rentri_registri(anno);
CREATE INDEX idx_rentri_registri_stato ON rentri_registri(stato);

-- ==========================================
-- MOVIMENTI CARICO/SCARICO
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_movimenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  registro_id UUID REFERENCES rentri_registri(id) ON DELETE CASCADE NOT NULL,
  
  -- Riferimenti (OBBLIGATORI per RENTRI)
  anno INTEGER NOT NULL, -- Anno registrazione (>= 1980, <= 2050)
  progressivo INTEGER NOT NULL, -- Progressivo registrazione (>= 1)
  data_ora_registrazione TIMESTAMP NOT NULL, -- Data/ora registrazione (ISO 8601 UTC)
  
  -- Causale Operazione (OBBLIGATORIA)
  causale_operazione VARCHAR(10), -- Codice causale (es: "aT", "TR", "T*", "PS", "GI")
  
  -- Dati movimento (nostri, per UI)
  tipo_operazione VARCHAR(20) NOT NULL, -- 'carico', 'scarico' (derivato da causale)
  data_operazione DATE NOT NULL,
  numero_riga INTEGER,
  
  -- Rifiuto (OBBLIGATORIO)
  codice_eer VARCHAR(10) NOT NULL, -- Codice EER a 6 cifre (es: 170101)
  descrizione_eer TEXT, -- Descrizione (obbligatoria se EER finisce con .99)
  
  -- Quantità (OBBLIGATORIA)
  quantita DECIMAL(12, 4) NOT NULL, -- Max 10 cifre intere + 4 decimali
  unita_misura VARCHAR(10) NOT NULL DEFAULT 'kg', -- RENTRI accetta principalmente 'kg'
  
  -- Provenienza (opzionale ma importante)
  provenienza VARCHAR(10), -- Codice provenienza da tabella RENTRI
  
  -- Caratteristiche pericolo (array, per rifiuti pericolosi)
  caratteristiche_pericolo TEXT[], -- Array di codici HP (es: ["HP14", "HP15"])
  
  -- Integrazione FIR (opzionale, per causali trasporto)
  numero_fir VARCHAR(20), -- Numero formulario
  data_inizio_trasporto TIMESTAMP, -- ISO 8601 UTC
  data_fine_trasporto TIMESTAMP, -- ISO 8601 UTC (per esito)
  peso_verificato_destino DECIMAL(12, 4), -- Peso a destino
  
  -- Origine/Destinazione (nostro, per display)
  provenienza_destinazione VARCHAR(255),
  riferimento_fir VARCHAR(100), -- Riferimento formulario (nostro)
  
  -- Annotazioni
  annotazioni TEXT, -- Max 500 caratteri per RENTRI
  note TEXT, -- Note interne (non trasmesse)
  
  -- Sincronizzazione RENTRI
  rentri_id VARCHAR(100), -- IdentificativoRentri (pattern: ^M[0-9A-Z]{19}$)
  sync_status VARCHAR(30) DEFAULT 'pending',
  sync_at TIMESTAMP,
  sync_error TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(registro_id, anno, progressivo)
);

CREATE INDEX idx_rentri_movimenti_org ON rentri_movimenti(org_id);
CREATE INDEX idx_rentri_movimenti_registro ON rentri_movimenti(registro_id);
CREATE INDEX idx_rentri_movimenti_data ON rentri_movimenti(data_operazione);
CREATE INDEX idx_rentri_movimenti_codice_eer ON rentri_movimenti(codice_eer);

-- ==========================================
-- FORMULARI (FIR)
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_formulari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificazione
  numero_fir VARCHAR(50),
  anno INTEGER,
  data_creazione DATE NOT NULL,
  
  -- Produttore/Detentore
  produttore_cf VARCHAR(16),
  produttore_nome VARCHAR(255),
  produttore_indirizzo TEXT,
  
  -- Trasportatore
  trasportatore_cf VARCHAR(16),
  trasportatore_nome VARCHAR(255),
  trasportatore_targa VARCHAR(20),
  trasportatore_albo VARCHAR(100),
  
  -- Destinatario
  destinatario_cf VARCHAR(16),
  destinatario_nome VARCHAR(255),
  destinatario_indirizzo TEXT,
  destinatario_autorizzazione VARCHAR(100),
  
  -- Rifiuti (array JSON)
  codici_eer JSONB, -- [{codice, descrizione, quantita, unita, caratteristiche}]
  
  -- Date trasporto
  data_inizio_trasporto TIMESTAMP,
  data_fine_trasporto TIMESTAMP,
  data_accettazione TIMESTAMP,
  
  -- Stati
  stato VARCHAR(30) DEFAULT 'bozza', -- 'bozza', 'trasmesso', 'accettato', 'rifiutato', 'annullato'
  
  -- RENTRI
  rentri_id VARCHAR(100),
  rentri_numero VARCHAR(100), -- Numero assegnato da RENTRI
  pdf_url TEXT, -- URL PDF generato
  
  -- Sincronizzazione
  sync_status VARCHAR(30) DEFAULT 'pending',
  sync_at TIMESTAMP,
  sync_error TEXT,
  
  -- Note
  note TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_rentri_formulari_org ON rentri_formulari(org_id);
CREATE INDEX idx_rentri_formulari_stato ON rentri_formulari(stato);
CREATE INDEX idx_rentri_formulari_data ON rentri_formulari(data_creazione);
CREATE INDEX idx_rentri_formulari_anno ON rentri_formulari(anno);

-- ==========================================
-- CODIFICHE (Cache)
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_codifiche (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificazione
  tabella VARCHAR(50) NOT NULL, -- 'Paesi', 'CodiciEER', 'UnitaMisura', ecc.
  codice VARCHAR(50) NOT NULL,
  descrizione TEXT,
  
  -- Dati completi
  data JSONB, -- Dati completi della codifica da RENTRI
  
  -- Cache
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  
  UNIQUE(tabella, codice)
);

CREATE INDEX idx_rentri_codifiche_tabella ON rentri_codifiche(tabella);
CREATE INDEX idx_rentri_codifiche_codice ON rentri_codifiche(codice);
CREATE INDEX idx_rentri_codifiche_expires ON rentri_codifiche(expires_at);

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Registri
ALTER TABLE rentri_registri ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view registri of their org"
  ON rentri_registri FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert registri in their org"
  ON rentri_registri FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update registri of their org"
  ON rentri_registri FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete registri of their org"
  ON rentri_registri FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Movimenti
ALTER TABLE rentri_movimenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movimenti of their org"
  ON rentri_movimenti FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert movimenti in their org"
  ON rentri_movimenti FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update movimenti of their org"
  ON rentri_movimenti FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete movimenti of their org"
  ON rentri_movimenti FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Formulari
ALTER TABLE rentri_formulari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view formulari of their org"
  ON rentri_formulari FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert formulari in their org"
  ON rentri_formulari FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update formulari of their org"
  ON rentri_formulari FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete formulari of their org"
  ON rentri_formulari FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Codifiche (public read)
ALTER TABLE rentri_codifiche ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codifiche"
  ON rentri_codifiche FOR SELECT
  TO authenticated
  USING (true);

-- ==========================================
-- TRIGGERS per updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_rentri_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rentri_registri_updated_at
  BEFORE UPDATE ON rentri_registri
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_updated_at();

CREATE TRIGGER update_rentri_movimenti_updated_at
  BEFORE UPDATE ON rentri_movimenti
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_updated_at();

CREATE TRIGGER update_rentri_formulari_updated_at
  BEFORE UPDATE ON rentri_formulari
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_updated_at();

-- ==========================================
-- COMMENTI
-- ==========================================

COMMENT ON TABLE rentri_registri IS 'Registri cronologici carico/scarico rifiuti per RENTRI';
COMMENT ON TABLE rentri_movimenti IS 'Movimenti singoli di carico/scarico rifiuti';
COMMENT ON TABLE rentri_formulari IS 'Formulari di Identificazione Rifiuti (FIR)';
COMMENT ON TABLE rentri_codifiche IS 'Cache codifiche RENTRI (EER, unità misura, ecc.)';

