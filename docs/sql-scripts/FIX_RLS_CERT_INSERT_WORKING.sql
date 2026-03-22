-- ============================================
-- FIX DEFINITIVO: Policy INSERT per certificati
-- VERSIONE CORRETTA
-- ============================================

-- 1. DROP policy esistente (ha qual: null)
DROP POLICY IF EXISTS "Admins can insert certificates" ON rentri_org_certificates;

-- 2. Ricrea con WITH CHECK corretto
CREATE POLICY "Admins can insert certificates"
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

-- 3. Verifica policy ricreata
SELECT 
  policyname, 
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'rentri_org_certificates' AND cmd = 'INSERT';

