-- =====================================================
-- RENTRI TEST DATA COMPLETI - Tutti i casi numerali
-- =====================================================
-- Questo script crea dati di test per:
-- 1. Registri (tutti i tipi)
-- 2. Movimenti (tutte le causali)
-- 3. FIR (tutti i tipi)
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

-- Pulisci dati test esistenti (solo se hanno 'TEST' nel numero)
DELETE FROM rentri_registri WHERE numero_registro LIKE 'TEST-%';

-- Registro 1: Carico/Scarico - Produzione
INSERT INTO rentri_registri (
  org_id, anno, tipo, numero_registro, 
  stato, created_at, created_by
) VALUES (
  get_first_org_id(),
  2025,
  'carico_scarico',
  'TEST-CS-PROD-2025',
  'attivo',
  NOW(),
  get_first_user_id()
);

-- Registro 2: Carico/Scarico - Recupero
INSERT INTO rentri_registri (
  org_id, anno, tipo, numero_registro, 
  stato, created_at, created_by
) VALUES (
  get_first_org_id(),
  2025,
  'carico_scarico',
  'TEST-CS-RECUP-2025',
  'attivo',
  NOW(),
  get_first_user_id()
);

-- Registro 3: Carico/Scarico - Smaltimento
INSERT INTO rentri_registri (
  org_id, anno, tipo, numero_registro, 
  stato, created_at, created_by
) VALUES (
  get_first_org_id(),
  2025,
  'carico_scarico',
  'TEST-CS-SMALT-2025',
  'attivo',
  NOW(),
  get_first_user_id()
);

-- Registro 4: Carico/Scarico - Trasporto
INSERT INTO rentri_registri (
  org_id, anno, tipo, numero_registro, 
  stato, created_at, created_by
) VALUES (
  get_first_org_id(),
  2025,
  'carico_scarico',
  'TEST-CS-TRASP-2025',
  'attivo',
  NOW(),
  get_first_user_id()
);

-- Registro 5: Carico/Scarico - Centro Raccolta
INSERT INTO rentri_registri (
  org_id, anno, tipo, numero_registro, 
  stato, created_at, created_by
) VALUES (
  get_first_org_id(),
  2025,
  'carico_scarico',
  'TEST-CS-CENTRO-2025',
  'attivo',
  NOW(),
  get_first_user_id()
);

-- Registro 6: Carico/Scarico - Intermediazione
INSERT INTO rentri_registri (
  org_id, anno, tipo, numero_registro, 
  stato, created_at, created_by
) VALUES (
  get_first_org_id(),
  2025,
  'carico_scarico',
  'TEST-CS-INTERM-2025',
  'attivo',
  NOW(),
  get_first_user_id()
);

-- Registro 7: Carico/Scarico - Multi-attività
INSERT INTO rentri_registri (
  org_id, anno, tipo, numero_registro, 
  stato, created_at, created_by
) VALUES (
  get_first_org_id(),
  2025,
  'carico_scarico',
  'TEST-CS-MULTI-2025',
  'attivo',
  NOW(),
  get_first_user_id()
);

-- =====================================================
-- 2. MOVIMENTI - Tutte le causali
-- =====================================================

-- Pulisci movimenti test esistenti
DELETE FROM rentri_movimenti WHERE registro_id IN (
  SELECT id FROM rentri_registri WHERE numero_registro LIKE 'TEST-%'
);

-- Helper: Ottieni ID registro per tipo
CREATE OR REPLACE FUNCTION get_test_registro_id(tipo_test text) RETURNS uuid AS $$
  SELECT id FROM rentri_registri WHERE numero_registro = tipo_test LIMIT 1;
$$ LANGUAGE sql;

-- MOVIMENTO 1: NP - Nuova Produzione (CARICO)
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  caratteristiche_pericolo, annotazioni, created_at, created_by
) VALUES (
  get_first_org_id(),
  get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 1,
  NOW(),
  'NP',
  'carico',
  NOW()::date,
  '160104*',
  1500.00,
  'kg',
  'S',
  ARRAY['HP14']::text[],
  'Test movimento Nuova Produzione - Carico rifiuto pericoloso',
  NOW(),
  get_first_user_id()
);

-- MOVIMENTO 2: DT - Deposito Temporaneo (CARICO)
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, provenienza,
  annotazioni, created_at, created_by
) VALUES (
  get_first_org_id(),
  get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 2,
  NOW(),
  'DT',
  'carico',
  NOW()::date,
  '170405*',
  2000.00,
  'kg',
  'S',
  'Test movimento Deposito Temporaneo - Carico metalli',
  NOW(),
  get_first_user_id()
);

