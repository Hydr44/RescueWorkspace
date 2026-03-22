-- =====================================================
-- RENTRI TEST DATA - VERSIONE MINIMALISTA
-- =====================================================
-- Usa SOLO le colonne obbligatorie essenziali
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
-- MOVIMENTI (12) - Solo colonne obbligatorie
-- =====================================================

-- 1. NP - Nuova Produzione
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 1, NOW(), 'NP', 'carico', NOW()::date,
  '160104*', 1500.00, 'kg', get_first_user_id()
);

-- 2. DT - Deposito Temporaneo
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 2, NOW(), 'DT', 'carico', NOW()::date,
  '170405*', 2000.00, 'kg', get_first_user_id()
);

-- 3. RE - Recupero
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 1, NOW(), 'RE', 'scarico', NOW()::date,
  '170405*', 1800.00, 'kg', get_first_user_id()
);

-- 4. I - Intermediazione
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-INTERM-2025'),
  2025, 1, NOW(), 'I', 'scarico', NOW()::date,
  '170405*', 1000.00, 'kg', get_first_user_id()
);

-- 5. TR - Trasporto
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-TRASP-2025'),
  2025, 1, NOW(), 'TR', 'scarico', NOW()::date,
  '160104*', 1200.00, 'kg', get_first_user_id()
);

-- 6. aT - Arrivo da Trasporto
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 2, NOW(), 'aT', 'carico', NOW()::date,
  '160104*', 1200.00, 'kg', get_first_user_id()
);

-- 7. T* - Trasporto generico
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-TRASP-2025'),
  2025, 2, NOW(), 'T*', 'scarico', NOW()::date,
  '170405*', 800.00, 'kg', get_first_user_id()
);

-- 8. T*aT - Trasporto con arrivo
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 3, NOW(), 'T*aT', 'carico', NOW()::date,
  '170405*', 800.00, 'kg', get_first_user_id()
);

-- 9. M - Materiali
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 4, NOW(), 'M', 'carico', NOW()::date,
  '170405*', 500.00, 'kg', get_first_user_id()
);

-- 10. NP + VFU (note in annotazioni)
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 3, NOW(), 'NP', 'carico', NOW()::date,
  '160104*', 1800.00, 'kg', 'VFU: Test Veicolo Fuori Uso', get_first_user_id()
);

-- 11. NP + RAEE (note in annotazioni)
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-PROD-2025'),
  2025, 4, NOW(), 'NP', 'carico', NOW()::date,
  '200135*', 250.00, 'kg', 'RAEE: Cat1, Cat4', get_first_user_id()
);

-- 12. aT + Respingimento (note in annotazioni)
INSERT INTO rentri_movimenti (
  org_id, registro_id, anno, progressivo, data_ora_registrazione,
  causale_operazione, tipo_operazione, data_operazione,
  codice_eer, quantita, unita_misura, annotazioni, created_by
) VALUES (
  get_first_org_id(), get_test_registro_id('TEST-CS-RECUP-2025'),
  2025, 5, NOW(), 'aT', 'carico', NOW()::date,
  '170405*', 1000.00, 'kg', 'Respingimento parziale: 200kg NC', get_first_user_id()
);

-- =====================================================
-- FIR (5) - Solo colonne obbligatorie
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
  RAISE NOTICE '✅ PRONTO PER TEST';
  RAISE NOTICE '========================================';
END $$;

-- Cleanup
DROP FUNCTION IF EXISTS get_first_org_id();
DROP FUNCTION IF EXISTS get_first_user_id();
DROP FUNCTION IF EXISTS get_test_registro_id(text);
