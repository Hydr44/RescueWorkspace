-- 20261006_turni_autista.sql
--
-- Il turno dell'autista: inizio e fine servizio dal telefono.
-- Disegno: RescueMobile/design/schermate/30-profilo.html, blocco «Servizio».
--
-- STATO: SCRITTA E NON ESEGUITA. Da applicare prima su staging.
--        Per tornare indietro:  drop table public.driver_shifts;
--                               delete from public.org_settings where key = 'mobile';
--
-- ── Perche' una tabella e non `staff_drivers.stato` ──────────────────────
-- `staff_drivers.stato` (disponibile / occupato / offline) la imposta l'UFFICIO
-- dal gestionale. Se l'autista la cambiasse dal telefono, l'ufficio se la
-- vedrebbe riscritta sotto senza accorgersene. E un turno non e' uno stato: e'
-- un fatto con due orari, e di fatti ce n'e' uno al giorno per autista. Dove
-- stanno tutti serve una tabella.
--
-- ── E' una funzione ATTIVABILE, spenta di serie ──────────────────────────
-- Chi non la vuole continua come adesso: gli orari li mette l'ufficio dal
-- gestionale e il coordinamento si fa a voce. L'interruttore sta in
-- `org_settings`, chiave `mobile`:
--     { "mostra_prezzi": true, "turni": false }
-- Nessuna azienda deve fare niente per restare come prima: il telefono legge
-- `turni = false` anche quando la riga non c'e' affatto.

-- ── La tabella ──────────────────────────────────────────────────────────
create table if not exists public.driver_shifts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  -- staff_drivers.id e' BIGINT sul database vero (le migration in archivio
  -- dicono uuid e si sbagliano: vedi STAGING_SCHEMA_LIVE.md).
  driver_id   bigint not null references public.staff_drivers(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  -- Da dove e' stato timbrato: serve all'ufficio per capire chi l'ha chiuso.
  source      text not null default 'mobile' check (source in ('mobile', 'desktop')),
  created_at  timestamptz not null default now(),
  -- Un turno non puo' finire prima di cominciare.
  constraint driver_shifts_ordine check (ended_at is null or ended_at >= started_at)
);

comment on table public.driver_shifts is
  'Turni di servizio degli autisti. Funzione attivabile per azienda: org_settings key=mobile, campo turni.';

-- UN SOLO turno aperto per autista. Lo garantisce l'indice, non il codice:
-- se due telefoni provano insieme, il secondo prende un errore invece di
-- aprire un secondo turno che poi nessuno chiude.
create unique index if not exists driver_shifts_uno_aperto
  on public.driver_shifts (driver_id)
  where ended_at is null;

-- Le due letture che servono: «i turni di questo autista» e «i turni di oggi
-- dell'azienda», che e' quello che guardera' l'ufficio.
create index if not exists driver_shifts_autista_data
  on public.driver_shifts (driver_id, started_at desc);
create index if not exists driver_shifts_org_data
  on public.driver_shifts (org_id, started_at desc);

-- ── Chi puo' fare cosa ──────────────────────────────────────────────────
alter table public.driver_shifts enable row level security;

-- L'autista vede e timbra SOLO i suoi. Il legame passa da `auth_user_id`
-- sulla sua riga di anagrafica: e' lo stesso modo in cui il telefono si
-- riconosce in tutto il resto dell'app.
drop policy if exists driver_shifts_autista_legge on public.driver_shifts;
create policy driver_shifts_autista_legge on public.driver_shifts
  for select using (
    driver_id in (select id from public.staff_drivers where auth_user_id = auth.uid())
  );

drop policy if exists driver_shifts_autista_apre on public.driver_shifts;
create policy driver_shifts_autista_apre on public.driver_shifts
  for insert with check (
    driver_id in (select id from public.staff_drivers where auth_user_id = auth.uid())
    and org_id in (select org_id from public.staff_drivers where auth_user_id = auth.uid())
  );

