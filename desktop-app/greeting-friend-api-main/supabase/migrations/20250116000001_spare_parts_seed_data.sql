-- =====================================================
-- DATI DI ESEMPIO PER SISTEMA RICAMBI MVP COMPLETO
-- =====================================================

-- 1. DISTINTA SMONTAGGIO DI ESEMPIO
-- =====================================================

-- Veicolo di esempio
INSERT INTO public.vehicles_catalog (org_id, make, model, year_from, year_to, fuel_type, engine_code, kw, hp, metadata) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Fiat', 'Panda', 2003, 2012, 'Benzina', '1.2 8V', 44, 60, '{"body_type": "hatchback", "doors": 5}');

-- Distinta smontaggio
INSERT INTO public.dismantling_jobs (org_id, vehicle_id, targa, telaio, marca, modello, anno, dismantling_date, dismantler_name, notes, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.vehicles_catalog WHERE make = 'Fiat' AND model = 'Panda' LIMIT 1),
   'AB123CD', 'ZFA31200001234567', 'Fiat', 'Panda', 2010, 
   '2024-01-15', 'Mario Rossi', 'Veicolo incidentato frontalmente, motore e interni in buone condizioni', 'completed');

-- Batch ricambi dalla distinta
INSERT INTO public.part_batches (org_id, job_id, oem_code, part_name, condition, qty_in, qty_available, qty_sold, cost_price, list_price, sell_price, status, notes) VALUES
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712345', 'Motore 1.2 8V', 'used', 1, 1, 0, 800.00, 1200.00, 1000.00, 'LISTED_STORE', 'Motore funzionante, 120.000 km'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712346', 'Cambio Manuale 5 Marce', 'used', 1, 1, 0, 300.00, 450.00, 380.00, 'LISTED_STORE', 'Cambio in ottime condizioni'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712347', 'Specchietto Retrovisore Sinistro', 'used', 1, 1, 0, 25.00, 65.00, 45.00, 'LISTED_STORE', 'Specchietto con regolazione elettrica'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712348', 'Fanale Anteriore Sinistro', 'used', 1, 1, 0, 40.00, 120.00, 85.00, 'LISTED_STORE', 'Fanale con LED, funzionante'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712349', 'Volante', 'used', 1, 1, 0, 80.00, 180.00, 120.00, 'LISTED_STORE', 'Volante con airbag, ottime condizioni'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712350', 'Sedile Anteriore Sinistro', 'used', 1, 1, 0, 120.00, 250.00, 180.00, 'LISTED_STORE', 'Sedile regolabile, tessuto in buone condizioni'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712351', 'Centralina Motore', 'used', 1, 1, 0, 200.00, 450.00, 350.00, 'LISTED_STORE', 'Centralina originale, funzionante'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712352', 'Ammortizzatore Anteriore Sinistro', 'used', 1, 1, 0, 60.00, 85.00, 70.00, 'LISTED_STORE', 'Ammortizzatore in buone condizioni'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712353', 'Pastiglie Freni Anteriori', 'used', 1, 1, 0, 20.00, 45.80, 35.00, 'LISTED_STORE', 'Pastiglie con ancora 70% di vita utile'),
   
  ('00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM public.dismantling_jobs WHERE targa = 'AB123CD'),
   '71712354', 'Cerchio 14" con Pneumatico', 'used', 4, 4, 0, 40.00, 80.00, 60.00, 'LISTED_STORE', 'Cerchi in lega, pneumatici con 60% di battistrada');

-- 2. CREAZIONE RICAMBI DAL BATCH
-- =====================================================

