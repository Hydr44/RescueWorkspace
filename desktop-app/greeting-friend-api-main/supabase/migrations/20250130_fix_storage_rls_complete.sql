-- Fix completo RLS Storage per company-assets
-- RISOLVE: "new row violates row-level security policy"
-- ============================================
-- NOTA: Le policy Storage devono essere create MANUALMENTE dal Dashboard
-- perché richiedono privilegi di superuser su storage.objects
-- 
-- ISTRUZIONI COMPLETE IN: STORAGE_BUCKET_SETUP_COMPLETE.md

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

-- 2. DOPO L'ESECUZIONE: vai su Dashboard → Storage → company-assets → Policies
-- e crea manualmente le policy (vedi STORAGE_BUCKET_SETUP_COMPLETE.md)

