-- Migrazione completa per gestione piazzale mezzi
-- Applicare questo SQL nella console Supabase

-- Elimina tabella esistente se presente (ATTENZIONE: cancella i dati!)
DROP TABLE IF EXISTS public.yard_vehicles CASCADE;

-- Crea tabella per gestire i mezzi nel piazzale
CREATE TABLE public.yard_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Informazioni veicolo (senza FK per flessibilità)
  targa text NOT NULL,
  marca text,
  modello text,
  telaio text,
  
  -- Posizione nel piazzale
  zona text NOT NULL DEFAULT 'A',
  posizione text,
  
  -- Tag specifici
  tag text NOT NULL DEFAULT 'sequestro' CHECK (tag IN ('sequestro', 'confisca', 'demolizione', 'vendita', 'manutenzione', 'attesa', 'altro')),
  
  -- Dettagli specifici per tag
  numero_pratica text,
  numero_chiave text,
  autorita_competente text,
  data_sequestro date,
  data_confisca date,
  scadenza_pratica date,
  
  -- Stato e note
  stato text DEFAULT 'attivo' CHECK (stato IN ('attivo', 'in_manutenzione', 'venduto', 'demolito', 'rimosso', 'rilasciato')),
  note text,
  
  -- Date di gestione
  data_ingresso timestamptz DEFAULT now(),
  data_rilascio timestamptz,
  data_uscita timestamptz,
  
  -- Gestione foto (originali e compresse)
  foto jsonb DEFAULT '[]'::jsonb,
  foto_compresse jsonb DEFAULT '[]'::jsonb,
  
  -- Condizioni
  condizioni_iniziali text,
  condizioni_finali text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indici per performance
CREATE INDEX idx_yard_vehicles_org_id ON public.yard_vehicles(org_id);
CREATE INDEX idx_yard_vehicles_targa ON public.yard_vehicles(targa);
CREATE INDEX idx_yard_vehicles_zona ON public.yard_vehicles(zona);
CREATE INDEX idx_yard_vehicles_tag ON public.yard_vehicles(tag);
CREATE INDEX idx_yard_vehicles_stato ON public.yard_vehicles(stato);
CREATE INDEX idx_yard_vehicles_data_ingresso ON public.yard_vehicles(data_ingresso);

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

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_yard_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at
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

-- Inserisci alcuni dati di esempio (opzionale)
INSERT INTO public.yard_vehicles (
  org_id, targa, marca, modello, zona, tag, numero_pratica, 
  data_ingresso, note, condizioni_iniziali
) VALUES 
(
  (SELECT id FROM public.orgs LIMIT 1),
  'AB123CD',
  'Fiat',
  'Punto',
  'A',
  'sequestro',
  'PRAT-001',
  now(),
  'Veicolo sequestrato per guida senza patente',
  'Buone condizioni generali, alcuni graffi laterali'
),
(
  (SELECT id FROM public.orgs LIMIT 1),
  'EF456GH',
  'Volkswagen',
  'Golf',
  'B',
  'confisca',
  'PRAT-002',
  now() - interval '5 days',
  'Veicolo confiscato per traffico di droga',
  'Ottime condizioni, interni puliti'
);

-- Verifica che tutto sia stato creato correttamente
SELECT 'Tabella yard_vehicles creata con successo!' as status;
SELECT COUNT(*) as total_records FROM public.yard_vehicles;
SELECT * FROM public.yard_vehicles_view LIMIT 5;
