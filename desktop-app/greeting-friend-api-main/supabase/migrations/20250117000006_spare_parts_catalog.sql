-- supabase/migrations/20250117000006_spare_parts_catalog.sql
-- Database locale per ricambi - Sistema di riconoscimento gratuito

-- Tabella catalogo ricambi
CREATE TABLE IF NOT EXISTS public.spare_parts_catalog (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  oem_code VARCHAR(50),
  ean_code VARCHAR(13),
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2),
  compatibility JSONB,
  images TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_catalog_code ON public.spare_parts_catalog(code);
CREATE INDEX IF NOT EXISTS idx_spare_parts_catalog_oem_code ON public.spare_parts_catalog(oem_code);
CREATE INDEX IF NOT EXISTS idx_spare_parts_catalog_ean_code ON public.spare_parts_catalog(ean_code);
CREATE INDEX IF NOT EXISTS idx_spare_parts_catalog_brand ON public.spare_parts_catalog(brand);
CREATE INDEX IF NOT EXISTS idx_spare_parts_catalog_category ON public.spare_parts_catalog(category);

-- RLS policies
ALTER TABLE public.spare_parts_catalog ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "spare_parts_catalog_read" ON public.spare_parts_catalog
  FOR SELECT USING (true);

-- Policy per inserimento (solo per utenti autenticati)
CREATE POLICY "spare_parts_catalog_insert" ON public.spare_parts_catalog
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy per aggiornamento (solo per utenti autenticati)
CREATE POLICY "spare_parts_catalog_update" ON public.spare_parts_catalog
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy per eliminazione (solo per utenti autenticati)
CREATE POLICY "spare_parts_catalog_delete" ON public.spare_parts_catalog
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_spare_parts_catalog_updated_at
  BEFORE UPDATE ON public.spare_parts_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dati di esempio
INSERT INTO public.spare_parts_catalog (code, oem_code, ean_code, name, brand, category, description, price, compatibility, images) VALUES
-- BMW
('BMW123456', 'BMW123456', NULL, 'Filtro Olio BMW', 'BMW', 'Motore', 'Filtro olio originale BMW per motori a benzina', 45.50, '["BMW Serie 3", "BMW Serie 5", "BMW X3"]', '[]'),
('BMW789012', 'BMW789012', NULL, 'Pastiglie Freno BMW', 'BMW', 'Freni', 'Pastiglie freno anteriori BMW', 89.90, '["BMW Serie 3", "BMW Serie 5"]', '[]'),
('BMW345678', 'BMW345678', NULL, 'Candela BMW', 'BMW', 'Motore', 'Candela accensione BMW', 12.50, '["BMW Serie 3", "BMW X3"]', '[]'),

-- FIAT
('FIAT123456', 'FIAT123456', NULL, 'Filtro Aria FIAT', 'FIAT', 'Motore', 'Filtro aria motore FIAT', 18.90, '["FIAT Panda", "FIAT Punto", "FIAT 500"]', '[]'),
('FIAT789012', 'FIAT789012', NULL, 'Lampadina FIAT', 'FIAT', 'Elettrico', 'Lampadina fari anteriori FIAT', 8.50, '["FIAT Panda", "FIAT Punto"]', '[]'),
('FIAT345678', 'FIAT345678', NULL, 'Cinghia Distribuzione FIAT', 'FIAT', 'Motore', 'Cinghia distribuzione FIAT', 65.00, '["FIAT Panda", "FIAT Punto", "FIAT 500"]', '[]'),

-- Volkswagen
('VW123456', 'VW123456', NULL, 'Filtro Olio VW', 'Volkswagen', 'Motore', 'Filtro olio Volkswagen', 32.50, '["VW Golf", "VW Polo", "VW Passat"]', '[]'),
('VW789012', 'VW789012', NULL, 'Disco Freno VW', 'Volkswagen', 'Freni', 'Disco freno anteriore VW', 75.00, '["VW Golf", "VW Polo"]', '[]'),
('VW345678', 'VW345678', NULL, 'Alternatore VW', 'Volkswagen', 'Elettrico', 'Alternatore Volkswagen', 180.00, '["VW Golf", "VW Passat"]', '[]'),

-- Codici EAN
('1234567890123', NULL, '1234567890123', 'Prodotto EAN Generico', 'Generico', 'Generico', 'Prodotto con codice EAN', 25.00, '["Veicoli Generici"]', '[]'),
('9876543210987', NULL, '9876543210987', 'Ricambio EAN Premium', 'Premium', 'Premium', 'Ricambio premium con codice EAN', 45.00, '["Veicoli Premium"]', '[]'),

-- Codici generici
('GEN001', 'GEN001', NULL, 'Ricambio Generico 1', 'Generico', 'Generico', 'Ricambio generico per test', 15.00, '["Veicoli Generici"]', '[]'),
('GEN002', 'GEN002', NULL, 'Ricambio Generico 2', 'Generico', 'Generico', 'Ricambio generico per test', 20.00, '["Veicoli Generici"]', '[]'),
('GEN003', 'GEN003', NULL, 'Ricambio Generico 3', 'Generico', 'Generico', 'Ricambio generico per test', 30.00, '["Veicoli Generici"]', '[]')

ON CONFLICT (code) DO NOTHING;

-- Commenti per documentazione
COMMENT ON TABLE public.spare_parts_catalog IS 'Catalogo locale ricambi per riconoscimento automatico';
COMMENT ON COLUMN public.spare_parts_catalog.code IS 'Codice principale del ricambio';
COMMENT ON COLUMN public.spare_parts_catalog.oem_code IS 'Codice OEM originale';
COMMENT ON COLUMN public.spare_parts_catalog.ean_code IS 'Codice EAN (13 cifre)';
COMMENT ON COLUMN public.spare_parts_catalog.compatibility IS 'Array JSON con veicoli compatibili';
COMMENT ON COLUMN public.spare_parts_catalog.images IS 'Array di URL immagini';

