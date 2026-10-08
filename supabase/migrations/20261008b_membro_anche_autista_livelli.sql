-- Membro anche autista: le tre funzioni confrontano il LIVELLO.
--
-- Trovato dalla revisione avversariale dell'08/10/2026: collega_membro_autista,
-- scollega_membro_autista e rendi_solo_autista controllavano solo «chi chiama
-- e' owner o admin», non il livello del bersaglio. Un amministratore poteva
-- togliere il gestionale a un altro amministratore, o collegare/scollegare la
-- scheda del titolare. change_member_role (20260608_team_security_rpcs) ha gia'
-- la regola giusta: si agisce solo su chi sta SOTTO di se'. Qui la stessa,
-- con l'eccezione di se' stessi per collega/scollega (il titolare che guida
-- si collega da solo).
--
-- Codice di risposta: TARGET_TOO_HIGH, lo stesso che il gestionale gia' mappa.

create or replace function public.collega_membro_autista(
  p_org_id uuid,
  p_user_id uuid,
  p_staff_driver_id bigint default null,
  p_nome text default null,
  p_cognome text default null,
  p_telefono text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ruolo    text;
  v_ruolo_chiamante text;
  v_email    text;
  v_nome     text;
  v_scheda   public.staff_drivers;
  v_nome_def text;
  v_cognome_def text;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'error', 'Non autenticato');
  end if;
  if not public.is_org_admin(p_org_id) then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Solo il titolare o un amministratore possono farlo');
  end if;

  select m.role into v_ruolo
  from public.org_members m
  where m.org_id = p_org_id and m.user_id = p_user_id;

  if v_ruolo is null then
    return jsonb_build_object('success', false, 'code', 'MEMBER_NOT_FOUND', 'error', 'La persona non risulta in questa azienda');
  end if;
  if v_ruolo = 'autista' then
    return jsonb_build_object('success', false, 'code', 'ALREADY_DRIVER_ROLE', 'error', 'Questa persona è già un autista: la sua scheda si gestisce da Autisti');
  end if;

  -- Su un altro si agisce solo se sta sotto di se'. Su se' stessi sempre.
  select m.role into v_ruolo_chiamante
  from public.org_members m
  where m.org_id = p_org_id and m.user_id = auth.uid();
  if p_user_id <> auth.uid() and public.role_level(v_ruolo) >= public.role_level(v_ruolo_chiamante) then
    return jsonb_build_object('success', false, 'code', 'TARGET_TOO_HIGH', 'error', 'Puoi farlo solo per chi ha un ruolo più basso del tuo');
  end if;

  select * into v_scheda
  from public.staff_drivers s
  where s.org_id = p_org_id and s.auth_user_id = p_user_id
  limit 1;
  if found then
    return jsonb_build_object('success', true, 'code', 'ALREADY_LINKED', 'staff_driver_id', v_scheda.id);
  end if;

  select p.email, p.full_name into v_email, v_nome
  from public.profiles p where p.id = p_user_id;

  if p_staff_driver_id is not null then
    update public.staff_drivers s
       set auth_user_id = p_user_id,
           email = coalesce(nullif(btrim(s.email), ''), v_email),
           mobile_status = 'active',
           mobile_account_created_at = coalesce(s.mobile_account_created_at, now()),
           mobile_account_disabled_at = null
     where s.id = p_staff_driver_id
       and s.org_id = p_org_id
       and s.auth_user_id is null
    returning * into v_scheda;

    if not found then
      return jsonb_build_object('success', false, 'code', 'DRIVER_CARD_UNAVAILABLE', 'error', 'La scheda scelta non è di questa azienda o è già collegata a un altro account');
    end if;
    return jsonb_build_object('success', true, 'code', 'LINKED', 'staff_driver_id', v_scheda.id);
  end if;

  if coalesce(btrim(p_telefono), '') = '' then
    return jsonb_build_object('success', false, 'code', 'PHONE_REQUIRED', 'error', 'Serve il numero di telefono dell’autista');
  end if;

  v_nome_def := nullif(btrim(coalesce(p_nome, '')), '');
  v_cognome_def := nullif(btrim(coalesce(p_cognome, '')), '');
  if v_nome_def is null then
    v_nome_def := nullif(split_part(btrim(coalesce(v_nome, '')), ' ', 1), '');
    if v_cognome_def is null then
      v_cognome_def := nullif(btrim(substr(btrim(coalesce(v_nome, '')), length(split_part(btrim(coalesce(v_nome, '')), ' ', 1)) + 1)), '');
    end if;
  end if;
  if v_nome_def is null then
    v_nome_def := coalesce(split_part(v_email, '@', 1), 'Autista');
  end if;

  begin
    insert into public.staff_drivers
      (org_id, nome, cognome, telefono, email, auth_user_id, mobile_status, mobile_account_created_at)
    values
      (p_org_id, v_nome_def, v_cognome_def, btrim(p_telefono), v_email, p_user_id, 'active', now())
    returning * into v_scheda;
  exception when unique_violation then
    return jsonb_build_object('success', false, 'code', 'PHONE_TAKEN', 'error', 'Questo numero di telefono è già di un altro autista dell’azienda');
  end;

  return jsonb_build_object('success', true, 'code', 'CREATED', 'staff_driver_id', v_scheda.id);