-- MOVIMENTO 3: RE - Recupero (SCARICO)
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  destinatario_denominazione, destinatario_codice_fiscale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 1,
  NOW(),
  'RE',
  'scarico',
  '170405*',
  'Ferro e acciaio',
  'S',
  'R4',
  1800.00,
  'kg',
  'S',
  'Impianto Recupero Test SRL',
  '12345678901',
  'Test movimento Recupero - Scarico per recupero',
  'bozza',
  NOW()
);

-- MOVIMENTO 4: I - Intermediazione (SCARICO)
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  intermediario_denominazione, intermediario_codice_fiscale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-INTERM-2025'),
  2025, 1,
  NOW(),
  'I',
  'scarico',
  '170405*',
  'Ferro e acciaio',
  'S',
  'R4',
  1000.00,
  'kg',
  'S',
  'Intermediario Test SRL',
  '98765432109',
  'Test movimento Intermediazione - Scarico tramite intermediario',
  'bozza',
  NOW()
);

-- MOVIMENTO 5: TR - Trasporto (SCARICO)
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  riferimento_fir, numero_fir, data_inizio_trasporto,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  destinatario_denominazione, destinatario_codice_fiscale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-TRASP-2025'),
  2025, 1,
  NOW(),
  'TR',
  'scarico',
  '160104*',
  'Veicoli fuori uso',
  'S',
  'R4',
  1200.00,
  'kg',
  'S',
  'FIR-TEST-001',
  'AA001234567890123',
  NOW()::date,
  'Trasporti Test SRL',
  '11223344556',
  'Destinazione Test SRL',
  '66778899001',
  'Test movimento Trasporto - Scarico con FIR',
  'bozza',
  NOW()
);

-- MOVIMENTO 6: aT - Arrivo da Trasporto (CARICO)
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  riferimento_fir, numero_fir, data_inizio_trasporto,
  data_fine_trasporto, peso_verificato_destino,
  produttore_denominazione, produttore_codice_fiscale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 2,
  NOW(),
  'aT',
  'carico',
  '160104*',
  'Veicoli fuori uso',
  'S',
  'R4',
  1200.00,
  'kg',
  'S',
  'FIR-TEST-001',
  'AA001234567890123',
  (NOW() - INTERVAL '1 day')::date,
  NOW()::date,
  1180.00,
  'Produttore Test SRL',
  '55443322110',
  'Test movimento Arrivo da Trasporto - Carico con esito conferimento',
  'bozza',
  NOW()
);

-- MOVIMENTO 7: T* - Trasporto generico (SCARICO)
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  riferimento_fir, numero_fir, data_inizio_trasporto,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-TRASP-2025'),
  2025, 2,
  NOW(),
  'T*',
  'scarico',
  '170405*',
  'Ferro e acciaio',
  'S',
  'R4',
  800.00,
  'kg',
  'S',
  'FIR-TEST-002',
  'AA001234567890124',
  NOW()::date,
  'Trasporti Veloci SRL',
  '22334455667',
  'Test movimento Trasporto generico - Scarico con FIR',
  'bozza',
  NOW()
);

-- MOVIMENTO 8: T*aT - Trasporto con arrivo (CARICO)
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  riferimento_fir, numero_fir, data_inizio_trasporto,
  data_fine_trasporto, peso_verificato_destino,
  produttore_denominazione, produttore_codice_fiscale,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 3,
  NOW(),
  'T*aT',
  'carico',
  '170405*',
  'Ferro e acciaio',
  'S',
  'R4',
  800.00,
  'kg',
  'S',
  'FIR-TEST-002',
  'AA001234567890124',
  (NOW() - INTERVAL '2 days')::date,
  NOW()::date,
  790.00,
  'Produttore Test 2 SRL',
  '99887766554',
  'Trasporti Veloci SRL',
  '22334455667',
  'Test movimento Trasporto con arrivo - Carico con esito',
  'bozza',
  NOW()
);

-- MOVIMENTO 9: M - Materiali (solo impianti)
-- Nota: Questo richiede la sezione materiali invece di rifiuto
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  quantita, unita_misura,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 4,
  NOW(),
  'M',
  'carico',
  500.00,
  'kg',
  'Test movimento Materiali - Carico materiali impianto (causale M)',
  'bozza',
  NOW()
);

-- MOVIMENTO 10: VFU - Veicolo Fuori Uso
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  veicolo_fuori_uso, vfu_numero_registro, vfu_data_registro,
  produttore_denominazione, produttore_codice_fiscale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 3,
  NOW(),
  'NP',
  'carico',
  '160104*',
  'Veicoli fuori uso',
  'S',
  'R4',
  1800.00,
  'kg',
  'S',
  true,
  'VFU-2025-001',
  NOW()::date,
  'Privato Cittadino',
  'RSSMRA80A01H501U',
  'Test movimento VFU - Carico veicolo fuori uso con dati registro PS',
  'bozza',
  NOW()
);

