-- Crea bucket storage per asset aziendali (logo, immagini branding)
-- ============================================
-- NOTA: Le policy Storage devono essere create manualmente dal Dashboard
-- o tramite API, poiché richiedono privilegi di superuser su storage.objects

-- Crea bucket company-assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true, -- Pubblico per permettere visualizzazione logo
  10485760, -- 10MB (logo possono essere più grandi)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- DOPO L'ESECUZIONE DI QUESTA MIGRATION:
-- 1. Vai su Supabase Dashboard → Storage
-- 2. Verifica che il bucket "company-assets" sia stato creato
-- 3. Configura le policy manualmente se necessario, oppure:
--    - Se RLS Storage è disabilitato, funzionerà senza policy aggiuntive
--    - Se RLS Storage è abilitato, aggiungi policy per:
--      * SELECT (lettura pubblica)
--      * INSERT (upload per membri org)
--      * DELETE (eliminazione per membri org)

