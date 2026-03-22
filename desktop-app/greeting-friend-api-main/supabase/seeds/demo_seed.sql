-- ============================================================
-- DEMO SEED DATA
-- Dati realistici per organizzazione demo autodemolizione
-- Eseguire DOPO aver creato l'org demo e l'utente demo
-- ============================================================

-- ISTRUZIONI:
-- 1. Creare utente demo su Supabase Auth: demo@rescuemanager.eu / Demo2026!
-- 2. Creare org demo e ottenere gli UUID
-- 3. Sostituire i placeholder qui sotto con gli UUID reali
-- 4. Eseguire questo script

-- ═══════════════════════════════════════════
-- PLACEHOLDER: sostituire con UUID reali
-- ═══════════════════════════════════════════
-- DEMO_ORG_ID  = UUID dell'org demo
-- DEMO_USER_ID = UUID dell'utente demo

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_client1 UUID;
  v_client2 UUID;
  v_client3 UUID;
  v_client4 UUID;
  v_client5 UUID;
  v_vehicle1 UUID;
  v_vehicle2 UUID;
  v_vehicle3 UUID;
  v_transport1 UUID;
  v_transport2 UUID;
  v_transport3 UUID;
  v_transport4 UUID;
  v_transport5 UUID;
  v_invoice1 UUID;
  v_invoice2 UUID;
  v_invoice3 UUID;
