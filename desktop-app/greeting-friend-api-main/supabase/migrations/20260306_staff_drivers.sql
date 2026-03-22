-- Migration: Create staff_drivers table
-- Required by: VehicleNew.jsx, DriverNew.jsx, Drivers.jsx, TransportNew.jsx

CREATE TABLE IF NOT EXISTS staff_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  cognome text DEFAULT '',
  telefono text DEFAULT '',
  email text DEFAULT '',
  patente text DEFAULT '',
  patente_scadenza date,
  stato text NOT NULL DEFAULT 'disponibile' CHECK (stato IN ('disponibile', 'occupato', 'offline')),
  assegnati_oggi integer NOT NULL DEFAULT 0,
  note text DEFAULT '',
  tags jsonb DEFAULT '[]'::jsonb,
  preferenze jsonb DEFAULT '[]'::jsonb,
  disp jsonb DEFAULT '{"lun":true,"mar":true,"mer":true,"gio":true,"ven":true,"sab":false,"dom":false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE staff_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_drivers_org_read" ON staff_drivers
  FOR SELECT USING (org_id = auth.jwt() ->> 'org_id'::text);

CREATE POLICY "staff_drivers_org_insert" ON staff_drivers
  FOR INSERT WITH CHECK (org_id = auth.jwt() ->> 'org_id'::text);

CREATE POLICY "staff_drivers_org_update" ON staff_drivers
  FOR UPDATE USING (org_id = auth.jwt() ->> 'org_id'::text);

CREATE POLICY "staff_drivers_org_delete" ON staff_drivers
  FOR DELETE USING (org_id = auth.jwt() ->> 'org_id'::text);

-- Index
CREATE INDEX IF NOT EXISTS idx_staff_drivers_org ON staff_drivers(org_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_staff_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_staff_drivers_updated_at
  BEFORE UPDATE ON staff_drivers
  FOR EACH ROW EXECUTE FUNCTION update_staff_drivers_updated_at();
