-- Migrazione: Numerazione fatture server-side
-- Tabella contatori + funzione RPC per generare numeri progressivi

-- Tabella contatori numerazione per organizzazione e anno
CREATE TABLE IF NOT EXISTS invoice_counters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, year)
);

-- RLS
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org counters"
  ON invoice_counters FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own org counters"
  ON invoice_counters FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Funzione RPC: genera prossimo numero fattura
-- Atomica e thread-safe grazie a FOR UPDATE
CREATE OR REPLACE FUNCTION next_invoice_number(
  p_org_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  p_prefix TEXT DEFAULT ''
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
  v_prefix TEXT;
BEGIN
  -- Inserisci contatore se non esiste, altrimenti incrementa atomicamente
  INSERT INTO invoice_counters (org_id, year, last_number, prefix)
  VALUES (p_org_id, p_year, 1, p_prefix)
  ON CONFLICT (org_id, year)
  DO UPDATE SET
    last_number = invoice_counters.last_number + 1,
    updated_at = now()
  RETURNING last_number, prefix INTO v_next, v_prefix;

  -- Formato: PREFIX/ANNO/NUMERO (es: "2026/1" o "FT/2026/1")
  IF v_prefix IS NOT NULL AND v_prefix != '' THEN
    RETURN v_prefix || '/' || p_year::TEXT || '/' || v_next::TEXT;
  ELSE
    RETURN p_year::TEXT || '/' || v_next::TEXT;
  END IF;
END;
$$;

-- Alias per compatibilita con il frontend (InvoiceNew.jsx chiama rpc_invoice_next_number)
CREATE OR REPLACE FUNCTION rpc_invoice_next_number(
  p_org_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN next_invoice_number(p_org_id);
END;
$$;
