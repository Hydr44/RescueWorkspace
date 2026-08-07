-- ============================================================================
-- DUMP SCHEMA (stato corrente) — tabelle del flusso Preventivo→Pagamento→Attivazione
-- Estratto da supabase/STAGING_SCHEMA_LIVE.md (snapshot DB live staging).
-- NB: snapshot di sole colonne (tipo + nullabilità). PK/FK/CHECK/DEFAULT
--     reali stanno nelle migration: usare questo come RIFERIMENTO, non come
--     pg_dump completo. Le note (PK/FK) sono indicate in commento a fine riga.
-- ============================================================================

CREATE TABLE public.leads (
  id uuid NOT NULL,  -- PK
  name text NOT NULL,
  email text,
  phone text,
  company text,
  type text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  source text NOT NULL,
  notes text,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  contacted_at timestamp with time zone,
  converted_at timestamp with time zone,
  last_email_at timestamp with time zone,
  email_count integer NOT NULL,
  tags text[],
  demo_account_id uuid,
  demo_org_id uuid,  -- FK→orgs.id
  demo_expires_at timestamp with time zone,
  demo_modules text[],
  vat_number text,
  codice_fiscale text,
  pec text,
  address_street text,
  address_city text,
  address_province text,
  address_postal_code text,
  forma_giuridica text,
  codice_ateco text,
  lifecycle_stage text,
  lead_score integer,
  lead_temperature text,
  industry text,
  company_size text,
  vehicles_per_month integer,
  current_software text,
  pain_points text[],
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer_url text,
  landing_page text,
  first_contact_channel text,
  referred_by_lead_id uuid,  -- FK→leads.id
  last_email_opened_at timestamp with time zone,
  last_email_clicked_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  engagement_score integer,
  email_subscribed boolean,
  email_unsubscribed_at timestamp with time zone,
  communication_preferences jsonb,
  preferred_contact_time text,
  next_followup_at timestamp with time zone,
  next_followup_action text,
  lost_reason text,
  lost_to_competitor text,
  expected_close_date date,
  expected_deal_value numeric,
  probability_to_close integer,
  decision_timeline text,
  decision_makers jsonb,
  ltv numeric,
  mrr_contribution numeric,
  churn_risk_score integer,
  health_score integer,
  custom_fields jsonb,
  first_contact_at timestamp with time zone,
  first_contact_method text,
  first_contact_notes text,
  first_contact_by uuid
);

CREATE TABLE public.lead_quotes (
  id uuid NOT NULL,  -- PK
  lead_id uuid NOT NULL,  -- FK→leads.id
  quote_number text NOT NULL,
  plan_type text,
  base_modules text[],
  special_modules text[],
  customizations text,
  base_price numeric NOT NULL,
  special_modules_price numeric,
  customizations_price numeric,
  discount_percent numeric,
  discount_amount numeric,
  monthly_total numeric NOT NULL,
  yearly_total numeric,
  setup_fee numeric,
  custom_base_price numeric,
  custom_rvfu_price numeric,
  custom_rentri_price numeric,
  custom_fatturazione_price numeric,
  contract_duration text,
  payment_method text,
  billing_frequency text,
  special_terms text,
  status text,
  public_uuid uuid,
  quote_date date NOT NULL,
  expiry_date date NOT NULL,
  sent_at timestamp with time zone,
  viewed_at timestamp with time zone,
  accepted_at timestamp with time zone,
  paid_at timestamp with time zone,
  pdf_url text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  stripe_checkout_session_id text,
  version integer,
  parent_quote_id uuid,  -- FK→lead_quotes.id
  quote_title text,
  internal_notes text,
  terms_and_conditions text,
  acceptance_ip inet,
  acceptance_user_agent text,
  acceptance_signature_data jsonb,
  rejected_at timestamp with time zone,
  rejection_reason text,
  rejection_ip inet,
  viewed_count integer,
  last_viewed_at timestamp with time zone,
  reminder_sent_count integer,
  last_reminder_at timestamp with time zone,
  requires_approval boolean,
  approved_by uuid,
  approved_at timestamp with time zone,
  discount_reason text,
  discount_approved_by uuid,
  trial_unit text,
  trial_quantity integer,
  trial_modules text[],
  post_trial_action text,
  auto_activate_on_payment boolean,
  activation_pending boolean,
  activated_at timestamp with time zone,
  activated_by uuid,
  activation_notes text,
  payment_link_url text,
  external_payment_method text,
  external_payment_reference text,
  external_payment_amount numeric,
  external_payment_date date,
  external_payment_notes text,
  external_payment_recorded_by uuid,
  external_payment_recorded_at timestamp with time zone,
  attachments jsonb,
  setup_description text,
  includes_onboarding boolean,
  onboarding_hours integer,
  includes_training boolean,
  training_hours integer,
  includes_data_import boolean,
  sla_response_hours integer,
  internal_reference text,
  commission_rate numeric,
  commission_recipient uuid
);

