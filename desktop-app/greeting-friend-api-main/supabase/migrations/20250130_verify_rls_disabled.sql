-- Script di verifica per controllare se RLS è disabilitato
-- Esegui questo per verificare lo stato attuale

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'company_settings',
  'export_templates', 
  'export_configurations',
  'export_history'
)
ORDER BY tablename;

-- Se rowsecurity è TRUE, RLS è ancora abilitato
-- Se rowsecurity è FALSE, RLS è disabilitato ✅

-- Verifica anche le policy residue (dovrebbero essere 0)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'company_settings',
  'export_templates',
  'export_configurations', 
  'export_history'
)
ORDER BY tablename, policyname;

-- Se ci sono ancora policy, rimuovile con:
-- DROP POLICY IF EXISTS "policy_name" ON public.table_name;

