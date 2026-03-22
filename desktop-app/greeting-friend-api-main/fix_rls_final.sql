-- ============================================
-- FIX DEFINITIVO RLS spare_parts
-- 
-- PROBLEMA: client.ts creava un secondo Supabase client → sessione OAuth persa.
-- FIX: client.ts ora re-exporta il singleton da supabase-browser.ts.
-- Policy RLS ora usano org_members + profiles.current_org come fallback.
-- ============================================

-- Step 1: Drop TUTTE le vecchie policy su spare_parts
DROP POLICY IF EXISTS "Users can view spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can insert spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can update spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can delete spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_org_members_select" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_org_members_insert" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_org_members_update" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_org_members_delete" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_select" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_insert" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_update" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_delete" ON public.spare_parts;

-- Step 2: Crea policy sicure con org_members + profiles fallback
CREATE POLICY "spare_parts_select"
  ON public.spare_parts FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

CREATE POLICY "spare_parts_insert"
  ON public.spare_parts FOR INSERT WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

CREATE POLICY "spare_parts_update"
  ON public.spare_parts FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

CREATE POLICY "spare_parts_delete"
  ON public.spare_parts FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

-- Step 3: Verifica
SELECT policyname, cmd, permissive, roles
FROM pg_policies
WHERE tablename = 'spare_parts'
ORDER BY policyname;
