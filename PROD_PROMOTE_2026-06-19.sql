-- =====================================================================
-- PROMOZIONE SICURA → PRODUZIONE (progetto ienzdgrqalltvkdkuamp)
-- Incolla questo blocco nel SQL Editor del progetto PROD ed eseguilo.
--
-- ⚠️ NON usare il "Merge" del Branching di Supabase: quel diff DROPpa
--    invoices/transports/demolition_cases/... = perdita totale dati prod.
--
-- Questo blocco è SOLO ADDITIVO e IDEMPOTENTE (nessun DROP di tabelle/dati):
--   1) assistance_requests.transport_id  → feature /track (mezzo live al cliente)
--   2) RPC team SECURITY DEFINER          → fix escalation privilegi (H1/H4)
-- Già applicato e verificato su STAGING il 2026-06-19.
--
-- NON incluso di proposito (verificare a mano su prod):
--   - invoices RLS: su staging è GIÀ abilitata con policy. Su prod controlla:
--       select relrowsecurity from pg_class where oid='public.invoices'::regclass;
--     se è già true con policy → non toccare.
--   - org_members RLS hardening: rischioso, NON applicare alla cieca.
-- =====================================================================

-- ── 1) Feature /track: link richiesta assist ↔ trasporto ──────────────
ALTER TABLE public.assistance_requests
  ADD COLUMN IF NOT EXISTS transport_id uuid REFERENCES public.transports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assistance_requests_transport
  ON public.assistance_requests(transport_id)
  WHERE transport_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transport_tracking_transport_recorded
  ON public.transport_tracking(transport_id, recorded_at DESC);

-- ── 2) RPC team server-side (gestione membri sicura) ──────────────────
CREATE OR REPLACE FUNCTION public.role_level(p_role TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(p_role, ''))
    WHEN 'owner' THEN 100 WHEN 'admin' THEN 80 WHEN 'manager' THEN 60
    WHEN 'operator' THEN 40 WHEN 'viewer' THEN 20 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invite RECORD; v_uid UUID := auth.uid(); v_email TEXT := lower(coalesce(auth.email(), ''));
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'error', 'Non autenticato'); END IF;
  SELECT * INTO v_invite FROM org_invites WHERE token = p_token AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'code', 'INVITE_NOT_FOUND', 'error', 'Invito non trovato o scaduto'); END IF;
  IF lower(v_invite.email) <> v_email THEN RETURN json_build_object('success', false, 'code', 'INVITE_EMAIL_MISMATCH', 'error', 'Invito intestato a un altro indirizzo email'); END IF;
  INSERT INTO org_members (org_id, user_id, role, created_at)
  VALUES (v_invite.org_id, v_uid, coalesce(v_invite.role, 'operator'), now())
  ON CONFLICT (org_id, user_id) DO NOTHING;
  UPDATE profiles SET current_org = v_invite.org_id WHERE id = v_uid AND current_org IS NULL;
  UPDATE org_invites SET status = 'accepted', accepted_at = now() WHERE id = v_invite.id;
  RETURN json_build_object('success', true, 'org_id', v_invite.org_id, 'role', v_invite.role);
END; $$;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.change_member_role(p_org_id UUID, p_target_user_id UUID, p_new_role TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor_role TEXT; v_target_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN json_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'error', 'Non autenticato'); END IF;
  SELECT role INTO v_actor_role FROM org_members WHERE org_id = p_org_id AND user_id = auth.uid();
  IF v_actor_role IS NULL OR role_level(v_actor_role) < 80 THEN RETURN json_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Permesso negato'); END IF;
  IF role_level(p_new_role) = 0 THEN RETURN json_build_object('success', false, 'code', 'INVALID_ROLE', 'error', 'Ruolo non valido'); END IF;
  IF role_level(p_new_role) >= role_level(v_actor_role) THEN RETURN json_build_object('success', false, 'code', 'ROLE_TOO_HIGH', 'error', 'Non puoi assegnare un ruolo pari o superiore al tuo'); END IF;
  SELECT role INTO v_target_role FROM org_members WHERE org_id = p_org_id AND user_id = p_target_user_id;
  IF v_target_role IS NULL THEN RETURN json_build_object('success', false, 'code', 'MEMBER_NOT_FOUND', 'error', 'Membro non trovato'); END IF;
  IF role_level(v_target_role) >= role_level(v_actor_role) THEN RETURN json_build_object('success', false, 'code', 'TARGET_TOO_HIGH', 'error', 'Non puoi modificare un membro pari o superiore al tuo'); END IF;
  UPDATE org_members SET role = p_new_role WHERE org_id = p_org_id AND user_id = p_target_user_id;
  RETURN json_build_object('success', true, 'role', p_new_role);
END; $$;
GRANT EXECUTE ON FUNCTION public.change_member_role(UUID, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_org_member(p_org_id UUID, p_target_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor_role TEXT; v_target_role TEXT; v_owner_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RETURN json_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'error', 'Non autenticato'); END IF;
  SELECT role INTO v_actor_role FROM org_members WHERE org_id = p_org_id AND user_id = auth.uid();
  IF v_actor_role IS NULL OR role_level(v_actor_role) < 80 THEN RETURN json_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Permesso negato'); END IF;
  SELECT role INTO v_target_role FROM org_members WHERE org_id = p_org_id AND user_id = p_target_user_id;
  IF v_target_role IS NULL THEN RETURN json_build_object('success', false, 'code', 'MEMBER_NOT_FOUND', 'error', 'Membro non trovato'); END IF;
  IF role_level(v_target_role) >= role_level(v_actor_role) THEN RETURN json_build_object('success', false, 'code', 'TARGET_TOO_HIGH', 'error', 'Non puoi rimuovere un membro pari o superiore al tuo'); END IF;
  IF lower(v_target_role) = 'owner' THEN
    SELECT count(*) INTO v_owner_count FROM org_members WHERE org_id = p_org_id AND lower(role) = 'owner';
    IF v_owner_count <= 1 THEN RETURN json_build_object('success', false, 'code', 'LAST_OWNER', 'error', 'Non puoi rimuovere l''ultimo owner'); END IF;
  END IF;
  DELETE FROM org_members WHERE org_id = p_org_id AND user_id = p_target_user_id;
  RETURN json_build_object('success', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.remove_org_member(UUID, UUID) TO authenticated;
