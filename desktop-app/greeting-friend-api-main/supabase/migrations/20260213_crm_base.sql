-- ============================================================
-- CRM Base: Timeline, Note, Tags, Pipeline
-- 2026-02-13
-- ============================================================

-- ─── Pipeline stages (lookup) ───
CREATE TABLE IF NOT EXISTS client_pipeline_stages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        text NOT NULL,            -- es. lead, prospect, cliente, fidelizzato, perso
  color       text NOT NULL DEFAULT '#3b82f6',  -- hex color per UI
  position    int  NOT NULL DEFAULT 0,  -- ordine nel funnel
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

ALTER TABLE client_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read pipeline stages"
  ON client_pipeline_stages FOR SELECT
  USING (is_member(org_id));

CREATE POLICY "org admins can manage pipeline stages"
  ON client_pipeline_stages FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

-- Default stages per ogni org (inseriti via trigger o manualmente)
-- Non inseriamo qui perché dipende dall'org_id

-- ─── Tags ───
CREATE TABLE IF NOT EXISTS client_tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        text NOT NULL,            -- es. VIP, moroso, nuovo, ricorrente
  color       text NOT NULL DEFAULT '#6366f1',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read tags"
  ON client_tags FOR SELECT
  USING (is_member(org_id));

CREATE POLICY "org admins can manage tags"
  ON client_tags FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

-- Junction table: client ↔ tag (many-to-many)
CREATE TABLE IF NOT EXISTS client_tag_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES client_tags(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, tag_id)
);

ALTER TABLE client_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read tag assignments"
  ON client_tag_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clients c WHERE c.id = client_id AND is_member(c.org_id)
  ));

CREATE POLICY "org members can manage tag assignments"
  ON client_tag_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM clients c WHERE c.id = client_id AND is_member(c.org_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients c WHERE c.id = client_id AND is_member(c.org_id)
  ));

-- ─── Pipeline stage on clients ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'pipeline_stage_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN pipeline_stage_id uuid REFERENCES client_pipeline_stages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Activities / Timeline ───
CREATE TABLE IF NOT EXISTS client_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type        text NOT NULL DEFAULT 'note',
  -- types: note, call, email, visit, quote_created, transport_created,
  --        invoice_created, status_change, tag_added, tag_removed, pipeline_change
  title       text,
  body        text,
  metadata    jsonb DEFAULT '{}',       -- dati extra (es. old_stage, new_stage, tag_name)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_activities_client ON client_activities(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_activities_org    ON client_activities(org_id, created_at DESC);

ALTER TABLE client_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read activities"
  ON client_activities FOR SELECT
  USING (is_member(org_id));

CREATE POLICY "org members can insert activities"
  ON client_activities FOR INSERT
  WITH CHECK (is_member(org_id));

CREATE POLICY "org admins can delete activities"
  ON client_activities FOR DELETE
  USING (is_org_admin(org_id));

-- ─── Notes (shortcut view — activities of type 'note') ───
-- No separate table needed, just filter client_activities WHERE type = 'note'

-- ─── Function: initialize default pipeline stages for an org ───
CREATE OR REPLACE FUNCTION init_pipeline_stages(p_org_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO client_pipeline_stages (org_id, name, color, position) VALUES
    (p_org_id, 'Lead',        '#3b82f6', 0),
    (p_org_id, 'Prospect',    '#f59e0b', 1),
    (p_org_id, 'Cliente',     '#10b981', 2),
    (p_org_id, 'Fidelizzato', '#8b5cf6', 3),
    (p_org_id, 'Perso',       '#ef4444', 4)
  ON CONFLICT (org_id, name) DO NOTHING;
END;
$$;

-- ─── Function: initialize default tags for an org ───
CREATE OR REPLACE FUNCTION init_client_tags(p_org_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO client_tags (org_id, name, color) VALUES
    (p_org_id, 'VIP',         '#f59e0b'),
    (p_org_id, 'Moroso',      '#ef4444'),
    (p_org_id, 'Nuovo',       '#3b82f6'),
    (p_org_id, 'Ricorrente',  '#10b981'),
    (p_org_id, 'Da ricontattare', '#8b5cf6')
  ON CONFLICT (org_id, name) DO NOTHING;
END;
$$;

-- ─── Initialize for all existing orgs ───
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM orgs LOOP
    PERFORM init_pipeline_stages(r.id);
    PERFORM init_client_tags(r.id);
  END LOOP;
END;
$$;
