-- 20261006_autista_colonne_sue.sql
--
-- L'autista puo' riscriversi TUTTA la sua riga di anagrafica. Qui si chiude.
--
-- STATO: SCRITTA E NON ESEGUITA.
--        Per tornare indietro:
--          drop trigger trg_staff_drivers_colonne_sue on public.staff_drivers;
--          drop function public.staff_drivers_colonne_sue();
--
-- ── Il problema, verificato sul database ────────────────────────────────
-- Esiste questa regola di accesso:
--
--   staff_drivers_self_update_last_seen
--     cmd        = UPDATE
--     using      = (auth_user_id = auth.uid())
--     with_check = (auth_user_id = auth.uid())
--
-- Il nome dice «last_seen», e nasce per quello: il telefono scrive ogni cinque
-- minuti l'ora in cui l'autista e' stato visto. Ma **in Postgres una regola di
-- riga non sa limitare le colonne**: concede l'intera riga. Quindi oggi un
-- autista, col suo gettone e senza nessun trucco, puo' scrivere:
--
--   update staff_drivers set costo_orario = 0 where auth_user_id = <se stesso>;
--   update staff_drivers set scadenza_patente = '2099-01-01' where ...;
--   update staff_drivers set mobile_account_disabled_at = null where ...;
--   update staff_drivers set org_id = '<altra azienda>' where ...;
--
-- In ordine di gravita':
--   1. `mobile_account_disabled_at`: l'ufficio disattiva l'accesso di un
--      autista, e l'autista se lo riattiva.
--   2. `org_id`: si sposta in un'altra azienda. La RLS dei trasporti e' per
--      azienda, quindi da li' vedrebbe il lavoro di qualcun altro. Serve
--      conoscere l'uuid dell'altra azienda, ma e' una strada aperta.
--   3. `scadenza_patente`, `scadenza_cqc`, `scadenza_cert_medico`: si allunga
--      le scadenze e spegne gli avvisi che l'ufficio riceve.
--   4. `costo_orario`, `costo_km`: si cambia quanto costa.
--   5. `mobile_modules`, `mobile_status`: si accende moduli non suoi.
--
-- Il disegno 31 («Li aggiorna l'ufficio») divide i campi, ma quella divisione
-- vive SOLO nell'interfaccia. Chi parla col database direttamente la salta.
--
-- ── Perche' non si risolve coi permessi di colonna ──────────────────────
-- Postgres li ha (`grant update (col) on tabella to ruolo`), ma valgono per
-- RUOLO, non per regola. Qui l'autista e l'impiegato sono entrambi
-- `authenticated`: togliendo le colonne all'autista si tolgono anche
-- all'ufficio, che dal gestionale non potrebbe piu' modificare un autista.
--
-- La strada che funziona e' un trigger: quando chi scrive e' l'autista stesso
-- e NON e' anche un membro dell'ufficio di quell'azienda, tutte le colonne
-- che non gli competono tornano al valore di prima. Non un errore: un
-- silenzioso «no». Cosi' il battito di `last_seen_at` continua a funzionare e
-- i campi del disegno 31 restano modificabili.

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
  e_lui_stesso := OLD.auth_user_id is not null and OLD.auth_user_id = auth.uid();
  if not e_lui_stesso then
    return NEW;   -- non e' l'autista: non ci riguarda
  end if;

  -- Un titolare che e' anche autista di se stesso deve poter fare tutto.
  select exists (
    select 1 from public.org_members m
     where m.org_id = OLD.org_id and m.user_id = auth.uid()
  ) into e_ufficio;
  if e_ufficio then
    return NEW;
  end if;

  -- Da qui in giu': e' l'autista e non e' l'ufficio.
  -- Quello che PUO' cambiare: i campi del disegno 31 piu' i tempi che il
  -- telefono scrive da se'. Tutto il resto torna com'era.
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

  -- Restano suoi: nome, cognome, telefono, email (il disegno 31), piu'
  -- last_seen_at, last_login_at e onboarded_at, che li scrive l'app.
  return NEW;
end;
$$;

comment on function public.staff_drivers_colonne_sue() is
  'L''autista puo'' cambiare solo nome, cognome, telefono, email e i propri tempi. Il resto torna al valore di prima: la regola di riga staff_drivers_self_update_last_seen concede tutta la riga e in Postgres non sa limitare le colonne.';

drop trigger if exists trg_staff_drivers_colonne_sue on public.staff_drivers;
create trigger trg_staff_drivers_colonne_sue
  before update on public.staff_drivers
  for each row execute function public.staff_drivers_colonne_sue();

-- ── Prove da fare dopo (col gettone di un autista, non col service_role) ──
--   update staff_drivers set costo_orario = 999 where auth_user_id = auth.uid();
--     -- passa senza errore, ma costo_orario NON cambia
--   update staff_drivers set telefono = '333 111 2222' where auth_user_id = auth.uid();
--     -- cambia
--   update staff_drivers set mobile_account_disabled_at = null where auth_user_id = auth.uid();
--     -- NON cambia
--
-- E col gettone di un titolare, dal gestionale: tutto come prima.
