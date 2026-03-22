-- Migrazione: Conservazione sostitutiva
-- Traccia documenti archiviati a norma (fatture XML firmate)

CREATE TABLE IF NOT EXISTS invoice_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  archive_date TIMESTAMPTZ DEFAULT now(),
  hash_sha256 TEXT NOT NULL,
  original_filename TEXT,
  storage_path TEXT,
  xml_content TEXT,
  archive_status TEXT DEFAULT 'archived' CHECK (archive_status IN ('archived', 'verified', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(invoice_id)
);

-- RLS
ALTER TABLE invoice_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org archive"
  ON invoice_archive FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org archive"
  ON invoice_archive FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Funzione RPC: archivia fattura
CREATE OR REPLACE FUNCTION archive_invoice(
  p_invoice_id UUID,
  p_org_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_archive_id UUID;
  v_xml TEXT;
  v_hash TEXT;
  v_filename TEXT;
  v_inv RECORD;
BEGIN
  -- Verifica che la fattura esista e sia dell'org
  SELECT id, number, date, meta, sdi_status
  INTO v_inv
  FROM invoices
  WHERE id = p_invoice_id AND org_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fattura non trovata o non appartenente all''organizzazione';
  END IF;

  -- Verifica che non sia gia archiviata
  IF EXISTS (SELECT 1 FROM invoice_archive WHERE invoice_id = p_invoice_id) THEN
    RAISE EXCEPTION 'Fattura gia archiviata';
  END IF;

  -- Estrai XML dai meta (se disponibile)
  v_xml := v_inv.meta->>'generated_xml';
  IF v_xml IS NULL THEN
    v_xml := v_inv.meta->>'original_xml';
  END IF;

  -- Calcola hash SHA-256 del contenuto
  IF v_xml IS NOT NULL THEN
    v_hash := encode(sha256(v_xml::bytea), 'hex');
  ELSE
    v_hash := encode(sha256(p_invoice_id::text::bytea), 'hex');
  END IF;

  -- Genera nome file
  v_filename := 'INV_' || COALESCE(v_inv.number, p_invoice_id::text) || '_' || COALESCE(v_inv.date::text, '') || '.xml';

  -- Inserisci record archivio
  INSERT INTO invoice_archive (org_id, invoice_id, hash_sha256, original_filename, xml_content, metadata)
  VALUES (
    p_org_id,
    p_invoice_id,
    v_hash,
    v_filename,
    v_xml,
    jsonb_build_object(
      'sdi_status', v_inv.sdi_status,
      'invoice_number', v_inv.number,
      'invoice_date', v_inv.date,
      'archived_by', auth.uid()
    )
  )
  RETURNING id INTO v_archive_id;

  -- Aggiorna stato fattura
  UPDATE invoices
  SET sdi_status = 'archived',
      meta = meta || jsonb_build_object('archived_at', now()::text, 'archive_id', v_archive_id::text)
  WHERE id = p_invoice_id;

  RETURN v_archive_id;
END;
$$;
