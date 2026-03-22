-- Migration: Funzionalità Fatture Avanzate
-- Created: 2026-01-16
-- Description: Aggiunge colonne e tabelle per funzionalità avanzate fatture (sconti, note interne, pagamenti, email)

-- ==========================================
-- COLONNE INVOICES
-- ==========================================

-- Collegamento fattura originale (per note credito/debito)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS original_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Sconti e abbuoni
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0;

-- Note interne (non visibili su PDF/SDI)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS note_internal TEXT;
-- note (note_external) già esiste come campo 'note'

-- Stato pagamento
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue'));

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_invoices_original_invoice ON public.invoices(original_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_discount_type ON public.invoices(discount_type);

-- ==========================================
-- TABELLA INVOICE_PAYMENTS (Storico Pagamenti)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Pagamento
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  payment_method TEXT, -- 'cash', 'transfer', 'check', 'card', etc.
  
  -- Riferimenti
  reference_number TEXT, -- numero assegno, bonifico, etc.
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_org ON public.invoice_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON public.invoice_payments(payment_date);

-- RLS (Row Level Security) - se abilitato
-- ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "invoice_payments_org_members_select" ON public.invoice_payments
--   FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- ==========================================
-- TABELLA INVOICE_EMAIL_LOGS (Log Email)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.invoice_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Email
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_email_logs_invoice ON public.invoice_email_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_email_logs_org ON public.invoice_email_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_invoice_email_logs_status ON public.invoice_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_invoice_email_logs_sent_at ON public.invoice_email_logs(sent_at);

-- RLS (Row Level Security) - se abilitato
-- ALTER TABLE public.invoice_email_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "invoice_email_logs_org_members_select" ON public.invoice_email_logs
--   FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- ==========================================
-- COMMENTI
-- ==========================================

COMMENT ON COLUMN public.invoices.original_invoice_id IS 'ID fattura originale per note credito/debito (TD04/TD05)';
COMMENT ON COLUMN public.invoices.discount_type IS 'Tipo sconto: none, percentage, fixed';
COMMENT ON COLUMN public.invoices.discount_value IS 'Valore sconto (percentuale o importo fisso)';
COMMENT ON COLUMN public.invoices.note_internal IS 'Note interne (non visibili su PDF/SDI)';
COMMENT ON COLUMN public.invoices.payment_status IS 'Stato pagamento: pending, paid, partial, overdue';

COMMENT ON TABLE public.invoice_payments IS 'Storico pagamenti per fatture (non connesso a SDI)';
COMMENT ON TABLE public.invoice_email_logs IS 'Log invii email fatture (non connesso a SDI)';
