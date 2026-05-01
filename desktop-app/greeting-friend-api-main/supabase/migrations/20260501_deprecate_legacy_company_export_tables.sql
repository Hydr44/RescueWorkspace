-- Migration: 2026-05-01 — Deprecazione tabelle legacy
--
-- Contesto:
--  L'app non usa più queste tabelle per l'anagrafica/branding:
--   - company_settings        → sostituita da org_settings (key='company')
--   - export_templates        → UI rimossa (era nel tab "Templates" di Settings)
--   - export_configurations   → dipendente da export_templates
--   - export_history          → log non più letto
--   - default_export_templates→ template di default mai inseriti
--
-- Strategia SAFE:
--  1. RENAME in `_deprecated_*` invece di DROP. Permette rollback immediato e
--     mantiene i dati storici per audit/recupero.
--  2. Una migration successiva (~30gg di test) farà il DROP definitivo:
--     20260601_drop_deprecated_company_export_tables.sql (da creare).
--
-- ROLLBACK: rinomina al contrario:
--   ALTER TABLE _deprecated_company_settings RENAME TO company_settings;
--   ... etc.

BEGIN;

-- 1. company_settings (anagrafica + branding)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='company_settings') THEN
    ALTER TABLE public.company_settings RENAME TO _deprecated_company_settings;
    RAISE NOTICE 'Renamed: company_settings → _deprecated_company_settings';
  ELSE
    RAISE NOTICE 'Skip: company_settings already absent';
  END IF;
END $$;

-- 2. export_history (dipende da export_configurations via FK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='export_history') THEN
    ALTER TABLE public.export_history RENAME TO _deprecated_export_history;
    RAISE NOTICE 'Renamed: export_history → _deprecated_export_history';
  ELSE
    RAISE NOTICE 'Skip: export_history already absent';
  END IF;
END $$;

-- 3. export_configurations (dipende da export_templates via FK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='export_configurations') THEN
    ALTER TABLE public.export_configurations RENAME TO _deprecated_export_configurations;
    RAISE NOTICE 'Renamed: export_configurations → _deprecated_export_configurations';
  ELSE
    RAISE NOTICE 'Skip: export_configurations already absent';
  END IF;
END $$;

-- 4. export_templates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='export_templates') THEN
    ALTER TABLE public.export_templates RENAME TO _deprecated_export_templates;
    RAISE NOTICE 'Renamed: export_templates → _deprecated_export_templates';
  ELSE
    RAISE NOTICE 'Skip: export_templates already absent';
  END IF;
END $$;

-- 5. default_export_templates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='default_export_templates') THEN
    ALTER TABLE public.default_export_templates RENAME TO _deprecated_default_export_templates;
    RAISE NOTICE 'Renamed: default_export_templates → _deprecated_default_export_templates';
  ELSE
    RAISE NOTICE 'Skip: default_export_templates already absent';
  END IF;
END $$;

COMMIT;
