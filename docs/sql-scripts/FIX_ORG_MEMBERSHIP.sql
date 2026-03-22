-- Step 1: Verifica membership
SELECT 
  om.user_id,
  om.org_id,
  om.role,
  o.name as org_name
FROM org_members om
JOIN orgs o ON o.id = om.org_id
WHERE om.user_id = auth.uid();

-- Se la query sopra restituisce 0 righe, esegui Step 2:

-- Step 2: Aggiungiti come owner della prima org (scozz)
-- DECOMMENTARE E ESEGUIRE SE NECESSARIO:

/*
INSERT INTO org_members (org_id, user_id, role, created_at)
VALUES (
  '6b4a96a6-3808-4fff-a7d2-bdf2764c71c5',  -- org "scozz"
  auth.uid(),
  'owner',
  NOW()
)
ON CONFLICT (org_id, user_id) DO NOTHING;
*/

-- Verifica di nuovo dopo l'insert:
-- SELECT * FROM org_members WHERE user_id = auth.uid();

