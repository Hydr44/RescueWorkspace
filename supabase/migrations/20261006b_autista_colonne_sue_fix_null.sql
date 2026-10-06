-- 20261006b_autista_colonne_sue_fix_null.sql
--
-- CORREGGE UN DIFETTO della migration 20261006_autista_colonne_sue.sql, che
-- e' GIA' APPLICATA SU STAGING. Da eseguire su staging SUBITO, e su
-- produzione solo questa versione (la precedente NON va messa in prod da sola).
--
-- ── Il difetto: la logica a tre valori di SQL ───────────────────────────
-- La versione di prima apriva cosi':
--
--   e_lui_stesso := OLD.auth_user_id is not null and OLD.auth_user_id = auth.uid();
--   if not e_lui_stesso then return NEW; end if;
--
-- Quando chi scrive NON ha un `auth.uid()` — cioe' il **service_role**: il
-- sito, il pannello admin, i cron, il battito di `last_seen_at` — allora
-- `auth.uid()` e' NULL, e in SQL:
--
--   true AND NULL  =  NULL        (non false!)
--   NOT NULL       =  NULL        (non true!)
--   if NULL then ... end if       → NON esegue
--
-- Quindi il `return NEW` che doveva far passare tutto NON scattava. Si
-- scendeva al controllo su `org_members`, che con `auth.uid()` NULL non trova
-- nessuna riga, e da li' si finiva dritti nel blocco che riporta le colonne al
-- valore di prima.
--
-- Risultato misurato su staging: ogni scrittura server-side su
-- `staff_drivers` si vedeva le colonne riportate indietro IN SILENZIO. Niente
-- errore, niente traccia: la UPDATE diceva «fatto» e il valore non cambiava.
-- Colpiva la creazione dell'account autista dal sito, le modifiche dal
-- pannello admin, e `mobile_account_disabled_at` scritto da una route — cioe'
-- proprio la cosa che questo trigger doveva proteggere.
--
-- ── La correzione ───────────────────────────────────────────────────────
-- Basta mettere `auth.uid() is not null` come PRIMO termine: `false AND NULL`
-- in SQL fa false, non NULL. Verificato sul database:
--     prima:  e_lui_stesso = NULL   → il return NEW non scattava
--     dopo:   e_lui_stesso = false  → il return NEW scatta
-- Il `coalesce` in piu' e' una cintura: se un giorno qualcuno rimette un
-- termine che puo' valere NULL, il comportamento resta «lascia passare».

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
  -- `auth.uid() is not null` PER PRIMO: senza, con il service_role tutta la
  -- catena vale NULL e il controllo qui sotto non esegue. Vedi l'intestazione.
  e_lui_stesso := auth.uid() is not null
                  and OLD.auth_user_id is not null
                  and OLD.auth_user_id = auth.uid();

  if not coalesce(e_lui_stesso, false) then
    return NEW;   -- il service_role, o un impiegato: non ci riguarda
  end if;

  -- Un titolare che e' anche autista di se stesso deve poter fare tutto.
  select exists (
    select 1 from public.org_members m
     where m.org_id = OLD.org_id and m.user_id = auth.uid()
  ) into e_ufficio;
  if coalesce(e_ufficio, false) then
    return NEW;
  end if;

  -- Da qui in giu': e' l'autista in persona, e non e' l'ufficio.
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
  'L''autista puo'' cambiare solo nome, cognome, telefono, email e i propri tempi. Il resto torna al valore di prima. v2: `auth.uid() is not null` per primo, altrimenti con il service_role la catena AND vale NULL e le scritture server-side venivano annullate in silenzio.';

-- Il trigger e' lo stesso di prima: si rimette per sicurezza, nel caso questa
-- migration venga eseguita da sola su un database pulito.
drop trigger if exists trg_staff_drivers_colonne_sue on public.staff_drivers;
create trigger trg_staff_drivers_colonne_sue
  before update on public.staff_drivers
  for each row execute function public.staff_drivers_colonne_sue();

-- ── Prove, in quest'ordine ──────────────────────────────────────────────
-- 1. Col service_role (la console Supabase), su un autista di prova:
--      update staff_drivers set costo_orario = 12.5 where id = <id>;
--      select costo_orario from staff_drivers where id = <id>;   -- 12.5: PASSA
--    Prima della correzione questo restava al valore di prima.
--
-- 2. Col gettone di un autista (dall'app, o con un JWT suo):
--      update staff_drivers set costo_orario = 999 where auth_user_id = auth.uid();
--        -- nessun errore, ma costo_orario NON cambia
--      update staff_drivers set mobile_account_disabled_at = null where auth_user_id = auth.uid();
--        -- NON cambia
--      update staff_drivers set telefono = '333 111 2222' where auth_user_id = auth.uid();
--        -- cambia
--
-- 3. Col gettone di un titolare, dal gestionale: tutto come prima.
