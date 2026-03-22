-- Migration: Tabella calendar_events per appuntamenti con clienti
-- File: supabase/migrations/20260306_calendar_events.sql

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Dettagli evento
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  type VARCHAR(50) NOT NULL DEFAULT 'appuntamento', -- appuntamento, scadenza, promemoria, personale, trasporto

  -- Date
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,

  -- Cliente collegato (opzionale)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255),  -- denormalizzato per visualizzazione rapida
  client_email VARCHAR(255), -- denormalizzato per invio email
  client_phone VARCHAR(50),

  -- Stato e notifiche
  status VARCHAR(30) DEFAULT 'confermato', -- confermato, annullato, completato, in_attesa
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  reminder_minutes INTEGER DEFAULT 60, -- promemoria N minuti prima

  -- Colore personalizzato (override del default dal tipo)
  color VARCHAR(20),

  -- Metadata
  created_by UUID,
  notes TEXT,
  meta JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(org_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_range ON calendar_events(org_id, start_at, end_at);

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view calendar_events for their org" ON calendar_events;
CREATE POLICY "Users can view calendar_events for their org" ON calendar_events
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert calendar_events for their org" ON calendar_events;
CREATE POLICY "Users can insert calendar_events for their org" ON calendar_events
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update calendar_events for their org" ON calendar_events;
CREATE POLICY "Users can update calendar_events for their org" ON calendar_events
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete calendar_events for their org" ON calendar_events;
CREATE POLICY "Users can delete calendar_events for their org" ON calendar_events
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

COMMENT ON TABLE calendar_events IS 'Appuntamenti e eventi del calendario aziendale, con possibilità di collegamento a clienti e invio email di conferma';
