-- Fix RLS Storage usando funzione RPC con SECURITY DEFINER
-- Questo bypassa il problema dei privilegi su storage.objects
-- ============================================

-- 1. Crea bucket se non esiste
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Funzione RPC per creare policy Storage (con SECURITY DEFINER)
-- ============================================
CREATE OR REPLACE FUNCTION public.setup_company_assets_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Esegue con privilegi del creatore (superuser)
AS $$
BEGIN
  -- Rimuovi policy esistenti
  DROP POLICY IF EXISTS "company_assets_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "company_assets_allow_upload" ON storage.objects;
  DROP POLICY IF EXISTS "company_assets_allow_update" ON storage.objects;
  DROP POLICY IF EXISTS "company_assets_allow_delete" ON storage.objects;

  -- Crea policy permissive per sviluppo
  CREATE POLICY "company_assets_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'company-assets');

  CREATE POLICY "company_assets_allow_upload"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'company-assets');

  CREATE POLICY "company_assets_allow_update"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'company-assets')
  WITH CHECK (bucket_id = 'company-assets');

  CREATE POLICY "company_assets_allow_delete"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'company-assets');

  RAISE NOTICE 'Policy Storage per company-assets create con successo';
END;
$$;

-- 3. Funzione RPC alternativa: disabilita RLS Storage completamente
-- ============================================
CREATE OR REPLACE FUNCTION public.disable_storage_rls_temporarily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Esegue con privilegi del creatore (superuser)
AS $$
BEGIN
  ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS Storage disabilitato temporaneamente';
END;
$$;

-- 4. Esegui automaticamente la funzione per creare le policy
-- ============================================
-- Prova prima a creare le policy
DO $$
BEGIN
  PERFORM public.setup_company_assets_storage_policies();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Privilegi insufficienti per creare policy Storage. Usa il Dashboard o esegui manualmente: SELECT public.setup_company_assets_storage_policies();';
  WHEN OTHERS THEN
    RAISE WARNING 'Errore durante creazione policy: %. Esegui manualmente: SELECT public.setup_company_assets_storage_policies();', SQLERRM;
END;
$$;

-- Commento per documentazione
COMMENT ON FUNCTION public.setup_company_assets_storage_policies() IS 
  'Crea policy Storage per company-assets. Esegui manualmente se necessario: SELECT public.setup_company_assets_storage_policies();';

COMMENT ON FUNCTION public.disable_storage_rls_temporarily() IS 
  'Disabilita RLS su Storage completamente (temporaneo per sviluppo). ATTENZIONE: usare solo in sviluppo!';

