-- Funzione per creare automaticamente org, profile e membership alla registrazione
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  pending_invite RECORD;
  user_role TEXT;
BEGIN
  -- Controlla se esiste un invito pending per questa email
  SELECT * INTO pending_invite
  FROM public.org_invites
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Utente ha un invito pending - usa org e ruolo dell'invito
    new_org_id := pending_invite.org_id;
    user_role := pending_invite.role;
  ELSE
    -- Nessun invito - crea nuova organizzazione
    org_name := split_part(NEW.email, '@', 1);
    INSERT INTO public.orgs (name, created_at, updated_at)
    VALUES (org_name, NOW(), NOW())
    RETURNING id INTO new_org_id;
    user_role := 'owner';
  END IF;
  
  -- Crea profilo utente
  INSERT INTO public.profiles (id, org_id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  
  -- Aggiungi utente a org_members con ruolo appropriato
  INSERT INTO public.org_members (org_id, user_id, role, created_at)
  VALUES (new_org_id, NEW.id, user_role, NOW());
  
  -- Se c'era un invito, marcalo come accettato
  IF FOUND THEN
    UPDATE public.org_invites
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = pending_invite.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger che si attiva alla creazione di un nuovo utente in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Commenti
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automaticamente org, profile e membership quando un utente si registra';
