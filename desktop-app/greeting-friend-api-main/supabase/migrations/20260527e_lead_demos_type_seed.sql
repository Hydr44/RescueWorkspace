-- 20260527e_lead_demos_type_seed.sql
-- Aggiunge `demo_type` e `seed_profile` su `lead_demos` per tracciare il
-- tipo di demo creata (showcase/trial/pilot) e il profilo di seed
-- applicato (autodemolitore_piccolo/grande/officina/flotta).
--
-- Il frontend admin-panel già passa questi campi all'attivazione (vedi
-- ActivateDemoPayload in admin-panel/src/lib/api.ts), e da oggi il
-- backend lead-api li scrive (con fallback se le colonne mancano).

alter table public.lead_demos
  add column if not exists demo_type text,
  add column if not exists seed_profile text;

-- CHECK constraint solo sui valori noti (NULL ammesso per back-compat).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lead_demos_demo_type_check'
  ) then
    alter table public.lead_demos
      add constraint lead_demos_demo_type_check
      check (demo_type is null or demo_type in ('showcase', 'trial', 'pilot'));
  end if;
end $$;

comment on column public.lead_demos.demo_type is
  'Tipo demo: showcase (dati seed pronti, vetrina), trial (account vuoto a tempo), pilot (POC con dati reali del prospect). Nullable per back-compat con righe pre-Mag 2026.';
comment on column public.lead_demos.seed_profile is
  'Profilo seed applicato: autodemolitore_piccolo|grande|officina|flotta. NULL se sample_data_loaded=false.';

create index if not exists idx_lead_demos_demo_type on public.lead_demos(demo_type);
