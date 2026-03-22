-- Query 1: Chi sei tu?
SELECT auth.uid() as my_user_id, auth.email() as my_email;

-- Query 2: Sei in org_members?
SELECT 
  om.user_id,
  om.org_id,
  om.role,
  o.name as org_name,
  o.id as org_uuid
FROM org_members om
LEFT JOIN orgs o ON o.id = om.org_id
WHERE om.user_id = auth.uid();

-- Query 3: Quante org esistono?
SELECT id, name, created_at FROM orgs ORDER BY created_at DESC LIMIT 5;

-- Query 4: Qual è l'orgId che l'app sta usando?
-- (Controlla localStorage nel browser: "rm:current_org")

