-- Migration per correggere le policy RLS di company_settings
-- Permette l'accesso agli owner della org anche se non sono in org_members

-- Rimuovi le policy esistenti
DROP POLICY IF EXISTS "Users can view company settings for their org" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update company settings for their org" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert company settings for their org" ON public.company_settings;

-- Policy più permissive: permette accesso se:
-- 1. L'utente è membro della org in org_members, OPPURE
-- 2. L'utente è il creatore della org (created_by)
CREATE POLICY "Users can view company settings for their org" ON public.company_settings
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
    OR 
    org_id IN (
      SELECT id FROM public.orgs 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update company settings for their org" ON public.company_settings
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
    OR 
    org_id IN (
      SELECT id FROM public.orgs 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert company settings for their org" ON public.company_settings
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
    OR 
    org_id IN (
      SELECT id FROM public.orgs 
      WHERE created_by = auth.uid()
    )
  );

-- Commenti
COMMENT ON POLICY "Users can view company settings for their org" ON public.company_settings IS 
  'Allows users to view company settings if they are org members or org owners';
COMMENT ON POLICY "Users can update company settings for their org" ON public.company_settings IS 
  'Allows users to update company settings if they are org members or org owners';
COMMENT ON POLICY "Users can insert company settings for their org" ON public.company_settings IS 
  'Allows users to insert company settings if they are org members or org owners';
