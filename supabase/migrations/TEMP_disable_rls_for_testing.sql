-- TEMPORANEO: Disabilita RLS per permettere all'app di funzionare
-- Questo è solo per testing - NON usare in produzione!

-- Disabilita RLS su org_members
ALTER TABLE IF EXISTS org_members DISABLE ROW LEVEL SECURITY;

-- Disabilita RLS su orgs  
ALTER TABLE IF EXISTS orgs DISABLE ROW LEVEL SECURITY;

-- Disabilita RLS su profiles (se esiste)
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- Verifica stato RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('org_members', 'orgs', 'profiles')
ORDER BY tablename;
