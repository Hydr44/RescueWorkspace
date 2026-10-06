-- 20261006e_colonne_sue_v4_depth.sql
--
-- QUARTA versione, e l'ultima correzione: una riga.
-- Applica questa sopra la v3 (20261006c). Non serve toccare altro.
--
-- ── Cosa ho trovato dopo aver provato la v3 ─────────────────────────────
-- Su `staff_drivers` c'e' gia' un altro trigger, `trg_sync_staff_driver`
-- (AFTER INSERT OR UPDATE OF nome, cognome, telefono, patente, email,
-- auth_user_id), che tiene allineata la tabella VECCHIA `drivers`. In fondo
-- fa questo:
--
--   IF NEW.driver_id IS DISTINCT FROM v_driver_id THEN
--     UPDATE public.staff_drivers SET driver_id = v_driver_id WHERE id = NEW.id;
--   END IF;
--
-- cioe' una UPDATE ANNIDATA su staff_drivers. Quell'update rifa' partire il
-- mio trigger BEFORE, che vede ancora l'autista come autore (`auth.uid()` e'
-- sempre il suo) e riporta `driver_id` al valore di prima — annullando in
-- silenzio il lavoro della sync.
--
-- Quanto conta OGGI: poco. Tutti e cinque gli autisti su staging hanno gia'
-- `driver_id` valorizzato, quindi la condizione `IS DISTINCT FROM` e' falsa e
-- l'update annidata non parte. Il caso che si rompe e' un autista NUOVO, con
-- `driver_id` ancora vuoto, che modifica il proprio telefono dall'app: la
-- sync creerebbe la riga in `drivers` e non riuscirebbe a collegarla,
-- lasciando un orfano.
--
-- La sync stessa si protegge cosi' (`sync_staff_driver_to_drivers`):
--   IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
-- ed e' la stessa protezione che serve a me, per lo stesso motivo: una
-- scrittura che arriva da un altro trigger non e' l'autista che digita.

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
  -- v4: una scrittura che arriva da un ALTRO trigger non e' l'autista che
  -- digita. Senza questa riga, l'update annidata di `trg_sync_staff_driver`
  -- veniva trattata come se fosse lui e il suo `driver_id` restava vuoto.
  -- Stessa guardia che usa la sync, per lo stesso motivo.
  if pg_trigger_depth() > 1 then
    return NEW;
  end if;

  -- v2: `auth.uid() is not null` PER PRIMO, altrimenti col service_role tutta
  -- la catena vale NULL e il controllo qui sotto non esegue.
  e_lui_stesso := auth.uid() is not null
                  and OLD.auth_user_id is not null
                  and OLD.auth_user_id = auth.uid();

  if not coalesce(e_lui_stesso, false) then
    return NEW;   -- il service_role, o un impiegato su un'altra riga
  end if;

  -- v3: «ufficio» e' il RUOLO, non l'esistenza della riga in org_members —
  -- gli autisti ci stanno tutti, con role='autista'. Lista di permessi: un
  -- ruolo sconosciuto o vuoto NON e' ufficio.
  select exists (
    select 1 from public.org_members m
     where m.org_id = OLD.org_id
       and m.user_id = auth.uid()
       and coalesce(m.role, '') in ('owner', 'admin', 'operator')
  ) into e_ufficio;

  if coalesce(e_ufficio, false) then
    return NEW;   -- il titolare che guida anche lui
  end if;

  -- E' l'autista in persona, e non e' dell'ufficio: puo' cambiare solo nome,
  -- cognome, telefono, email (il disegno 31) piu' last_seen_at, last_login_at
  -- e onboarded_at, che li scrive l'app. Il resto torna com'era — non un
  -- errore, un silenzioso «no».
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
  'v4. L''autista cambia solo nome, cognome, telefono, email e i propri tempi; il resto torna al valore di prima. v2: auth.uid() is not null per primo (col service_role la catena AND vale NULL). v3: «ufficio» = org_members.role in (owner,admin,operator), non la sola esistenza della riga. v4: pg_trigger_depth() > 1 lascia passare le scritture annidate, altrimenti l''update di trg_sync_staff_driver viene annullata.';

-- Il trigger non cambia: `create or replace function` basta. Si rimette solo
-- nel caso questa migration venga eseguita su un database pulito.
drop trigger if exists trg_staff_drivers_colonne_sue on public.staff_drivers;
create trigger trg_staff_drivers_colonne_sue
  before update on public.staff_drivers
  for each row execute function public.staff_drivers_colonne_sue();

-- ── La prova e' la stessa della v3 ──────────────────────────────────────
-- Il blocco in fondo a 20261006c vale ancora: deve dare PROTETTO su
-- costo_orario, scadenza_patente, disabled_at, org_id e mobile_modules, e
-- far cambiare il telefono.
--
-- In piu', per questa versione, la prova della sync: su un autista con
-- `driver_id` VUOTO, cambiare il telefono dall'app e controllare che
-- `driver_id` si riempia.
--   select id, driver_id from staff_drivers where auth_user_id is not null;
