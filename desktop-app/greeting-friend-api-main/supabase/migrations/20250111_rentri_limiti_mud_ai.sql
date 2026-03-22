-- Migration: RENTRI Limiti Rifiuti, MUD e Validazione IA
-- Created: 2025-01-11
-- Description: Sistema limiti rifiuti, MUD e validazione IA pre-invio

-- ==========================================
-- LIMITI RIFIUTI PER ORGANIZZAZIONE
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_limiti_rifiuti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  -- Anno di riferimento
  anno INTEGER NOT NULL,
  
  -- Limiti per codice EER (opzionale, se NULL si applica a tutti)
  codice_eer VARCHAR(10), -- Codice EER specifico o NULL per limite totale
  
  -- Limiti quantità
  limite_quantita DECIMAL(15, 4) NOT NULL, -- Quantità massima smaltibile (kg o unità)
  unita_misura VARCHAR(10) NOT NULL DEFAULT 'kg',
  
  -- Quantità attuale (calcolata)
  quantita_attuale DECIMAL(15, 4) DEFAULT 0,
  
  -- Alert configurazione
  soglia_alert_percentuale INTEGER DEFAULT 80, -- Alert quando si raggiunge 80% del limite
  alert_inviato BOOLEAN DEFAULT false,
  alert_inviato_at TIMESTAMP,
  
  -- Note
  note TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Unicità: un limite per org/anno/codice_eer
  UNIQUE(org_id, anno, codice_eer)
);

CREATE INDEX idx_rentri_limiti_org ON rentri_limiti_rifiuti(org_id);
CREATE INDEX idx_rentri_limiti_anno ON rentri_limiti_rifiuti(anno);
CREATE INDEX idx_rentri_limiti_eer ON rentri_limiti_rifiuti(codice_eer);
CREATE INDEX idx_rentri_limiti_alert ON rentri_limiti_rifiuti(org_id, anno, alert_inviato) 
  WHERE alert_inviato = false;

-- ==========================================
-- MODELLO UNICO DICHIARAZIONE (MUD)
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_mud (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  -- Anno di riferimento
  anno INTEGER NOT NULL,
  
  -- Stato MUD
  stato VARCHAR(30) DEFAULT 'bozza', -- 'bozza', 'in_completamento', 'completato', 'trasmesso'
  
  -- Periodo riferimento
  data_inizio DATE NOT NULL,
  data_fine DATE NOT NULL,
  
  -- Dati MUD (JSONB per flessibilità)
  dati_mud JSONB DEFAULT '{}', -- Dati aggregati per il MUD
  
  -- Statistiche
  totale_movimenti INTEGER DEFAULT 0,
  totale_registri INTEGER DEFAULT 0,
  totale_formulari INTEGER DEFAULT 0,
  totale_quantita DECIMAL(15, 4) DEFAULT 0,
  
  -- File generati
  file_xml_url TEXT, -- URL file XML MUD
  file_pdf_url TEXT, -- URL file PDF MUD
  file_generato_at TIMESTAMP,
  
  -- Trasmissione
  trasmesso_at TIMESTAMP,
  numero_protocollo VARCHAR(100),
  esito_trasmissione TEXT,
  
  -- Note
  note TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Unicità: un MUD per org/anno
  UNIQUE(org_id, anno)
);

CREATE INDEX idx_rentri_mud_org ON rentri_mud(org_id);
CREATE INDEX idx_rentri_mud_anno ON rentri_mud(anno);
CREATE INDEX idx_rentri_mud_stato ON rentri_mud(stato);

-- ==========================================
-- VALIDAZIONE IA PRE-INVIO
-- ==========================================

CREATE TABLE IF NOT EXISTS rentri_ai_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo entità validata
  tipo_entita VARCHAR(30) NOT NULL, -- 'movimento', 'formulario', 'registro'
  entita_id UUID NOT NULL, -- ID della entità validata
  
  -- Risultato validazione
  stato_validazione VARCHAR(30) DEFAULT 'pending', -- 'pending', 'ok', 'warning', 'error', 'confirmed'
  
  -- Alert/Avvisi IA
  alert_ia JSONB DEFAULT '[]', -- Array di alert/avvisi dall'IA
  -- Formato: [{"tipo": "error|warning|info", "campo": "codice_eer", "messaggio": "...", "severita": 1-10}]
  
  -- Dettagli validazione
  prompt_inviato TEXT, -- Prompt inviato all'IA
  risposta_ia TEXT, -- Risposta raw dall'IA
  analisi_ia JSONB, -- Analisi strutturata dall'IA
  
  -- Decisione umana
  confermato_da UUID REFERENCES auth.users(id),
  confermato_at TIMESTAMP,
  nota_conferma TEXT, -- Nota dell'operatore che ha confermato
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unicità: una validazione per entità
  UNIQUE(tipo_entita, entita_id)
);

