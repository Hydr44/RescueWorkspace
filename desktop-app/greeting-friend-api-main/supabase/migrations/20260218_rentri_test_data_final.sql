-- =====================================================
-- RENTRI TEST DATA - VERSIONE FINALE (SCHEMA REALE)
-- =====================================================
-- Usa SOLO le colonne che esistono nello schema reale
-- =====================================================

-- Funzioni helper
CREATE OR REPLACE FUNCTION get_first_org_id() RETURNS uuid AS $$
  SELECT id FROM orgs LIMIT 1;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_first_user_id() RETURNS uuid AS $$
  SELECT id FROM auth.users LIMIT 1;
$$ LANGUAGE sql;

-- Pulisci dati test
DELETE FROM rentri_movimenti WHERE registro_id IN (
  SELECT id FROM rentri_registri WHERE numero_registro LIKE 'TEST-%'
);
DELETE FROM rentri_registri WHERE numero_registro LIKE 'TEST-%';
DELETE FROM rentri_formulari WHERE numero_fir LIKE 'TEST-%';

-- =====================================================
-- REGISTRI (7)
-- =====================================================

INSERT INTO rentri_registri (org_id, anno, tipo, numero_registro, stato, created_by) VALUES
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-PROD-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-RECUP-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-SMALT-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-TRASP-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-CENTRO-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-INTERM-2025', 'attivo', get_first_user_id()),
  (get_first_org_id(), 2025, 'carico_scarico', 'TEST-CS-MULTI-2025', 'attivo', get_first_user_id());

-- Helper per registri
CREATE OR REPLACE FUNCTION get_test_registro_id(tipo_test text) RETURNS uuid AS $$
  SELECT id FROM rentri_registri WHERE numero_registro = tipo_test LIMIT 1;
$$ LANGUAGE sql;

-- =====================================================
-- MOVIMENTI (12) - SOLO colonne esistenti nello schema
-- =====================================================
-- Colonne reali: org_id, registro_id, tipo_operazione, data_operazione,
-- codice_eer, quantita, unita_misura, note, created_by, anno, 
-- progressivo, data_ora_registrazione, causale_operazione

-- 1. NP - Nuova Produzione (carico: rifiuto entra nel registro)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  'carico', NOW()::date, '160104', 1500.00, 'kg',
  2025, 1, NOW(), 'NP', 'S', 'R4',
  'Veicolo fuori uso - demolizione', 'Test NP - Nuova Produzione VFU', get_first_user_id()
);

-- 2. DT - Deposito Temporaneo (carico: rifiuto entra in deposito)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  'carico', NOW()::date, '170405', 2000.00, 'kg',
  2025, 2, NOW(), 'DT', 'S', 'R4',
  'Deposito temporaneo rottami ferrosi', 'Test DT - Deposito Temporaneo', get_first_user_id()
);

-- 3. RE - Recupero/Smaltimento (scarico: rifiuto esce dal registro)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  'scarico', NOW()::date, '170405', 1800.00, 'kg',
  2025, 1, NOW(), 'RE', 'S', 'R4',
  'Conferimento rottami ferrosi a impianto recupero', 'Test RE - Recupero', get_first_user_id()
);

-- 4. I - Intermediazione (carico: rifiuto preso in carico dall'intermediario)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-INTERM-2025'),
  'carico', NOW()::date, '170405', 1000.00, 'kg',
  2025, 1, NOW(), 'I', 'S', 'R4',
  'Intermediazione rottami ferrosi', 'Test I - Intermediazione', get_first_user_id()
);

-- 5. TR - Trasporto in uscita (scarico: rifiuto lascia il sito)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  numero_fir, annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-TRASP-2025'),
  'scarico', NOW()::date, '160104', 1200.00, 'kg',
  2025, 1, NOW(), 'TR', 'S', 'R4',
  'TEST-FIR-001', 'Trasporto VFU a impianto trattamento', 'Test TR - Trasporto', get_first_user_id()
);

-- 6. aT - Arrivo da Trasporto (carico: rifiuto arriva al sito)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  numero_fir, peso_verificato_destino, annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  'carico', NOW()::date, '160104', 1200.00, 'kg',
  2025, 2, NOW(), 'aT', 'S', 'R4',
  'TEST-FIR-001', 1195.00, 'Arrivo VFU da trasportatore - peso verificato', 'Test aT - Arrivo da Trasporto', get_first_user_id()
);

