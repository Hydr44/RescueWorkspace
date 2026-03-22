-- ============================================
-- CHECK COMPLETO RLS spare_parts
-- Esegui TUTTO in SQL Editor di Supabase
-- ============================================

-- 1. Utente corrente
SELECT '1. UTENTE CORRENTE' as check,
  auth.uid() as user_id,
  auth.email() as email;

-- 2. Membership in org_members
SELECT '2. ORG_MEMBERS' as check,
  om.user_id,
  om.org_id,
  om.role
FROM public.org_members om
WHERE om.user_id = auth.uid();

-- 3. Profile dell'utente
SELECT '3. PROFILES' as check,
  p.id,
  p.org_id,
  p.email
FROM public.profiles p
WHERE p.id = auth.uid();

-- 4. Tutte le org esistenti
SELECT '4. ORGS' as check,
  id as org_id,
  name
FROM public.orgs
LIMIT 10;

-- 5. Tutti i membri di org_members (per capire la struttura)
SELECT '5. TUTTI ORG_MEMBERS' as check,
  om.user_id,
  om.org_id,
  om.role
FROM public.org_members om
LIMIT 20;

-- 6. Verifica colonna has_images (GENERATED ALWAYS AS)
-- Potrebbe bloccare l'INSERT se la colonna computed ha problemi
SELECT '6. COLONNE SPARE_PARTS' as check,
  column_name,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'spare_parts'
  AND (is_generated = 'ALWAYS' OR column_default LIKE '%CASE%')
ORDER BY ordinal_position;

-- 7. Tutte le policy su spare_parts
SELECT '7. POLICY RLS' as check,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'spare_parts'
ORDER BY cmd, policyname;

-- 8. RLS è attivato?
SELECT '8. RLS STATUS' as check,
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'spare_parts';

-- 9. Trigger su spare_parts (potrebbe bloccare INSERT)
SELECT '9. TRIGGERS' as check,
  tgname,
  tgtype,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.spare_parts'::regclass
AND NOT tgisinternal;

-- 10. Test diretto: prova INSERT con org_id dell'utente
-- (non esegue, solo verifica se l'org_id è valido)
SELECT '10. ORG_ID PER INSERT' as check,
  COALESCE(
    (SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid() LIMIT 1),
    (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
  ) as org_id_da_usare;
