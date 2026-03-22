-- Fix per aggiungere constraint UNIQUE su org_id e pulizia dati duplicati
-- ============================================

-- 1. Verifica e rimuovi duplicati, mantenendo il più recente
-- ============================================
WITH ranked_settings AS (
  SELECT 
    id,
    org_id,
    ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY updated_at DESC, created_at DESC) as rn
  FROM public.company_settings
),
duplicates AS (
  SELECT id 
  FROM ranked_settings 
  WHERE rn > 1
)
DELETE FROM public.company_settings 
WHERE id IN (SELECT id FROM duplicates);

-- 2. Aggiungi constraint UNIQUE su org_id
-- ============================================
ALTER TABLE public.company_settings 
ADD CONSTRAINT company_settings_org_id_unique UNIQUE (org_id);

-- 3. Commento per documentazione
-- ============================================
COMMENT ON CONSTRAINT company_settings_org_id_unique ON public.company_settings IS 
  'Garantisce che ogni organizzazione abbia una sola configurazione aziendale';

