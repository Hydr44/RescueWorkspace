-- Fix RLS policies per spare_parts
-- Esegui questo script nel SQL Editor di Supabase Dashboard

-- 1. Drop vecchie policy
DROP POLICY IF EXISTS "Users can view spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can insert spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can update spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can delete spare parts for their org" ON public.spare_parts;

-- 2. Crea policy corrette
CREATE POLICY "Users can view spare parts for their org"
  ON public.spare_parts
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert spare parts for their org"
  ON public.spare_parts
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update spare parts for their org"
  ON public.spare_parts
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete spare parts for their org"
  ON public.spare_parts
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Verifica che RLS sia attivo
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- 4. Verifica le policy create
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'spare_parts' 
ORDER BY policyname;
