-- =====================================================
-- UPGRADE MODULO RICAMBI: campi completi + immagini + marketplace eBay/Subito/Shopify
-- =====================================================

-- 1. NUOVI CAMPI SU spare_parts
-- =====================================================

-- Dati fisici
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS weight_kg numeric(8,2);
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS length_cm numeric(8,2);
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS width_cm numeric(8,2);
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS height_cm numeric(8,2);
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS material text;

-- Posizione sul veicolo
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS vehicle_side text CHECK (vehicle_side IN ('left', 'right', 'front', 'rear', 'center', 'upper', 'lower', NULL));
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS vehicle_position text; -- es. "Motore anteriore", "Portiera DX", "Cruscotto"

-- Provenienza veicolo (dati denormalizzati per velocità)
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_make text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_model text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_year integer;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_fuel text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_engine_code text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_vin text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_plate text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_km integer;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_vehicle_color text;

-- Codici aggiuntivi
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS cross_references text[]; -- Array codici OEM alternativi
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS tecdoc_article_id text;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS tecdoc_supplier text;

-- Garanzia
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS warranty_months integer DEFAULT 0;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS warranty_notes text;

-- Vendita
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS published_title text; -- Titolo per marketplace (può differire dal nome interno)
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS published_description text; -- Descrizione per marketplace
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS shipping_weight_kg numeric(8,2);
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2);
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false;

-- Indici per nuovi campi
CREATE INDEX IF NOT EXISTS idx_spare_parts_make_model ON public.spare_parts(source_vehicle_make, source_vehicle_model);
CREATE INDEX IF NOT EXISTS idx_spare_parts_published ON public.spare_parts(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_spare_parts_tecdoc ON public.spare_parts(tecdoc_article_id);

-- 2. TABELLA IMMAGINI RICAMBI
-- =====================================================

CREATE TABLE IF NOT EXISTS public.spare_part_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  
  -- File
  storage_path text NOT NULL, -- Path in Supabase Storage
  url text NOT NULL, -- URL pubblico
  thumbnail_url text, -- URL thumbnail (generato)
  
  -- Metadata
  file_name text,
  file_size integer,
  mime_type text,
  width integer,
  height integer,
  
  -- Ordinamento
  sort_order integer DEFAULT 0,
  is_primary boolean DEFAULT false, -- Immagine principale
  
  -- Stato
  alt_text text, -- Per SEO marketplace
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spare_part_images_part ON public.spare_part_images(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_spare_part_images_primary ON public.spare_part_images(spare_part_id, is_primary) WHERE is_primary = true;

-- RLS
ALTER TABLE public.spare_part_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY spare_part_images_org_select ON public.spare_part_images
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_part_images.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY spare_part_images_org_insert ON public.spare_part_images
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_part_images.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY spare_part_images_org_update ON public.spare_part_images
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_part_images.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY spare_part_images_org_delete ON public.spare_part_images
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = spare_part_images.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger updated_at per spare_part_images non serve (no updated_at)

-- 3. UPGRADE MARKETPLACE: aggiungere eBay, Subito, Shopify
-- =====================================================

-- Crea tabella marketplaces se non esiste (potrebbe non essere stata creata in precedenza)
CREATE TABLE IF NOT EXISTS public.marketplaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rimuovi il vecchio CHECK constraint e aggiungi quello nuovo con più opzioni
ALTER TABLE public.marketplaces DROP CONSTRAINT IF EXISTS marketplaces_name_check;
ALTER TABLE public.marketplaces ADD CONSTRAINT marketplaces_name_check 
  CHECK (name IN ('woo', 'shopify', 'ebay', 'subito', 'csv', 'custom'));

-- Tabella connessioni marketplace per ogni org (credenziali OAuth/API)
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Tipo marketplace
  platform text NOT NULL CHECK (platform IN ('ebay', 'subito', 'shopify', 'woo')),
  
  -- Credenziali (criptate lato app)
  credentials jsonb NOT NULL DEFAULT '{}',
  -- eBay: { app_id, cert_id, dev_id, oauth_token, refresh_token, sandbox }
  -- Shopify: { shop_domain, api_key, api_secret, access_token }
  -- Subito: { email, api_key } (se disponibile) o { export_format: 'csv'|'xml' }
  
  -- Stato connessione
  status text DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connected', 'expired', 'error')),
  last_auth_at timestamptz,
  last_error text,
  
  -- Impostazioni sync
  auto_sync boolean DEFAULT false,
  sync_interval_minutes integer DEFAULT 60,
  last_sync_at timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(org_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_connections_org ON public.marketplace_connections(org_id);

-- RLS
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY marketplace_connections_org_select ON public.marketplace_connections
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = marketplace_connections.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY marketplace_connections_org_insert ON public.marketplace_connections
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = marketplace_connections.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY marketplace_connections_org_update ON public.marketplace_connections
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = marketplace_connections.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY marketplace_connections_org_delete ON public.marketplace_connections
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = marketplace_connections.org_id AND m.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger updated_at
DROP TRIGGER IF EXISTS marketplace_connections_updated_at ON public.marketplace_connections;
CREATE TRIGGER marketplace_connections_updated_at
  BEFORE UPDATE ON public.marketplace_connections
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 4. SUPABASE STORAGE BUCKET
-- =====================================================
-- Nota: il bucket va creato via dashboard Supabase o via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('spare-parts-images', 'spare-parts-images', true);
-- Policy storage:
-- CREATE POLICY "Org members can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'spare-parts-images' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'spare-parts-images');
-- CREATE POLICY "Org members can delete" ON storage.objects FOR DELETE USING (bucket_id = 'spare-parts-images' AND auth.uid() IS NOT NULL);

-- =====================================================
-- FINE MIGRAZIONE
-- =====================================================
