-- Migration: Estensione schema per integrazione RVFU
-- File: supabase/migrations/20250115000000_rvfu_integration.sql

-- Estensione della tabella demolition_cases per supportare RVFU
ALTER TABLE demolition_cases 
ADD COLUMN IF NOT EXISTS rvfu_id INTEGER,
ADD COLUMN IF NOT EXISTS rvfu_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS rvfu_sync_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rvfu_communication_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS rvfu_error TEXT;

-- Creazione di indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_demolition_cases_rvfu_id ON demolition_cases(rvfu_id);
CREATE INDEX IF NOT EXISTS idx_demolition_cases_rvfu_status ON demolition_cases(rvfu_status);
CREATE INDEX IF NOT EXISTS idx_demolition_cases_rvfu_sync_date ON demolition_cases(rvfu_sync_date);

-- Creazione di una tabella per i documenti RVFU
CREATE TABLE IF NOT EXISTS rvfu_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demolition_case_id UUID REFERENCES demolition_cases(id) ON DELETE CASCADE,
  rvfu_id INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255),
  document_url TEXT,
  document_data BYTEA, -- Per memorizzare i documenti in base64
  document_status VARCHAR(50) DEFAULT 'INSERITO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella documenti RVFU
CREATE INDEX IF NOT EXISTS idx_rvfu_documents_demolition_case_id ON rvfu_documents(demolition_case_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_documents_rvfu_id ON rvfu_documents(rvfu_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_documents_document_type ON rvfu_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_rvfu_documents_document_status ON rvfu_documents(document_status);

-- Creazione di una tabella per i log delle operazioni RVFU
CREATE TABLE IF NOT EXISTS rvfu_operation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demolition_case_id UUID REFERENCES demolition_cases(id) ON DELETE CASCADE,
  rvfu_id INTEGER,
  operation_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'SYNC', 'ERROR'
  operation_status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'ERROR', 'PENDING'
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella log operazioni RVFU
CREATE INDEX IF NOT EXISTS idx_rvfu_operation_logs_demolition_case_id ON rvfu_operation_logs(demolition_case_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_operation_logs_rvfu_id ON rvfu_operation_logs(rvfu_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_operation_logs_operation_type ON rvfu_operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_rvfu_operation_logs_operation_status ON rvfu_operation_logs(operation_status);
CREATE INDEX IF NOT EXISTS idx_rvfu_operation_logs_created_at ON rvfu_operation_logs(created_at);

-- Creazione di una tabella per le configurazioni RVFU
CREATE TABLE IF NOT EXISTS rvfu_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  rvfu_base_url TEXT NOT NULL,
  rvfu_api_key TEXT,
  rvfu_timeout INTEGER DEFAULT 30000,
  rvfu_user_type VARCHAR(20) DEFAULT 'concessionario', -- 'concessionario' | 'cr'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per la tabella configurazioni RVFU
CREATE INDEX IF NOT EXISTS idx_rvfu_configurations_org_id ON rvfu_configurations(org_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_configurations_is_active ON rvfu_configurations(is_active);

-- Creazione di una tabella per i soggetti VFU
CREATE TABLE IF NOT EXISTS rvfu_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demolition_case_id UUID REFERENCES demolition_cases(id) ON DELETE CASCADE,
  rvfu_id INTEGER NOT NULL,
  subject_type VARCHAR(30) NOT NULL, -- 'INTESTATARIO', 'DETENTORE', 'DETENTORE_RAPPRESENTANTE'
  codice_fiscale VARCHAR(16) NOT NULL,
  cognome VARCHAR(255),
  nome VARCHAR(255),
  ragione_sociale VARCHAR(255),
  data_nascita DATE,
  codice_comune_nascita VARCHAR(3),
  codice_provincia_nascita VARCHAR(2),
  codice_comune_residenza VARCHAR(3),
  codice_provincia_residenza VARCHAR(2),
  indirizzo_residenza TEXT,
  numero_civico_residenza VARCHAR(10),
  cap_residenza VARCHAR(5),
  tipo_persona_giuridica VARCHAR(2) DEFAULT 'PF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella soggetti VFU
CREATE INDEX IF NOT EXISTS idx_rvfu_subjects_demolition_case_id ON rvfu_subjects(demolition_case_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_subjects_rvfu_id ON rvfu_subjects(rvfu_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_subjects_subject_type ON rvfu_subjects(subject_type);
CREATE INDEX IF NOT EXISTS idx_rvfu_subjects_codice_fiscale ON rvfu_subjects(codice_fiscale);

-- Creazione di una tabella per le distinte documenti VFU
CREATE TABLE IF NOT EXISTS rvfu_document_distincts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demolition_case_id UUID REFERENCES demolition_cases(id) ON DELETE CASCADE,
  rvfu_id INTEGER NOT NULL,
  du VARCHAR(20) DEFAULT 'ASSENTE',
  cdc VARCHAR(20) DEFAULT 'ASSENTE',
  cdp VARCHAR(20) DEFAULT 'ASSENTE',
  foglio_c VARCHAR(20) DEFAULT 'ASSENTE',
  documento_intestatario BOOLEAN DEFAULT false,
  documento_detentore BOOLEAN DEFAULT false,
  targa_anteriore BOOLEAN DEFAULT false,
  targa_posteriore BOOLEAN DEFAULT false,
  targa_denuncia BOOLEAN DEFAULT false,
  altro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella distinte documenti VFU
CREATE INDEX IF NOT EXISTS idx_rvfu_document_distincts_demolition_case_id ON rvfu_document_distincts(demolition_case_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_document_distincts_rvfu_id ON rvfu_document_distincts(rvfu_id);

-- Creazione di una tabella per i fascicoli VFU
CREATE TABLE IF NOT EXISTS rvfu_fascicoli (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demolition_case_id UUID REFERENCES demolition_cases(id) ON DELETE CASCADE,
  rvfu_id INTEGER NOT NULL,
  fascicolo_id INTEGER NOT NULL,
  stato_fascicolo VARCHAR(20) DEFAULT 'INSERITO',
  data_creazione_fascicolo TIMESTAMP WITH TIME ZONE,
  data_chiusura_fascicolo TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella fascicoli VFU
CREATE INDEX IF NOT EXISTS idx_rvfu_fascicoli_demolition_case_id ON rvfu_fascicoli(demolition_case_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_fascicoli_rvfu_id ON rvfu_fascicoli(rvfu_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_fascicoli_fascicolo_id ON rvfu_fascicoli(fascicolo_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_fascicoli_stato_fascicolo ON rvfu_fascicoli(stato_fascicolo);

-- Creazione di una tabella per le deleghe RVFU
CREATE TABLE IF NOT EXISTS rvfu_deleghe (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  delega_id INTEGER NOT NULL,
  codice_fiscale_delegato VARCHAR(16) NOT NULL,
  matricola_sede_delegato VARCHAR(50) NOT NULL,
  data_inizio DATE NOT NULL,
  data_fine DATE NOT NULL,
  stato_delega VARCHAR(20) DEFAULT 'ATTIVA',
  note_aggiuntive TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella deleghe RVFU
CREATE INDEX IF NOT EXISTS idx_rvfu_deleghe_org_id ON rvfu_deleghe(org_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_deleghe_delega_id ON rvfu_deleghe(delega_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_deleghe_codice_fiscale_delegato ON rvfu_deleghe(codice_fiscale_delegato);
CREATE INDEX IF NOT EXISTS idx_rvfu_deleghe_stato_delega ON rvfu_deleghe(stato_delega);

-- Creazione di una tabella per i veicoli RVFU
CREATE TABLE IF NOT EXISTS rvfu_veicoli (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demolition_case_id UUID REFERENCES demolition_cases(id) ON DELETE CASCADE,
  rvfu_id INTEGER NOT NULL,
  targa VARCHAR(7) NOT NULL,
  telaio VARCHAR(20) NOT NULL,
  tipo_veicolo VARCHAR(1) NOT NULL,
  causale VARCHAR(20),
  cic VARCHAR(50),
  modello VARCHAR(255),
  fabbrica VARCHAR(255),
  peso_complessivo VARCHAR(20),
  destinazione_veicolo VARCHAR(50),
  tipo_utilizzo_veicolo VARCHAR(50),
  regime_veicolo VARCHAR(50),
  obbligo_iscrizione_pra VARCHAR(1),
  radiabile VARCHAR(1),
  radiato VARCHAR(1),
  forzabile BOOLEAN DEFAULT false,
  vincolo_ostativo VARCHAR(255),
  data_immatricolazione DATE,
  data_registrazione DATE,
  stato_vfu VARCHAR(20),
  ente_ritiro VARCHAR(255),
  ente_conferimento VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella veicoli RVFU
CREATE INDEX IF NOT EXISTS idx_rvfu_veicoli_demolition_case_id ON rvfu_veicoli(demolition_case_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_veicoli_rvfu_id ON rvfu_veicoli(rvfu_id);
CREATE INDEX IF NOT EXISTS idx_rvfu_veicoli_targa ON rvfu_veicoli(targa);
CREATE INDEX IF NOT EXISTS idx_rvfu_veicoli_telaio ON rvfu_veicoli(telaio);
CREATE INDEX IF NOT EXISTS idx_rvfu_veicoli_stato_vfu ON rvfu_veicoli(stato_vfu);

-- Creazione di una tabella per le causali RVFU
CREATE TABLE IF NOT EXISTS rvfu_causali (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codice VARCHAR(20) NOT NULL UNIQUE,
  codice_mtv VARCHAR(10),
  codice_mne VARCHAR(10),
  descrizione VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per la tabella causali RVFU
CREATE INDEX IF NOT EXISTS idx_rvfu_causali_codice ON rvfu_causali(codice);
CREATE INDEX IF NOT EXISTS idx_rvfu_causali_is_active ON rvfu_causali(is_active);

-- Creazione di una tabella per i comuni ISTAT
CREATE TABLE IF NOT EXISTS rvfu_comuni_istat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codice VARCHAR(3) NOT NULL UNIQUE,
  codice_istat VARCHAR(6) NOT NULL UNIQUE,
  denominazione VARCHAR(255) NOT NULL,
  sigla_provincia VARCHAR(2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella comuni ISTAT
CREATE INDEX IF NOT EXISTS idx_rvfu_comuni_istat_codice ON rvfu_comuni_istat(codice);
CREATE INDEX IF NOT EXISTS idx_rvfu_comuni_istat_codice_istat ON rvfu_comuni_istat(codice_istat);
CREATE INDEX IF NOT EXISTS idx_rvfu_comuni_istat_sigla_provincia ON rvfu_comuni_istat(sigla_provincia);
CREATE INDEX IF NOT EXISTS idx_rvfu_comuni_istat_is_active ON rvfu_comuni_istat(is_active);

-- Creazione di una tabella per le province ISTAT
CREATE TABLE IF NOT EXISTS rvfu_province_istat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codice VARCHAR(3) NOT NULL UNIQUE,
  denominazione VARCHAR(255) NOT NULL,
  sigla VARCHAR(2) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella province ISTAT
CREATE INDEX IF NOT EXISTS idx_rvfu_province_istat_codice ON rvfu_province_istat(codice);
CREATE INDEX IF NOT EXISTS idx_rvfu_province_istat_sigla ON rvfu_province_istat(sigla);
CREATE INDEX IF NOT EXISTS idx_rvfu_province_istat_is_active ON rvfu_province_istat(is_active);

-- Creazione di una tabella per gli stati esteri ISTAT
CREATE TABLE IF NOT EXISTS rvfu_stati_esteri_istat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codice VARCHAR(3) NOT NULL UNIQUE,
  denominazione VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per la tabella stati esteri ISTAT
CREATE INDEX IF NOT EXISTS idx_rvfu_stati_esteri_istat_codice ON rvfu_stati_esteri_istat(codice);
CREATE INDEX IF NOT EXISTS idx_rvfu_stati_esteri_istat_is_active ON rvfu_stati_esteri_istat(is_active);

-- Creazione di trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applicazione del trigger a tutte le tabelle con updated_at
DROP TRIGGER IF EXISTS update_rvfu_documents_updated_at ON rvfu_documents;
CREATE TRIGGER update_rvfu_documents_updated_at BEFORE UPDATE ON rvfu_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_configurations_updated_at ON rvfu_configurations;
CREATE TRIGGER update_rvfu_configurations_updated_at BEFORE UPDATE ON rvfu_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_subjects_updated_at ON rvfu_subjects;
CREATE TRIGGER update_rvfu_subjects_updated_at BEFORE UPDATE ON rvfu_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_document_distincts_updated_at ON rvfu_document_distincts;
CREATE TRIGGER update_rvfu_document_distincts_updated_at BEFORE UPDATE ON rvfu_document_distincts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_fascicoli_updated_at ON rvfu_fascicoli;
CREATE TRIGGER update_rvfu_fascicoli_updated_at BEFORE UPDATE ON rvfu_fascicoli FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_deleghe_updated_at ON rvfu_deleghe;
CREATE TRIGGER update_rvfu_deleghe_updated_at BEFORE UPDATE ON rvfu_deleghe FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_veicoli_updated_at ON rvfu_veicoli;
CREATE TRIGGER update_rvfu_veicoli_updated_at BEFORE UPDATE ON rvfu_veicoli FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_causali_updated_at ON rvfu_causali;
CREATE TRIGGER update_rvfu_causali_updated_at BEFORE UPDATE ON rvfu_causali FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_comuni_istat_updated_at ON rvfu_comuni_istat;
CREATE TRIGGER update_rvfu_comuni_istat_updated_at BEFORE UPDATE ON rvfu_comuni_istat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_province_istat_updated_at ON rvfu_province_istat;
CREATE TRIGGER update_rvfu_province_istat_updated_at BEFORE UPDATE ON rvfu_province_istat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rvfu_stati_esteri_istat_updated_at ON rvfu_stati_esteri_istat;
CREATE TRIGGER update_rvfu_stati_esteri_istat_updated_at BEFORE UPDATE ON rvfu_stati_esteri_istat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Creazione di RLS (Row Level Security) per le nuove tabelle
ALTER TABLE rvfu_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_document_distincts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_fascicoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_deleghe ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_veicoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_causali ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_comuni_istat ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_province_istat ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvfu_stati_esteri_istat ENABLE ROW LEVEL SECURITY;

-- Creazione di policy RLS per le tabelle che dipendono da demolition_cases
DROP POLICY IF EXISTS "Users can view rvfu_documents for their org" ON rvfu_documents;
CREATE POLICY "Users can view rvfu_documents for their org" ON rvfu_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM demolition_cases dc 
      WHERE dc.id = rvfu_documents.demolition_case_id 
      AND dc.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Users can insert rvfu_documents for their org" ON rvfu_documents;
CREATE POLICY "Users can insert rvfu_documents for their org" ON rvfu_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM demolition_cases dc 
      WHERE dc.id = rvfu_documents.demolition_case_id 
      AND dc.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Users can update rvfu_documents for their org" ON rvfu_documents;
CREATE POLICY "Users can update rvfu_documents for their org" ON rvfu_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM demolition_cases dc 
      WHERE dc.id = rvfu_documents.demolition_case_id 
      AND dc.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Users can delete rvfu_documents for their org" ON rvfu_documents;
CREATE POLICY "Users can delete rvfu_documents for their org" ON rvfu_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM demolition_cases dc 
      WHERE dc.id = rvfu_documents.demolition_case_id 
      AND dc.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy simili per le altre tabelle che dipendono da demolition_cases
DROP POLICY IF EXISTS "Users can view rvfu_operation_logs for their org" ON rvfu_operation_logs;
CREATE POLICY "Users can view rvfu_operation_logs for their org" ON rvfu_operation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM demolition_cases dc 
      WHERE dc.id = rvfu_operation_logs.demolition_case_id 
      AND dc.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Users can insert rvfu_operation_logs for their org" ON rvfu_operation_logs;
CREATE POLICY "Users can insert rvfu_operation_logs for their org" ON rvfu_operation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM demolition_cases dc 
      WHERE dc.id = rvfu_operation_logs.demolition_case_id 
      AND dc.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy per le tabelle che dipendono da organizations
DROP POLICY IF EXISTS "Users can view rvfu_configurations for their org" ON rvfu_configurations;
CREATE POLICY "Users can view rvfu_configurations for their org" ON rvfu_configurations
  FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "Users can insert rvfu_configurations for their org" ON rvfu_configurations;
CREATE POLICY "Users can insert rvfu_configurations for their org" ON rvfu_configurations
  FOR INSERT WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "Users can update rvfu_configurations for their org" ON rvfu_configurations;
CREATE POLICY "Users can update rvfu_configurations for their org" ON rvfu_configurations
  FOR UPDATE USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "Users can delete rvfu_configurations for their org" ON rvfu_configurations;
CREATE POLICY "Users can delete rvfu_configurations for their org" ON rvfu_configurations
  FOR DELETE USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy per le tabelle di lookup (pubbliche)
DROP POLICY IF EXISTS "Anyone can view rvfu_causali" ON rvfu_causali;
CREATE POLICY "Anyone can view rvfu_causali" ON rvfu_causali FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Anyone can view rvfu_comuni_istat" ON rvfu_comuni_istat;
CREATE POLICY "Anyone can view rvfu_comuni_istat" ON rvfu_comuni_istat FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Anyone can view rvfu_province_istat" ON rvfu_province_istat;
CREATE POLICY "Anyone can view rvfu_province_istat" ON rvfu_province_istat FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Anyone can view rvfu_stati_esteri_istat" ON rvfu_stati_esteri_istat;
CREATE POLICY "Anyone can view rvfu_stati_esteri_istat" ON rvfu_stati_esteri_istat FOR SELECT USING (is_active = true);

-- Fix colonne VARCHAR troppo corte nelle tabelle già esistenti
ALTER TABLE rvfu_causali ALTER COLUMN codice TYPE VARCHAR(20);
ALTER TABLE rvfu_veicoli ALTER COLUMN causale TYPE VARCHAR(20);
ALTER TABLE rvfu_province_istat ALTER COLUMN codice TYPE VARCHAR(3);

-- Inserimento di dati di esempio per le causali RVFU
INSERT INTO rvfu_causali (codice, codice_mtv, codice_mne, descrizione) VALUES
('ROTTAMAZIONE', 'ROT', 'ROT', 'Rottamazione veicolo'),
('DEMOLIZIONE', 'DEM', 'DEM', 'Demolizione veicolo'),
('CESSAZIONE', 'CES', 'CES', 'Cessione veicolo'),
('FURTO', 'FUR', 'FUR', 'Furto veicolo'),
('INCIDENTE', 'INC', 'INC', 'Incidente stradale')
ON CONFLICT (codice) DO NOTHING;

-- Inserimento di dati di esempio per le province italiane
INSERT INTO rvfu_province_istat (codice, denominazione, sigla) VALUES
('001', 'Torino', 'TO'),
('002', 'Vercelli', 'VC'),
('003', 'Novara', 'NO'),
('004', 'Cuneo', 'CN'),
('005', 'Asti', 'AT'),
('006', 'Alessandria', 'AL'),
('007', 'Biella', 'BI'),
('008', 'Verbano-Cusio-Ossola', 'VB'),
('009', 'Aosta', 'AO'),
('010', 'Imperia', 'IM'),
('011', 'Savona', 'SV'),
('012', 'Genova', 'GE'),
('013', 'La Spezia', 'SP'),
('014', 'Varese', 'VA'),
('015', 'Como', 'CO'),
('016', 'Sondrio', 'SO'),
('017', 'Milano', 'MI'),
('018', 'Bergamo', 'BG'),
('019', 'Brescia', 'BS'),
('020', 'Pavia', 'PV'),
('021', 'Cremona', 'CR'),
('022', 'Mantova', 'MN'),
('023', 'Lecco', 'LC'),
('024', 'Lodi', 'LO'),
('025', 'Monza e Brianza', 'MB'),
('026', 'Trento', 'TN'),
('027', 'Bolzano', 'BZ'),
('028', 'Verona', 'VR'),
('029', 'Vicenza', 'VI'),
('030', 'Belluno', 'BL'),
('031', 'Treviso', 'TV'),
('032', 'Venezia', 'VE'),
('033', 'Padova', 'PD'),
('034', 'Rovigo', 'RO'),
('035', 'Udine', 'UD'),
('036', 'Gorizia', 'GO'),
('037', 'Trieste', 'TS'),
('038', 'Piacenza', 'PC'),
('039', 'Parma', 'PR'),
('040', 'Reggio nell''Emilia', 'RE'),
('041', 'Modena', 'MO'),
('042', 'Bologna', 'BO'),
('043', 'Ferrara', 'FE'),
('044', 'Ravenna', 'RA'),
('045', 'Forlì-Cesena', 'FC'),
('046', 'Pesaro e Urbino', 'PU'),
('047', 'Ancona', 'AN'),
('048', 'Macerata', 'MC'),
('049', 'Ascoli Piceno', 'AP'),
('050', 'Fermo', 'FM'),
('051', 'Massa-Carrara', 'MS'),
('052', 'Lucca', 'LU'),
('053', 'Pistoia', 'PT'),
('054', 'Firenze', 'FI'),
('055', 'Prato', 'PO'),
('056', 'Livorno', 'LI'),
('057', 'Pisa', 'PI'),
('058', 'Arezzo', 'AR'),
('059', 'Siena', 'SI'),
('060', 'Grosseto', 'GR'),
('061', 'Perugia', 'PG'),
('062', 'Terni', 'TR'),
('063', 'Viterbo', 'VT'),
('064', 'Rieti', 'RI'),
('065', 'Roma', 'RM'),
('066', 'Latina', 'LT'),
('067', 'Frosinone', 'FR'),
('068', 'L''Aquila', 'AQ'),
('069', 'Teramo', 'TE'),
('070', 'Pescara', 'PE'),
('071', 'Chieti', 'CH'),
('072', 'Campobasso', 'CB'),
('073', 'Isernia', 'IS'),
('074', 'Caserta', 'CE'),
('075', 'Benevento', 'BN'),
('076', 'Napoli', 'NA'),
('077', 'Avellino', 'AV'),
('078', 'Salerno', 'SA'),
('079', 'Foggia', 'FG'),
('080', 'Bari', 'BA'),
('081', 'Taranto', 'TA'),
('082', 'Brindisi', 'BR'),
('083', 'Lecce', 'LE'),
('084', 'Potenza', 'PZ'),
('085', 'Matera', 'MT'),
('086', 'Cosenza', 'CS'),
('087', 'Catanzaro', 'CZ'),
('088', 'Reggio di Calabria', 'RC'),
('089', 'Trapani', 'TP'),
('090', 'Palermo', 'PA'),
('091', 'Messina', 'ME'),
('092', 'Agrigento', 'AG'),
('093', 'Caltanissetta', 'CL'),
('094', 'Enna', 'EN'),
('095', 'Catania', 'CT'),
('096', 'Ragusa', 'RG'),
('097', 'Siracusa', 'SR'),
('098', 'Sassari', 'SS'),
('099', 'Nuoro', 'NU'),
('100', 'Cagliari', 'CA'),
('101', 'Oristano', 'OR'),
('102', 'Sud Sardegna', 'SU')
ON CONFLICT DO NOTHING;

-- Inserimento comuni principali italiani (capoluoghi di provincia)
INSERT INTO rvfu_comuni_istat (codice, codice_istat, denominazione, sigla_provincia) VALUES
('001', '001272', 'Torino', 'TO'),
('002', '002158', 'Vercelli', 'VC'),
('003', '003106', 'Novara', 'NO'),
('004', '004078', 'Cuneo', 'CN'),
('005', '005005', 'Asti', 'AT'),
('006', '006003', 'Alessandria', 'AL'),
('007', '096004', 'Biella', 'BI'),
('008', '103072', 'Verbania', 'VB'),
('009', '007003', 'Aosta', 'AO'),
('010', '008031', 'Imperia', 'IM'),
('011', '009056', 'Savona', 'SV'),
('012', '010025', 'Genova', 'GE'),
('013', '011015', 'La Spezia', 'SP'),
('014', '012133', 'Varese', 'VA'),
('015', '013075', 'Como', 'CO'),
('016', '014063', 'Sondrio', 'SO'),
('017', '015146', 'Milano', 'MI'),
('018', '016024', 'Bergamo', 'BG'),
('019', '017029', 'Brescia', 'BS'),
('020', '018110', 'Pavia', 'PV'),
('021', '019036', 'Cremona', 'CR'),
('022', '020030', 'Mantova', 'MN'),
('023', '097042', 'Lecco', 'LC'),
('024', '098031', 'Lodi', 'LO'),
('025', '108033', 'Monza', 'MB'),
('026', '022205', 'Trento', 'TN'),
('027', '021008', 'Bolzano', 'BZ'),
('028', '023091', 'Verona', 'VR'),
('029', '024116', 'Vicenza', 'VI'),
('030', '025014', 'Belluno', 'BL'),
('031', '026086', 'Treviso', 'TV'),
('032', '027042', 'Venezia', 'VE'),
('033', '028060', 'Padova', 'PD'),
('034', '029048', 'Rovigo', 'RO'),
('035', '030129', 'Udine', 'UD'),
('036', '031007', 'Gorizia', 'GO'),
('037', '032006', 'Trieste', 'TS'),
('038', '109008', 'Pordenone', 'PN'),
('039', '033032', 'Piacenza', 'PC'),
('040', '034027', 'Parma', 'PR'),
('041', '035033', 'Reggio nell''Emilia', 'RE'),
('042', '036036', 'Modena', 'MO'),
('043', '037006', 'Bologna', 'BO'),
('044', '038008', 'Ferrara', 'FE'),
('045', '039014', 'Ravenna', 'RA'),
('046', '040012', 'Forlì', 'FC'),
('047', '041040', 'Pesaro', 'PU'),
('048', '042002', 'Ancona', 'AN'),
('049', '043028', 'Macerata', 'MC'),
('050', '044007', 'Ascoli Piceno', 'AP'),
('051', '109009', 'Fermo', 'FM'),
('052', '045010', 'Massa', 'MS'),
('053', '046017', 'Lucca', 'LU'),
('054', '047014', 'Pistoia', 'PT'),
('055', '048017', 'Firenze', 'FI'),
('056', '100003', 'Prato', 'PO'),
('057', '049009', 'Livorno', 'LI'),
('058', '050026', 'Pisa', 'PI'),
('059', '051002', 'Arezzo', 'AR'),
('060', '052032', 'Siena', 'SI'),
('061', '053009', 'Grosseto', 'GR'),
('062', '054039', 'Perugia', 'PG'),
('063', '055032', 'Terni', 'TR'),
('064', '056059', 'Viterbo', 'VT'),
('065', '057059', 'Rieti', 'RI'),
('066', '058091', 'Roma', 'RM'),
('067', '059011', 'Latina', 'LT'),
('068', '060022', 'Frosinone', 'FR'),
('069', '066009', 'L''Aquila', 'AQ'),
('070', '067041', 'Teramo', 'TE'),
('071', '068028', 'Pescara', 'PE'),
('072', '069022', 'Chieti', 'CH'),
('073', '070006', 'Campobasso', 'CB'),
('074', '094009', 'Isernia', 'IS'),
('075', '061022', 'Caserta', 'CE'),
('076', '062008', 'Benevento', 'BN'),
('077', '063049', 'Napoli', 'NA'),
('078', '064007', 'Avellino', 'AV'),
('079', '065116', 'Salerno', 'SA'),
('080', '071024', 'Foggia', 'FG'),
('081', '072006', 'Bari', 'BA'),
('082', '073027', 'Taranto', 'TA'),
('083', '074001', 'Brindisi', 'BR'),
('084', '075035', 'Lecce', 'LE'),
('085', '110001', 'Barletta', 'BT'),
('086', '076063', 'Potenza', 'PZ'),
('087', '077014', 'Matera', 'MT'),
('088', '078045', 'Cosenza', 'CS'),
('089', '079023', 'Catanzaro', 'CZ'),
('090', '080063', 'Reggio di Calabria', 'RC'),
('091', '101004', 'Crotone', 'KR'),
('092', '102042', 'Vibo Valentia', 'VV'),
('093', '081021', 'Trapani', 'TP'),
('094', '082053', 'Palermo', 'PA'),
('095', '083048', 'Messina', 'ME'),
('096', '084003', 'Agrigento', 'AG'),
('097', '085003', 'Caltanissetta', 'CL'),
('098', '086007', 'Enna', 'EN'),
('099', '087015', 'Catania', 'CT'),
('100', '088009', 'Ragusa', 'RG'),
('101', '089017', 'Siracusa', 'SR'),
('102', '090015', 'Sassari', 'SS'),
('103', '091022', 'Nuoro', 'NU'),
('104', '092009', 'Cagliari', 'CA'),
('105', '095018', 'Oristano', 'OR'),
('106', '104008', 'Olbia', 'SS'),
('107', '111015', 'Carbonia', 'SU')
ON CONFLICT DO NOTHING;

-- Commenti per documentazione
COMMENT ON TABLE rvfu_documents IS 'Documenti allegati ai VFU';
COMMENT ON TABLE rvfu_operation_logs IS 'Log delle operazioni RVFU';
COMMENT ON TABLE rvfu_configurations IS 'Configurazioni RVFU per organizzazione';
COMMENT ON TABLE rvfu_subjects IS 'Soggetti (intestatari, detentori) dei VFU';
COMMENT ON TABLE rvfu_document_distincts IS 'Distinte documenti per VFU';
COMMENT ON TABLE rvfu_fascicoli IS 'Fascicoli VFU';
COMMENT ON TABLE rvfu_deleghe IS 'Deleghe RVFU';
COMMENT ON TABLE rvfu_veicoli IS 'Dati veicoli VFU';
COMMENT ON TABLE rvfu_causali IS 'Causali per registrazione VFU';
COMMENT ON TABLE rvfu_comuni_istat IS 'Comuni ISTAT per VFU';
COMMENT ON TABLE rvfu_province_istat IS 'Province ISTAT per VFU';
COMMENT ON TABLE rvfu_stati_esteri_istat IS 'Stati esteri ISTAT per VFU';
