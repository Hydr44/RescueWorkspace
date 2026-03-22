-- Seed Data per Supabase Staging Environment
-- RescueManager - Test Data
-- Esegui dopo aver importato lo schema production

-- ============================================
-- ORGANIZZAZIONI DI TEST
-- ============================================

INSERT INTO orgs (id, name, email, vat_number, subscription_tier, subscription_status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Autodemolizioni Test SRL', 'test1@rescuemanager.test', '12345678901', 'professional', 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Soccorso Stradale Test', 'test2@rescuemanager.test', '10987654321', 'enterprise', 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Demo Free Account', 'free@rescuemanager.test', '11111111111', 'free', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- UTENTI DI TEST
-- ============================================
-- Nota: Gli utenti devono essere creati via Supabase Auth
-- Questi record sono solo per riferimento nella tabella users (se esiste)
-- Password per tutti: TestPassword123!

-- Utenti per Org 1
-- admin@test1.rescuemanager.test / TestPassword123!
-- user@test1.rescuemanager.test / TestPassword123!

-- Utenti per Org 2
-- admin@test2.rescuemanager.test / TestPassword123!

-- Utenti per Org 3
-- free@rescuemanager.test / TestPassword123!

-- ============================================
-- TRASPORTI DI TEST
-- ============================================

INSERT INTO transports (id, org_id, vehicle_plate, vehicle_brand, vehicle_model, status, pickup_address, delivery_address, price, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'AA000AA', 'Fiat', 'Panda', 'completed', 'Via Roma 1, Milano', 'Via Verdi 10, Roma', 150.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'BB111BB', 'Volkswagen', 'Golf', 'in_progress', 'Via Dante 5, Torino', 'Via Manzoni 20, Napoli', 200.00, NOW() - INTERVAL '1 day', NOW()),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'CC222CC', 'BMW', 'Serie 3', 'pending', 'Via Garibaldi 15, Bologna', 'Via Cavour 8, Firenze', 180.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000002', 'DD333DD', 'Mercedes', 'Classe A', 'completed', 'Via Mazzini 3, Genova', 'Via Colombo 12, Venezia', 220.00, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000002', 'EE444EE', 'Audi', 'A4', 'cancelled', 'Via Leopardi 7, Palermo', 'Via Pascoli 5, Bari', 250.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LEAD DI TEST
-- ============================================

INSERT INTO leads (id, org_id, name, email, phone, vehicle_plate, status, source, notes, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'Mario Rossi', 'mario.rossi@example.com', '+39 333 1234567', 'FF555FF', 'new', 'website', 'Richiesta preventivo per demolizione', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', 'Luigi Verdi', 'luigi.verdi@example.com', '+39 333 7654321', 'GG666GG', 'contacted', 'phone', 'Interessato a soccorso stradale', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', 'Anna Bianchi', 'anna.bianchi@example.com', '+39 333 9876543', 'HH777HH', 'converted', 'referral', 'Cliente convertito, trasporto completato', NOW() - INTERVAL '1 week', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000002', 'Paolo Neri', 'paolo.neri@example.com', '+39 333 1112233', 'II888II', 'qualified', 'google', 'Lead qualificato, in attesa preventivo', NOW() - INTERVAL '1 day', NOW()),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000002', 'Sara Gialli', 'sara.gialli@example.com', '+39 333 4445566', 'JJ999JJ', 'lost', 'facebook', 'Lead perso, prezzo troppo alto', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VEICOLI DI TEST (se tabella vehicles esiste)
-- ============================================

-- INSERT INTO vehicles (id, org_id, plate, brand, model, year, vin, status, created_at) VALUES
--   ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001', 'KK000KK', 'Fiat', '500', 2018, 'ZFA31200000123456', 'active', NOW()),
--   ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000001', 'LL111LL', 'Renault', 'Clio', 2019, 'VF1RJ000000654321', 'active', NOW()),
--   ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000002', 'MM222MM', 'Ford', 'Fiesta', 2020, 'WF0XXXGAJXKP12345', 'active', NOW())
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FATTURE DI TEST (se tabella invoices esiste)
-- ============================================

-- INSERT INTO invoices (id, org_id, invoice_number, invoice_date, customer_name, customer_vat, total_amount, status, created_at) VALUES
--   ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000001', '2026/001', '2026-01-15', 'Cliente Test 1', '12345678901', 150.00, 'paid', NOW() - INTERVAL '1 month'),
--   ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000001', '2026/002', '2026-02-10', 'Cliente Test 2', '10987654321', 200.00, 'sent', NOW() - INTERVAL '2 weeks'),
--   ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000001', '2026/003', '2026-03-01', 'Cliente Test 3', '11111111111', 180.00, 'draft', NOW() - INTERVAL '1 week')
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- IMPOSTAZIONI ORG DI TEST
-- ============================================

-- INSERT INTO org_settings (org_id, setting_key, setting_value, created_at) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'invoice_prefix', 'TEST', NOW()),
--   ('00000000-0000-0000-0000-000000000001', 'invoice_counter', '3', NOW()),
--   ('00000000-0000-0000-0000-000000000001', 'email_notifications', 'true', NOW()),
--   ('00000000-0000-0000-0000-000000000002', 'invoice_prefix', 'DEMO', NOW()),
--   ('00000000-0000-0000-0000-000000000002', 'invoice_counter', '1', NOW())
-- ON CONFLICT (org_id, setting_key) DO NOTHING;

-- ============================================
-- CLEANUP VECCHI DATI TEST (opzionale)
-- ============================================

-- Rimuovi dati test più vecchi di 30 giorni
-- DELETE FROM transports WHERE org_id IN (
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000002',
--   '00000000-0000-0000-0000-000000000003'
-- ) AND created_at < NOW() - INTERVAL '30 days';

-- ============================================
-- VERIFICA DATI INSERITI
-- ============================================

-- Conta record per tabella
SELECT 'orgs' as table_name, COUNT(*) as count FROM orgs WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
UNION ALL
SELECT 'transports', COUNT(*) FROM transports WHERE org_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
UNION ALL
SELECT 'leads', COUNT(*) FROM leads WHERE org_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

-- ============================================
-- NOTE IMPORTANTI
-- ============================================

-- 1. UTENTI AUTH: Crea manualmente via Supabase Dashboard o API:
--    - admin@test1.rescuemanager.test
--    - user@test1.rescuemanager.test
--    - admin@test2.rescuemanager.test
--    - free@rescuemanager.test
--    Password: TestPassword123!

-- 2. STORAGE: Se usi storage buckets, carica file test manualmente

-- 3. CLEANUP: Esegui cleanup periodico per evitare accumulo dati test

-- 4. PRODUCTION: MAI eseguire questo script su production!

-- ============================================
-- SEED DATA COMPLETATO
-- ============================================

SELECT 'Seed data staging completato!' as status;
