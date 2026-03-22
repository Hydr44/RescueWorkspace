-- FASE 1: Smart Recognition Foundation
-- Estende il database esistente per il riconoscimento automatico

-- 1. Tabella per lookup barcode avanzato
CREATE TABLE IF NOT EXISTS public.barcode_lookup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode varchar(50) UNIQUE NOT NULL,
  part_name text NOT NULL,
  brand varchar(100),
  oem_code varchar(100),
  category varchar(100),
  compatibility_data jsonb DEFAULT '{}',
  price_data jsonb DEFAULT '{}',
  source varchar(50) DEFAULT 'manual', -- manual, gs1, auto_parts, quattroruote
  confidence_score numeric DEFAULT 1.0, -- 0.0 to 1.0
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabella per compatibilità veicoli estesa
CREATE TABLE IF NOT EXISTS public.vehicle_compatibility_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  make varchar(50) NOT NULL,
  model varchar(100) NOT NULL,
  year_from integer,
  year_to integer,
  engine_codes text[],
  body_types text[],
  fuel_types text[],
  compatibility_type varchar(20) DEFAULT 'exact' CHECK (compatibility_type IN ('exact', 'compatible', 'adaptable')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 3. Tabella per configurazione API esterne
CREATE TABLE IF NOT EXISTS public.external_api_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  api_name varchar(100) NOT NULL,
  endpoint text,
  api_key text,
  rate_limit integer DEFAULT 1000,
  last_used timestamptz,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  config_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Tabella per log riconoscimenti automatici
CREATE TABLE IF NOT EXISTS public.recognition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  barcode varchar(50),
  recognition_type varchar(50), -- barcode, ocr, image, manual
  input_data jsonb,
  result_data jsonb,
  confidence_score numeric,
  processing_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- 5. Tabella per suggerimenti intelligenti
CREATE TABLE IF NOT EXISTS public.smart_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  suggestion_type varchar(50) NOT NULL, -- similar, compatible, alternative, bundle
  suggested_part_id uuid REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  confidence_score numeric DEFAULT 0.0,
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 6. Tabella per prezzi dinamici
CREATE TABLE IF NOT EXISTS public.dynamic_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  base_price numeric NOT NULL,
  min_price numeric,
  max_price numeric,
  margin_percentage numeric DEFAULT 30.0,
  competitor_prices jsonb DEFAULT '{}',
  market_trend varchar(20) DEFAULT 'stable', -- rising, falling, stable
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_barcode_lookup_barcode ON public.barcode_lookup(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_lookup_source ON public.barcode_lookup(source);
CREATE INDEX IF NOT EXISTS idx_vehicle_compatibility_extended_part ON public.vehicle_compatibility_extended(part_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_compatibility_extended_make_model ON public.vehicle_compatibility_extended(make, model);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_org_created ON public.recognition_logs(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_part ON public.smart_suggestions(part_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_part ON public.dynamic_pricing(part_id);

-- RLS Policies
ALTER TABLE public.barcode_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_compatibility_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;

-- Policy per barcode_lookup (lettura pubblica, scrittura solo per org)
CREATE POLICY "barcode_lookup_read_public" ON public.barcode_lookup FOR SELECT USING (true);
CREATE POLICY "barcode_lookup_write_org" ON public.barcode_lookup FOR INSERT WITH CHECK (true);
CREATE POLICY "barcode_lookup_update_org" ON public.barcode_lookup FOR UPDATE USING (true);

-- Policy per vehicle_compatibility_extended
CREATE POLICY "vehicle_compatibility_read_public" ON public.vehicle_compatibility_extended FOR SELECT USING (true);
CREATE POLICY "vehicle_compatibility_write_org" ON public.vehicle_compatibility_extended FOR INSERT WITH CHECK (true);

-- Policy per external_api_configs
CREATE POLICY "external_api_configs_org_access" ON public.external_api_configs FOR ALL USING (
  org_id = (auth.jwt() ->> 'org_id')::uuid
);

-- Policy per recognition_logs
CREATE POLICY "recognition_logs_org_access" ON public.recognition_logs FOR ALL USING (
  org_id = (auth.jwt() ->> 'org_id')::uuid
);

-- Policy per smart_suggestions
CREATE POLICY "smart_suggestions_org_access" ON public.smart_suggestions FOR ALL USING (
  org_id = (auth.jwt() ->> 'org_id')::uuid
);

-- Policy per dynamic_pricing
CREATE POLICY "dynamic_pricing_org_access" ON public.dynamic_pricing FOR ALL USING (
  org_id = (auth.jwt() ->> 'org_id')::uuid
);

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per updated_at
CREATE TRIGGER update_barcode_lookup_updated_at BEFORE UPDATE ON public.barcode_lookup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_api_configs_updated_at BEFORE UPDATE ON public.external_api_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserimento dati di esempio per test
INSERT INTO public.barcode_lookup (barcode, part_name, brand, oem_code, category, compatibility_data, price_data, source) VALUES
('1234567890123', 'Filtro Olio Motore', 'Fiat', 'FIAT-FILTER-001', 'Filtri', 
 '{"make": "Fiat", "model": "Panda", "year_from": 2003, "year_to": 2012}', 
 '{"list_price": 25.00, "suggested_price": 32.50}', 'manual'),
('2345678901234', 'Pastiglie Freno Anteriori', 'Fiat', 'FIAT-BRAKE-001', 'Freni',
 '{"make": "Fiat", "model": "Panda", "year_from": 2003, "year_to": 2012}',
 '{"list_price": 45.00, "suggested_price": 58.50}', 'manual'),
('3456789012345', 'Candela Accensione', 'Fiat', 'FIAT-SPARK-001', 'Accensione',
 '{"make": "Fiat", "model": "Panda", "year_from": 2003, "year_to": 2012}',
 '{"list_price": 8.00, "suggested_price": 10.40}', 'manual')
ON CONFLICT (barcode) DO NOTHING;

-- Inserimento configurazioni API di esempio (gratuite)
INSERT INTO public.external_api_configs (org_id, api_name, endpoint, status, config_data) VALUES
((SELECT id FROM public.orgs LIMIT 1), 'vin_decoder_free', 'https://vindecoder.eu/api', 'active', '{"rate_limit": 100, "free_tier": true}'),
((SELECT id FROM public.orgs LIMIT 1), 'gs1_lookup', 'https://api.gs1.org/v1/products', 'active', '{"rate_limit": 50, "free_tier": true}'),
((SELECT id FROM public.orgs LIMIT 1), 'auto_parts_db', 'https://api.autoparts.com/v2', 'active', '{"rate_limit": 200, "free_tier": true}')
ON CONFLICT DO NOTHING;

