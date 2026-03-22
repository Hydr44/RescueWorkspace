-- ============================================================================
-- MIGRAZIONE: Fix RLS completo per tutte le tabelle
-- Data: 2026-02-13
--
-- STATO PRE-MIGRAZIONE (dal dump):
--   - 33 tabelle con RLS OFF (molte con policy scritte ma inutili)
--   - is_member() ROTTA: punta a tabella "memberships" inesistente
--   - is_org_admin() usa current_role_for() che legge users.ruolo
--   - current_org_id() legge profiles.org_id (non JWT)
--   - Policy dev_all con true/true su clients, transports, quotes
--   - ~80 policy duplicate/conflittuali
--   - global_counters e app_versions sono tabelle globali (no org_id)
--
-- COSA FA:
--   1. Fix TUTTE le funzioni helper (is_member, is_org_admin, ecc.)
--   2. Abilita RLS su tutte le 33 tabelle
--   3. Rimuove ~80 policy rotte/duplicate/insicure
--   4. Ricrea policy pulite e consistenti
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 0: Fix funzioni helper
-- ============================================================================

-- is_member: ERA ROTTA (puntava a "memberships" inesistente)
CREATE OR REPLACE FUNCTION public.is_member(org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = org AND user_id = auth.uid()
  );
$$;

-- fn_is_member: già funzionante, riscritta per consistenza
CREATE OR REPLACE FUNCTION public.fn_is_member(org uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v bool;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.org_members
    WHERE org_id = org AND user_id = v_uid
  ) INTO v;
  RETURN COALESCE(v, false);
END;
$$;

-- is_org_admin: ERA INDIRETTA (usava current_role_for → users.ruolo)
-- Ora legge direttamente da org_members.role
CREATE OR REPLACE FUNCTION public.is_org_admin(org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = org
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- is_org_member (1 param): pulita
CREATE OR REPLACE FUNCTION public.is_org_member(p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org AND user_id = auth.uid()
  );
$$;

-- is_org_member (2 params): pulita (era lentissima con information_schema)
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id AND user_id = p_user_id
  );
$$;

-- current_org_id: mantiene logica esistente (profiles.org_id)
-- Non tocchiamo perché il mobile/desktop la usano così
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

-- current_role_for: manteniamo ma aggiungiamo fallback su org_members
CREATE OR REPLACE FUNCTION public.current_role_for(org uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT ruolo FROM public.users
     WHERE auth_user_id = auth.uid() AND org_id = org
     ORDER BY created_at DESC LIMIT 1),
    (SELECT role FROM public.org_members
     WHERE user_id = auth.uid() AND org_id = org
     LIMIT 1)
  );
$$;

-- is_staff: nuova funzione helper
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_staff FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- PARTE 1: Abilitare RLS su TUTTE le tabelle che ce l'hanno disabilitato
-- ============================================================================

ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_billing_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentri_codifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentri_formulari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentri_movimenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentri_org_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentri_registri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 2: Rimuovere policy PERICOLOSE (dev_all, true/true, duplicate)
-- ============================================================================

-- --- clients: rimuovere dev_all e policy duplicate ---
DROP POLICY IF EXISTS "clients_dev_all" ON public.clients;
DROP POLICY IF EXISTS "org_scope" ON public.clients;
DROP POLICY IF EXISTS "clients: by org" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

-- --- drivers: rimuovere select_all (true) e duplicata ---
DROP POLICY IF EXISTS "drivers_select_all" ON public.drivers;
DROP POLICY IF EXISTS "drivers: by org" ON public.drivers;

-- --- org_members: rimuovere authenticated_access (true/true) e duplicate ---
DROP POLICY IF EXISTS "org_members_authenticated_access" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select_scope" ON public.org_members;
DROP POLICY IF EXISTS "org_members_insert_self" ON public.org_members;
DROP POLICY IF EXISTS "org_members_delete_self" ON public.org_members;
DROP POLICY IF EXISTS "org_members_update_self" ON public.org_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.org_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.org_members;
DROP POLICY IF EXISTS "Staff can view all org_members" ON public.org_members;

-- --- orgs: rimuovere authenticated_access (true/true) e duplicate ---
DROP POLICY IF EXISTS "orgs_authenticated_access" ON public.orgs;
DROP POLICY IF EXISTS "insert orgs" ON public.orgs;
DROP POLICY IF EXISTS "orgs_insert_authenticated" ON public.orgs;
DROP POLICY IF EXISTS "orgs_select" ON public.orgs;
DROP POLICY IF EXISTS "orgs_select_where_member" ON public.orgs;
DROP POLICY IF EXISTS "select orgs for members" ON public.orgs;
DROP POLICY IF EXISTS "Staff can view all orgs" ON public.orgs;

