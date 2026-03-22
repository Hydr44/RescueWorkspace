-- =====================================================
-- SISTEMA RICAMBI MVP COMPLETO
-- Estende il sistema esistente con tutte le funzionalità
-- =====================================================

-- 1. DISTINTE SMONTAGGIO E BATCH
-- =====================================================

-- Distinte di smontaggio veicoli
CREATE TABLE IF NOT EXISTS public.dismantling_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati veicolo
  vehicle_id uuid REFERENCES public.vehicles_catalog(id),
  targa text,
  telaio text,
  marca text,
  modello text,
  anno integer,
  
  -- Dati smontaggio
  dismantling_date date DEFAULT CURRENT_DATE,
  dismantler_name text,
  notes text,
  
  -- Stato
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Batch di ricambi per distinta
CREATE TABLE IF NOT EXISTS public.part_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Riferimenti
  job_id uuid NOT NULL REFERENCES public.dismantling_jobs(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.spare_parts(id) ON DELETE SET NULL,
  
  -- Dati batch
  oem_code text,
  part_name text NOT NULL,
  condition text DEFAULT 'used' CHECK (condition IN ('new', 'used', 'refurbished', 'damaged')),
  
  -- Quantità
  qty_in integer DEFAULT 1,
  qty_available integer DEFAULT 1,
  qty_sold integer DEFAULT 0,
  
  -- Prezzi
  cost_price numeric(10,2),
  list_price numeric(10,2),
  sell_price numeric(10,2),
  
  -- Stato
  status text DEFAULT 'NEW' CHECK (status IN ('NEW', 'QA_OK', 'LISTED_STORE', 'LISTED_ONLINE', 'SOLD', 'RETURNED', 'DISCARDED')),
  
  -- Metadata
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. SISTEMA PREZZI E LISTINI QUATTORUOTE
-- =====================================================

-- Catalogo Quattroruote (listini ufficiali)
CREATE TABLE IF NOT EXISTS public.quattroruote_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificazione veicolo
  make text NOT NULL,
  model text NOT NULL,
  year_from integer,
  year_to integer,
  fuel_type text,
  
  -- Categoria ricambio
  category text NOT NULL,
  subcategory text,
  
  -- Prezzo listino
  list_price numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  
  -- Metadata
  source text DEFAULT 'quattroruote',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Regole di calcolo prezzi
CREATE TABLE IF NOT EXISTS public.price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati regola
  name text NOT NULL,
  description text,
  formula text NOT NULL, -- es: "max(list_price*0.6, cost*1.3)"
  
  -- Condizioni
  condition_type text DEFAULT 'all' CHECK (condition_type IN ('all', 'category', 'condition', 'custom')),
  condition_value text,
  
  -- Stato
  active boolean DEFAULT true,
  priority integer DEFAULT 0,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 3. GESTIONE MAGAZZINO AVANZATA
-- =====================================================

-- Scaffali e ubicazioni
CREATE TABLE IF NOT EXISTS public.shelves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Codice scaffale
  code text NOT NULL,
  area text,
  section text,
  shelf_number text,
  
  -- Dettagli
  description text,
  capacity integer,
  notes text,
  
  -- Stato
  active boolean DEFAULT true,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(org_id, code)
);

-- Movimenti di magazzino
CREATE TABLE IF NOT EXISTS public.stock_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Riferimenti
  part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.part_batches(id) ON DELETE SET NULL,
  
  -- Movimento
  qty integer NOT NULL,
  type text NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJ', 'TRANSFER')),
  reason text,
  
  -- Riferimento esterno
  ref_type text, -- 'order', 'dismantling', 'adjustment', 'transfer'
  ref_id uuid,
  
  -- Dettagli
  notes text,
  cost_per_unit numeric(10,2),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 4. SISTEMA POS E VENDITE
-- =====================================================

-- Ordini (POS e Online)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Tipo ordine
  type text NOT NULL CHECK (type IN ('POS', 'ONLINE', 'WHOLESALE')),
  
  -- Cliente
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_tax_code text,
  
  -- Totale
  subtotal numeric(10,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  
  -- Pagamento
  payment_method text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Stato
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  
  -- Metadata
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Righe ordine
CREATE TABLE IF NOT EXISTS public.order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.part_batches(id) ON DELETE SET NULL,
  
  -- Quantità e prezzi
  qty integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 22.00,
  discount_rate numeric(5,2) DEFAULT 0,
  line_total numeric(10,2) NOT NULL,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. SISTEMA BARCODE E ETICHETTE
-- =====================================================

-- Barcode per ricambi
CREATE TABLE IF NOT EXISTS public.barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Riferimenti
  part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  
  -- Barcode
  symbology text DEFAULT 'code128',
  value text NOT NULL,
  
  -- Tipo
  type text DEFAULT 'part' CHECK (type IN ('part', 'location', 'batch')),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  UNIQUE(value)
);

