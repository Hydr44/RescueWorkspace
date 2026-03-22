-- Migration: Workflow di lavorazione VFU (Veicoli Fuori Uso)
-- Created: 2026-02-26
-- Description: Stati di lavorazione veicolo secondo D.Lgs 209/2003
--   Fasi: accettazione -> messa in sicurezza -> bonifica -> smontaggio ricambi
--         -> smontaggio componenti -> pesatura -> radiazione PRA -> conferimento -> completato

-- ============================================================================
-- TABELLA: vfu_processing_steps (Fasi di lavorazione)
-- Ogni riga = una fase completata per un caso di demolizione
-- ============================================================================

CREATE TABLE IF NOT EXISTS vfu_processing_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demolition_case_id UUID NOT NULL REFERENCES demolition_cases(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Fase
  step_code VARCHAR(50) NOT NULL,
  step_order INTEGER NOT NULL,
  step_label VARCHAR(100) NOT NULL,

  -- Stato della fase
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),

  -- Dettagli operatore
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  operator_notes TEXT,

  -- Dati specifici della fase (JSON flessibile)
  step_data JSONB DEFAULT '{}',

  -- Scadenza normativa (es. smontaggio entro 10gg)
  deadline_at TIMESTAMPTZ,
  is_overdue BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_step_per_case UNIQUE(demolition_case_id, step_code)
);

CREATE INDEX idx_vfu_steps_case ON vfu_processing_steps(demolition_case_id);
CREATE INDEX idx_vfu_steps_org ON vfu_processing_steps(org_id);
CREATE INDEX idx_vfu_steps_status ON vfu_processing_steps(status);
CREATE INDEX idx_vfu_steps_deadline ON vfu_processing_steps(deadline_at) WHERE deadline_at IS NOT NULL AND status != 'completed';

COMMENT ON TABLE vfu_processing_steps IS 'Fasi di lavorazione VFU secondo D.Lgs 209/2003';

