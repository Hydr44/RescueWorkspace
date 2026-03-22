-- Fix policy INSERT per spare_parts
-- Il problema è che WITH CHECK è null, quindi non verifica org_id

-- Drop tutte le policy INSERT esistenti
DROP POLICY IF EXISTS "Users can insert spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_org_members_insert" ON public.spare_parts;

-- Crea UNA SOLA policy INSERT corretta con WITH CHECK
CREATE POLICY "Users can insert spare parts for their org"
  ON public.spare_parts
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Verifica
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'spare_parts' AND cmd = 'INSERT'
ORDER BY policyname;