-- --- profiles: rimuovere le tantissime duplicate ---
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_oauth_insert" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin can update profiles org_id" ON public.profiles;
DROP POLICY IF EXISTS "admin can upsert profiles org_id" ON public.profiles;
DROP POLICY IF EXISTS "profiles_oauth_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_mine" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_rw" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
DROP POLICY IF EXISTS "update own profile" ON public.profiles;

-- --- transports: rimuovere dev_all e tutte le duplicate ---
DROP POLICY IF EXISTS "transports_dev_all" ON public.transports;
DROP POLICY IF EXISTS "org_scope" ON public.transports;
DROP POLICY IF EXISTS "transports_all" ON public.transports;
DROP POLICY IF EXISTS "transports_claim_update" ON public.transports;
DROP POLICY IF EXISTS "transports_delete" ON public.transports;
DROP POLICY IF EXISTS "transports_insert" ON public.transports;
DROP POLICY IF EXISTS "transports_select" ON public.transports;
DROP POLICY IF EXISTS "transports_select_by_org" ON public.transports;
DROP POLICY IF EXISTS "transports_update" ON public.transports;
DROP POLICY IF EXISTS "update transports same org" ON public.transports;
DROP POLICY IF EXISTS "insert transports" ON public.transports;
DROP POLICY IF EXISTS "read transports same org" ON public.transports;
DROP POLICY IF EXISTS "tr_admin_delete" ON public.transports;
DROP POLICY IF EXISTS "tr_admin_insert" ON public.transports;
DROP POLICY IF EXISTS "tr_admin_update" ON public.transports;
DROP POLICY IF EXISTS "tr_driver_claim" ON public.transports;
DROP POLICY IF EXISTS "tr_driver_update_own" ON public.transports;
DROP POLICY IF EXISTS "tr_select_same_org" ON public.transports;

-- --- vehicles: rimuovere select_all (true) e duplicate ---
DROP POLICY IF EXISTS "vehicles_select_all" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles: by org" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete" ON public.vehicles;

-- --- quotes: rimuovere dev_all ---
DROP POLICY IF EXISTS "quotes_dev_all" ON public.quotes;
DROP POLICY IF EXISTS "quotes_all" ON public.quotes;
DROP POLICY IF EXISTS "org_scope" ON public.quotes;

-- --- rentri_codifiche: rimuovere duplicata ---
DROP POLICY IF EXISTS "Everyone can view codifiche" ON public.rentri_codifiche;
DROP POLICY IF EXISTS "Anyone can read codifiche" ON public.rentri_codifiche;

-- --- rentri_formulari: rimuovere insert duplicata ---
DROP POLICY IF EXISTS "Users can insert formulari in their org" ON public.rentri_formulari;

-- --- rentri_movimenti: rimuovere insert duplicata ---
DROP POLICY IF EXISTS "Users can create movimenti for their org" ON public.rentri_movimenti;

-- --- rentri_registri: rimuovere insert duplicata ---
DROP POLICY IF EXISTS "Users can insert registri in their org" ON public.rentri_registri;

-- --- rentri_org_certificates: rimuovere insert duplicata ---
DROP POLICY IF EXISTS "Admins can insert certificates" ON public.rentri_org_certificates;

-- --- barcode_lookup: policy ok, solo RLS era spento (già abilitato sopra) ---

-- --- recognition_logs: policy ok, solo RLS era spento ---

-- --- org_settings: rimuovere policy troppo permissive ---
DROP POLICY IF EXISTS "org_settings_select" ON public.org_settings;
DROP POLICY IF EXISTS "org_settings_update" ON public.org_settings;
DROP POLICY IF EXISTS "org_settings_delete" ON public.org_settings;
DROP POLICY IF EXISTS "org_settings_insert" ON public.org_settings;
DROP POLICY IF EXISTS "org_settings_admin_select" ON public.org_settings;
DROP POLICY IF EXISTS "org_settings_admin_write" ON public.org_settings;

