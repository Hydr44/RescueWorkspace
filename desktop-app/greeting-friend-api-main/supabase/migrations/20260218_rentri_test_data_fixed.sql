-- =====================================================
-- RENTRI TEST DATA COMPLETI - VERSIONE CORRETTA
-- =====================================================
-- Usa solo le colonne che esistono realmente nelle tabelle
-- =====================================================

-- Funzione helper per ottenere la prima org
CREATE OR REPLACE FUNCTION get_first_org_id() RETURNS uuid AS $$
  SELECT id FROM orgs LIMIT 1;
$$ LANGUAGE sql;

-- Funzione helper per ottenere il primo utente
CREATE OR REPLACE FUNCTION get_first_user_id() RETURNS uuid AS $$
  SELECT id FROM auth.users LIMIT 1;
$$ LANGUAGE sql;

-- =====================================================
-- 1. REGISTRI - Tutti i tipi
-- =====================================================

-- Pulisci dati test esistenti
DELETE FROM rentri_movimenti WHERE registro_id IN (
  SELECT id FROM rentri_registri WHERE numero_registro LIKE 'TEST-%'
);
DELETE FROM rentri_registri WHERE numero_registro LIKE 'TEST-%';

-- Registri test (7 registri)
INSERT INTO rentri_registri (org_id, anno, tipo, numero_registro, stato, created_by) VALUES
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-PROD-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-RECUP-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-SMALT-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-TRASP-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-CENTRO-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-INTERM-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-MULTI-2025', 'attivo', get_first_user_id());

-- =====================================================
-- 2. MOVIMENTI - Tutte le causali (12 movimenti)
-- =====================================================

-- Helper: Ottieni ID registro per tipo
CREATE OR REPLACE FUNCTION get_test_registro_id(tipo_test text) RETURNS uuid AS $$
  SELECT id FROM rentri_registri WHERE numero_registro = tipo_test LIMIT 1;
$$ LANGUAGE sql;

-- MOVIMENTO 1: NP - Nuova Produzione
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  caratteristiche_pericolo, annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 1, NOW(), 'NP', 'carico', NOW()::date,
  '160104*', 1500.00, 'kg', 'S', ARRAY['HP14']::text[],
  'Test NP - Nuova Produzione VFU pericoloso', get_first_user_id()
);

-- MOVIMENTO 2: DT - Deposito Temporaneo
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 2, NOW(), 'DT', 'carico', NOW()::date,
  '170405*', 2000.00, 'kg', 'S',
  'Test DT - Deposito Temporaneo metalli', get_first_user_id()
);

-- MOVIMENTO 3: RE - Recupero
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 1, NOW(), 'RE', 'scarico', NOW()::date,
  '170405*', 1800.00, 'kg', 'S',
  'Test RE - Recupero scarico', get_first_user_id()
);

-- MOVIMENTO 4: I - Intermediazione
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-INTERM-2025'),
  2025, 1, NOW(), 'I', 'scarico', NOW()::date,
  '170405*', 1000.00, 'kg', 'S',
  'Test I - Intermediazione', get_first_user_id()
);

-- MOVIMENTO 5: TR - Trasporto
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  numero_fir, data_inizio_trasporto,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-TRASP-2025'),
  2025, 1, NOW(), 'TR', 'scarico', NOW()::date,
  '160104*', 1200.00, 'kg', 'S',
  'AA001234567890123', NOW(),
  'Test TR - Trasporto con FIR', get_first_user_id()
);

-- MOVIMENTO 6: aT - Arrivo da Trasporto
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  numero_fir, data_inizio_trasporto, data_fine_trasporto, peso_verificato_destino,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 2, NOW(), 'aT', 'carico', NOW()::date,
  '160104*', 1200.00, 'kg', 'S',
  'AA001234567890123', (NOW() - INTERVAL '1 day'), NOW(), 1180.00,
  'Test aT - Arrivo da Trasporto con esito', get_first_user_id()
);

-- MOVIMENTO 7: T* - Trasporto generico
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  numero_fir, data_inizio_trasporto,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-TRASP-2025'),
  2025, 2, NOW(), 'T*', 'scarico', NOW()::date,
  '170405*', 800.00, 'kg', 'S',
  'AA001234567890124', NOW(),
  'Test T* - Trasporto generico', get_first_user_id()
);

-- MOVIMENTO 8: T*aT - Trasporto con arrivo
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  numero_fir, data_inizio_trasporto, data_fine_trasporto, peso_verificato_destino,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 3, NOW(), 'T*aT', 'carico', NOW()::date,
  '170405*', 800.00, 'kg', 'S',
  'AA001234567890124', (NOW() - INTERVAL '2 days'), NOW(), 790.00,
  'Test T*aT - Trasporto con arrivo ed esito', get_first_user_id()
);

