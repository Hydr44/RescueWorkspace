-- ============================================
-- CREAZIONE TABELLE DISTINTE SMONTAGGIO
-- ============================================

-- Tabella dismantling_jobs: distinte di smontaggio veicoli
CREATE TABLE IF NOT EXISTS public.dismantling_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati veicolo
  marca TEXT NOT NULL,
  modello TEXT NOT NULL,
  anno INTEGER,
  targa TEXT,
  telaio TEXT,
  vehicle_catalog_id UUID REFERENCES public.vehicles_catalog(id),
  
  -- Dati smontaggio
  dismantling_date DATE NOT NULL DEFAULT CURRENT_DATE,
  dismantler_name TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  
  -- Metadati
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabella part_batches: batch di ricambi da distinta
CREATE TABLE IF NOT EXISTS public.part_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dismantling_job_id UUID NOT NULL REFERENCES public.dismantling_jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati ricambio
  part_name TEXT NOT NULL,
  part_code TEXT,
  category_id UUID REFERENCES public.spare_parts_categories(id),
  
  -- Quantità
  qty_in INTEGER NOT NULL DEFAULT 0,
  qty_available INTEGER NOT NULL DEFAULT 0,
  qty_sold INTEGER NOT NULL DEFAULT 0,
  qty_damaged INTEGER NOT NULL DEFAULT 0,
  
  -- Stato
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'completed')),
  
  -- Metadati
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_dismantling_jobs_org ON public.dismantling_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_dismantling_jobs_status ON public.dismantling_jobs(status);
CREATE INDEX IF NOT EXISTS idx_dismantling_jobs_date ON public.dismantling_jobs(dismantling_date);

CREATE INDEX IF NOT EXISTS idx_part_batches_job ON public.part_batches(dismantling_job_id);
CREATE INDEX IF NOT EXISTS idx_part_batches_org ON public.part_batches(org_id);
CREATE INDEX IF NOT EXISTS idx_part_batches_status ON public.part_batches(status);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dismantling_jobs_updated_at ON public.dismantling_jobs;
CREATE TRIGGER update_dismantling_jobs_updated_at
  BEFORE UPDATE ON public.dismantling_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_part_batches_updated_at ON public.part_batches;
CREATE TRIGGER update_part_batches_updated_at
  BEFORE UPDATE ON public.part_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies per dismantling_jobs
ALTER TABLE public.dismantling_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dismantling_jobs_select" ON public.dismantling_jobs;
CREATE POLICY "dismantling_jobs_select"
  ON public.dismantling_jobs FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "dismantling_jobs_insert" ON public.dismantling_jobs;
CREATE POLICY "dismantling_jobs_insert"
  ON public.dismantling_jobs FOR INSERT WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "dismantling_jobs_update" ON public.dismantling_jobs;
CREATE POLICY "dismantling_jobs_update"
  ON public.dismantling_jobs FOR UPDATE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "dismantling_jobs_delete" ON public.dismantling_jobs;
CREATE POLICY "dismantling_jobs_delete"
  ON public.dismantling_jobs FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

-- RLS Policies per part_batches
ALTER TABLE public.part_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "part_batches_select" ON public.part_batches;
CREATE POLICY "part_batches_select"
  ON public.part_batches FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "part_batches_insert" ON public.part_batches;
CREATE POLICY "part_batches_insert"
  ON public.part_batches FOR INSERT WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "part_batches_update" ON public.part_batches;
CREATE POLICY "part_batches_update"
  ON public.part_batches FOR UPDATE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "part_batches_delete" ON public.part_batches;
CREATE POLICY "part_batches_delete"
  ON public.part_batches FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

-- Verifica
SELECT 'Tabelle create con successo!' as status;
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('dismantling_jobs', 'part_batches')
ORDER BY tablename, policyname;