BEGIN

  -- ═══════════════════════════════════════════
  -- CREA ORG DEMO
  -- ═══════════════════════════════════════════
  INSERT INTO orgs (id, name, number, is_demo)
  VALUES (gen_random_uuid(), 'Autodemolizioni Demo S.r.l.', 'DEMO001', true)
  RETURNING id INTO v_org_id;

  -- Cerca utente demo (deve essere già creato in Supabase Auth)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@rescuemanager.eu' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Utente demo@rescuemanager.eu non trovato in auth.users. Creare prima l''utente.';
    RETURN;
  END IF;

  -- Profilo
  INSERT INTO profiles (id, full_name, org_id, current_org)
  VALUES (v_user_id, 'Operatore Demo', v_org_id, v_org_id)
  ON CONFLICT (id) DO UPDATE SET full_name = 'Operatore Demo', org_id = v_org_id, current_org = v_org_id;

  -- Membership
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner')
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'owner';

  -- ═══════════════════════════════════════════
  -- ABBONAMENTO DEMO (tutti i moduli attivi)
  -- ═══════════════════════════════════════════
  INSERT INTO org_subscriptions (org_id, plan, status, billing_type, modules, is_custom)
  VALUES (v_org_id, 'full', 'active', 'free', ARRAY['base','sdi','rvfu','rentri','contabilita'], true)
  ON CONFLICT (org_id) DO UPDATE SET plan = 'full', status = 'active', billing_type = 'free', modules = ARRAY['base','sdi','rvfu','rentri','contabilita'], is_custom = true;

  INSERT INTO org_modules (org_id, module, status) VALUES
    (v_org_id, 'base', 'active'),
    (v_org_id, 'sdi', 'active'),
    (v_org_id, 'rvfu', 'active'),
    (v_org_id, 'rentri', 'active'),
    (v_org_id, 'contabilita', 'active')
  ON CONFLICT (org_id, module) DO UPDATE SET status = 'active';

  -- ═══════════════════════════════════════════
  -- CLIENTI DEMO (5 clienti realistici)
  -- ═══════════════════════════════════════════
  v_client1 := gen_random_uuid();
  v_client2 := gen_random_uuid();
  v_client3 := gen_random_uuid();
  v_client4 := gen_random_uuid();
  v_client5 := gen_random_uuid();

  INSERT INTO clients (id, org_id, nome, codice, phone, email, piva, cf, indirizzo, citta, cap, provincia, tipo) VALUES
    (v_client1, v_org_id, 'Rossi Mario', 'CLI001', '+39 333 1234567', 'mario.rossi@email.it', '01234567890', 'RSSMRA80A01H501Z', 'Via Roma 15', 'Roma', '00100', 'RM', 'privato'),
    (v_client2, v_org_id, 'Bianchi Auto S.r.l.', 'CLI002', '+39 06 9876543', 'info@bianchiauto.it', '09876543210', '09876543210', 'Via Milano 42', 'Milano', '20100', 'MI', 'azienda'),
    (v_client3, v_org_id, 'Verdi Giuseppe', 'CLI003', '+39 347 5551234', 'g.verdi@pec.it', NULL, 'VRDGPP75B15F205X', 'Corso Italia 88', 'Napoli', '80100', 'NA', 'privato'),
    (v_client4, v_org_id, 'Trasporti Esposito S.a.s.', 'CLI004', '+39 081 7654321', 'esposito.trasporti@email.it', '05432109876', '05432109876', 'Via Napoli 23', 'Caserta', '81100', 'CE', 'azienda'),
    (v_client5, v_org_id, 'Ferrari Anna', 'CLI005', '+39 320 9998877', 'anna.ferrari@gmail.com', NULL, 'FRRNNA90C45D969P', 'Piazza Duomo 1', 'Firenze', '50100', 'FI', 'privato');

  -- ═══════════════════════════════════════════
  -- VEICOLI / MEZZI DEMO (3 mezzi aziendali)
  -- ═══════════════════════════════════════════
  v_vehicle1 := gen_random_uuid();
  v_vehicle2 := gen_random_uuid();
  v_vehicle3 := gen_random_uuid();

  INSERT INTO vehicles (id, org_id, targa, marca, modello, tipo, stato, anno) VALUES
    (v_vehicle1, v_org_id, 'AB123CD', 'IVECO', 'Daily 35S14', 'Carro attrezzi', 'attivo', 2022),
    (v_vehicle2, v_org_id, 'EF456GH', 'FIAT', 'Ducato Maxi', 'Furgone', 'attivo', 2021),
    (v_vehicle3, v_org_id, 'IJ789KL', 'MAN', 'TGL 12.250', 'Bisarca', 'attivo', 2023);

  -- ═══════════════════════════════════════════
  -- TRASPORTI DEMO (5 trasporti in vari stati)
  -- ═══════════════════════════════════════════
  v_transport1 := gen_random_uuid();
  v_transport2 := gen_random_uuid();
  v_transport3 := gen_random_uuid();
  v_transport4 := gen_random_uuid();
  v_transport5 := gen_random_uuid();

  INSERT INTO transports (id, org_id, client_id, customer_name, customer_phone, pickup_address, dropoff_address, vehicle_id, status, notes, created_at) VALUES
    (v_transport1, v_org_id, v_client1, 'Rossi Mario', '+39 333 1234567', 'Via Roma 15, Roma RM', 'Via del Deposito 8, Roma RM', v_vehicle1, 'completed', 'Ritiro Fiat Punto 2008 - Demolizione', NOW() - INTERVAL '5 days'),
    (v_transport2, v_org_id, v_client2, 'Bianchi Auto S.r.l.', '+39 06 9876543', 'Via Milano 42, Milano MI', 'Via Industriale 15, Lodi LO', v_vehicle2, 'in_progress', 'Ritiro 3 veicoli da concessionaria', NOW() - INTERVAL '1 day'),
    (v_transport3, v_org_id, v_client3, 'Verdi Giuseppe', '+39 347 5551234', 'Corso Italia 88, Napoli NA', 'Via del Deposito 8, Roma RM', v_vehicle1, 'pending', 'VW Golf 2012 - Incidentata, rimorchio necessario', NOW()),
    (v_transport4, v_org_id, v_client4, 'Trasporti Esposito S.a.s.', '+39 081 7654321', 'Via Napoli 23, Caserta CE', 'Via Industriale 15, Lodi LO', v_vehicle3, 'assigned', 'Lotto 5 veicoli fuori uso da rottamare', NOW() + INTERVAL '2 days'),
    (v_transport5, v_org_id, v_client5, 'Ferrari Anna', '+39 320 9998877', 'Piazza Duomo 1, Firenze FI', 'Via del Deposito 8, Roma RM', v_vehicle2, 'pending', 'Renault Clio 2015 - Radiazione PRA', NOW() + INTERVAL '3 days');

  -- ═══════════════════════════════════════════
  -- FATTURE DEMO (3 fatture in vari stati)
  -- ═══════════════════════════════════════════
  v_invoice1 := gen_random_uuid();
  v_invoice2 := gen_random_uuid();
  v_invoice3 := gen_random_uuid();

  INSERT INTO invoices (id, org_id, customer_name, customer_vat, customer_tax_code, number, date, currency, total, sdi_status, meta, created_at) VALUES
    (v_invoice1, v_org_id, 'Rossi Mario', NULL, 'RSSMRA80A01H501Z', 1, (NOW() - INTERVAL '10 days')::date, 'EUR', 366.00, 'delivered',
      '{"sdi":{"documento":{"tipo_documento":"TD01"},"trasmissione":{"identificativo_sdi":"IT01234567890_00001","data_invio":"2026-02-12T10:30:00Z","esito":"ET01"}}}'::jsonb,
      NOW() - INTERVAL '10 days'),
    (v_invoice2, v_org_id, 'Bianchi Auto S.r.l.', '09876543210', '09876543210', 2, (NOW() - INTERVAL '3 days')::date, 'EUR', 1830.00, 'validated',
      '{"sdi":{"documento":{"tipo_documento":"TD01"},"cessionario":{"denominazione":"Bianchi Auto S.r.l.","partita_iva":"09876543210"}}}'::jsonb,
      NOW() - INTERVAL '3 days'),
    (v_invoice3, v_org_id, 'Verdi Giuseppe', NULL, 'VRDGPP75B15F205X', 3, NOW()::date, 'EUR', 244.00, 'draft',
      '{"sdi":{"documento":{"tipo_documento":"TD01"}}}'::jsonb,
      NOW());

  -- Righe fattura
  INSERT INTO invoice_items (invoice_id, descr, qty, price, vat_perc) VALUES
    (v_invoice1, 'Servizio demolizione veicolo Fiat Punto', 1, 200.00, 22),
    (v_invoice1, 'Ritiro e trasporto veicolo', 1, 100.00, 22),
    (v_invoice2, 'Demolizione lotto 3 veicoli', 3, 350.00, 22),
    (v_invoice2, 'Trasporto bisarca', 1, 250.00, 22),
    (v_invoice2, 'Pratiche PRA radiazione (x3)', 3, 30.00, 22),
    (v_invoice3, 'Servizio demolizione VW Golf', 1, 150.00, 22),
    (v_invoice3, 'Pratica PRA radiazione', 1, 50.00, 22);

  -- Eventi SDI demo per fattura consegnata
  INSERT INTO sdi_events (invoice_id, event_type, payload, created_at) VALUES
    (v_invoice1, 'sent', '{"filename":"IT02166430856_00001.xml.p7m"}'::jsonb, NOW() - INTERVAL '10 days'),
    (v_invoice1, 'delivered', '{"esito":"ET01","identificativo_sdi":"IT01234567890_00001"}'::jsonb, NOW() - INTERVAL '9 days');

  -- ═══════════════════════════════════════════
  -- RICAMBI DEMO (8 ricambi vari)
  -- ═══════════════════════════════════════════
  INSERT INTO spare_parts (id, org_id, name, code, oem_code, category, condition, status, purchase_price, selling_price, location, vehicle_brand, vehicle_model, vehicle_year, notes, created_at) VALUES
    (gen_random_uuid(), v_org_id, 'Motore 1.2 Fire', 'MOT-001', '55212460', 'Motore', 'buono', 'available', 150.00, 450.00, 'Scaffale A1', 'FIAT', 'Punto', '2008', 'Km 85.000, testato funzionante', NOW() - INTERVAL '8 days'),
    (gen_random_uuid(), v_org_id, 'Cambio manuale 5 marce', 'CAM-001', 'C514.5.10', 'Trasmissione', 'buono', 'available', 120.00, 380.00, 'Scaffale A2', 'FIAT', 'Punto', '2008', 'Funzionante, nessun rumore', NOW() - INTERVAL '8 days'),
    (gen_random_uuid(), v_org_id, 'Porta anteriore DX', 'CAR-001', NULL, 'Carrozzeria', 'discreto', 'available', 30.00, 120.00, 'Zona B3', 'VW', 'Golf', '2012', 'Piccola ammaccatura, verniciatura grigio', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), v_org_id, 'Faro anteriore SX LED', 'ILL-001', '5G0941005', 'Illuminazione', 'ottimo', 'reserved', 80.00, 250.00, 'Scaffale C1', 'VW', 'Golf VII', '2015', 'LED originale, perfetto', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), v_org_id, 'Centralina motore ECU', 'ELE-001', '0261S07753', 'Elettronica', 'buono', 'available', 60.00, 200.00, 'Scaffale D1', 'RENAULT', 'Clio', '2015', 'Codice Bosch, da riprogrammare', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), v_org_id, 'Compressore A/C', 'CLI-001', 'DCP09061', 'Climatizzazione', 'buono', 'sold', 45.00, 180.00, 'Venduto', 'FIAT', 'Punto', '2008', 'Venduto a Bianchi Auto', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), v_org_id, 'Radiatore acqua', 'RAF-001', '46779393', 'Raffreddamento', 'buono', 'available', 25.00, 90.00, 'Scaffale A3', 'FIAT', 'Punto', '2010', 'Nessuna perdita', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), v_org_id, 'Cerchio in lega 16"', 'RUO-001', '5G0601025K', 'Ruote', 'discreto', 'available', 40.00, 95.00, 'Zona E1', 'VW', 'Golf VII', '2015', 'Set da 4, lievi graffi', NOW());

  -- ═══════════════════════════════════════════
  -- PREVENTIVI DEMO (2 preventivi)
  -- ═══════════════════════════════════════════
  INSERT INTO quotes (id, org_id, cliente, descrizione, importo, stato, created_at) VALUES
    (gen_random_uuid(), v_org_id, 'Verdi Giuseppe', 'Demolizione VW Golf 2012 + ritiro + pratica PRA', 350.00, 'inviato', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), v_org_id, 'Ferrari Anna', 'Ritiro e demolizione Renault Clio 2015', 280.00, 'bozza', NOW());

  -- ═══════════════════════════════════════════
  -- CASI RVFU DEMO (2 casi in vari stati)
  -- ═══════════════════════════════════════════
  INSERT INTO rvfu_cases (id, org_id, targa, telaio, marca, modello, anno, proprietario_nome, proprietario_cf, stato, created_at) VALUES
    (gen_random_uuid(), v_org_id, 'MN012OP', 'ZFA18800000123456', 'FIAT', 'Punto', '2008', 'Rossi Mario', 'RSSMRA80A01H501Z', 'completato', NOW() - INTERVAL '7 days'),
    (gen_random_uuid(), v_org_id, 'QR345ST', 'WVWZZZ1KZCW123456', 'VW', 'Golf', '2012', 'Verdi Giuseppe', 'VRDGPP75B15F205X', 'in_lavorazione', NOW() - INTERVAL '2 days');

  -- ═══════════════════════════════════════════
  -- REGISTRI RENTRI DEMO
  -- ═══════════════════════════════════════════
  INSERT INTO rentri_registri (id, org_id, tipo, anno, numero, stato, created_at) VALUES
    (gen_random_uuid(), v_org_id, 'carico_scarico', 2026, 1, 'attivo', NOW() - INTERVAL '30 days');

  -- FIR demo
  INSERT INTO rentri_formulari (id, org_id, numero_fir, stato, rentri_stato, data_emissione, 
    produttore_denominazione, produttore_cf, produttore_indirizzo,
    destinatario_denominazione, destinatario_cf, destinatario_indirizzo,
    trasportatore_denominazione, trasportatore_cf,
    codice_eer, descrizione_rifiuto, quantita, unita_misura,
    created_at) VALUES
    (gen_random_uuid(), v_org_id, 'FIR-2026-001', 'trasmesso', 'trasmesso', (NOW() - INTERVAL '15 days')::date,
      'Autodemolizioni Demo S.r.l.', 'SCZMNL05L21D960T', 'Via del Deposito 8, Roma',
      'Eco Recuperi S.r.l.', '12345678901', 'Via Riciclo 5, Latina',
      'Trasporti Esposito S.a.s.', '05432109876',
      '160104*', 'Veicoli fuori uso', 1500.00, 'kg',
      NOW() - INTERVAL '15 days'),
    (gen_random_uuid(), v_org_id, 'FIR-2026-002', 'bozza', 'bozza', NOW()::date,
      'Autodemolizioni Demo S.r.l.', 'SCZMNL05L21D960T', 'Via del Deposito 8, Roma',
      'Eco Recuperi S.r.l.', '12345678901', 'Via Riciclo 5, Latina',
      'Trasporti Esposito S.a.s.', '05432109876',
      '160103', 'Pneumatici fuori uso', 800.00, 'kg',
      NOW());

  RAISE NOTICE 'Demo seed completato! Org ID: %, User ID: %', v_org_id, v_user_id;
END $$;
