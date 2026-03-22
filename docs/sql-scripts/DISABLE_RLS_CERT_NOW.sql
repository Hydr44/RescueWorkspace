-- ============================================
-- DISATTIVA RLS per rentri_org_certificates
-- Soluzione temporanea per sbloccare upload
-- ============================================

-- Disattiva RLS sulla tabella
ALTER TABLE rentri_org_certificates DISABLE ROW LEVEL SECURITY;

-- Verifica che sia disattivato
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'rentri_org_certificates';

-- Dovrebbe mostrare: rls_enabled = false

