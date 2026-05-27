-- 20260527d_demo_org_hard_delete.sql
-- Funzione `delete_org_cascade(uuid)`: hard-delete completo di un'org e tutti
-- i suoi dati (usata dalla conversione lead demo → cliente pagante, dove la
-- nuova architettura prevede org_demo SEPARATA dalla nuova org_prod, e la
-- demo viene rasa al suolo al pagamento).
--
-- Perché serve: la maggior parte delle FK verso `orgs(id)` è senza
-- `ON DELETE CASCADE` (default `NO ACTION`), quindi un `DELETE FROM orgs`
-- diretto fallisce. Questa funzione ordina le DELETE per dipendenza FK e
-- usa guard `information_schema` per non rompersi se una tabella manca in
-- ambienti staging/dev con schema parziale.
--
-- Lascia INTATTI:
--   - auth.users (l'utente sopravvive: stessa mail per l'org prod)
--   - profiles  (il chiamante deve aver già riassegnato `current_org`)
--   - leads     (storico lead conservato; `demo_org_id` viene nullato)
--   - lead_demos (storico conservato; `demo_org_id` nullato, status→converted)
--
-- Sicurezza: SECURITY DEFINER + check explicit lock anti-uso accidentale.
-- Chiamabile SOLO con `is_demo=true` per evitare disastri.

-- Drop any prior signature: una versione precedente potrebbe esistere con
-- un nome parametro diverso (es. `p_org_id`), e Postgres non permette a
-- `CREATE OR REPLACE` di rinominare i parametri di input.
drop function if exists public.delete_org_cascade(uuid);

create or replace function public.delete_org_cascade(target_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_demo_check boolean;
  t text;
  tables_org_scoped text[] := array[
    -- Children di invoices/transports/vehicles/clients: cancellare prima
    -- (la maggior parte cascade già, ma esplicito per safety)
    'sdi_events',
    'invoice_items',
    'invoice_reminders',
    'transport_tracking',
    'transport_routes',
    'client_activities',
    'client_tag_assignments',
    'spare_parts_compatibility',
    'ticket_messages',

    -- Tabelle org-scoped foglia / di servizio
    'audit_log',
    'org_billing_connections',
    'org_settings',
    'org_subscriptions',
    'quote_presets',
    'quote_templates',
    'rvfu_configurations',
    'assistance_requests',
    'barcode_lookup',
    'external_api_configs',
    'gps_devices',
    'marketplace_favorites',
    'marketplace_org_stats',
    'marketplace_listings',
    'marketplace_offers',
    'dynamic_pricing',
    'recognition_logs',
    'smart_suggestions',
    'rentri_codifiche',
    'rentri_codifiche_cache',
    'rentri_formulari',
    'rentri_movimenti',
    'rentri_registri',
    'rentri_notifiche',
    'rentri_org_certificates',
    'rvfu_cases',
    'spare_parts',
    'yard_vehicles',
    'client_tags',
    'client_pipeline_stages',
    'company_settings',
    'operators',
    'outbox_emails',
    'accounting_entries',
    'support_tickets',
    'cookie_consents',

    -- Dati core (dopo i loro children)
    'invoices',
    'ddt',
    'quotes',
    'demolition_cases',
    'drivers',
    'staff_drivers',
    'staff_vehicles',
    'transports',
    'clients',
    'vehicles',
    'vehicles_catalog',

    -- org_members per ultimo: serve per RLS durante eventuali cleanup
    'org_members'
  ];
begin
  if target_org_id is null then
    raise exception 'delete_org_cascade: target_org_id is null';
  end if;

  -- 0. Children senza org_id (linked via padre): cancellare PRIMA dei padri.
  --    `ddt_items.ddt_id` e `invoice_due.invoice_id` non hanno org_id in colonna,
  --    quindi non vengono pescati dal loop su tables_org_scoped.
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='ddt_items') then
    delete from public.ddt_items
      where ddt_id in (select id from public.ddt where org_id = target_org_id);
  end if;
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='invoice_due') then
    delete from public.invoice_due
      where invoice_id in (select id from public.invoices where org_id = target_org_id);
  end if;

  -- Safety: vietato cancellare org di produzione tramite questa funzione.
  select is_demo into is_demo_check from public.orgs where id = target_org_id;
  if is_demo_check is null then
    raise notice 'delete_org_cascade: org % non trovata, nulla da fare', target_org_id;
    return;
  end if;
  if is_demo_check is not true then
    raise exception 'delete_org_cascade: org % NON è demo (is_demo=%). Aborted per sicurezza.', target_org_id, is_demo_check;
  end if;

  -- 1. Nullify ref esterne che non hanno ON DELETE SET NULL/CASCADE
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='leads' and column_name='demo_org_id') then
    update public.leads set demo_org_id = null where demo_org_id = target_org_id;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='lead_demos' and column_name='demo_org_id') then
    update public.lead_demos
      set demo_org_id = null,
          status = case when status = 'active' then 'converted' else status end
      where demo_org_id = target_org_id;
  end if;

  -- 2. profiles.current_org / profiles.org_id: nullify se ancora puntano qui
  --    (il chiamante DOVREBBE aver già riassegnato, ma defensive)
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles' and column_name='current_org') then
    update public.profiles set current_org = null where current_org = target_org_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles' and column_name='org_id') then
    update public.profiles set org_id = null where org_id = target_org_id;
  end if;

  -- 3. DELETE su tutte le tabelle org-scoped (ordine FK)
  foreach t in array tables_org_scoped loop
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name=t and column_name='org_id') then
      execute format('delete from public.%I where org_id = $1', t) using target_org_id;
    end if;
  end loop;

  -- 3b. marketplace_offers ha anche buyer_org_id (alternativa a org_id)
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='marketplace_offers' and column_name='buyer_org_id') then
    delete from public.marketplace_offers where buyer_org_id = target_org_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='marketplace_offers' and column_name='seller_org_id') then
    delete from public.marketplace_offers where seller_org_id = target_org_id;
  end if;

  -- 4. Finalmente l'org stessa
  delete from public.orgs where id = target_org_id;

  raise notice 'delete_org_cascade: org % cancellata', target_org_id;
end;
$$;

comment on function public.delete_org_cascade is
  'Hard-delete di un''org demo (is_demo=true) e tutti i suoi dati org-scoped. Rifiuta org non-demo per sicurezza. Usata da lead-api/convert.js dopo conversione cliente.';

-- Permessi: solo service role (lead-api gira con service_role key)
revoke all on function public.delete_org_cascade(uuid) from public, authenticated, anon;
grant execute on function public.delete_org_cascade(uuid) to service_role;