-- Crea ricambi dai batch
INSERT INTO public.spare_parts (org_id, name, description, category_id, oem_code, ean_code, internal_code, source_vehicle_id, dismantled_from_transport, quantity, price_buy, price_sell, auto_price, warehouse_location, warehouse_barcode, condition, status, images, technical_docs, search_terms, compatibility_notes, metadata) 
SELECT 
  pb.org_id,
  pb.part_name,
  pb.notes,
  (SELECT id FROM public.spare_parts_categories WHERE code = 'ENG' LIMIT 1),
  pb.oem_code,
  NULL,
  CONCAT('INT-', EXTRACT(YEAR FROM pb.created_at)::text, '-', LPAD(EXTRACT(DOY FROM pb.created_at)::text, 3, '0'), '-', LPAD(ROW_NUMBER() OVER (ORDER BY pb.created_at)::text, 3, '0')),
  dj.vehicle_id,
  NULL,
  pb.qty_available,
  pb.cost_price,
  pb.sell_price,
  true,
  CASE 
    WHEN pb.part_name ILIKE '%motore%' THEN 'A1-01'
    WHEN pb.part_name ILIKE '%cambio%' THEN 'A1-02'
    WHEN pb.part_name ILIKE '%specchietto%' THEN 'B2-01'
    WHEN pb.part_name ILIKE '%fanale%' THEN 'B2-02'
    WHEN pb.part_name ILIKE '%volante%' THEN 'C3-01'
    WHEN pb.part_name ILIKE '%sedile%' THEN 'C3-02'
    WHEN pb.part_name ILIKE '%centralina%' THEN 'D4-01'
    WHEN pb.part_name ILIKE '%ammortizzatore%' THEN 'E5-01'
    WHEN pb.part_name ILIKE '%freni%' THEN 'E5-02'
    WHEN pb.part_name ILIKE '%cerchio%' THEN 'F6-01'
    ELSE 'G7-01'
  END,
  CONCAT('LOC-', pb.oem_code),
  pb.condition,
  CASE 
    WHEN pb.status = 'LISTED_STORE' THEN 'available'
    ELSE 'available'
  END,
  '[]',
  '[]',
  CONCAT(pb.part_name, ' ', pb.oem_code, ' ', dj.marca, ' ', dj.modello, ' ', dj.anno),
  CONCAT('Compatibile con ', dj.marca, ' ', dj.modello, ' ', dj.anno, ' (', dj.targa, ')'),
  '{"source": "dismantling", "batch_id": "' || pb.id || '", "job_id": "' || pb.job_id || '"}'
FROM public.part_batches pb
JOIN public.dismantling_jobs dj ON pb.job_id = dj.id
WHERE pb.org_id = '00000000-0000-0000-0000-000000000001';

-- 3. SCAFFALI DI ESEMPIO
-- =====================================================

INSERT INTO public.shelves (org_id, code, area, section, shelf_number, description, capacity, notes, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'A1-01', 'A', '1', '01', 'Scaffale Motori', 50, 'Zona motori e componenti principali', true),
  ('00000000-0000-0000-0000-000000000001', 'A1-02', 'A', '1', '02', 'Scaffale Trasmissioni', 30, 'Cambi e componenti trasmissione', true),
  ('00000000-0000-0000-0000-000000000001', 'B2-01', 'B', '2', '01', 'Scaffale Carrozzeria', 100, 'Specchietti, fanali, paraurti', true),
  ('00000000-0000-0000-0000-000000000001', 'B2-02', 'B', '2', '02', 'Scaffale Carrozzeria 2', 80, 'Portiere, cofani, tetti', true),
  ('00000000-0000-0000-0000-000000000001', 'C3-01', 'C', '3', '01', 'Scaffale Interni', 60, 'Volanti, sedili, console', true),
  ('00000000-0000-0000-0000-000000000001', 'C3-02', 'C', '3', '02', 'Scaffale Interni 2', 40, 'Tappezzerie, cinture, airbag', true),
  ('00000000-0000-0000-0000-000000000001', 'D4-01', 'D', '4', '01', 'Scaffale Elettronica', 25, 'Centraline, sensori, cavi', true),
  ('00000000-0000-0000-0000-000000000001', 'E5-01', 'E', '5', '01', 'Scaffale Sospensioni', 35, 'Ammortizzatori, molle, bracci', true),
  ('00000000-0000-0000-0000-000000000001', 'E5-02', 'E', '5', '02', 'Scaffale Freni', 45, 'Pastiglie, dischi, pinze', true),
  ('00000000-0000-0000-0000-000000000001', 'F6-01', 'F', '6', '01', 'Scaffale Pneumatici', 20, 'Cerchi e pneumatici', true);