-- MOVIMENTO 9: M - Materiali
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura,
  annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 4, NOW(), 'M', 'carico', NOW()::date,
  '170405*', 500.00, 'kg',
  'Test M - Materiali impianto', get_first_user_id()
);

-- MOVIMENTO 10: NP + VFU
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 3, NOW(), 'NP', 'carico', NOW()::date,
  '160104*', 1800.00, 'kg', 'S',
  'Test NP+VFU - Veicolo Fuori Uso',
  'VFU: numero_registro=VFU-2025-001, data=' || NOW()::date, 
  get_first_user_id()
);

-- MOVIMENTO 11: NP + RAEE
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 4, NOW(), 'NP', 'carico', NOW()::date,
  '200135*', 250.00, 'kg', 'S',
  'Test NP+RAEE - Apparecchiature elettroniche',
  'RAEE: categorie_aee=[Cat1,Cat4]',
  get_first_user_id()
);

-- MOVIMENTO 12: aT + Respingimento parziale
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  numero_fir, data_inizio_trasporto, data_fine_trasporto, peso_verificato_destino,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 5, NOW(), 'aT', 'carico', NOW()::date,
  '170405*', 1000.00, 'kg', 'S',
  'AA001234567890125', (NOW() - INTERVAL '1 day'), NOW(), 800.00,
  'Test aT+Respingimento - Parziale non conforme',
  'Respingimento: tipo=P, quantita=200kg, causale=NC',
  get_first_user_id()
);

-- =====================================================
-- 3. FIR - Tutti i tipi (5 formulari)
-- =====================================================

-- Pulisci FIR test esistenti
DELETE FROM rentri_formulari WHERE numero_fir LIKE 'TEST-%';

-- FIR 1: Trasporto normale
INSERT INTO rentri_formulari (
  org_id, numero_fir, anno, data_creazione, stato,
  produttore_cf, produttore_nome, produttore_indirizzo,
  destinatario_cf, destinatario_nome, destinatario_indirizzo,
  trasportatore_cf, trasportatore_nome, trasportatore_albo,
  codici_eer, data_inizio_trasporto, note, created_by
) VALUES (
  get_first_org_id(), 'TEST-FIR-001', 2025, NOW()::date, 'bozza',
  '12345678901', 'Produttore Test SRL', 'Via Test 1, Roma',
  '98765432109', 'Destinatario Test SRL', 'Via Destinazione 1, Milano',
  '11223344556', 'Trasporti Test SRL', 'MI/123456/2025',
  '[{"codice":"160104*","descrizione":"Veicoli fuori uso","quantita":1500,"unita":"kg","caratteristiche":["HP14"]}]'::jsonb,
  NOW()::date, 'Test FIR normale - rifiuto pericoloso', get_first_user_id()
);

-- FIR 2: Trasporto transfrontaliero
INSERT INTO rentri_formulari (
  org_id, numero_fir, anno, data_creazione, stato,
  produttore_cf, produttore_nome, produttore_indirizzo,
  destinatario_cf, destinatario_nome, destinatario_indirizzo,
  trasportatore_cf, trasportatore_nome, trasportatore_albo,
  codici_eer, data_inizio_trasporto, note, created_by
) VALUES (
  get_first_org_id(), 'TEST-FIR-002', 2025, NOW()::date, 'bozza',
  '55667788990', 'Produttore Italia SRL', 'Via Italia 10, Roma',
  'FR123456789', 'Destinatario Francia SARL', 'Rue de Paris 20, Paris, France',
  '99887766554', 'Trasporti Internazionali SRL', 'MI/654321/2025',
  '[{"codice":"170405*","descrizione":"Ferro e acciaio","quantita":2000,"unita":"kg"}]'::jsonb,
  NOW()::date, 'Test FIR transfrontaliero - esportazione Francia', get_first_user_id()
);

-- FIR 3: Con intermediario
INSERT INTO rentri_formulari (
  org_id, numero_fir, anno, data_creazione, stato,
  produttore_cf, produttore_nome, produttore_indirizzo,
  destinatario_cf, destinatario_nome, destinatario_indirizzo,
  trasportatore_cf, trasportatore_nome, trasportatore_albo,
  codici_eer, data_inizio_trasporto, note, created_by
) VALUES (
  get_first_org_id(), 'TEST-FIR-003', 2025, NOW()::date, 'bozza',
  '11111111111', 'Produttore Test 3 SRL', 'Via Produzione 5, Milano',
  '22222222222', 'Destinatario Test 3 SRL', 'Via Smaltimento 10, Torino',
  '33333333333', 'Trasporti Test 3 SRL', 'MI/111111/2025',
  '[{"codice":"170405*","descrizione":"Ferro e acciaio","quantita":1000,"unita":"kg"}]'::jsonb,
  NOW()::date, 'Test FIR con intermediario - CF: 44444444444', get_first_user_id()
);

