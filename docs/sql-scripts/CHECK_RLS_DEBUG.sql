-- Query Diagnostica RLS RENTRI
-- Esegui queste query per capire il problema

-- 1. Verifica il tuo user_id
SELECT auth.uid() as my_user_id;

-- 2. Verifica se sei in org_members
SELECT 
  om.user_id,
  om.org_id,
  om.role,
  o.name as org_name
FROM org_members om
LEFT JOIN orgs o ON o.id = om.org_id
WHERE om.user_id = auth.uid();

-- 3. Verifica le policies su rentri_formulari
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rentri_formulari';

-- 4. Test INSERT diretto (bypassa RLS temporaneamente)
-- NON ESEGUIRE QUESTO se non sei owner del database
-- SET ROLE postgres;
-- INSERT INTO rentri_formulari (org_id, numero_fir, anno, data_creazione, produttore_cf, produttore_nome, trasportatore_nome, trasportatore_targa, destinatario_cf, destinatario_nome)
-- VALUES (...);

-- 5. Verifica RLS abilitato
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'rentri_%';