end;
$$;

create or replace function public.scollega_membro_autista(
  p_org_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ruolo text;
  v_ruolo_chiamante text;
  v_quante integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'error', 'Non autenticato');
  end if;
  if not public.is_org_admin(p_org_id) then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Solo il titolare o un amministratore possono farlo');
  end if;

  select m.role into v_ruolo
  from public.org_members m
  where m.org_id = p_org_id and m.user_id = p_user_id;
  if v_ruolo is null then
    return jsonb_build_object('success', false, 'code', 'MEMBER_NOT_FOUND', 'error', 'La persona non risulta in questa azienda');
  end if;
  if v_ruolo = 'autista' then
    return jsonb_build_object('success', false, 'code', 'ALREADY_DRIVER_ROLE', 'error', 'Questa persona è un autista: si gestisce da Autisti');
  end if;

  select m.role into v_ruolo_chiamante
  from public.org_members m
  where m.org_id = p_org_id and m.user_id = auth.uid();
  if p_user_id <> auth.uid() and public.role_level(v_ruolo) >= public.role_level(v_ruolo_chiamante) then
    return jsonb_build_object('success', false, 'code', 'TARGET_TOO_HIGH', 'error', 'Puoi farlo solo per chi ha un ruolo più basso del tuo');
  end if;

  update public.staff_drivers s
     set auth_user_id = null,
         mobile_status = 'inactive',
         mobile_account_disabled_at = now(),
         last_seen_at = null
   where s.org_id = p_org_id
     and s.auth_user_id = p_user_id;
  get diagnostics v_quante = row_count;

  return jsonb_build_object('success', true, 'code', case when v_quante > 0 then 'UNLINKED' else 'NOTHING_TO_UNLINK' end);
end;
$$;

create or replace function public.rendi_solo_autista(
  p_org_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ruolo text;
  v_ruolo_chiamante text;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'error', 'Non autenticato');
  end if;
  if not public.is_org_admin(p_org_id) then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Solo il titolare o un amministratore possono farlo');
  end if;
  if p_user_id = auth.uid() then
    return jsonb_build_object('success', false, 'code', 'CANNOT_SELF', 'error', 'Non puoi togliere a te stesso l’accesso al gestionale');
  end if;

  select m.role into v_ruolo
  from public.org_members m
  where m.org_id = p_org_id and m.user_id = p_user_id;
  if v_ruolo is null then
    return jsonb_build_object('success', false, 'code', 'MEMBER_NOT_FOUND', 'error', 'La persona non risulta in questa azienda');
  end if;
  if v_ruolo = 'owner' then
    return jsonb_build_object('success', false, 'code', 'CANNOT_DEMOTE_OWNER', 'error', 'Il titolare non può diventare solo autista');
  end if;
  if v_ruolo = 'autista' then
    return jsonb_build_object('success', true, 'code', 'ALREADY_DRIVER_ONLY');
  end if;

  select m.role into v_ruolo_chiamante
  from public.org_members m
  where m.org_id = p_org_id and m.user_id = auth.uid();
  if public.role_level(v_ruolo) >= public.role_level(v_ruolo_chiamante) then
    return jsonb_build_object('success', false, 'code', 'TARGET_TOO_HIGH', 'error', 'Puoi farlo solo per chi ha un ruolo più basso del tuo');
  end if;

  if not exists (select 1 from public.staff_drivers s where s.org_id = p_org_id and s.auth_user_id = p_user_id) then
    return jsonb_build_object('success', false, 'code', 'NO_DRIVER_CARD', 'error', 'Questa persona non ha una scheda autista collegata: senza, resterebbe chiusa fuori da tutto');
  end if;

  update public.org_members m
     set role = 'autista'
   where m.org_id = p_org_id and m.user_id = p_user_id;

  return jsonb_build_object('success', true, 'code', 'DRIVER_ONLY');
end;
$$;