CREATE TABLE public.lead_demos (
  id uuid NOT NULL,  -- PK
  lead_id uuid NOT NULL,  -- FK→leads.id
  demo_account_id uuid,
  demo_org_id uuid,  -- FK→orgs.id
  duration_days integer,
  modules_enabled text[] NOT NULL,
  sample_data_loaded boolean,
  status text,
  activated_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  last_login_at timestamp with time zone,
  login_count integer,
  modules_used text[],
  data_created jsonb,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  trial_unit text,
  trial_quantity integer,
  grace_period_days integer,
  trial_extended_count integer,
  auto_extend_on_engagement boolean,
  conversion_offer_sent boolean,
  related_quote_id uuid,  -- FK→lead_quotes.id
  demo_type text,
  seed_data boolean,
  seed_profile text,
  access_email text,
  access_password_set boolean,
  show_in_marketing boolean,
  pilot_assigned_to uuid,
  pilot_objectives text,
  conversion_probability integer
);

CREATE TABLE public.plan_activation_links (
  id uuid NOT NULL,  -- PK
  token text NOT NULL,
  org_id uuid NOT NULL,  -- FK→orgs.id
  plan text NOT NULL,
  modules text[] NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL,
  created_by uuid,
  link_type text NOT NULL,
  trial_days integer,
  billing_period character varying
);

CREATE TABLE public.plans (
  id text NOT NULL,  -- PK
  label text NOT NULL,
  monthly_price integer NOT NULL,
  yearly_price integer NOT NULL,
  max_modules integer NOT NULL,
  description text,
  is_active boolean NOT NULL,
  sort_order integer NOT NULL
);

CREATE TABLE public.org_subscriptions (
  org_id uuid NOT NULL,  -- PK FK→orgs.id
  status text NOT NULL,
  plan text NOT NULL,
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone,
  is_custom boolean,
  custom_notes text,
  custom_price numeric,
  billing_type text,
  stripe_subscription_id text,
  modules text[],
  stripe_portal_url text,
  trial_end timestamp with time zone,
  created_at timestamp with time zone
);

CREATE TABLE public.orgs (
  id uuid NOT NULL,  -- PK
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  created_by uuid,
  description text,
  address text,
  phone text,
  email text,
  website text,
  vat text,
  tax_code text,
  updated_at timestamp with time zone,
  number integer,
  is_demo boolean,
  demo_expires_at timestamp with time zone,
  web_access_enabled boolean,
  web_features text[],
  desktop_access_enabled boolean,
  desktop_modules text[],
  converted_from_lead_id uuid  -- FK→leads.id
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,  -- PK
  email text,
  stripe_customer_id text,
  created_at timestamp with time zone,
  current_org uuid,
  updated_at timestamp with time zone,
  org_id uuid,
  full_name text,
  is_admin boolean,
  google_id text,
  avatar_url text,
  provider text,
  provider_id text,
  staff_role text,
  is_staff boolean,
  status text NOT NULL,
  onboarding_completed boolean,
  push_token text,
  push_token_updated_at timestamp with time zone,
  location_consent_at timestamp with time zone,
  location_consent_level text
);

CREATE TABLE public.invoice_payments (
  id uuid NOT NULL,  -- PK
  invoice_id uuid NOT NULL,  -- FK→invoices.id
  org_id uuid NOT NULL,  -- FK→orgs.id
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamp with time zone,
  created_by uuid,
  updated_at timestamp with time zone
);