-- MOVIMENTO 11: Rifiuto con categorie AEE (RAEE)
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  categorie_aee,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 4,
  NOW(),
  'NP',
  'carico',
  '200135*',
  'Apparecchiature elettriche ed elettroniche',
  'S',
  'R4',
  250.00,
  'kg',
  'S',
  ARRAY['Cat1', 'Cat4']::text[],
  'Test movimento RAEE - Carico con categorie AEE',
  'bozza',
  NOW()
);

-- MOVIMENTO 12: Respingimento parziale
INSERT INTO rentri_movimenti (
  org_id, user_id, registro_id, anno, progressivo,
  data_ora_registrazione, causale_operazione, tipo_operazione,
  codice_eer, descrizione_eer, stato_fisico, destinato_attivita,
  quantita, unita_misura, provenienza,
  riferimento_fir, numero_fir, data_inizio_trasporto,
  data_fine_trasporto, peso_verificato_destino,
  respingimento_tipo, respingimento_quantita, respingimento_unita_misura,
  respingimento_causale,
  annotazioni, stato, created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 5,
  NOW(),
  'aT',
  'carico',
  '170405*',
  'Ferro e acciaio',
  'S',
  'R4',
  1000.00,
  'kg',
  'S',
  'FIR-TEST-003',
  'AA001234567890125',
  (NOW() - INTERVAL '1 day')::date,
  NOW()::date,
  800.00,
  'P',
  200.00,
  'kg',
  'NC',
  'Test movimento con Respingimento Parziale - Non conforme',
  'bozza',
  NOW()
);

-- =====================================================
-- 3. FIR - Tutti i tipi
-- =====================================================

-- Pulisci FIR test esistenti
DELETE FROM rentri_formulari WHERE numero_fir LIKE 'TEST-%';

-- FIR 1: Trasporto normale
INSERT INTO rentri_formulari (
  org_id, user_id, numero_fir, data_emissione, stato,
  produttore_denominazione, produttore_codice_fiscale,
  produttore_indirizzo, produttore_comune_id,
  destinatario_denominazione, destinatario_codice_fiscale,
  destinatario_indirizzo, destinatario_comune_id,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  trasportatore_num_iscrizione_albo,
  codice_eer, descrizione_eer, stato_fisico,
  quantita, unita_misura,
  caratteristiche_pericolo,
  data_inizio_trasporto,
  created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  'TEST-FIR-001',
  NOW()::date,
  'bozza',
  'Produttore Test SRL',
  '12345678901',
  'Via Test 1',
  '058091',
  'Destinatario Test SRL',
  '98765432109',
  'Via Destinazione 1',
  '058091',
  'Trasporti Test SRL',
  '11223344556',
  'MI/123456/2025',
  '160104*',
  'Veicoli fuori uso',
  'S',
  1500.00,
  'kg',
  ARRAY['HP14']::text[],
  NOW()::date,
  NOW()
);

-- FIR 2: Trasporto transfrontaliero
INSERT INTO rentri_formulari (
  org_id, user_id, numero_fir, data_emissione, stato,
  produttore_denominazione, produttore_codice_fiscale,
  produttore_indirizzo, produttore_comune_id,
  destinatario_denominazione, destinatario_codice_fiscale,
  destinatario_indirizzo,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  trasportatore_num_iscrizione_albo,
  codice_eer, descrizione_eer, stato_fisico,
  quantita, unita_misura,
  trasporto_transfrontaliero, tipo_trasporto_transfrontaliero,
  data_inizio_trasporto,
  created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  'TEST-FIR-002',
  NOW()::date,
  'bozza',
  'Produttore Italia SRL',
  '55667788990',
  'Via Italia 10',
  '058091',
  'Destinatario Francia SARL',
  'FR123456789',
  'Rue de Paris 20, Paris, France',
  'Trasporti Internazionali SRL',
  '99887766554',
  'MI/654321/2025',
  '170405*',
  'Ferro e acciaio',
  'S',
  2000.00,
  'kg',
  true,
  'E',
  NOW()::date,
  NOW()
);

