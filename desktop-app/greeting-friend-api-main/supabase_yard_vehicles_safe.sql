-- Migrazione sicura per yard_vehicles (senza cancellare dati esistenti)
-- Applicare questo SQL nella console Supabase

-- Verifica se la tabella esiste già e creala se necessario
CREATE TABLE IF NOT EXISTS public.yard_vehicles (
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

-- Indici per performance (solo se non esistono)
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_org_id ON public.yard_vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_targa ON public.yard_vehicles(targa);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_zona ON public.yard_vehicles(zona);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_tag ON public.yard_vehicles(tag);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_stato ON public.yard_vehicles(stato);
CREATE INDEX IF NOT EXISTS idx_yard_vehicles_data_ingresso ON public.yard_vehicles(data_ingresso);

-- RLS (Row Level Security)
ALTER TABLE public.yard_vehicles ENABLE ROW LEVEL SECURITY;

-- Policy per permettere accesso solo all'organizzazione (solo se non esiste)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'yard_vehicles' 
        AND policyname = 'Users can access yard_vehicles from their organization'
    ) THEN
        CREATE POLICY "Users can access yard_vehicles from their organization" ON public.yard_vehicles
          FOR ALL USING (
            org_id IN (
              SELECT om.org_id 
              FROM public.org_members om 
              WHERE om.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_yard_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at (solo se non esiste)
DROP TRIGGER IF EXISTS update_yard_vehicles_updated_at ON public.yard_vehicles;
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

-- Inserisci alcuni dati di esempio (solo se la tabella è vuota)
INSERT INTO public.yard_vehicles (
  org_id, targa, marca, modello, zona, tag, numero_pratica, 
  data_ingresso, note, condizioni_iniziali, numero_chiave
) 
SELECT 
  (SELECT id FROM public.orgs LIMIT 1),
  'AB123CD',
  'Fiat',
  'Punto',
  'A',
  'sequestro',
  'PRAT-001',
  now(),
  'Veicolo sequestrato per guida senza patente',
  'Buone condizioni generali, alcuni graffi laterali',
  'CHIAVE-001'
WHERE NOT EXISTS (SELECT 1 FROM public.yard_vehicles LIMIT 1);

-- Verifica che tutto sia stato creato correttamente
SELECT 'Configurazione completata!' as status;
SELECT COUNT(*) as total_records FROM public.yard_vehicles;
SELECT targa, marca, modello, zona, tag, numero_chiave FROM public.yard_vehicles LIMIT 5;