-- 7. T* - Trasporto generico (scarico: rifiuto parte dal sito)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  numero_fir, annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-TRASP-2025'),
  'scarico', NOW()::date, '170405', 800.00, 'kg',
  2025, 2, NOW(), 'T*', 'S', 'R4',
  'TEST-FIR-002', 'Trasporto rottami ferrosi', 'Test T* - Trasporto generico', get_first_user_id()
);

-- 8. T*aT - Trasporto con arrivo (carico: rifiuto arriva dopo trasporto)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  numero_fir, peso_verificato_destino, annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  'carico', NOW()::date, '170405', 800.00, 'kg',
  2025, 3, NOW(), 'T*aT', 'S', 'R4',
  'TEST-FIR-002', 795.00, 'Arrivo rottami ferrosi - peso verificato a destinazione', 'Test T*aT - Trasporto con arrivo', get_first_user_id()
);

-- 9. M - Materiali (carico: materiale non rifiuto entra nel sito)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  'carico', NOW()::date, '170405', 500.00, 'kg',
  2025, 4, NOW(), 'M', 'S', 'R4',
  'Materiali metallici non classificati come rifiuto', 'Test M - Materiali', get_first_user_id()
);

-- 10. NP + VFU (carico con flag veicolo fuori uso)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  veicolo_fuori_uso, annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  'carico', NOW()::date, '160104', 1800.00, 'kg',
  2025, 3, NOW(), 'NP', 'S', 'R4',
  true, 'VFU - targa AA000BB - demolizione completa', 'Test NP+VFU - Veicolo Fuori Uso', get_first_user_id()
);

-- 11. NP + RAEE (carico apparecchiature elettroniche)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  'carico', NOW()::date, '200135', 250.00, 'kg',
  2025, 4, NOW(), 'NP', 'S', 'R3',
  'Apparecchiature elettroniche dismesse', 'Test NP+RAEE - Apparecchiature elettroniche', get_first_user_id()
);

-- 12. aT + Respingimento parziale (carico con respingimento)
INSERT INTO rentri_movimenti (
  org_id, registro_id, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, anno, progressivo,
  data_ora_registrazione, causale_operazione, stato_fisico, destinato_attivita,
  numero_fir, peso_verificato_destino,
  respingimento_tipo, respingimento_quantita, respingimento_unita_misura,
  annotazioni, note, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  'carico', NOW()::date, '170405', 1000.00, 'kg',
  2025, 5, NOW(), 'aT', 'S', 'R4',
  'TEST-FIR-003', 850.00,
  'parziale', 150.00, 'kg',
  'Arrivo parziale - 150kg respinti per non conformità', 'Test aT+Respingimento - Parziale NC', get_first_user_id()
);

-- =====================================================
-- FIR (5)
-- =====================================================

INSERT INTO rentri_formulari (
  org_id, numero_fir, anno, data_creazione, stato, created_by
) VALUES
  (get_first_org_id(), 'TEST-FIR-001', 2025, NOW()::date, 'bozza', get_first_user_id()),
  (get_first_org_id(), 'TEST-FIR-002', 2025, NOW()::date, 'bozza', get_first_user_id()),
  (get_first_org_id(), 'TEST-FIR-003', 2025, NOW()::date, 'bozza', get_first_user_id()),
  (get_first_org_id(), 'TEST-FIR-004', 2025, NOW()::date, 'bozza', get_first_user_id()),
  (get_first_org_id(), 'TEST-FIR-005', 2025, NOW()::date, 'bozza', get_first_user_id());

-- =====================================================
-- REPORT
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
  RAISE NOTICE 'Registri: % | Movimenti: % | FIR: %', registri_count, movimenti_count, fir_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CAUSALI TESTATE (9/9):';
  RAISE NOTICE 'NP, DT, RE, I, TR, aT, T*, T*aT, M';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PRONTO PER TEST AL 100%';
  RAISE NOTICE '========================================';
END $$;

-- Cleanup
DROP FUNCTION IF EXISTS get_first_org_id();
DROP FUNCTION IF EXISTS get_first_user_id();
DROP FUNCTION IF EXISTS get_test_registro_id(text);