-- FIR 3: Con intermediario
INSERT INTO rentri_formulari (
  org_id, user_id, numero_fir, data_emissione, stato,
  produttore_denominazione, produttore_codice_fiscale,
  produttore_indirizzo, produttore_comune_id,
  destinatario_denominazione, destinatario_codice_fiscale,
  destinatario_indirizzo, destinatario_comune_id,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  trasportatore_num_iscrizione_albo,
  intermediario_denominazione, intermediario_codice_fiscale,
  intermediario_num_iscrizione_albo,
  codice_eer, descrizione_eer, stato_fisico,
  quantita, unita_misura,
  data_inizio_trasporto,
  created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  'TEST-FIR-003',
  NOW()::date,
  'bozza',
  'Produttore Test 3 SRL',
  '11111111111',
  'Via Produzione 5',
  '058091',
  'Destinatario Test 3 SRL',
  '22222222222',
  'Via Smaltimento 10',
  '058091',
  'Trasporti Test 3 SRL',
  '33333333333',
  'MI/111111/2025',
  'Intermediario Test SRL',
  '44444444444',
  'MI/222222/2025',
  '170405*',
  'Ferro e acciaio',
  'S',
  1000.00,
  'kg',
  NOW()::date,
  NOW()
);

-- FIR 4: RAEE con categorie AEE
INSERT INTO rentri_formulari (
  org_id, user_id, numero_fir, data_emissione, stato,
  produttore_denominazione, produttore_codice_fiscale,
  produttore_indirizzo, produttore_comune_id,
  destinatario_denominazione, destinatario_codice_fiscale,
  destinatario_indirizzo, destinatario_comune_id,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  trasportatore_num_iscrizione_albo,
  codice_eer, descrizione_eer, stato_fisico,
  quantita, unita_misura,
  categorie_aee,
  data_inizio_trasporto,
  created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  'TEST-FIR-004',
  NOW()::date,
  'bozza',
  'Centro Raccolta Test',
  '55555555555',
  'Via Raccolta 15',
  '058091',
  'Impianto RAEE Test SRL',
  '66666666666',
  'Via Recupero 20',
  '058091',
  'Trasporti RAEE SRL',
  '77777777777',
  'MI/333333/2025',
  '200135*',
  'Apparecchiature elettriche ed elettroniche',
  'S',
  500.00,
  'kg',
  ARRAY['Cat1', 'Cat2', 'Cat4']::text[],
  NOW()::date,
  NOW()
);

-- FIR 5: Rifiuto liquido (litri)
INSERT INTO rentri_formulari (
  org_id, user_id, numero_fir, data_emissione, stato,
  produttore_denominazione, produttore_codice_fiscale,
  produttore_indirizzo, produttore_comune_id,
  destinatario_denominazione, destinatario_codice_fiscale,
  destinatario_indirizzo, destinatario_comune_id,
  trasportatore_denominazione, trasportatore_codice_fiscale,
  trasportatore_num_iscrizione_albo,
  codice_eer, descrizione_eer, stato_fisico,
  quantita, unita_misura,
  caratteristiche_pericolo,
  data_inizio_trasporto,
  created_at
) VALUES (
  get_first_org_id(),
  get_first_user_id(),
  'TEST-FIR-005',
  NOW()::date,
  'bozza',
  'Officina Test SRL',
  '88888888888',
  'Via Officina 25',
  '058091',
  'Smaltimento Liquidi SRL',
  '99999999999',
  'Via Trattamento 30',
  '058091',
  'Trasporti Liquidi SRL',
  '10101010101',
  'MI/444444/2025',
  '130205*',
  'Oli minerali per motori, ingranaggi e lubrificazione, non clorurati',
  'L',
  800.00,
  'l',
  ARRAY['HP5', 'HP14']::text[],
  NOW()::date,
  NOW()
);

-- =====================================================
-- REPORT DATI TEST INSERITI
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
  RAISE NOTICE 'CAUSALI MOVIMENTI TESTATE:';
  RAISE NOTICE '- NP: Nuova Produzione (4 casi)';
  RAISE NOTICE '- DT: Deposito Temporaneo';
  RAISE NOTICE '- RE: Recupero';
  RAISE NOTICE '- I: Intermediazione';
  RAISE NOTICE '- TR: Trasporto';
  RAISE NOTICE '- aT: Arrivo da Trasporto';
  RAISE NOTICE '- T*: Trasporto generico';
  RAISE NOTICE '- T*aT: Trasporto con arrivo';
  RAISE NOTICE '- M: Materiali';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CASI SPECIALI TESTATI:';
  RAISE NOTICE '- VFU: Veicolo Fuori Uso';
  RAISE NOTICE '- RAEE: Con categorie AEE';
  RAISE NOTICE '- Respingimento parziale';
  RAISE NOTICE '- Trasporto transfrontaliero';
  RAISE NOTICE '- Intermediario';
  RAISE NOTICE '- Rifiuti liquidi (litri)';
  RAISE NOTICE '- Rifiuti pericolosi (HP)';
  RAISE NOTICE '========================================';
END $$;

-- Cleanup functions
DROP FUNCTION IF EXISTS get_first_org_id();
DROP FUNCTION IF EXISTS get_first_user_id();
DROP FUNCTION IF EXISTS get_test_registro_id(text);
