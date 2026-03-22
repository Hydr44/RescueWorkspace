-- ============================================
-- FIX DEFINITIVO: Policy INSERT per certificati
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
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rentri_org_certificates' AND cmd = 'INSERT';

-- 4. Test che l'utente sia nella org giusta
SELECT 
  'User ID:' as label, auth.uid() as value
UNION ALL
SELECT 
  'Orgs accessibili:', 
  STRING_AGG(org_id::text, ', ')
FROM org_members 
WHERE user_id = auth.uid()
UNION ALL
SELECT
  'Target org_id:',
  '1ea3be12-a439-46ac-94d9-eaff1bb346c2'
UNION ALL
SELECT
  'Utente in org?',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM org_members 
      WHERE user_id = auth.uid() 
      AND org_id = '1ea3be12-a439-46ac-94d9-eaff1bb346c2'
    ) THEN 'SI ✅'
    ELSE 'NO ❌'
  END;