-- 4. REGOLE DI PREZZO DI ESEMPIO
-- =====================================================

INSERT INTO public.price_rules (org_id, name, description, formula, condition_type, condition_value, active, priority, created_by) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Regola Standard', 'Prezzo standard per tutti i ricambi', 'max(list_price*0.65, cost*1.25)', 'all', NULL, true, 0, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Regola Motori', 'Prezzo speciale per motori', 'max(list_price*0.70, cost*1.30)', 'category', 'ENG', true, 1, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Regola Nuovi', 'Prezzo per ricambi nuovi', 'max(list_price*0.80, cost*1.40)', 'condition', 'new', true, 2, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Regola Danneggiati', 'Prezzo per ricambi danneggiati', 'max(list_price*0.40, cost*1.10)', 'condition', 'damaged', true, 3, '00000000-0000-0000-0000-000000000001');

-- 5. MOVIMENTI STOCK INIZIALI
-- =====================================================

-- Crea movimenti IN per tutti i ricambi creati
INSERT INTO public.stock_moves (org_id, part_id, batch_id, qty, type, reason, ref_type, ref_id, notes, cost_per_unit, created_by)
SELECT 
  sp.org_id,
  sp.id,
  pb.id,
  pb.qty_in,
  'IN',
  'Carico da distinta smontaggio',
  'dismantling',
  pb.job_id,
  CONCAT('Carico iniziale da veicolo ', dj.targa),
  pb.cost_price,
  '00000000-0000-0000-0000-000000000001'
FROM public.spare_parts sp
JOIN public.part_batches pb ON pb.oem_code = sp.oem_code AND pb.org_id = sp.org_id
JOIN public.dismantling_jobs dj ON pb.job_id = dj.id
WHERE sp.org_id = '00000000-0000-0000-0000-000000000001'
  AND sp.metadata->>'source' = 'dismantling';

-- 6. BARCODE DI ESEMPIO
-- =====================================================

-- Crea barcode per i ricambi
INSERT INTO public.barcodes (org_id, part_id, symbology, value, type, created_by)
SELECT 
  sp.org_id,
  sp.id,
  'code128',
  CONCAT('PART-', sp.id),
  'part',
  '00000000-0000-0000-0000-000000000001'
FROM public.spare_parts sp
WHERE sp.org_id = '00000000-0000-0000-0000-000000000001';

-- 7. ORDINE DI ESEMPIO (VENDITA POS)
-- =====================================================

-- Crea un ordine POS di esempio
INSERT INTO public.orders (org_id, type, customer_name, customer_phone, subtotal, tax_amount, discount_amount, total, payment_method, payment_status, status, notes, created_by) VALUES
  ('00000000-0000-0000-0000-000000000001', 'POS', 'Giuseppe Bianchi', '+39 333 1234567', 150.00, 33.00, 0.00, 183.00, 'cash', 'paid', 'confirmed', 'Vendita al banco - cliente soddisfatto', '00000000-0000-0000-0000-000000000001');

-- Crea righe ordine
INSERT INTO public.order_lines (order_id, part_id, batch_id, qty, unit_price, tax_rate, discount_rate, line_total, notes)
SELECT 
  o.id,
  sp.id,
  pb.id,
  1,
  sp.price_sell,
  22.00,
  0.00,
  sp.price_sell * 1.22,
  'Vendita al banco'
FROM public.orders o
CROSS JOIN public.spare_parts sp
JOIN public.part_batches pb ON pb.oem_code = sp.oem_code AND pb.org_id = sp.org_id
WHERE o.org_id = '00000000-0000-0000-0000-000000000001'
  AND o.type = 'POS'
  AND sp.name ILIKE '%specchietto%'
