-- FASE 1: Database Ricambi & Riconoscimento Automatico

-- Categorie ricambi standard
CREATE TABLE IF NOT EXISTS public.spare_parts_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.spare_parts_categories(id),
  code text UNIQUE, -- es. "ENG" per Engine, "SUS" per Suspension
  created_at timestamptz DEFAULT now()
);

-- Catalogo veicoli (per compatibilità)
CREATE TABLE IF NOT EXISTS public.vehicles_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati identificativi
  make text NOT NULL, -- Marca (es. "Fiat")
  model text NOT NULL, -- Modello (es. "Punto")
  year_from integer,
  year_to integer,
  fuel_type text, -- Benzina, Diesel, GPL, Elettrico
  engine_code text,
  kw integer,
  hp integer,
  
  -- Codici tecnici
  ktype_id text, -- TecDoc KType ID (se disponibile)
  vin_pattern text, -- Pattern VIN per auto-riconoscimento
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ricambi in magazzino
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati base
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.spare_parts_categories(id),
  
  -- Identificazione
  oem_code text, -- Codice originale costruttore
  ean_code text, -- Barcode EAN
  internal_code text, -- Codice interno gestionale
  
  -- Provenienza
  source_vehicle_id uuid REFERENCES public.vehicles_catalog(id),
  dismantled_from_transport uuid REFERENCES public.transports(id),
  
  -- Prezzi e quantità
  quantity integer DEFAULT 1,
  price_buy numeric(10,2),
  price_sell numeric(10,2),
  auto_price boolean DEFAULT true, -- Calcolo prezzo automatico
  
  -- Ubicazione magazzino
  warehouse_location text, -- es. "Scaffale A-12"
  warehouse_barcode text, -- Barcode ubicazione
  
  -- Stato
  condition text DEFAULT 'used' CHECK (condition IN ('new', 'used', 'refurbished', 'damaged')),
  status text DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged')),
  
  -- Immagini e documenti
  images jsonb DEFAULT '[]', -- Array di URL immagini
  technical_docs jsonb DEFAULT '[]',
  
  -- Metadata ricerca
  search_terms text, -- Termini ricerca aggiuntivi
  compatibility_notes text,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Matrice compatibilità ricambi-veicoli
CREATE TABLE IF NOT EXISTS public.spare_parts_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles_catalog(id) ON DELETE CASCADE,
  
  -- Dettagli compatibilità
  compatibility_type text DEFAULT 'exact' CHECK (compatibility_type IN ('exact', 'compatible', 'adaptable')),
  notes text,
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(spare_part_id, vehicle_id)
);

-- Cache dati API esterne (TecDoc, etc)
CREATE TABLE IF NOT EXISTS public.external_parts_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificazione parte
  oem_code text,
  ean_code text,
  
  -- Dati da API
  api_source text NOT NULL, -- 'tecdoc', 'autodata', 'custom'
  external_id text, -- ID sulla piattaforma esterna
  part_data jsonb NOT NULL, -- Dati completi dalla API
  
  -- Metadata
  last_sync timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(api_source, external_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_org ON public.spare_parts(org_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_oem ON public.spare_parts(oem_code);
CREATE INDEX IF NOT EXISTS idx_spare_parts_ean ON public.spare_parts(ean_code);
CREATE INDEX IF NOT EXISTS idx_spare_parts_status ON public.spare_parts(status);
CREATE INDEX IF NOT EXISTS idx_spare_parts_location ON public.spare_parts(warehouse_location);
CREATE INDEX IF NOT EXISTS idx_vehicles_catalog_org ON public.vehicles_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_catalog_ktype ON public.vehicles_catalog(ktype_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_part ON public.spare_parts_compatibility(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_vehicle ON public.spare_parts_compatibility(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_cache_oem ON public.external_parts_cache(oem_code);
CREATE INDEX IF NOT EXISTS idx_cache_ean ON public.external_parts_cache(ean_code);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_spare_parts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER spare_parts_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_spare_parts_timestamp();

CREATE TRIGGER vehicles_catalog_updated_at
  BEFORE UPDATE ON public.vehicles_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_spare_parts_timestamp();

-- RLS Policies
ALTER TABLE public.spare_parts_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_parts_cache ENABLE ROW LEVEL SECURITY;

-- Policy: membri org possono vedere/gestire ricambi
CREATE POLICY spare_parts_org_members_select ON public.spare_parts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_parts.org_id AND m.user_id = auth.uid())
  );

CREATE POLICY spare_parts_org_members_insert ON public.spare_parts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_parts.org_id AND m.user_id = auth.uid())
  );

CREATE POLICY spare_parts_org_members_update ON public.spare_parts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_parts.org_id AND m.user_id = auth.uid())
  );

CREATE POLICY spare_parts_org_members_delete ON public.spare_parts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_parts.org_id AND m.user_id = auth.uid())
  );

-- Policy simili per vehicles_catalog
CREATE POLICY vehicles_catalog_org_select ON public.vehicles_catalog
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = vehicles_catalog.org_id AND m.user_id = auth.uid())
  );

CREATE POLICY vehicles_catalog_org_insert ON public.vehicles_catalog
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = vehicles_catalog.org_id AND m.user_id = auth.uid())
  );

CREATE POLICY vehicles_catalog_org_update ON public.vehicles_catalog
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = vehicles_catalog.org_id AND m.user_id = auth.uid())
  );

-- Categorie e cache pubbliche in lettura
CREATE POLICY spare_parts_categories_public_read ON public.spare_parts_categories
  FOR SELECT USING (true);

CREATE POLICY external_cache_public_read ON public.external_parts_cache
  FOR SELECT USING (true);

-- Compatibilità leggibile da tutti gli utenti autenticati
CREATE POLICY compatibility_public_read ON public.spare_parts_compatibility
  FOR SELECT USING (true);

-- Inserimento categorie base
INSERT INTO public.spare_parts_categories (name, code) VALUES
  ('Motore', 'ENG'),
  ('Trasmissione', 'TRX'),
  ('Sospensioni', 'SUS'),
  ('Freni', 'BRK'),
  ('Carrozzeria', 'BODY'),
  ('Interni', 'INT'),
  ('Elettronica', 'ELEC'),
  ('Illuminazione', 'LIGHT'),
  ('Pneumatici', 'TIRE'),
  ('Altro', 'OTHER')
ON CONFLICT (code) DO NOTHING;