-- --- quote_presets: rimuovere policy troppo permissive ---
DROP POLICY IF EXISTS "quote_presets_update" ON public.quote_presets;
DROP POLICY IF EXISTS "quote_presets_select" ON public.quote_presets;
DROP POLICY IF EXISTS "quote_presets_insert" ON public.quote_presets;
DROP POLICY IF EXISTS "quote_presets_delete" ON public.quote_presets;
DROP POLICY IF EXISTS "qp_admin_all" ON public.quote_presets;

-- --- subscriptions: rimuovere duplicate ---
DROP POLICY IF EXISTS "subscriptions: me" ON public.subscriptions;
DROP POLICY IF EXISTS "read own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "read_own_subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "read own subs" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_self" ON public.subscriptions;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;

-- --- oauth_tokens: rimuovere policy troppo aperte ---
DROP POLICY IF EXISTS "Allow oauth token insertion" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Allow oauth token selection" ON public.oauth_tokens;
DROP POLICY IF EXISTS "oauth_tokens_user_access" ON public.oauth_tokens;

-- --- users: rimuovere policy conflittuali (service_only con false) ---
DROP POLICY IF EXISTS "users_update_service_only" ON public.users;
DROP POLICY IF EXISTS "users_insert_service_only" ON public.users;

-- ============================================================================
-- PARTE 3: Ricreare policy PULITE e CORRETTE
-- ============================================================================

-- =====================
-- clients (org-scoped)
-- =====================
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "clients_delete" ON public.clients FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- drivers (org-scoped)
-- =====================
CREATE POLICY "drivers_select" ON public.drivers FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "drivers_insert" ON public.drivers FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "drivers_update" ON public.drivers FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "drivers_delete" ON public.drivers FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- vehicles (org-scoped)
-- =====================
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "vehicles_insert" ON public.vehicles FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "vehicles_update" ON public.vehicles FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "vehicles_delete" ON public.vehicles FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- org_members
-- =====================
CREATE POLICY "org_members_select" ON public.org_members FOR SELECT
  USING (user_id = auth.uid() OR is_member(org_id));
CREATE POLICY "org_members_insert" ON public.org_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_org_admin(org_id)
  );
CREATE POLICY "org_members_update" ON public.org_members FOR UPDATE
  USING (user_id = auth.uid() OR is_org_admin(org_id))
  WITH CHECK (user_id = auth.uid() OR is_org_admin(org_id));
CREATE POLICY "org_members_delete" ON public.org_members FOR DELETE
  USING (user_id = auth.uid() OR is_org_admin(org_id));
CREATE POLICY "org_members_staff_select" ON public.org_members FOR SELECT
  USING (is_staff());

-- =====================
-- orgs
-- =====================
CREATE POLICY "orgs_select" ON public.orgs FOR SELECT
  USING (is_member(id));
CREATE POLICY "orgs_insert_staff_only" ON public.orgs FOR INSERT
  WITH CHECK (is_staff());
CREATE POLICY "orgs_update" ON public.orgs FOR UPDATE
  USING (is_org_admin(id)) WITH CHECK (is_org_admin(id));
CREATE POLICY "orgs_staff_select" ON public.orgs FOR SELECT
  USING (is_staff());

-- =====================
-- profiles
-- =====================
CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "profiles_select_same_org" ON public.profiles FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT om.org_id FROM org_members om WHERE om.user_id = auth.uid())
  );
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_staff_select" ON public.profiles FOR SELECT
  USING (is_staff());
CREATE POLICY "profiles_staff_update" ON public.profiles FOR UPDATE
  USING (is_staff());

-- =====================
-- transports (org-scoped + driver claim)
-- =====================
CREATE POLICY "transports_select" ON public.transports FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "transports_insert" ON public.transports FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "transports_update" ON public.transports FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "transports_delete" ON public.transports FOR DELETE
  USING (is_org_admin(org_id));
-- Driver può claimare un trasporto non assegnato nella sua org
CREATE POLICY "transports_driver_claim" ON public.transports FOR UPDATE
  USING (org_id = current_org_id() AND driver_id IS NULL)
  WITH CHECK (org_id = current_org_id() AND driver_id = auth.uid());
-- Driver può aggiornare i propri trasporti
CREATE POLICY "transports_driver_update_own" ON public.transports FOR UPDATE
  USING (org_id = current_org_id() AND driver_id = auth.uid())
  WITH CHECK (org_id = current_org_id() AND driver_id = auth.uid());

