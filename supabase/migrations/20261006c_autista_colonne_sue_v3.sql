-- 20261006c_autista_colonne_sue_v3.sql
--
-- TERZA versione. Le due prima NON proteggevano niente, per due motivi
-- diversi. Questa e' provata sul database con l'identita' di un autista vero.
--
-- STATO: da applicare su STAGING, provare col blocco in fondo, e poi prod.
--        Sostituisce 20261006 e 20261006b: basta questa.
--        Indietro:  drop trigger trg_staff_drivers_colonne_sue on public.staff_drivers;
--                   drop function public.staff_drivers_colonne_sue();
--
-- ── Il difetto della v1: la logica a tre valori ─────────────────────────
--   e_lui_stesso := OLD.auth_user_id is not null and OLD.auth_user_id = auth.uid();
--   if not e_lui_stesso then return NEW; end if;
-- Col service_role `auth.uid()` e' NULL, quindi `true AND NULL` = NULL,
-- `NOT NULL` = NULL, e `if NULL then` non esegue: il «lascia passare» non
-- scattava e le scritture server-side si vedevano le colonne riportate
-- indietro in silenzio. Corretto nella v2 mettendo `auth.uid() is not null`
-- come primo termine (`false AND NULL` = false).
--
-- ── Il difetto della v2, peggiore: l'ipotesi sbagliata ──────────────────
-- La v2 lasciava passare tutto a chi e' «anche ufficio», e il controllo era:
--
--   select exists (select 1 from org_members m
--                   where m.org_id = OLD.org_id and m.user_id = auth.uid())
--
-- cioe' «esiste una riga in org_members». Ho dato per scontato che gli
-- autisti non ci fossero. MISURATO SU STAGING: ci sono TUTTI, con
-- `role = 'autista'`. Quindi la via di fuga scattava per ogni autista e il
-- trigger non pinnava mai niente.
--
-- Provato con l'identita' di Marco Sotto (id 16), in transazione annullata:
--   costo_orario              999          invece di 0
--   scadenza_patente          2099-01-01   invece di 2026-05-30
--   mobile_account_disabled_at 2020-01-01  invece di vuoto
-- Tre colonne su tre passavano. Il fix non proteggeva nessuno.
--
-- ── La correzione: il RUOLO, non l'esistenza della riga ─────────────────
-- «Ufficio» vuol dire `role in ('owner','admin','operator')`. E' una lista di
-- PERMESSI, non di esclusioni: un ruolo nuovo o vuoto NON conta come ufficio,
-- quindi la protezione si applica. In sicurezza si sbaglia da quel lato.
--
-- Il titolare che guida anche lui resta libero: ha `role = 'owner'` in
-- org_members, quindi passa. L'autista puro ha `role = 'autista'` e non passa.
-- Verificato sul database: col gettone dell'autista il predicato da' false,
-- con quello di un owner della stessa azienda da' true.

create or replace function public.staff_drivers_colonne_sue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  e_lui_stesso boolean;
  e_ufficio    boolean;
begin
  -- `auth.uid() is not null` PER PRIMO: senza, col service_role tutta la
  -- catena vale NULL e il controllo qui sotto non esegue (difetto della v1).
  e_lui_stesso := auth.uid() is not null
                  and OLD.auth_user_id is not null
                  and OLD.auth_user_id = auth.uid();

  if not coalesce(e_lui_stesso, false) then
    return NEW;   -- il service_role, o un impiegato su un'altra riga
  end if;

  -- Chi e' dell'ufficio fa tutto, anche sulla propria riga di autista: il
  -- titolare di un'azienda piccola guida lui. Il controllo e' sul RUOLO e con
  -- una lista di permessi: un ruolo sconosciuto o vuoto NON e' ufficio
  -- (difetto della v2, che guardava solo se la riga esisteva — e gli autisti
  -- stanno tutti in org_members con role='autista').
  select exists (
    select 1 from public.org_members m
     where m.org_id = OLD.org_id
       and m.user_id = auth.uid()
       and coalesce(m.role, '') in ('owner', 'admin', 'operator')
  ) into e_ufficio;

  if coalesce(e_ufficio, false) then
    return NEW;
  end if;

  -- Da qui in giu': e' l'autista in persona e non e' dell'ufficio.
  -- Quello che PUO' cambiare: nome, cognome, telefono, email (il disegno 31)
  -- piu' last_seen_at, last_login_at e onboarded_at, che li scrive l'app.
  -- Tutto il resto torna com'era: non un errore, un silenzioso «no».
  NEW.id                         := OLD.id;
  NEW.org_id                     := OLD.org_id;
  NEW.auth_user_id               := OLD.auth_user_id;
  NEW.driver_id                  := OLD.driver_id;
  NEW.stato                      := OLD.stato;
  NEW.note                       := OLD.note;
  NEW.patente                    := OLD.patente;
  NEW.patenti                    := OLD.patenti;
  NEW.tags                       := OLD.tags;
  NEW.preferenze                 := OLD.preferenze;
  NEW.disp                       := OLD.disp;
  NEW.assegnatioggi              := OLD.assegnatioggi;
  NEW.assegnati_oggi             := OLD.assegnati_oggi;
  NEW.scadenza_patente           := OLD.scadenza_patente;
  NEW.scadenza_cqc               := OLD.scadenza_cqc;
  NEW.scadenza_cert_medico       := OLD.scadenza_cert_medico;
  NEW.costo_orario               := OLD.costo_orario;
  NEW.costo_km                   := OLD.costo_km;
  NEW.documenti                  := OLD.documenti;
  NEW.codice_fiscale             := OLD.codice_fiscale;
  NEW.data_nascita               := OLD.data_nascita;
  NEW.mobile_modules             := OLD.mobile_modules;
  NEW.mobile_status              := OLD.mobile_status;
  NEW.mobile_account_disabled_at := OLD.mobile_account_disabled_at;
  NEW.mobile_account_created_at  := OLD.mobile_account_created_at;
  NEW.created_at                 := OLD.created_at;

  return NEW;
