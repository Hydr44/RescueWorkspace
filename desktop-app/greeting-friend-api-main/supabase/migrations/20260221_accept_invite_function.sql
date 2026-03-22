-- Elimina versione vecchia della funzione se esiste
DROP FUNCTION IF EXISTS public.accept_team_invite(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.accept_team_invite(TEXT, UUID, TEXT);

-- Funzione RPC per verificare invito (il trigger handle_new_user gestisce il resto)
CREATE OR REPLACE FUNCTION public.verify_team_invite(
  p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Verifica che l'invito esista ed è valido
  SELECT * INTO v_invite
  FROM org_invites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invito non trovato o scaduto'
    );
  END IF;
  
  -- Ritorna info invito
  RETURN json_build_object(
    'success', true,
    'org_id', v_invite.org_id,
    'role', v_invite.role,
    'email', v_invite.email
  );
END;
$$;

-- Grant execute a tutti (anche anonimi per verificare invito prima di registrarsi)
GRANT EXECUTE ON FUNCTION public.verify_team_invite(TEXT) TO anon, authenticated;
