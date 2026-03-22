-- Migrazione per gestione piazzale mezzi con tag specifici
-- Crea tabella per gestire i mezzi nelle diverse zone del piazzale

CREATE TABLE IF NOT EXISTS public.yard_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Informazioni veicolo (senza FK per flessibilità)
  targa text NOT NULL,
  marca text,
  modello text,
  telaio text,
  
  -- Posizione nel piazzale
  zona text NOT NULL, -- es. "Zona A", "Settore Nord", "Area Sequestri"
  posizione text, -- es. "A1", "B3", "Nord-12"
  
  -- Tag specifici
  tag text NOT NULL CHECK (tag IN ('sequestro', 'confisca', 'demolizione', 'vendita', 'manutenzione', 'attesa', 'altro')),
  
  -- Dettagli specifici per tag
  numero_pratica text, -- Per sequestri/confische
  numero_chiave text, -- Numero chiave del veicolo
  autorita_competente text, -- Per sequestri/confische
  data_sequestro date, -- Per sequestri
  data_confisca date, -- Per confische
  scadenza_pratica date, -- Scadenza pratica
  
  -- Stato e note
  stato text DEFAULT 'attivo' CHECK (stato IN ('attivo', 'in_manutenzione', 'venduto', 'demolito', 'rimosso', 'rilasciato')),
  note text,
  
  -- Date di gestione
  data_ingresso timestamptz DEFAULT now(),
  data_rilascio timestamptz, -- Data di rilascio del veicolo
  data_uscita timestamptz,
  
  -- Gestione foto (originali e compresse)
  foto jsonb DEFAULT '[]'::jsonb, -- Array di foto originali
  foto_compresse jsonb DEFAULT '[]'::jsonb, -- Array di foto compresse
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_org_id ON public.yard_vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_targa ON public.yard_vehicles(targa);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_zona ON public.yard_vehicles(zona);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_tag ON public.yard_vehicles(tag);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_stato ON public.yard_vehicles(stato);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_data_ingresso ON public.yard_vehicles(data_ingresso);

-- RLS (Row Level Security)
ALTER TABLE public.yard_vehicles ENABLE ROW LEVEL SECURITY;

-- Policy per permettere accesso solo all'organizzazione
CREATE POLICY "Users can access yard_vehicles from their organization" ON public.yard_vehicles
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id 
      FROM public.org_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_yard_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_yard_vehicles_updated_at
  BEFORE UPDATE ON public.yard_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_yard_vehicles_updated_at();

-- Vista per visualizzare i mezzi nel piazzale con dettagli
CREATE OR REPLACE VIEW public.yard_vehicles_view AS
SELECT 
  yv.*,
  CASE 
    WHEN yv.tag = 'sequestro' THEN 'Sequestro'
    WHEN yv.tag = 'confisca' THEN 'Confisca'
    WHEN yv.tag = 'demolizione' THEN 'Demolizione'
    WHEN yv.tag = 'vendita' THEN 'Vendita'
    WHEN yv.tag = 'manutenzione' THEN 'Manutenzione'
    WHEN yv.tag = 'attesa' THEN 'Attesa'
    WHEN yv.tag = 'altro' THEN 'Altro'
    ELSE 'Sconosciuto'
  END as tag_label,
  CASE 
    WHEN yv.stato = 'attivo' THEN 'Attivo'
    WHEN yv.stato = 'in_manutenzione' THEN 'In Manutenzione'
    WHEN yv.stato = 'venduto' THEN 'Venduto'
    WHEN yv.stato = 'demolito' THEN 'Demolito'
    WHEN yv.stato = 'rimosso' THEN 'Rimosso'
    WHEN yv.stato = 'rilasciato' THEN 'Rilasciato'
    ELSE yv.stato
  END as stato_label,
  -- Calcola giorni di permanenza
  CASE 
    WHEN yv.data_uscita IS NOT NULL THEN 
      EXTRACT(DAYS FROM (yv.data_uscita - yv.data_ingresso))
    ELSE 
      EXTRACT(DAYS FROM (now() - yv.data_ingresso))
  END as giorni_permanenza
FROM public.yard_vehicles yv;

-- RLS per la vista
ALTER VIEW public.yard_vehicles_view SET (security_invoker = true);
