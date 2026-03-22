-- ============================================================================
-- Migrazione: Admin Panel Foundation
-- Data: 2026-02-12
-- Descrizione: Aggiunge tabelle e colonne necessarie per il nuovo admin panel
--              e il sistema di abbonamenti modulare (Base + Add-on).
--              Lo staff ha auth SEPARATA da Supabase Auth (tabella staff propria).
-- ============================================================================

-- ============================================================================
-- 1. profiles.status — Gestione stato utente app (attualmente hardcoded)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN status text NOT NULL DEFAULT 'active' 
      CHECK (status IN ('active', 'suspended', 'inactive'));
  END IF;
END $$;

-- ============================================================================
-- 2. staff — Tabella staff SEPARATA da auth.users
--    Lo staff admin NON usa Supabase Auth. Ha il proprio sistema di login.
--    Password hashata con bcrypt, JWT custom generato dall'API.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,             -- bcrypt hash
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'marketing', 'sales', 'support', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  last_login_ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);

-- ============================================================================
-- 3. staff_sessions — Sessioni JWT staff
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  token_hash text NOT NULL,                -- SHA-256 del JWT (per revoca)
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_sessions_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON public.staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token_hash ON public.staff_sessions(token_hash);

-- ============================================================================
-- 4. staff_audit_log — Log azioni staff nell'admin panel
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  staff_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_label text,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_audit_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_staff_audit_log_staff_id ON public.staff_audit_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_log_action ON public.staff_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_staff_audit_log_target ON public.staff_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_log_created_at ON public.staff_audit_log(created_at DESC);

-- ============================================================================
-- 5. system_settings — Impostazioni globali piattaforma (feature flags, config)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.staff(id),
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);

INSERT INTO public.system_settings (key, value, description) VALUES
  ('maintenance_enabled', 'false', 'Abilita modalità manutenzione'),
  ('registration_enabled', '"true"', 'Abilita registrazione nuovi utenti'),
  ('trial_days', '14', 'Giorni di prova gratuita'),
  ('default_plan', '"base"', 'Piano di default per nuovi utenti'),
  ('feature_flags', '{"rvfu": true, "sdi": true, "rentri": true, "spare_parts": true, "yard": true}', 'Feature flags globali')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 6. org_modules — Moduli attivi per organizzazione (Base + Add-on)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.org_modules (
  org_id uuid NOT NULL,
  module text NOT NULL CHECK (module IN ('base', 'rvfu', 'sdi', 'rentri')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
  activated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  stripe_item_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT org_modules_pkey PRIMARY KEY (org_id, module),
  CONSTRAINT org_modules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_org_modules_org_id ON public.org_modules(org_id);
CREATE INDEX IF NOT EXISTS idx_org_modules_status ON public.org_modules(status);

-- ============================================================================
-- 7. Aggiornamento org_subscriptions — Supporto abbonamenti personalizzati
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'is_custom'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN is_custom boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'custom_notes'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN custom_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'custom_price'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN custom_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'billing_type'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN billing_type text DEFAULT 'stripe' 
      CHECK (billing_type IN ('stripe', 'manual', 'free', 'trial'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN stripe_subscription_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'modules'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN modules text[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================================================
-- 8. notifications_log — Storico notifiche broadcast
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('broadcast', 'org', 'user', 'system')),
  title text NOT NULL,
  body text,
  target_type text NOT NULL CHECK (target_type IN ('all', 'org', 'user', 'staff', 'plan')),
  target_id text,
  channel text DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'push', 'sms')),
  status text DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  metadata jsonb DEFAULT '{}',
  sent_at timestamptz,
  sent_by uuid REFERENCES public.staff(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notifications_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_log_type ON public.notifications_log(type);
CREATE INDEX IF NOT EXISTS idx_notifications_log_created_at ON public.notifications_log(created_at DESC);

-- ============================================================================
-- 9. RLS Policies
--    NOTA: Le tabelle staff/staff_sessions/staff_audit_log NON usano RLS
--    perché lo staff non passa per Supabase Auth. L'accesso è controllato
--    dall'API del website che verifica il JWT staff.
--    Solo org_modules e notifications_log hanno RLS per gli utenti app.
-- ============================================================================

-- Disabilita RLS sulle tabelle staff (accesso solo via service_role dal backend)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Service role bypassa RLS automaticamente, quindi le API backend funzionano.
-- Per sicurezza, nessuna policy = nessun accesso da client anon/authenticated.

-- org_modules: org members possono leggere i propri moduli
ALTER TABLE public.org_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can read own modules" ON public.org_modules;
CREATE POLICY "Org members can read own modules" ON public.org_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_members.org_id = org_modules.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. Helper function: check se org ha un modulo attivo
-- ============================================================================
CREATE OR REPLACE FUNCTION public.org_has_module(p_org_id uuid, p_module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_modules
    WHERE org_id = p_org_id
    AND module = p_module
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- ============================================================================
-- 11. Seed: primo utente staff (super_admin)
--     Password: 3490791892Cc
--     Hash generato con bcrypt (cost 10)
--     NOTA: L'hash verrà inserito dall'API al primo avvio. Qui usiamo un
--     placeholder che verrà sovrascritto dal seed script.
-- ============================================================================
-- Il seed effettivo avviene via API (POST /api/staff/auth/seed) perché
-- PostgreSQL non ha bcrypt nativo. Vedi il seed script nel website.
