-- Migrazione: Bollo virtuale, Ritenuta d'acconto, Cassa previdenziale
-- Conforme a FatturaPA 1.2.2 (DatiBollo, DatiRitenuta, DatiCassaPrevidenziale)

-- ==========================================
-- BOLLO VIRTUALE (Art. 6 DM 17/06/2014)
-- Obbligatorio per fatture esenti IVA (N1-N4) con importo > €77.47
-- Importo fisso: €2.00
-- ==========================================

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bollo_virtuale BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bollo_importo NUMERIC(10,2) DEFAULT 2.00;

COMMENT ON COLUMN public.invoices.bollo_virtuale IS 'Se true, applica bollo virtuale (DatiBollo in XML). Obbligatorio per fatture esenti IVA > €77.47';
COMMENT ON COLUMN public.invoices.bollo_importo IS 'Importo bollo virtuale (default €2.00 per DM 17/06/2014)';

-- ==========================================
-- RITENUTA D'ACCONTO (Art. 25 DPR 600/1973)
-- TipoRitenuta: RT01 (persone fisiche), RT02 (persone giuridiche)
-- CausalePagamento: A-Z (codice tributo)
-- ==========================================

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ritenuta_tipo TEXT CHECK (ritenuta_tipo IN ('RT01', 'RT02', 'RT03', 'RT04', 'RT05', 'RT06'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ritenuta_importo NUMERIC(10,2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ritenuta_aliquota NUMERIC(5,2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ritenuta_causale TEXT;

COMMENT ON COLUMN public.invoices.ritenuta_tipo IS 'Tipo ritenuta: RT01=persone fisiche, RT02=persone giuridiche, RT03=contributo INPS, RT04=contributo ENASARCO, RT05=contributo ENPAM, RT06=altro contributo previdenziale';
COMMENT ON COLUMN public.invoices.ritenuta_importo IS 'Importo ritenuta d''acconto calcolato';
COMMENT ON COLUMN public.invoices.ritenuta_aliquota IS 'Aliquota ritenuta (es. 20.00 per 20%)';
COMMENT ON COLUMN public.invoices.ritenuta_causale IS 'Causale pagamento ritenuta (A=prestazioni lavoro autonomo, B=royalties, ecc.)';

-- ==========================================
-- CASSA PREVIDENZIALE (Art. 1 L. 335/1995)
-- Per professionisti iscritti a casse previdenziali
-- TipoCassa: TC01-TC22
-- ==========================================

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cassa_tipo TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cassa_aliquota NUMERIC(5,2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cassa_importo NUMERIC(10,2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cassa_imponibile NUMERIC(10,2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cassa_aliquota_iva NUMERIC(5,2);

COMMENT ON COLUMN public.invoices.cassa_tipo IS 'Tipo cassa previdenziale: TC01=INPS, TC02=Cassa Avvocati, TC03=Cassa Ingegneri, TC04=Cassa Notariato, TC07=ENPAIA, TC22=INPS gestione separata, ecc.';
COMMENT ON COLUMN public.invoices.cassa_aliquota IS 'Aliquota contributo cassa (es. 4.00 per 4%)';
COMMENT ON COLUMN public.invoices.cassa_importo IS 'Importo contributo cassa calcolato';
COMMENT ON COLUMN public.invoices.cassa_imponibile IS 'Imponibile su cui calcolare il contributo cassa';
COMMENT ON COLUMN public.invoices.cassa_aliquota_iva IS 'Aliquota IVA applicata al contributo cassa';

-- ==========================================
-- TABELLA SOLLECITI PAGAMENTO
-- ==========================================

CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  reminder_type TEXT DEFAULT 'first' CHECK (reminder_type IN ('first', 'second', 'third', 'legal')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged')),
  notes TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org reminders"
  ON invoice_reminders FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org reminders"
  ON invoice_reminders FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice ON public.invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_org ON public.invoice_reminders(org_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_date ON public.invoice_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_status ON public.invoice_reminders(status);

COMMENT ON TABLE public.invoice_reminders IS 'Solleciti di pagamento per fatture scadute';