-- ============================================================================
-- TABELLA LOOKUP: vfu_step_definitions (Definizioni fasi standard)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vfu_step_definitions (
  step_code VARCHAR(50) PRIMARY KEY,
  step_order INTEGER NOT NULL,
  step_label VARCHAR(100) NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  deadline_days INTEGER, -- giorni dalla presa in carico (NULL = nessuna scadenza)
  icon VARCHAR(50),
  color VARCHAR(20),
  checklist JSONB DEFAULT '[]', -- sotto-attivita della fase
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO vfu_step_definitions (step_code, step_order, step_label, description, is_mandatory, deadline_days, icon, color, checklist) VALUES
  ('accettazione', 10, 'Accettazione', 'Presa in carico del veicolo al centro di raccolta. Registrazione dati, verifica documenti, foto iniziali.', true, NULL, 'FiTruck', 'blue',
   '[{"key":"foto_ingresso","label":"Foto ingresso veicolo","required":true},{"key":"documenti_verificati","label":"Documenti verificati (CdC, CdP)","required":true},{"key":"targa_ritirata","label":"Targa ritirata","required":false},{"key":"km_registrati","label":"Chilometraggio registrato","required":false}]'),

  ('messa_in_sicurezza', 20, 'Messa in sicurezza', 'Rimozione componenti pericolosi: batteria, airbag, serbatoi gas compressi, condensatori PCB.', true, 3, 'FiShield', 'amber',
   '[{"key":"batteria_rimossa","label":"Batteria rimossa e stoccata","required":true},{"key":"airbag_neutralizzati","label":"Airbag neutralizzati","required":true},{"key":"serbatoi_gas","label":"Serbatoi gas compressi rimossi","required":false},{"key":"condensatori_pcb","label":"Condensatori PCB rimossi","required":false},{"key":"componenti_mercurio","label":"Componenti con mercurio rimossi","required":false}]'),

  ('bonifica', 30, 'Bonifica ambientale', 'Aspirazione di tutti i liquidi: carburante, olio motore, olio cambio, liquido freni, antigelo, lavavetri. Rimozione filtro olio.', true, 5, 'FiDroplet', 'emerald',
   '[{"key":"carburante_aspirato","label":"Carburante aspirato","required":true},{"key":"olio_motore","label":"Olio motore aspirato","required":true},{"key":"olio_cambio","label":"Olio cambio aspirato","required":true},{"key":"liquido_freni","label":"Liquido freni aspirato","required":true},{"key":"antigelo","label":"Antigelo aspirato","required":true},{"key":"lavavetri","label":"Liquido lavavetri aspirato","required":true},{"key":"filtro_olio","label":"Filtro olio rimosso","required":true},{"key":"liquido_condizionatore","label":"Gas condizionatore recuperato (R134a/R1234yf)","required":false}]'),

  ('smontaggio_ricambi', 40, 'Smontaggio ricambi', 'Smontaggio parti riutilizzabili come ricambi usati entro 10 giorni lavorativi dalla presa in carico (D.Lgs 209/2003).', true, 10, 'FiTool', 'purple',
   '[{"key":"motore","label":"Motore estratto","required":false},{"key":"cambio","label":"Cambio estratto","required":false},{"key":"portiere","label":"Portiere smontate","required":false},{"key":"cofano","label":"Cofano smontato","required":false},{"key":"fari","label":"Fari smontati","required":false},{"key":"ruote","label":"Ruote smontate","required":true},{"key":"pastiglie_freno","label":"Pastiglie freno rimosse","required":true},{"key":"catalizzatore","label":"Catalizzatore rimosso","required":true},{"key":"elettronica","label":"Centraline/elettronica recuperata","required":false}]'),

  ('smontaggio_componenti', 50, 'Smontaggio componenti', 'Rimozione componenti obbligatori per riciclo: metalli (Cu, Al, Mg), pneumatici, vetri, plastiche grandi (paraurti, cruscotto).', true, 15, 'FiPackage', 'cyan',
   '[{"key":"pneumatici","label":"Pneumatici rimossi e stoccati","required":true},{"key":"vetri","label":"Vetri rimossi","required":true},{"key":"paraurti","label":"Paraurti rimossi","required":true},{"key":"cruscotto","label":"Cruscotto rimosso","required":false},{"key":"metalli_cu","label":"Componenti rame separati","required":false},{"key":"metalli_al","label":"Componenti alluminio separati","required":false},{"key":"metalli_mg","label":"Componenti magnesio separati","required":false},{"key":"sedili","label":"Sedili rimossi","required":false}]'),

  ('pesatura', 60, 'Pesatura e classificazione', 'Pesatura carcassa e classificazione CER dei rifiuti prodotti. Compilazione registro carico/scarico.', true, NULL, 'FiBarChart2', 'orange',
   '[{"key":"peso_carcassa","label":"Peso carcassa registrato (kg)","required":true},{"key":"codici_cer","label":"Codici CER assegnati ai rifiuti","required":true},{"key":"registro_carico_scarico","label":"Registro carico/scarico aggiornato","required":true},{"key":"foto_carcassa","label":"Foto carcassa bonificata","required":false}]'),

  ('radiazione_pra', 70, 'Radiazione PRA', 'Richiesta radiazione al PRA (solo per veicoli con obbligo iscrizione). Emissione Certificato di Rottamazione.', false, 30, 'FiFileText', 'red',
   '[{"key":"richiesta_radiazione","label":"Richiesta radiazione inviata","required":true},{"key":"certificato_rottamazione","label":"Certificato di Rottamazione emesso","required":true},{"key":"comunicazione_aci","label":"Comunicazione ad ACI completata","required":true}]'),

  ('conferimento', 80, 'Conferimento a frantumatore', 'Invio carcassa bonificata a impianto di frantumazione autorizzato. Compilazione FIR per trasporto rifiuti.', true, 60, 'FiSend', 'slate',
   '[{"key":"frantumatore_identificato","label":"Frantumatore autorizzato identificato","required":true},{"key":"fir_compilato","label":"FIR compilato per trasporto","required":true},{"key":"trasporto_effettuato","label":"Trasporto carcassa effettuato","required":true},{"key":"quarta_copia_fir","label":"4a copia FIR ricevuta","required":false}]'),

  ('completato', 90, 'Completato', 'Pratica VFU chiusa. Tutti i documenti archiviati, CDR emesso, registri aggiornati.', true, NULL, 'FiCheckCircle', 'emerald',
   '[{"key":"documentazione_archiviata","label":"Documentazione completa archiviata","required":true},{"key":"mud_aggiornato","label":"Dati MUD aggiornati","required":false}]')
ON CONFLICT (step_code) DO NOTHING;

COMMENT ON TABLE vfu_step_definitions IS 'Definizioni delle fasi standard di lavorazione VFU';

-- ============================================================================
-- COLONNE AGGIUNTIVE su demolition_cases
-- ============================================================================

ALTER TABLE demolition_cases
  ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'accettazione',
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS peso_ingresso_kg DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS peso_carcassa_kg DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS certificato_rottamazione_numero VARCHAR(100),
  ADD COLUMN IF NOT EXISTS certificato_rottamazione_data DATE,
  ADD COLUMN IF NOT EXISTS fir_rifiuti_id UUID, -- collegamento a FIR RENTRI
  ADD COLUMN IF NOT EXISTS invoice_draft_id UUID, -- collegamento a bozza fattura SDI
  ADD COLUMN IF NOT EXISTS rentri_movimento_id UUID, -- collegamento a movimento RENTRI
  ADD COLUMN IF NOT EXISTS is_local_only BOOLEAN DEFAULT true; -- true = dati solo locali, false = sincronizzato con RVFU

CREATE INDEX IF NOT EXISTS idx_demolition_cases_processing_status ON demolition_cases(processing_status);
CREATE INDEX IF NOT EXISTS idx_demolition_cases_is_local ON demolition_cases(is_local_only);

-- ============================================================================
-- TABELLA: vfu_rifiuti_prodotti (Rifiuti prodotti dalla demolizione)
-- Per generazione automatica bozze RENTRI
-- ============================================================================

CREATE TABLE IF NOT EXISTS vfu_rifiuti_prodotti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demolition_case_id UUID NOT NULL REFERENCES demolition_cases(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  codice_cer VARCHAR(10) NOT NULL,       -- es. "16 01 04*" (VFU), "16 01 03" (pneumatici)
  descrizione VARCHAR(255) NOT NULL,
  peso_kg DECIMAL(10,2),
  unita_misura VARCHAR(10) DEFAULT 'kg',
  pericoloso BOOLEAN DEFAULT false,
  destino VARCHAR(50),                   -- recupero, smaltimento, riutilizzo
  destinatario VARCHAR(255),             -- impianto destinatario
  fir_numero VARCHAR(50),               -- numero FIR associato
  data_conferimento DATE,

  step_code VARCHAR(50),                 -- fase in cui e stato prodotto

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vfu_rifiuti_case ON vfu_rifiuti_prodotti(demolition_case_id);
CREATE INDEX idx_vfu_rifiuti_cer ON vfu_rifiuti_prodotti(codice_cer);

COMMENT ON TABLE vfu_rifiuti_prodotti IS 'Rifiuti prodotti durante la demolizione VFU, per generazione bozze RENTRI';

-- ============================================================================
-- TABELLA: vfu_ricambi_estratti (Ricambi estratti per rivendita)
-- Per collegamento con marketplace/vendite
-- ============================================================================

CREATE TABLE IF NOT EXISTS vfu_ricambi_estratti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demolition_case_id UUID NOT NULL REFERENCES demolition_cases(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  spare_part_id UUID REFERENCES spare_parts(id) ON DELETE SET NULL,

  nome VARCHAR(200) NOT NULL,
  categoria VARCHAR(100),
  condizione VARCHAR(50) DEFAULT 'usato',  -- usato, ricondizionato, per_ricambi
  qualita VARCHAR(5),                       -- A, B, C
  prezzo_stimato DECIMAL(10,2),
  note TEXT,

  step_code VARCHAR(50) DEFAULT 'smontaggio_ricambi',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vfu_ricambi_case ON vfu_ricambi_estratti(demolition_case_id);
CREATE INDEX idx_vfu_ricambi_spare ON vfu_ricambi_estratti(spare_part_id);

COMMENT ON TABLE vfu_ricambi_estratti IS 'Ricambi estratti durante smontaggio VFU, collegabili a spare_parts e marketplace';

-- ============================================================================
-- FUNZIONE: Inizializza steps per un nuovo caso
-- ============================================================================

CREATE OR REPLACE FUNCTION init_vfu_processing_steps()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO vfu_processing_steps (demolition_case_id, org_id, step_code, step_order, step_label, status, deadline_at)
  SELECT
    NEW.id,
    NEW.org_id,
    d.step_code,
    d.step_order,
    d.step_label,
    CASE WHEN d.step_order = 10 THEN 'in_progress' ELSE 'pending' END,
    CASE WHEN d.deadline_days IS NOT NULL THEN NOW() + (d.deadline_days || ' days')::INTERVAL ELSE NULL END
  FROM vfu_step_definitions d
  WHERE d.step_code != 'radiazione_pra' OR NEW.meta->>'obbligoIscrizionePRA' = 'S'
  ORDER BY d.step_order;

  -- Imposta lo stato iniziale
  NEW.processing_status := 'accettazione';
  NEW.processing_started_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Il trigger si attiva solo per nuovi inserimenti
CREATE TRIGGER trigger_init_vfu_steps
  AFTER INSERT ON demolition_cases
  FOR EACH ROW
  EXECUTE FUNCTION init_vfu_processing_steps();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE vfu_processing_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vfu_step_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vfu_rifiuti_prodotti ENABLE ROW LEVEL SECURITY;
ALTER TABLE vfu_ricambi_estratti ENABLE ROW LEVEL SECURITY;

-- Step definitions: leggibili da tutti
CREATE POLICY "Anyone can view step definitions"
  ON vfu_step_definitions FOR SELECT USING (true);

-- Processing steps: solo propria org
CREATE POLICY "Users can manage processing steps for their org"
  ON vfu_processing_steps FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Rifiuti prodotti: solo propria org
CREATE POLICY "Users can manage vfu rifiuti for their org"
  ON vfu_rifiuti_prodotti FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Ricambi estratti: solo propria org
CREATE POLICY "Users can manage vfu ricambi for their org"
  ON vfu_ricambi_estratti FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
