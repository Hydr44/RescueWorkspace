-- ============================================================================
-- Migrazione: Settings Enhancement — org_invites + audit log org_id
-- Data: 2026-02-14
-- Descrizione: Aggiunge tabella org_invites per inviti team e colonna org_id
--              su staff_audit_log per filtrare log per organizzazione.
-- ============================================================================

-- ============================================================================
-- 1. org_invites — Inviti pendenti per nuovi membri organizzazione
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_invites_pkey PRIMARY KEY (id),
  CONSTRAINT org_invites_unique_pending UNIQUE (org_id, email, status)
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON public.org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.org_invites(email);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON public.org_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_status ON public.org_invites(status);

-- RLS
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- Org admins possono gestire inviti
DROP POLICY IF EXISTS "Org admins can manage invites" ON public.org_invites;
CREATE POLICY "Org admins can manage invites" ON public.org_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = org_invites.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Org members possono leggere inviti della propria org
DROP POLICY IF EXISTS "Org members can read invites" ON public.org_invites;
CREATE POLICY "Org members can read invites" ON public.org_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = org_invites.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. staff_audit_log.org_id — Per filtrare log per organizzazione
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_audit_log' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.staff_audit_log ADD COLUMN org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_staff_audit_log_org_id ON public.staff_audit_log(org_id);
  END IF;
END $$;

-- ============================================================================
-- 3. Aggiungere colonne mancanti a org_subscriptions per BillingSettings
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'stripe_portal_url'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN stripe_portal_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions' AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN trial_end timestamptz;
  END IF;
END $$;

-- ============================================================================
-- 4. Funzione helper: accetta invito e aggiunge membro
-- ============================================================================
CREATE OR REPLACE FUNCTION public.accept_org_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite record;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Non autenticato');
  END IF;

  -- Trova invito valido
  SELECT * INTO v_invite
  FROM public.org_invites
  WHERE token = p_token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now());

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'Invito non valido o scaduto');
  END IF;

  -- Controlla se già membro
  IF EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = v_invite.org_id AND user_id = v_user_id
  ) THEN
    -- Aggiorna invito come accettato comunque
    UPDATE public.org_invites SET status = 'accepted', accepted_at = now() WHERE id = v_invite.id;
    RETURN jsonb_build_object('error', 'Sei già membro di questa organizzazione');
  END IF;

  -- Aggiungi come membro
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (v_invite.org_id, v_user_id, v_invite.role);

  -- Segna invito come accettato
  UPDATE public.org_invites SET status = 'accepted', accepted_at = now() WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_invite.org_id,
    'role', v_invite.role
  );
END;
$$;