-- L'autista può solo CHIUDERE un turno che e' suo e ancora aperto. Non puo'
-- riaprire, non puo' spostare l'inizio, non puo' toccare quelli di ieri:
-- un registro che chi lo timbra puo' riscrivere non serve a niente.
drop policy if exists driver_shifts_autista_chiude on public.driver_shifts;
create policy driver_shifts_autista_chiude on public.driver_shifts
  for update using (
    ended_at is null
    and driver_id in (select id from public.staff_drivers where auth_user_id = auth.uid())
  ) with check (
    driver_id in (select id from public.staff_drivers where auth_user_id = auth.uid())
  );

-- L'ufficio vede e sistema i turni della sua azienda.
drop policy if exists driver_shifts_org_legge on public.driver_shifts;
create policy driver_shifts_org_legge on public.driver_shifts
  for select using (
    org_id in (select org_id from public.org_members where user_id = auth.uid())
  );

drop policy if exists driver_shifts_org_scrive on public.driver_shifts;
create policy driver_shifts_org_scrive on public.driver_shifts
  for all using (
    org_id in (select org_id from public.org_members where user_id = auth.uid())
  ) with check (
    org_id in (select org_id from public.org_members where user_id = auth.uid())
  );

-- ── L'inizio e la fine non si possono spostare a piacere ────────────────
-- L'autista chiude il turno, e la chiusura deve valere adesso: senza questo
-- controllo potrebbe mandare una data qualsiasi e farsi ore che non ha fatto.
-- L'ufficio dal gestionale invece corregge (gira con un altro ruolo).
create or replace function public.driver_shifts_chiusura_onesta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo per chi timbra dal telefono, cioe' l'autista stesso.
  if exists (
    select 1 from public.staff_drivers
     where id = NEW.driver_id and auth_user_id = auth.uid()
  ) then
    -- L'inizio non si tocca.
    if NEW.started_at is distinct from OLD.started_at then
      NEW.started_at := OLD.started_at;
    end if;
    -- La fine e' adesso, non quando dice il telefono (che puo' avere
    -- l'orologio sbagliato, o essere stato spostato di proposito).
    if NEW.ended_at is not null and OLD.ended_at is null then
      NEW.ended_at := now();
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_driver_shifts_chiusura on public.driver_shifts;
create trigger trg_driver_shifts_chiusura
  before update on public.driver_shifts
  for each row execute function public.driver_shifts_chiusura_onesta();

-- ── L'interruttore delle due funzioni del telefono ──────────────────────
-- Non si scrive niente per nessuna azienda: i valori di serie stanno nel
-- codice del telefono (`mostra_prezzi` acceso, `turni` spento), quindi senza
-- riga tutto resta come oggi. Questa riga la scrive il gestionale quando
-- qualcuno tocca l'interruttore.
--
-- Per accendere i turni a un'azienda, a mano:
--   insert into public.org_settings (org_id, key, value)
--   values ('<org_id>', 'mobile', '{"mostra_prezzi": true, "turni": true}'::jsonb)
--   on conflict (org_id, key) do update
--     set value = public.org_settings.value || excluded.value,
--         updated_at = now();
--
-- Per nascondere i prezzi agli autisti di un'azienda:
--   ... value = '{"mostra_prezzi": false}'::jsonb ...

-- ── Controlli dopo l'esecuzione ─────────────────────────────────────────
--   select count(*) from public.driver_shifts;                  -- 0
--   select indexname from pg_indexes where tablename = 'driver_shifts';
--     -- driver_shifts_pkey, driver_shifts_uno_aperto,
--     -- driver_shifts_autista_data, driver_shifts_org_data
--   select policyname from pg_policies where tablename = 'driver_shifts';  -- 5
--
-- Prova dell'indice unico (deve FALLIRE la seconda):
--   insert into public.driver_shifts (org_id, driver_id) values ('<org>', <id>);
--   insert into public.driver_shifts (org_id, driver_id) values ('<org>', <id>);
--     -- ERROR: duplicate key value violates unique constraint "driver_shifts_uno_aperto"
