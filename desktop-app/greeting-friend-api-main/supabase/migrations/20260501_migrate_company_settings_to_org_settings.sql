-- Migration: 2026-05-01 — Unifica dati anagrafica in org_settings.key='company'
--
-- Contesto:
--  Da Maggio 2026 la fonte autoritativa dell'anagrafica organizzazione è
--  `org_settings` (key='company', value JSONB). La tabella `company_settings`
--  (separate columns) viene deprecata: vedi migration parallela
--  20260501_deprecate_legacy_company_export_tables.sql
--
--  Questa migration copia i dati esistenti da `company_settings` a
--  `org_settings.company` per ogni org che NON ha ancora un record valido
--  in org_settings, oppure ha solo dati parziali. È idempotente: rieseguibile
--  più volte senza effetti collaterali.
--
-- Schema target (JSONB):
--  {
--    company_name, vat, piva (alias), tax_code,
--    phone, email, iban,
--    address: { street, civico, city, zip, province, country }
--  }
--
-- Strategia merge:
--  - Se esiste già `org_settings.company` per quell'org_id, fa MERGE conservando
--    i campi già presenti (priorità ai valori più recenti dell'utente).
--  - Se non esiste, crea il record da zero.
--  - Regime fiscale + PEC vanno su org_settings.key='sdi' (gestiti separatamente).

BEGIN;

-- 1. Anagrafica + indirizzo + IBAN → org_settings.key='company'
INSERT INTO public.org_settings (org_id, key, value, updated_at)
SELECT
  cs.org_id,
  'company',
  jsonb_strip_nulls(jsonb_build_object(
    'company_name', NULLIF(TRIM(cs.company_name), ''),
    'vat',          NULLIF(TRIM(cs.vat_number), ''),
    'piva',         NULLIF(TRIM(cs.vat_number), ''),  -- alias retrocompat
    'tax_code',     NULLIF(TRIM(COALESCE(cs.tax_code, cs.codice_fiscale)), ''),
    'phone',        NULLIF(TRIM(cs.phone), ''),
    'email',        NULLIF(TRIM(cs.email), ''),
    'iban',         NULLIF(TRIM(cs.iban), ''),
    'address', jsonb_strip_nulls(jsonb_build_object(
      'street',   NULLIF(TRIM(cs.address_street), ''),
      'civico',   NULLIF(TRIM(cs.address_number), ''),
      'city',     NULLIF(TRIM(cs.address_city), ''),
      'zip',      NULLIF(TRIM(cs.address_postal_code), ''),
      'province', NULLIF(TRIM(cs.address_province), ''),
      'country',  COALESCE(NULLIF(TRIM(cs.address_country), ''), 'IT')
    ))
  )),
  NOW()
FROM public.company_settings cs
WHERE EXISTS (SELECT 1 FROM public.orgs o WHERE o.id = cs.org_id)
ON CONFLICT (org_id, key) DO UPDATE
  -- MERGE: priorità ai dati già presenti in org_settings (più recenti),
  -- riempie solo i campi mancanti dalla legacy.
  SET value = EXCLUDED.value || public.org_settings.value,
      updated_at = NOW();

-- 2. Regime fiscale + PEC → org_settings.key='sdi'
INSERT INTO public.org_settings (org_id, key, value, updated_at)
SELECT
  cs.org_id,
  'sdi',
  jsonb_strip_nulls(jsonb_build_object(
    'regime_fiscale', NULLIF(TRIM(cs.legal_form), ''),  -- legacy: legal_form era usato come regime
    'pec',            NULLIF(TRIM(cs.pec), '')
  )),
  NOW()
FROM public.company_settings cs
WHERE EXISTS (SELECT 1 FROM public.orgs o WHERE o.id = cs.org_id)
  AND (cs.pec IS NOT NULL OR cs.legal_form IS NOT NULL)
ON CONFLICT (org_id, key) DO UPDATE
  SET value = EXCLUDED.value || public.org_settings.value,
      updated_at = NOW();

-- 3. Sincronizza orgs.name col company_name (per coerenza sidebar/UI)
UPDATE public.orgs o
SET name = sub.company_name
FROM (
  SELECT
    cs.org_id,
    COALESCE(NULLIF(TRIM(cs.company_name), ''), o2.name) AS company_name
  FROM public.company_settings cs
  JOIN public.orgs o2 ON o2.id = cs.org_id
  WHERE cs.company_name IS NOT NULL AND TRIM(cs.company_name) <> ''
) sub
WHERE o.id = sub.org_id
  AND (o.name IS NULL OR TRIM(o.name) = '' OR o.name LIKE 'Org %' OR o.name = sub.company_name);
  -- Aggiorna solo se: vuoto, placeholder generico, o uguale (no-op)

-- Report finale
DO $$
DECLARE
  cnt_company INTEGER;
  cnt_sdi INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt_company FROM public.org_settings WHERE key = 'company';
  SELECT COUNT(*) INTO cnt_sdi FROM public.org_settings WHERE key = 'sdi';
  RAISE NOTICE '=== Migration completata ===';
  RAISE NOTICE 'org_settings.key=company  →  % records', cnt_company;
  RAISE NOTICE 'org_settings.key=sdi      →  % records', cnt_sdi;
END $$;

COMMIT;

-- ROLLBACK (se necessario, prima del DROP della tabella legacy):
--   DELETE FROM org_settings WHERE key = 'company' AND ...
--   ATTENZIONE: cancella TUTTI i dati anagrafica. Preferire restore da backup.