-- =====================
-- quotes (org-scoped)
-- =====================
CREATE POLICY "quotes_select" ON public.quotes FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "quotes_insert" ON public.quotes FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "quotes_update" ON public.quotes FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "quotes_delete" ON public.quotes FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- rentri_codifiche (tabella di lookup, read-only per tutti gli autenticati)
-- =====================
CREATE POLICY "rentri_codifiche_select" ON public.rentri_codifiche FOR SELECT TO authenticated
  USING (true);

-- =====================
-- org_settings (org-scoped, read per membri, write per admin)
-- =====================
CREATE POLICY "org_settings_select" ON public.org_settings FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "org_settings_insert" ON public.org_settings FOR INSERT
  WITH CHECK (is_org_admin(org_id));
CREATE POLICY "org_settings_update" ON public.org_settings FOR UPDATE
  USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));
CREATE POLICY "org_settings_delete" ON public.org_settings FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- quote_presets (org-scoped, read per membri, write per admin)
-- =====================
CREATE POLICY "quote_presets_select" ON public.quote_presets FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "quote_presets_insert" ON public.quote_presets FOR INSERT
  WITH CHECK (is_org_admin(org_id));
CREATE POLICY "quote_presets_update" ON public.quote_presets FOR UPDATE
  USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));
CREATE POLICY "quote_presets_delete" ON public.quote_presets FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- subscriptions (user-scoped)
-- =====================
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================
-- oauth_tokens (user-scoped)
-- =====================
CREATE POLICY "oauth_tokens_select" ON public.oauth_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "oauth_tokens_insert" ON public.oauth_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "oauth_tokens_update" ON public.oauth_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "oauth_tokens_delete" ON public.oauth_tokens FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- PARTE 4: Policy per tabelle che avevano RLS OFF e ZERO policy
-- ============================================================================

-- =====================
-- invoices (org-scoped)
-- =====================
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- invoice_items (via invoices join)
-- =====================
CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = invoice_items.invoice_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = invoice_items.invoice_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = invoice_items.invoice_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = invoice_items.invoice_id AND m.user_id = auth.uid()
  ));

-- =====================
-- accounting_entries (org-scoped)
-- =====================
CREATE POLICY "accounting_entries_select" ON public.accounting_entries FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "accounting_entries_insert" ON public.accounting_entries FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "accounting_entries_update" ON public.accounting_entries FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "accounting_entries_delete" ON public.accounting_entries FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- chart_of_accounts (org-scoped)
-- =====================
CREATE POLICY "chart_of_accounts_select" ON public.chart_of_accounts FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "chart_of_accounts_insert" ON public.chart_of_accounts FOR INSERT
  WITH CHECK (is_org_admin(org_id));
CREATE POLICY "chart_of_accounts_update" ON public.chart_of_accounts FOR UPDATE
  USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));
CREATE POLICY "chart_of_accounts_delete" ON public.chart_of_accounts FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- company_settings (org-scoped)
-- =====================
CREATE POLICY "company_settings_select" ON public.company_settings FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "company_settings_insert" ON public.company_settings FOR INSERT
  WITH CHECK (is_org_admin(org_id));
CREATE POLICY "company_settings_update" ON public.company_settings FOR UPDATE
  USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));
CREATE POLICY "company_settings_delete" ON public.company_settings FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- export_configurations (org-scoped)
-- =====================
CREATE POLICY "export_configurations_select" ON public.export_configurations FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "export_configurations_insert" ON public.export_configurations FOR INSERT
  WITH CHECK (is_member(org_id));
CREATE POLICY "export_configurations_update" ON public.export_configurations FOR UPDATE
  USING (is_member(org_id)) WITH CHECK (is_member(org_id));
CREATE POLICY "export_configurations_delete" ON public.export_configurations FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- export_history (org-scoped)
-- =====================
CREATE POLICY "export_history_select" ON public.export_history FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "export_history_insert" ON public.export_history FOR INSERT
  WITH CHECK (is_member(org_id));

-- =====================
-- export_templates (org-scoped)
-- =====================
CREATE POLICY "export_templates_select" ON public.export_templates FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "export_templates_insert" ON public.export_templates FOR INSERT
  WITH CHECK (is_org_admin(org_id));
CREATE POLICY "export_templates_update" ON public.export_templates FOR UPDATE
  USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));
CREATE POLICY "export_templates_delete" ON public.export_templates FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- org_billing_connections (org-scoped, admin only)
-- =====================
CREATE POLICY "org_billing_connections_select" ON public.org_billing_connections FOR SELECT
  USING (is_member(org_id));
