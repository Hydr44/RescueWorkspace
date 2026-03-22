-- Sistema codici interni e contatori per ricambi
-- Formato: RM-{CATEGORIA}-{ANNO}-{PROGRESSIVO}

-- Tabella contatori per codici interni
CREATE TABLE IF NOT EXISTS spare_parts_code_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  category_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, category_code, year)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_code_counters_org ON spare_parts_code_counters(org_id);
CREATE INDEX IF NOT EXISTS idx_code_counters_lookup ON spare_parts_code_counters(org_id, category_code, year);

-- RLS
ALTER TABLE spare_parts_code_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org counters"
  ON spare_parts_code_counters FOR SELECT
  USING (is_member(org_id));

CREATE POLICY "Users can insert own org counters"
  ON spare_parts_code_counters FOR INSERT
  WITH CHECK (is_member(org_id));

CREATE POLICY "Users can update own org counters"
  ON spare_parts_code_counters FOR UPDATE
  USING (is_member(org_id));

-- Funzione per generare prossimo codice interno
CREATE OR REPLACE FUNCTION next_spare_part_code(
  p_org_id UUID,
  p_category_code VARCHAR(10)
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER;
  v_counter INTEGER;
  v_code TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());
  
  -- Inserisci o aggiorna contatore
  INSERT INTO spare_parts_code_counters (org_id, category_code, year, counter)
  VALUES (p_org_id, p_category_code, v_year, 1)
  ON CONFLICT (org_id, category_code, year)
  DO UPDATE SET 
    counter = spare_parts_code_counters.counter + 1,
    updated_at = NOW()
  RETURNING counter INTO v_counter;
  
  -- Genera codice: RM-{CAT}-{YEAR}-{NUM}
  v_code := 'RM-' || p_category_code || '-' || v_year || '-' || LPAD(v_counter::TEXT, 5, '0');
  
  RETURN v_code;
END;
$$;

-- Aggiungi colonna per barcode stampato
ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS barcode_printed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS barcode_printed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS label_count INTEGER DEFAULT 0;

COMMENT ON COLUMN spare_parts.barcode_printed IS 'Se TRUE, etichetta con barcode è stata stampata';
COMMENT ON COLUMN spare_parts.barcode_printed_at IS 'Data ultima stampa etichetta';
COMMENT ON COLUMN spare_parts.label_count IS 'Numero etichette stampate per questo ricambio';

-- Indice per ricerca rapida da scanner
CREATE INDEX IF NOT EXISTS idx_spare_parts_internal_code ON spare_parts(internal_code) WHERE internal_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spare_parts_oem_code ON spare_parts(oem_code) WHERE oem_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spare_parts_ean_code ON spare_parts(ean_code) WHERE ean_code IS NOT NULL;