end;
$$;

comment on function public.staff_drivers_colonne_sue() is
  'v3. L''autista puo'' cambiare solo nome, cognome, telefono, email e i propri tempi; il resto torna al valore di prima. «Ufficio» = org_members.role in (owner,admin,operator): gli autisti stanno TUTTI in org_members con role=autista, quindi il solo «esiste la riga» non bastava. E auth.uid() is not null va per primo, altrimenti col service_role la catena AND vale NULL.';

drop trigger if exists trg_staff_drivers_colonne_sue on public.staff_drivers;
create trigger trg_staff_drivers_colonne_sue
  before update on public.staff_drivers
  for each row execute function public.staff_drivers_colonne_sue();


-- ══════════════════════════════════════════════════════════════════════════
-- LA PROVA. Incollala dopo aver applicato la funzione qui sopra.
--
-- Non lascia NIENTE: il `raise exception` in fondo annulla tutta la
-- transazione, e il risultato arriva nel messaggio d'errore. Cambia l'id e
-- l'uuid con un autista vero della tua azienda (NON un owner).
--
-- Atteso: telefono CAMBIA, le altre tre NON cambiano.
-- ══════════════════════════════════════════════════════════════════════════
--
-- do $$
-- declare
--   v_id         bigint := 16;
--   v_uid        uuid   := 'b538a773-12de-4741-93f5-0695b10570f1';
--   v_costo numeric; v_tel text; v_scad date; v_dis timestamptz;
--   o_costo numeric; o_tel text; o_scad date; o_dis timestamptz;
-- begin
--   select costo_orario, telefono, scadenza_patente, mobile_account_disabled_at
--     into o_costo, o_tel, o_scad, o_dis from staff_drivers where id = v_id;
--
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
--
--   update staff_drivers
--      set costo_orario = 999,
--          telefono = 'PROVA-TELEFONO',
--          scadenza_patente = '2099-01-01',
--          mobile_account_disabled_at = '2020-01-01'
--    where id = v_id;
--
--   select costo_orario, telefono, scadenza_patente, mobile_account_disabled_at
--     into v_costo, v_tel, v_scad, v_dis from staff_drivers where id = v_id;
--
--   raise exception E'ESITO (nulla e'' stato salvato)\n  costo_orario:  % -> %   %\n  scadenza_pat:  % -> %   %\n  disabled_at:   % -> %   %\n  telefono:      % -> %   %',
--     o_costo, v_costo, case when v_costo = o_costo then 'PROTETTO' else 'BUCO!' end,
--     o_scad,  v_scad,  case when v_scad  = o_scad  then 'PROTETTO' else 'BUCO!' end,
--     coalesce(o_dis::text,'NULL'), coalesce(v_dis::text,'NULL'),
--       case when v_dis is not distinct from o_dis then 'PROTETTO' else 'BUCO!' end,
--     o_tel, v_tel, case when v_tel <> o_tel then 'CAMBIA, giusto' else 'non cambia, SBAGLIATO' end;
-- end $$;
--
-- Poi la controprova col service_role (la console normale, senza set_config):
--   update staff_drivers set costo_orario = 12.5 where id = <id>;
--   select costo_orario from staff_drivers where id = <id>;   -- 12.5: deve PASSARE
--   update staff_drivers set costo_orario = 0 where id = <id>;   -- rimetti com'era