-- 6. VENDITA ONLINE E MARKETPLACE
-- =====================================================

-- Marketplace configurati
CREATE TABLE IF NOT EXISTS public.marketplaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati marketplace
  name text NOT NULL CHECK (name IN ('woo', 'shopify', 'csv', 'custom')),
  display_name text NOT NULL,
  
  -- Configurazione
  config jsonb NOT NULL DEFAULT '{}',
  active boolean DEFAULT true,
  
  -- Sync
  last_sync timestamptz,
  sync_status text DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'success')),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Listings su marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id uuid NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  
  -- ID esterno
  external_id text,
  
  -- Stato
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED')),
  
  -- Dati sincronizzati
  payload jsonb DEFAULT '{}',
  
  -- Sync
  last_sync timestamptz DEFAULT now(),
  sync_errors text[],
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(marketplace_id, part_id)
);

-- 7. INDICI PER PERFORMANCE
-- =====================================================

-- Indici principali
CREATE INDEX IF NOT EXISTS idx_dismantling_jobs_org ON public.dismantling_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_dismantling_jobs_status ON public.dismantling_jobs(status);
CREATE INDEX IF NOT EXISTS idx_part_batches_job ON public.part_batches(job_id);
CREATE INDEX IF NOT EXISTS idx_part_batches_part ON public.part_batches(part_id);
CREATE INDEX IF NOT EXISTS idx_part_batches_status ON public.part_batches(status);

CREATE INDEX IF NOT EXISTS idx_quattroruote_make_model ON public.quattroruote_catalog(make, model);
CREATE INDEX IF NOT EXISTS idx_quattroruote_category ON public.quattroruote_catalog(category);
CREATE INDEX IF NOT EXISTS idx_price_rules_org ON public.price_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_price_rules_active ON public.price_rules(active);

CREATE INDEX IF NOT EXISTS idx_shelves_org ON public.shelves(org_id);
CREATE INDEX IF NOT EXISTS idx_shelves_code ON public.shelves(code);
CREATE INDEX IF NOT EXISTS idx_stock_moves_part ON public.stock_moves(part_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_type ON public.stock_moves(type);
CREATE INDEX IF NOT EXISTS idx_stock_moves_date ON public.stock_moves(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_org ON public.orders(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON public.orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON public.order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_part ON public.order_lines(part_id);

CREATE INDEX IF NOT EXISTS idx_barcodes_part ON public.barcodes(part_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_value ON public.barcodes(value);
CREATE INDEX IF NOT EXISTS idx_marketplaces_org ON public.marketplaces(org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_marketplace ON public.marketplace_listings(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_part ON public.marketplace_listings(part_id);

-- 8. TRIGGER PER AGGIORNAMENTI AUTOMATICI
-- =====================================================

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica trigger a tutte le tabelle con updated_at
CREATE TRIGGER dismantling_jobs_updated_at
  BEFORE UPDATE ON public.dismantling_jobs
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER part_batches_updated_at
  BEFORE UPDATE ON public.part_batches
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER price_rules_updated_at
  BEFORE UPDATE ON public.price_rules
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER shelves_updated_at
  BEFORE UPDATE ON public.shelves
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER marketplaces_updated_at
  BEFORE UPDATE ON public.marketplaces
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Trigger per aggiornare quantità ricambi
CREATE OR REPLACE FUNCTION update_part_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcola la quantità totale dai movimenti stock
  UPDATE public.spare_parts 
  SET quantity = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN type = 'IN' THEN qty
        WHEN type = 'OUT' THEN -qty
        WHEN type = 'ADJ' THEN qty
        ELSE 0
      END
    ), 0)
    FROM public.stock_moves 
    WHERE part_id = COALESCE(NEW.part_id, OLD.part_id)
  )
  WHERE id = COALESCE(NEW.part_id, OLD.part_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_moves_update_quantity
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_moves
  FOR EACH ROW EXECUTE FUNCTION update_part_quantity();

-- 9. RLS POLICIES
-- =====================================================

-- Abilita RLS su tutte le nuove tabelle
ALTER TABLE public.dismantling_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quattroruote_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Policy per dismantling_jobs
CREATE POLICY dismantling_jobs_org_members ON public.dismantling_jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = dismantling_jobs.org_id AND m.user_id = auth.uid())
  );

-- Policy per part_batches
CREATE POLICY part_batches_org_members ON public.part_batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = part_batches.org_id AND m.user_id = auth.uid())
  );

