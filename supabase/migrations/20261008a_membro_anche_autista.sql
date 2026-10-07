-- Un membro dell'ufficio puo' essere ANCHE autista.
--
-- Richiesto dal titolare l'08/10/2026: «posso essere sia operatore che autista;
-- chi e' solo autista rimane autista; lo cambia il titolare dalle impostazioni
-- del gestionale». Il modello lo prevedeva gia' — ruolo d'ufficio in
-- org_members + scheda staff_drivers con auth_user_id = suo utente (e' il caso
-- «il titolare che guida anche lui» del trigger staff_drivers_colonne_sue v4) —
-- ma NESSUNA strada legittima ci arrivava: la route del sito
-- /api/auth/driver-account risponde 409 alle email dell'ufficio, e dal
-- gestionale DriverNew fallisce in silenzio.
--
-- Queste due funzioni sono quella strada. Stanno nel database e non nel
-- client perche':
--   - la RLS di staff_drivers e' larga (qualunque membro modifica qualunque
--     scheda) e sta per stringersi: appoggiarsi a update diretti dal client
--     vorrebbe dire rifare tutto fra un mese;
--   - il controllo «chi puo' farlo» (owner o admin) va fatto dal server, come
--     per change_member_role / remove_org_member (20260608_team_security_rpcs).
--
-- Risposta sempre jsonb {success, code, ...}: il gestionale la mappa gia' con
-- normalizeError({code, message}) per le altre RPC del personale.

-- ---------------------------------------------------------------------------
-- Collega (o crea e collega) la scheda autista di un membro d'ufficio.
--   p_staff_driver_id: una scheda ESISTENTE e libera dell'azienda da collegare;
--   altrimenti si crea una scheda nuova con nome/cognome/telefono (telefono
--   obbligatorio: la colonna e' NOT NULL e unica per azienda).
-- ---------------------------------------------------------------------------
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
    -- Un autista puro ha gia' la sua scheda e si gestisce dalla pagina Autisti.
    return jsonb_build_object('success', false, 'code', 'ALREADY_DRIVER_ROLE', 'error', 'Questa persona è già un autista: la sua scheda si gestisce da Autisti');
  end if;

  -- Gia' collegato in questa azienda: niente da fare, si risponde con la scheda.
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
    -- Scheda esistente: deve essere di questa azienda e libera.
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

  -- Scheda nuova.
  if coalesce(btrim(p_telefono), '') = '' then
    return jsonb_build_object('success', false, 'code', 'PHONE_REQUIRED', 'error', 'Serve il numero di telefono dell’autista');
  end if;

  -- Nome: quello passato, altrimenti dal profilo (prima parola / resto).
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

-- ---------------------------------------------------------------------------
-- Scollega la scheda autista di un membro d'ufficio. La scheda RESTA (con la
-- storia dei trasporti assegnati): si toglie solo il collegamento all'account,
-- come fa la disattivazione dal sito. org_members non si tocca.
-- ---------------------------------------------------------------------------
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

-- Le chiama solo chi e' dentro: mai anon (vedi la revoca di massa del 07/10/2026
-- sulle SECURITY DEFINER esposte ad anon).
revoke all on function public.collega_membro_autista(uuid, uuid, bigint, text, text, text) from public, anon;
revoke all on function public.scollega_membro_autista(uuid, uuid) from public, anon;
grant execute on function public.collega_membro_autista(uuid, uuid, bigint, text, text, text) to authenticated;
grant execute on function public.scollega_membro_autista(uuid, uuid) to authenticated;

comment on function public.collega_membro_autista(uuid, uuid, bigint, text, text, text) is
  'Impostazioni → Personale: rende un membro d''ufficio anche autista (collega o crea la scheda staff_drivers). Solo owner/admin.';
comment on function public.scollega_membro_autista(uuid, uuid) is
  'Impostazioni → Personale: toglie a un membro d''ufficio la scheda autista (la scheda resta, scollegata). Solo owner/admin.';

-- ---------------------------------------------------------------------------
-- Il contrario: un autista che usa anche il gestionale, e il ritorno a «solo
-- telefono». La promozione (autista → operator/manager/viewer/admin) la fa gia'
-- change_member_role (20260608_team_security_rpcs), con i suoi controlli di
-- livello. Il ritorno a 'autista' invece change_member_role lo RIFIUTA
-- (INVALID_ROLE: livello 0), quindi serve questa. Vale solo per chi ha la
-- scheda autista collegata: senza, 'autista' come ruolo vorrebbe dire «chiuso
-- fuori da tutto» (il telefono lo tratta come rimosso, il gestionale lo blocca).
-- ---------------------------------------------------------------------------
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
  if not exists (select 1 from public.staff_drivers s where s.org_id = p_org_id and s.auth_user_id = p_user_id) then
    return jsonb_build_object('success', false, 'code', 'NO_DRIVER_CARD', 'error', 'Questa persona non ha una scheda autista collegata: senza, resterebbe chiusa fuori da tutto');
  end if;

  update public.org_members m
     set role = 'autista'
   where m.org_id = p_org_id and m.user_id = p_user_id;

  return jsonb_build_object('success', true, 'code', 'DRIVER_ONLY');
end;
$$;

revoke all on function public.rendi_solo_autista(uuid, uuid) from public, anon;
grant execute on function public.rendi_solo_autista(uuid, uuid) to authenticated;
comment on function public.rendi_solo_autista(uuid, uuid) is
  'Impostazioni → Personale → Autisti: un autista che usava anche il gestionale torna a «solo telefono» (ruolo autista). Solo owner/admin, mai su se'' stessi né sul titolare.';
