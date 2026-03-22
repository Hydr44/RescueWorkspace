-- ============================================
-- FIX RLS per INSERT certificati RENTRI
-- ============================================

-- Verifica policy esistenti
SELECT 
  schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'rentri_org_certificates';

-- DROP policy esistenti per INSERT
DROP POLICY IF EXISTS "Users can insert certificates for their org" ON rentri_org_certificates;
DROP POLICY IF EXISTS "rentri_org_certificates_insert_policy" ON rentri_org_certificates;

-- Crea policy INSERT corretta
CREATE POLICY "Users can insert certificates for their org"
ON rentri_org_certificates
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- Verifica che funzioni
SELECT 
  auth.uid() as current_user,
  om.org_id,
  om.role
FROM org_members om
WHERE om.user_id = auth.uid();

-- Test INSERT (commentato, decommentare per testare)
-- INSERT INTO rentri_org_certificates (
--   org_id,
--   cf_operatore,
--   ragione_sociale,
--   certificate_pem,
--   private_key_pem,
--   certificate_password,
--   environment,
--   issued_at,
--   expires_at,
--   is_active,
--   is_default
-- ) VALUES (
--   '1ea3be12-a439-46ac-94d9-eaff1bb346c2',
--   'TEST123',
--   'TEST CERT',
--   'test',
--   'test',
--   'test',
--   'demo',
--   NOW(),
--   NOW() + INTERVAL '2 years',
--   true,
--   false
-- );

