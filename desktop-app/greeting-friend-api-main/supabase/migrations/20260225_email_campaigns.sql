-- ============================================================================
-- Email Campaigns & Templates
-- Per admin-panel: invio email automatiche a leads/clienti
-- ============================================================================

-- Template email riutilizzabili
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Campagne email inviate
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  template_id uuid REFERENCES email_templates(id),
  sent_by uuid REFERENCES auth.users(id),
  sent_by_email text,
  recipient_count int NOT NULL DEFAULT 0,
  recipient_type text NOT NULL DEFAULT 'leads',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Destinatari singoli per campagna
CREATE TABLE IF NOT EXISTS email_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  opened_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Note sui leads (timeline)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_count int NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- Lead notes / timeline
CREATE TABLE IF NOT EXISTS lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES auth.users(id),
  staff_email text,
  type text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Staff-only policies
CREATE POLICY "staff_all_email_templates" ON email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_email_campaigns" ON email_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_email_recipients" ON email_recipients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_lead_notes" ON lead_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indici
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_recipients_campaign ON email_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING gin(tags);
