-- Regulatory Monitor — stato per fonte + storico eventi
-- Applicare su Supabase (SQL editor, oppure `supabase db push` se versionato).
-- Le tabelle sono backend-only: RLS attiva e NESSUNA policy => solo il
-- service_role (server VPS) può leggere/scrivere.

create table if not exists public.regulatory_monitor_state (
  source_id        text primary key,
  group_label      text,
  label            text,
  url              text,
  signature        text,        -- hash del contenuto (mode 'text') o dell'insieme di link
  items            jsonb,        -- mappa { url: titolo } (mode 'links')
  last_checked_at  timestamptz,
  last_changed_at  timestamptz,
  last_error       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.regulatory_monitor_events (
  id           uuid primary key default gen_random_uuid(),
  source_id    text not null,
  group_label  text,
  label        text,
  url          text,
  added        jsonb,           -- nuove voci rilevate
  summary      text,
  detected_at  timestamptz not null default now()
);

create index if not exists idx_regmon_events_detected
  on public.regulatory_monitor_events (detected_at desc);

alter table public.regulatory_monitor_state  enable row level security;
alter table public.regulatory_monitor_events enable row level security;

-- Lettura degli eventi dall'admin panel (anon/authenticated key). I dati sono
-- informazioni PUBBLICHE (titoli/URL di note e manuali ufficiali): nessuna
-- sensibilità. La tabella _state resta riservata al service_role (nessuna policy).
-- Se l'admin panel autentica via sessione Supabase puoi restringere a
-- `to authenticated`.
drop policy if exists "regmon_events_read" on public.regulatory_monitor_events;
create policy "regmon_events_read" on public.regulatory_monitor_events
  for select using (true);

-- Lettura dello stato corrente (elenco documenti/manuali più recenti per fonte)
-- dall'admin panel. Stessi presupposti: dati pubblici. La scrittura resta al
-- service_role del monitor (che bypassa la RLS).
drop policy if exists "regmon_state_read" on public.regulatory_monitor_state;
create policy "regmon_state_read" on public.regulatory_monitor_state
  for select using (true);