-- Policy per price_rules
CREATE POLICY price_rules_org_members ON public.price_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = price_rules.org_id AND m.user_id = auth.uid())
  );

-- Policy per shelves
CREATE POLICY shelves_org_members ON public.shelves
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = shelves.org_id AND m.user_id = auth.uid())
  );

-- Policy per stock_moves
CREATE POLICY stock_moves_org_members ON public.stock_moves
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = stock_moves.org_id AND m.user_id = auth.uid())
  );

-- Policy per orders
CREATE POLICY orders_org_members ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = orders.org_id AND m.user_id = auth.uid())
  );

-- Policy per order_lines
CREATE POLICY order_lines_org_members ON public.order_lines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = orders.org_id AND m.user_id = auth.uid())
  );

-- Policy per barcodes
CREATE POLICY barcodes_org_members ON public.barcodes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = barcodes.org_id AND m.user_id = auth.uid())
  );

-- Policy per marketplaces
CREATE POLICY marketplaces_org_members ON public.marketplaces
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = marketplaces.org_id AND m.user_id = auth.uid())
  );

-- Policy per marketplace_listings
CREATE POLICY marketplace_listings_org_members ON public.marketplace_listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = marketplaces.org_id AND m.user_id = auth.uid())
  );

-- Quattroruote catalog è pubblico in lettura
CREATE POLICY quattroruote_catalog_public_read ON public.quattroruote_catalog
  FOR SELECT USING (true);

-- 10. DATI INIZIALI
-- =====================================================

-- Categorie Quattroruote
INSERT INTO public.quattroruote_catalog (make, model, year_from, year_to, category, subcategory, list_price) VALUES
  ('Fiat', 'Panda', 2003, 2012, 'Motore', 'Filtro Olio', 15.50),
  ('Fiat', 'Panda', 2003, 2012, 'Motore', 'Filtro Aria', 12.30),
  ('Fiat', 'Panda', 2003, 2012, 'Freni', 'Pastiglie Anteriori', 45.80),
  ('Fiat', 'Panda', 2003, 2012, 'Freni', 'Pastiglie Posteriori', 35.20),
  ('Fiat', 'Panda', 2003, 2012, 'Sospensioni', 'Ammortizzatore Anteriore', 85.00),
  ('Fiat', 'Panda', 2003, 2012, 'Sospensioni', 'Ammortizzatore Posteriore', 75.00),
  ('Fiat', 'Panda', 2003, 2012, 'Carrozzeria', 'Specchietto Retrovisore', 65.00),
  ('Fiat', 'Panda', 2003, 2012, 'Carrozzeria', 'Fanale Anteriore', 120.00),
  ('Fiat', 'Panda', 2003, 2012, 'Carrozzeria', 'Fanale Posteriore', 95.00),
  ('Fiat', 'Panda', 2003, 2012, 'Interni', 'Volante', 180.00),
  ('Fiat', 'Panda', 2003, 2012, 'Interni', 'Sedile Anteriore', 250.00),
  ('Fiat', 'Panda', 2003, 2012, 'Elettronica', 'Centralina Motore', 450.00),
  ('Fiat', 'Panda', 2003, 2012, 'Elettronica', 'Sensore Temperatura', 25.00),
  ('Fiat', 'Panda', 2003, 2012, 'Pneumatici', 'Cerchio 14"', 80.00),
  ('Fiat', 'Panda', 2003, 2012, 'Pneumatici', 'Cerchio 15"', 95.00)
ON CONFLICT DO NOTHING;

-- Regole di prezzo di default
-- (Saranno create per ogni org quando necessario)

-- Scaffali di esempio
-- (Saranno creati per ogni org quando necessario)

-- =====================================================
-- FINE MIGRAZIONE SISTEMA RICAMBI MVP COMPLETO
-- =====================================================