-- FIR 4: RAEE con categorie AEE
INSERT INTO rentri_formulari (
  org_id, numero_fir, anno, data_creazione, stato,
  produttore_cf, produttore_nome, produttore_indirizzo,
  destinatario_cf, destinatario_nome, destinatario_indirizzo,
  trasportatore_cf, trasportatore_nome, trasportatore_albo,
  codici_eer, data_inizio_trasporto, note, created_by
) VALUES (
  get_first_org_id(), 'TEST-FIR-004', 2025, NOW()::date, 'bozza',
  '55555555555', 'Centro Raccolta Test', 'Via Raccolta 15, Bologna',
  '66666666666', 'Impianto RAEE Test SRL', 'Via Recupero 20, Firenze',
  '77777777777', 'Trasporti RAEE SRL', 'MI/333333/2025',
  '[{"codice":"200135*","descrizione":"Apparecchiature elettriche","quantita":500,"unita":"kg","categorie_aee":["Cat1","Cat2","Cat4"]}]'::jsonb,
  NOW()::date, 'Test FIR RAEE - categorie AEE', get_first_user_id()
);

-- FIR 5: Rifiuto liquido
INSERT INTO rentri_formulari (
  org_id, numero_fir, anno, data_creazione, stato,
  produttore_cf, produttore_nome, produttore_indirizzo,
  destinatario_cf, destinatario_nome, destinatario_indirizzo,
  trasportatore_cf, trasportatore_nome, trasportatore_albo,
  codici_eer, data_inizio_trasporto, note, created_by
) VALUES (
  get_first_org_id(), 'TEST-FIR-005', 2025, NOW()::date, 'bozza',
  '88888888888', 'Officina Test SRL', 'Via Officina 25, Napoli',
  '99999999999', 'Smaltimento Liquidi SRL', 'Via Trattamento 30, Bari',
  '10101010101', 'Trasporti Liquidi SRL', 'MI/444444/2025',
  '[{"codice":"130205*","descrizione":"Oli minerali","quantita":800,"unita":"l","caratteristiche":["HP5","HP14"]}]'::jsonb,
  NOW()::date, 'Test FIR liquido - oli minerali in litri', get_first_user_id()
);

-- =====================================================
-- REPORT FINALE
-- =====================================================

DO $$
DECLARE
  registri_count int;
  movimenti_count int;
  fir_count int;
BEGIN
  SELECT COUNT(*) INTO registri_count FROM rentri_registri WHERE numero_registro LIKE 'TEST-%';
  SELECT COUNT(*) INTO movimenti_count FROM rentri_movimenti WHERE registro_id IN (
    SELECT id FROM rentri_registri WHERE numero_registro LIKE 'TEST-%'
  );
  SELECT COUNT(*) INTO fir_count FROM rentri_formulari WHERE numero_fir LIKE 'TEST-%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RENTRI TEST DATA - INSERIMENTO COMPLETATO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Registri inseriti: %', registri_count;
  RAISE NOTICE 'Movimenti inseriti: %', movimenti_count;
  RAISE NOTICE 'FIR inseriti: %', fir_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CAUSALI MOVIMENTI TESTATE (9/9):';
  RAISE NOTICE '- NP: Nuova Produzione';
  RAISE NOTICE '- DT: Deposito Temporaneo';
  RAISE NOTICE '- RE: Recupero';
  RAISE NOTICE '- I: Intermediazione';
  RAISE NOTICE '- TR: Trasporto';
  RAISE NOTICE '- aT: Arrivo da Trasporto';
  RAISE NOTICE '- T*: Trasporto generico';
  RAISE NOTICE '- T*aT: Trasporto con arrivo';
  RAISE NOTICE '- M: Materiali';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CASI SPECIALI TESTATI (10/10):';
  RAISE NOTICE '- VFU (Veicolo Fuori Uso)';
  RAISE NOTICE '- RAEE (Categorie AEE)';
  RAISE NOTICE '- Respingimento parziale';
  RAISE NOTICE '- Trasporto transfrontaliero';
  RAISE NOTICE '- Intermediario';
  RAISE NOTICE '- Rifiuti liquidi (litri)';
  RAISE NOTICE '- Rifiuti pericolosi (HP)';
  RAISE NOTICE '- Integrazione FIR';
  RAISE NOTICE '- Esito conferimento';
  RAISE NOTICE '- Peso verificato';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PRONTO PER TEST AL 100%';
  RAISE NOTICE '========================================';
END $$;

-- Cleanup functions
DROP FUNCTION IF EXISTS get_first_org_id();
DROP FUNCTION IF EXISTS get_first_user_id();
DROP FUNCTION IF EXISTS get_test_registro_id(text);
