-- ============================================================================
-- SUBSCRIPTION SYSTEM - Aggiornamenti per piani v2.4.1
-- RescueManager - 16/02/2026
--
-- Tabelle GIÀ ESISTENTI: org_subscriptions, org_modules, plan_activation_links
-- Da creare: plans (lookup piani)
-- Da aggiornare: org_modules CHECK (aggiungere 'contabilita')
-- ============================================================================

-- ─── 1. Crea tabella plans (lookup piani) ───
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  label text NOT NULL,
  monthly_price integer NOT NULL, -- centesimi EUR
  yearly_price integer NOT NULL,  -- centesimi EUR
  max_modules integer NOT NULL DEFAULT 1,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

-- Inserisci piani (upsert)
INSERT INTO public.plans (id, label, monthly_price, yearly_price, max_modules, description, sort_order) VALUES
  ('starter',      'Starter',      17900, 180000, 1, 'Base completo + 1 modulo a scelta',     1),
  ('professional', 'Professional', 27900, 280000, 2, 'Base completo + 2 moduli a scelta',     2),
  ('business',     'Business',     35900, 360000, 3, 'Base completo + 3 moduli a scelta',     3),
  ('full',         'Full',         44900, 450000, 4, 'Base completo + tutti i moduli inclusi', 4)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  max_modules = EXCLUDED.max_modules,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- RLS per plans (read-only per tutti)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plans' AND policyname='plans_select_all') THEN
    CREATE POLICY plans_select_all ON public.plans FOR SELECT USING (true);
  END IF;
END $$;

-- ─── 2. Aggiorna CHECK su org_modules per aggiungere 'contabilita' ───
-- Rimuovi vecchio CHECK e ricrea con contabilita incluso
ALTER TABLE public.org_modules DROP CONSTRAINT IF EXISTS org_modules_module_check;
ALTER TABLE public.org_modules ADD CONSTRAINT org_modules_module_check
  CHECK (module = ANY (ARRAY['base'::text, 'rvfu'::text, 'sdi'::text, 'rentri'::text, 'contabilita'::text]));

-- ─── 3. Aggiungi colonna created_at a org_subscriptions se mancante ───
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='org_subscriptions' AND column_name='created_at') THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ─── 4. RLS per org_subscriptions (se non già presente) ───
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='org_subscriptions' AND policyname='org_subscriptions_select_member') THEN
    CREATE POLICY org_subscriptions_select_member ON public.org_subscriptions FOR SELECT USING (
      org_id IN (SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid())
    );
  END IF;
END $$;