CREATE INDEX idx_rentri_ai_validations_org ON rentri_ai_validations(org_id);
CREATE INDEX idx_rentri_ai_validations_tipo ON rentri_ai_validations(tipo_entita, entita_id);
CREATE INDEX idx_rentri_ai_validations_stato ON rentri_ai_validations(stato_validazione);
CREATE INDEX idx_rentri_ai_validations_pending ON rentri_ai_validations(org_id, stato_validazione) 
  WHERE stato_validazione IN ('pending', 'warning', 'error');

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Limiti Rifiuti
ALTER TABLE rentri_limiti_rifiuti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage limiti of their org"
  ON rentri_limiti_rifiuti
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- MUD
ALTER TABLE rentri_mud ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage mud of their org"
  ON rentri_mud
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- AI Validations
ALTER TABLE rentri_ai_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ai_validations of their org"
  ON rentri_ai_validations
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert ai_validations in their org"
  ON rentri_ai_validations
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update ai_validations of their org"
  ON rentri_ai_validations
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- ==========================================
-- TRIGGERS per updated_at
-- ==========================================

CREATE TRIGGER update_rentri_limiti_updated_at
  BEFORE UPDATE ON rentri_limiti_rifiuti
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_updated_at();

CREATE TRIGGER update_rentri_mud_updated_at
  BEFORE UPDATE ON rentri_mud
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_updated_at();

CREATE TRIGGER update_rentri_ai_validations_updated_at
  BEFORE UPDATE ON rentri_ai_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_updated_at();

-- ==========================================
-- FUNZIONE: Aggiorna quantita_attuale nei limiti
-- ==========================================

CREATE OR REPLACE FUNCTION update_rentri_limiti_quantita()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna quantita_attuale quando viene creato/modificato un movimento
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Aggiorna limite totale (codice_eer NULL)
    UPDATE rentri_limiti_rifiuti
    SET quantita_attuale = (
      SELECT COALESCE(SUM(quantita), 0)
      FROM rentri_movimenti
      WHERE org_id = NEW.org_id
        AND EXTRACT(YEAR FROM data_operazione) = rentri_limiti_rifiuti.anno
        AND sync_status = 'trasmesso'
    )
    WHERE org_id = NEW.org_id
      AND anno = EXTRACT(YEAR FROM NEW.data_operazione)
      AND codice_eer IS NULL;
    
    -- Aggiorna limite specifico per codice EER
    UPDATE rentri_limiti_rifiuti
    SET quantita_attuale = (
      SELECT COALESCE(SUM(quantita), 0)
      FROM rentri_movimenti
      WHERE org_id = NEW.org_id
        AND codice_eer = rentri_limiti_rifiuti.codice_eer
        AND EXTRACT(YEAR FROM data_operazione) = rentri_limiti_rifiuti.anno
        AND sync_status = 'trasmesso'
    )
    WHERE org_id = NEW.org_id
      AND anno = EXTRACT(YEAR FROM NEW.data_operazione)
      AND codice_eer = NEW.codice_eer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rentri_limiti_on_movimento
  AFTER INSERT OR UPDATE ON rentri_movimenti
  FOR EACH ROW
  WHEN (NEW.sync_status = 'trasmesso')
  EXECUTE FUNCTION update_rentri_limiti_quantita();

-- ==========================================
-- COMMENTI
-- ==========================================

COMMENT ON TABLE rentri_limiti_rifiuti IS 'Limiti quantità rifiuti smaltibili per organizzazione/anno';
COMMENT ON TABLE rentri_mud IS 'Modello Unico Dichiarazione - Dichiarazione annuale rifiuti';
COMMENT ON TABLE rentri_ai_validations IS 'Validazioni IA pre-invio per movimenti, formulari e registri';

