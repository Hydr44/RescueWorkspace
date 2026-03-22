-- ============================================================
-- SEED DATI DEMO - Step 2
-- Eseguire DOPO aver creato l'org demo con create_demo_org.sql
-- Popola l'org demo con dati realistici
-- ============================================================

DO $$
DECLARE
  v_demo_org_id UUID;
  v_client1_id UUID;
  v_client2_id UUID;
  v_client3_id UUID;
  v_client4_id UUID;
  v_client5_id UUID;
  v_vehicle1_id UUID;
  v_vehicle2_id UUID;
  v_vehicle3_id UUID;
  v_transport1_id UUID;
  v_transport2_id UUID;
  v_invoice1_id UUID;
  v_invoice2_id UUID;
  v_invoice3_id UUID;
BEGIN
  -- Trova l'org demo
  SELECT id INTO v_demo_org_id FROM orgs WHERE is_demo = true LIMIT 1;
  
  IF v_demo_org_id IS NULL THEN
    RAISE EXCEPTION 'Org demo non trovata. Esegui prima create_demo_org.sql';
  END IF;
  
  RAISE NOTICE 'Popolamento dati per org demo: %', v_demo_org_id;
  
  -- ═══════════════════════════════════════════════════════════════
  -- CLIENTI DEMO (5)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO clients (id, org_id, name, type, vat_number, fiscal_code, email, phone, address, city, province, postal_code, country, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'Mario Rossi', 'private', NULL, 'RSSMRA80A01F205X', 'mario.rossi@email.it', '+39 333 1234567', 'Via Roma 10', 'Milano', 'MI', '20100', 'IT', NOW() - INTERVAL '6 months')
  RETURNING id INTO v_client1_id;
  
  INSERT INTO clients (id, org_id, name, type, vat_number, fiscal_code, email, phone, address, city, province, postal_code, country, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'Autotrasporti Bianchi S.r.l.', 'business', '12345678901', '12345678901', 'info@bianchi.it', '+39 02 9876543', 'Via Garibaldi 45', 'Torino', 'TO', '10100', 'IT', NOW() - INTERVAL '5 months')
  RETURNING id INTO v_client2_id;
  
  INSERT INTO clients (id, org_id, name, type, vat_number, fiscal_code, email, phone, address, city, province, postal_code, country, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'Laura Verdi', 'private', NULL, 'VRDLRA75D45H501Z', 'laura.verdi@gmail.com', '+39 340 9876543', 'Corso Italia 88', 'Roma', 'RM', '00100', 'IT', NOW() - INTERVAL '4 months')
  RETURNING id INTO v_client3_id;
  
  INSERT INTO clients (id, org_id, name, type, vat_number, fiscal_code, email, phone, address, city, province, postal_code, country, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'Carrozzeria Neri & C.', 'business', '98765432109', '98765432109', 'carrozzeria@neri.com', '+39 011 5551234', 'Via Torino 22', 'Genova', 'GE', '16100', 'IT', NOW() - INTERVAL '3 months')
  RETURNING id INTO v_client4_id;
  
  INSERT INTO clients (id, org_id, name, type, vat_number, fiscal_code, email, phone, address, city, province, postal_code, country, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'Giuseppe Ferrari', 'private', NULL, 'FRRGPP85M15L219Y', 'g.ferrari@libero.it', '+39 348 7654321', 'Piazza Duomo 5', 'Firenze', 'FI', '50100', 'IT', NOW() - INTERVAL '2 months')
  RETURNING id INTO v_client5_id;
  
  RAISE NOTICE 'Creati 5 clienti demo';
  
  -- ═══════════════════════════════════════════════════════════════
  -- VEICOLI/MEZZI DEMO (3)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO vehicles (id, org_id, plate, brand, model, type, year, fuel_type, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'AB123CD', 'Iveco', 'Daily 35C15', 'truck', 2018, 'diesel', NOW() - INTERVAL '2 years')
  RETURNING id INTO v_vehicle1_id;
  
  INSERT INTO vehicles (id, org_id, plate, brand, model, type, year, fuel_type, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'EF456GH', 'Mercedes', 'Sprinter 316', 'van', 2020, 'diesel', NOW() - INTERVAL '1 year')
  RETURNING id INTO v_vehicle2_id;
  
  INSERT INTO vehicles (id, org_id, plate, brand, model, type, year, fuel_type, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, 'IJ789KL', 'Fiat', 'Ducato Maxi', 'van', 2019, 'diesel', NOW() - INTERVAL '18 months')
  RETURNING id INTO v_vehicle3_id;
  
  RAISE NOTICE 'Creati 3 veicoli demo';
  
  -- ═══════════════════════════════════════════════════════════════
  -- TRASPORTI DEMO (5)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO transports (id, org_id, client_id, vehicle_id, status, pickup_address, delivery_address, pickup_date, delivery_date, notes, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client1_id, v_vehicle1_id, 'completed', 'Via Roma 10, Milano', 'Via Demolizioni 5, Milano', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'Trasporto completato senza problemi', NOW() - INTERVAL '15 days')
  RETURNING id INTO v_transport1_id;
  
  INSERT INTO transports (id, org_id, client_id, vehicle_id, status, pickup_address, delivery_address, pickup_date, delivery_date, notes, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client2_id, v_vehicle2_id, 'in_progress', 'Via Garibaldi 45, Torino', 'Via Demolizioni 5, Milano', NOW(), NULL, 'Trasporto in corso', NOW() - INTERVAL '2 days')
  RETURNING id INTO v_transport2_id;
  
  INSERT INTO transports (id, org_id, client_id, vehicle_id, status, pickup_address, delivery_address, pickup_date, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client3_id, v_vehicle1_id, 'pending', 'Corso Italia 88, Roma', 'Via Demolizioni 5, Milano', NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day');
  
  INSERT INTO transports (id, org_id, client_id, vehicle_id, status, pickup_address, delivery_address, pickup_date, delivery_date, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client4_id, v_vehicle3_id, 'completed', 'Via Torino 22, Genova', 'Via Demolizioni 5, Milano', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days');
  
  INSERT INTO transports (id, org_id, client_id, vehicle_id, status, pickup_address, delivery_address, pickup_date, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client5_id, v_vehicle2_id, 'pending', 'Piazza Duomo 5, Firenze', 'Via Demolizioni 5, Milano', NOW() + INTERVAL '5 days', NOW());
  
  RAISE NOTICE 'Creati 5 trasporti demo';
  
  -- ═══════════════════════════════════════════════════════════════
  -- FATTURE DEMO (3)
  -- ═══════════════════════════════════════════════════════════════
  
  -- Fattura 1: Draft (bozza)
  INSERT INTO invoices (id, org_id, client_id, number, date, due_date, status, sdi_status, total, subtotal, tax, created_at)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client1_id, 'DEMO-001', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'draft', 'draft', 122.00, 100.00, 22.00, NOW() - INTERVAL '5 days')
  RETURNING id INTO v_invoice1_id;
  
  -- Righe fattura 1
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, total)
  VALUES 
    (v_invoice1_id, 'Servizio demolizione veicolo', 1, 100.00, 22, 122.00);
  
  -- Fattura 2: Validated (validata, pronta per invio)
  INSERT INTO invoices (id, org_id, client_id, number, date, due_date, status, sdi_status, total, subtotal, tax, created_at, meta)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client2_id, 'DEMO-002', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', 'sent', 'validated', 610.00, 500.00, 110.00, NOW() - INTERVAL '3 days', 
     '{"sdi": {"validated_at": "' || (NOW() - INTERVAL '2 days')::text || '", "xml_generated": true}}'::jsonb)
  RETURNING id INTO v_invoice2_id;
  
  -- Righe fattura 2
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, total)
  VALUES 
    (v_invoice2_id, 'Demolizione veicolo commerciale', 1, 300.00, 22, 366.00),
    (v_invoice2_id, 'Trasporto veicolo', 1, 200.00, 22, 244.00);
  
  -- Fattura 3: Delivered (inviata e consegnata)
  INSERT INTO invoices (id, org_id, client_id, number, date, due_date, status, sdi_status, total, subtotal, tax, created_at, meta)
  VALUES 
    (gen_random_uuid(), v_demo_org_id, v_client3_id, 'DEMO-003', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', 'sent', 'delivered', 244.00, 200.00, 44.00, NOW() - INTERVAL '15 days',
     '{"sdi": {"sent_at": "' || (NOW() - INTERVAL '14 days')::text || '", "delivered_at": "' || (NOW() - INTERVAL '13 days')::text || '", "xml_generated": true, "id_sdi": "12345"}}'::jsonb)
  RETURNING id INTO v_invoice3_id;
  
  -- Righe fattura 3
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, total)
  VALUES 
    (v_invoice3_id, 'Servizio demolizione auto', 1, 200.00, 22, 244.00);
  
  -- Eventi SDI per fattura 3
  INSERT INTO invoice_events (invoice_id, event_type, event_date, description)
  VALUES 
    (v_invoice3_id, 'sent', NOW() - INTERVAL '14 days', 'Fattura inviata a SDI'),
    (v_invoice3_id, 'delivered', NOW() - INTERVAL '13 days', 'Fattura consegnata al destinatario');
  
  RAISE NOTICE 'Create 3 fatture demo con righe ed eventi';
  
  -- ═══════════════════════════════════════════════════════════════
  -- RICAMBI DEMO (8)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO spare_parts (org_id, code, name, category, brand, price, stock, location, created_at)
  VALUES 
    (v_demo_org_id, 'MOT-001', 'Motore 1.6 TDI', 'motori', 'Volkswagen', 850.00, 2, 'Scaffale A1', NOW() - INTERVAL '3 months'),
    (v_demo_org_id, 'CAM-002', 'Cambio manuale 5 marce', 'trasmissione', 'Fiat', 450.00, 3, 'Scaffale B2', NOW() - INTERVAL '2 months'),
    (v_demo_org_id, 'POR-003', 'Portiera anteriore dx', 'carrozzeria', 'Ford', 180.00, 5, 'Scaffale C3', NOW() - INTERVAL '1 month'),
    (v_demo_org_id, 'FAR-004', 'Faro anteriore LED', 'elettronica', 'BMW', 320.00, 4, 'Scaffale D1', NOW() - INTERVAL '20 days'),
    (v_demo_org_id, 'VOL-005', 'Volante multifunzione', 'interni', 'Audi', 120.00, 6, 'Scaffale E2', NOW() - INTERVAL '15 days'),
    (v_demo_org_id, 'CER-006', 'Cerchio in lega 17"', 'ruote', 'Mercedes', 95.00, 8, 'Scaffale F3', NOW() - INTERVAL '10 days'),
    (v_demo_org_id, 'RAD-007', 'Radiatore motore', 'raffreddamento', 'Renault', 140.00, 3, 'Scaffale G1', NOW() - INTERVAL '5 days'),
    (v_demo_org_id, 'TUR-008', 'Turbina turbocompressore', 'motori', 'Opel', 680.00, 1, 'Scaffale A2', NOW() - INTERVAL '2 days');
  
  RAISE NOTICE 'Creati 8 ricambi demo';
  
  -- ═══════════════════════════════════════════════════════════════
  -- PREVENTIVI DEMO (2)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO quotes (org_id, client_id, number, date, valid_until, status, total, subtotal, tax, notes, created_at)
  VALUES 
    (v_demo_org_id, v_client4_id, 'PREV-001', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days', 'sent', 366.00, 300.00, 66.00, 'Preventivo per demolizione veicolo commerciale', NOW() - INTERVAL '7 days'),
    (v_demo_org_id, v_client5_id, 'PREV-002', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 'draft', 183.00, 150.00, 33.00, 'Preventivo demolizione auto privata', NOW() - INTERVAL '2 days');
  
  RAISE NOTICE 'Creati 2 preventivi demo';
  
  -- ═══════════════════════════════════════════════════════════════
  -- CASI RVFU DEMO (2)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO demolition_cases (org_id, client_id, vehicle_plate, vehicle_brand, vehicle_model, status, demolition_date, notes, created_at)
  VALUES 
    (v_demo_org_id, v_client1_id, 'AA111BB', 'Fiat', 'Punto', 'completed', NOW() - INTERVAL '30 days', 'Demolizione completata, certificato emesso', NOW() - INTERVAL '35 days'),
    (v_demo_org_id, v_client3_id, 'CC222DD', 'Opel', 'Corsa', 'in_progress', NULL, 'Caso in lavorazione', NOW() - INTERVAL '5 days');
  
  RAISE NOTICE 'Creati 2 casi RVFU demo';
  
  -- ═══════════════════════════════════════════════════════════════
  -- FORMULARI RENTRI DEMO (2)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO rentri_formulari (org_id, numero_fir, anno, data_creazione, stato, produttore_denominazione, trasportatore_denominazione, destinatario_denominazione, created_at)
  VALUES 
    (v_demo_org_id, 'FIR001', EXTRACT(YEAR FROM NOW())::INTEGER, NOW() - INTERVAL '10 days', 'bozza', 'Autodemolizioni Demo S.r.l.', 'Trasporti Rossi', 'Impianto Recupero Metalli', NOW() - INTERVAL '10 days'),
    (v_demo_org_id, 'FIR002', EXTRACT(YEAR FROM NOW())::INTEGER, NOW() - INTERVAL '5 days', 'bozza', 'Autodemolizioni Demo S.r.l.', 'Trasporti Bianchi', 'Centro Smaltimento Rifiuti', NOW() - INTERVAL '5 days');
  
  RAISE NOTICE 'Creati 2 formulari RENTRI demo';
  
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'DATI DEMO POPOLATI CON SUCCESSO!';
  RAISE NOTICE 'Org ID: %', v_demo_org_id;
  RAISE NOTICE '- 5 clienti';
  RAISE NOTICE '- 3 veicoli';
  RAISE NOTICE '- 5 trasporti';
  RAISE NOTICE '- 3 fatture (draft, validated, delivered)';
  RAISE NOTICE '- 8 ricambi';
  RAISE NOTICE '- 2 preventivi';
  RAISE NOTICE '- 2 casi RVFU';
  RAISE NOTICE '- 2 formulari RENTRI';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
