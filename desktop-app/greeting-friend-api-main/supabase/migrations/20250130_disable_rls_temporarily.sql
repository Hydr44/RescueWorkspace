-- Migration per disabilitare temporaneamente RLS su company_settings e export_templates
-- ⚠️ ATTENZIONE: Questa è una soluzione temporanea per sviluppo
-- ⚠️ In produzione, riabilita RLS e usa le policy corrette

-- Rimuovi tutte le policy esistenti prima di disabilitare RLS
DROP POLICY IF EXISTS "Users can view company settings for their org" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update company settings for their org" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert company settings for their org" ON public.company_settings;

DROP POLICY IF EXISTS "Users can view export templates for their org" ON public.export_templates;
DROP POLICY IF EXISTS "Users can manage export templates for their org" ON public.export_templates;

DROP POLICY IF EXISTS "Users can view export configurations for their org" ON public.export_configurations;
DROP POLICY IF EXISTS "Users can manage export configurations for their org" ON public.export_configurations;

DROP POLICY IF EXISTS "Users can view export history for their org" ON public.export_history;
DROP POLICY IF EXISTS "Users can insert export history for their org" ON public.export_history;

-- Disabilita RLS su company_settings
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;

-- Disabilita RLS su export_templates
ALTER TABLE public.export_templates DISABLE ROW LEVEL SECURITY;

-- Disabilita RLS su export_configurations
ALTER TABLE public.export_configurations DISABLE ROW LEVEL SECURITY;

-- Disabilita RLS su export_history
ALTER TABLE public.export_history DISABLE ROW LEVEL SECURITY;

-- Commenti per ricordare di riabilitare RLS
COMMENT ON TABLE public.company_settings IS 
  '⚠️ RLS DISABILITATO - Riabilita con migration 20250130_fix_company_settings_rls.sql';
COMMENT ON TABLE public.export_templates IS 
  '⚠️ RLS DISABILITATO - Riabilita RLS prima di produzione';