LIMIT 1;

-- Aggiorna quantità venduta nel batch
UPDATE public.part_batches 
SET qty_sold = qty_sold + 1, qty_available = qty_available - 1
WHERE id IN (
  SELECT pb.id 
  FROM public.order_lines ol
  JOIN public.part_batches pb ON ol.batch_id = pb.id
  WHERE ol.order_id IN (
    SELECT id FROM public.orders WHERE org_id = '00000000-0000-0000-0000-000000000001' AND type = 'POS'
  )
);

-- Crea movimento OUT per la vendita
INSERT INTO public.stock_moves (org_id, part_id, batch_id, qty, type, reason, ref_type, ref_id, notes, cost_per_unit, created_by)
SELECT 
  sp.org_id,
  sp.id,
  pb.id,
  1,
  'OUT',
  'Vendita al banco',
  'order',
  o.id,
  CONCAT('Vendita a ', o.customer_name),
  pb.cost_price,
  '00000000-0000-0000-0000-000000000001'
FROM public.order_lines ol
JOIN public.orders o ON ol.order_id = o.id
JOIN public.spare_parts sp ON ol.part_id = sp.id
JOIN public.part_batches pb ON ol.batch_id = pb.id
WHERE o.org_id = '00000000-0000-0000-0000-000000000001'
  AND o.type = 'POS';

-- 8. MARKETPLACE DI ESEMPIO
-- =====================================================

INSERT INTO public.marketplaces (org_id, name, display_name, config, active, sync_status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'woo', 'WooCommerce Store', '{"url": "https://ricambi.example.com", "api_key": "ck_xxx", "api_secret": "cs_xxx"}', true, 'idle'),
  ('00000000-0000-0000-0000-000000000001', 'shopify', 'Shopify Store', '{"shop": "ricambi-shop", "access_token": "shpat_xxx"}', true, 'idle'),
  ('00000000-0000-0000-0000-000000000001', 'csv', 'Export CSV', '{"filename": "ricambi_export.csv", "include_images": true}', true, 'idle');

-- 9. LISTING MARKETPLACE DI ESEMPIO
-- =====================================================

-- Crea alcuni listing per i ricambi
INSERT INTO public.marketplace_listings (marketplace_id, part_id, external_id, status, payload, last_sync, sync_errors)
SELECT 
  m.id,
  sp.id,
  CONCAT('ext_', sp.id),
  'PUBLISHED',
  '{"title": "' || sp.name || '", "price": ' || sp.price_sell || ', "description": "' || COALESCE(sp.description, '') || '", "images": ' || sp.images || '}',
  now(),
  '{}'
FROM public.marketplaces m
CROSS JOIN public.spare_parts sp
WHERE m.org_id = '00000000-0000-0000-0000-000000000001'
  AND sp.org_id = '00000000-0000-0000-0000-000000000001'
  AND sp.status = 'available'
  AND sp.name ILIKE '%specchietto%'
LIMIT 1;

-- 10. AGGIORNA METADATA RICAMBI
-- =====================================================

-- Aggiorna i ricambi con informazioni aggiuntive
UPDATE public.spare_parts 
SET 
  metadata = metadata || '{"batch_id": "' || pb.id || '", "job_id": "' || pb.job_id || '", "source_vehicle": "' || dj.targa || '"}',
  search_terms = search_terms || ' ' || dj.marca || ' ' || dj.modello || ' ' || dj.anno
FROM public.part_batches pb
JOIN public.dismantling_jobs dj ON pb.job_id = dj.id
WHERE spare_parts.oem_code = pb.oem_code 
  AND spare_parts.org_id = pb.org_id
  AND spare_parts.metadata->>'source' = 'dismantling';

-- =====================================================
-- FINE DATI DI ESEMPIO
-- =====================================================

