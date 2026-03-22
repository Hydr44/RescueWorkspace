-- =====================================================
-- FIX: Crea tabella shelves + aggiunge colonna year a vehicles_catalog
-- Le tabelle erano definite in migrazioni precedenti ma mai applicate
-- =====================================================

-- 1. SHELVES (scaffali magazzino)
-- Definita in 20250116000000 ma mai applicata al DB
CREATE TABLE IF NOT EXISTS public.shelves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  code text NOT NULL,
  area text,
  section text,
  shelf_number text,
  
  description text,
  capacity integer,
  notes text,
  
  active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(org_id, code)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_shelves_org ON public.shelves(org_id);
CREATE INDEX IF NOT EXISTS idx_shelves_code ON public.shelves(code);

-- RLS
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

-- Policy: membri org possono CRUD
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shelves' AND policyname = 'shelves_org_members'
  ) THEN
    CREATE POLICY shelves_org_members ON public.shelves
      FOR ALL USING (
        EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = shelves.org_id AND m.user_id = auth.uid())
      );
  END IF;
END $$;

-- Ensure the timestamp trigger function exists
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at
DROP TRIGGER IF EXISTS shelves_updated_at ON public.shelves;
CREATE TRIGGER shelves_updated_at
  BEFORE UPDATE ON public.shelves
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 2. VEHICLES_CATALOG: aggiunge colonna "year" come alias calcolato
-- La tabella ha year_from e year_to, ma il componente chiede "year"
-- Aggiungiamo una colonna generata per compatibilità
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vehicles_catalog' AND column_name = 'year'
  ) THEN
    ALTER TABLE public.vehicles_catalog ADD COLUMN year integer GENERATED ALWAYS AS (year_from) STORED;
  END IF;
END $$;

-- Indice per la nuova colonna
CREATE INDEX IF NOT EXISTS idx_vehicles_catalog_year ON public.vehicles_catalog(year);

COMMENT ON COLUMN public.vehicles_catalog.year IS 'Alias per year_from, usato dal componente SparePartNewMVP';