CREATE POLICY "org_billing_connections_insert" ON public.org_billing_connections FOR INSERT
  WITH CHECK (is_org_admin(org_id));
CREATE POLICY "org_billing_connections_update" ON public.org_billing_connections FOR UPDATE
  USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));
CREATE POLICY "org_billing_connections_delete" ON public.org_billing_connections FOR DELETE
  USING (is_org_admin(org_id));

-- =====================
-- user_2fa_settings (user-scoped)
-- =====================
CREATE POLICY "user_2fa_select" ON public.user_2fa_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_2fa_insert" ON public.user_2fa_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_2fa_update" ON public.user_2fa_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_2fa_delete" ON public.user_2fa_settings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================
-- user_notification_settings (user-scoped)
-- =====================
CREATE POLICY "user_notif_select" ON public.user_notification_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_notif_insert" ON public.user_notification_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_notif_update" ON public.user_notification_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================
-- user_sessions (user-scoped)
-- =====================
CREATE POLICY "user_sessions_select" ON public.user_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_sessions_insert" ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_sessions_update" ON public.user_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_sessions_delete" ON public.user_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================
-- global_counters (tabella globale — no org_id, solo key/last_number/updated_at)
-- =====================
CREATE POLICY "global_counters_select" ON public.global_counters FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "global_counters_insert" ON public.global_counters FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "global_counters_update" ON public.global_counters FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- =====================
-- default_export_templates (read-only lookup per autenticati)
-- =====================
CREATE POLICY "default_export_templates_select" ON public.default_export_templates FOR SELECT TO authenticated
  USING (true);

-- =====================
-- billing_providers (read-only lookup per autenticati)
-- =====================
CREATE POLICY "billing_providers_select" ON public.billing_providers FOR SELECT TO authenticated
  USING (true);

-- =====================
-- app_versions (read-only per autenticati, write per staff)
-- =====================
CREATE POLICY "app_versions_select" ON public.app_versions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "app_versions_staff_manage" ON public.app_versions FOR ALL
  USING (is_staff());

-- =====================
-- app_heartbeats (user-scoped insert, staff read)
-- =====================
CREATE POLICY "app_heartbeats_insert" ON public.app_heartbeats FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "app_heartbeats_select_own" ON public.app_heartbeats FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "app_heartbeats_staff_select" ON public.app_heartbeats FOR SELECT
  USING (is_staff());

-- =====================
-- maintenance_mode (staff-only)
-- =====================
CREATE POLICY "maintenance_mode_select" ON public.maintenance_mode FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "maintenance_mode_staff_manage" ON public.maintenance_mode FOR ALL
  USING (is_staff());

-- =====================
-- outbox_emails (staff-only, service_role per insert)
-- =====================
CREATE POLICY "outbox_emails_staff_select" ON public.outbox_emails FOR SELECT
  USING (is_staff());
CREATE POLICY "outbox_emails_insert" ON public.outbox_emails FOR INSERT TO authenticated
  WITH CHECK (is_member(org_id));

-- =====================
-- sdi_events (via invoices join — ha invoice_id, non org_id)
-- =====================
CREATE POLICY "sdi_events_select" ON public.sdi_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = sdi_events.invoice_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "sdi_events_insert" ON public.sdi_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = sdi_events.invoice_id AND m.user_id = auth.uid()
  ));

-- =====================
-- invoice_due (via invoices join — ha invoice_id, non org_id)
-- =====================
CREATE POLICY "invoice_due_select" ON public.invoice_due FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "invoice_due_insert" ON public.invoice_due FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "invoice_due_update" ON public.invoice_due FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "invoice_due_delete" ON public.invoice_due FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN org_members m ON m.org_id = i.org_id AND m.role IN ('owner','admin')
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));

-- =====================
-- staff (RLS on ma zero policy — staff-only)
-- =====================
CREATE POLICY "staff_select" ON public.staff FOR SELECT
  USING (is_staff());
CREATE POLICY "staff_manage" ON public.staff FOR ALL
  USING (is_staff());

-- =====================
-- staff_sessions (RLS on ma zero policy — staff-only)
-- =====================
CREATE POLICY "staff_sessions_select" ON public.staff_sessions FOR SELECT
  USING (is_staff());
CREATE POLICY "staff_sessions_manage" ON public.staff_sessions FOR ALL
  USING (is_staff());

COMMIT;
