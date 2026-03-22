-- Migration: Movimenti Contabili
-- Created: 2026-01-16
-- Description: Sistema di movimenti contabili (partita doppia) per fatture, pagamenti, note credito/debito
-- NOTA: Sistema completamente separato da SDI (SDI gestisce solo XML fatture)

-- ==========================================
-- TABELLA CHART_OF_ACCOUNTS (Piano dei Conti)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Codice conto
  code TEXT NOT NULL, -- Codice conto (es. "120", "401", "2001")
  name TEXT NOT NULL, -- Nome conto (es. "Crediti verso clienti", "Ricavi vendite")
  
  -- Categoria
  category TEXT, -- 'asset', 'liability', 'revenue', 'expense', 'equity'
  subcategory TEXT, -- Sottocategoria (es. "current_assets", "sales", "tax")
  
  -- Configurazione
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- Conti di sistema (non modificabili)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_org ON public.chart_of_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON public.chart_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_active ON public.chart_of_accounts(org_id, is_active) WHERE is_active = true;

-- ==========================================
-- TABELLA ACCOUNTING_ENTRIES (Movimenti Contabili)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Riferimento documento
  document_type TEXT NOT NULL, -- 'invoice', 'payment', 'credit_note', 'debit_note', 'foreign_invoice', 'manual'
  document_id UUID, -- ID fattura, pagamento, ecc.
  
  -- Data contabile
  accounting_date DATE NOT NULL,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Movimento (Partita Doppia)
  account_code TEXT NOT NULL, -- Codice conto (es. "120", "401", "2001")
  account_name TEXT, -- Nome conto (derivato da chart_of_accounts, ma salvato per storico)
  debit_amount NUMERIC(10,2) DEFAULT 0 CHECK (debit_amount >= 0), -- Dare
  credit_amount NUMERIC(10,2) DEFAULT 0 CHECK (credit_amount >= 0), -- Avere
  
  -- Descrizione
  description TEXT, -- Descrizione movimento
  reference TEXT, -- Riferimento documento (es. "Fattura N. 001/2024")
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_accounting_entries_org ON public.accounting_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_document ON public.accounting_entries(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_date ON public.accounting_entries(accounting_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_account ON public.accounting_entries(account_code);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_date_range ON public.accounting_entries(org_id, accounting_date);

-- ==========================================
-- FUNZIONE: Inserisci Conti Predefiniti per Org
-- ==========================================

CREATE OR REPLACE FUNCTION public.init_chart_of_accounts_for_org(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Inserisci conti predefiniti solo se non esistono già
  INSERT INTO public.chart_of_accounts (org_id, code, name, category, subcategory, is_system)
  VALUES
    (p_org_id, '120', 'Crediti verso clienti', 'asset', 'current_assets', true),
    (p_org_id, '401', 'Ricavi vendite', 'revenue', 'sales', true),
    (p_org_id, '2001', 'IVA a debito', 'liability', 'tax', true),
    (p_org_id, '2002', 'IVA a credito', 'asset', 'tax', true),
    (p_org_id, '1001', 'Banca c/c', 'asset', 'current_assets', true),
    (p_org_id, '1002', 'Cassa', 'asset', 'current_assets', true),
    (p_org_id, '600', 'Costi per acquisti', 'expense', 'purchases', true),
    (p_org_id, '200', 'Debiti verso fornitori', 'liability', 'current_liabilities', true)
  ON CONFLICT (org_id, code) DO NOTHING;
END;
$$;

-- ==========================================
-- COMMENTI TABELLE
-- ==========================================

COMMENT ON TABLE public.chart_of_accounts IS 'Piano dei conti configurabile per ogni organizzazione';
COMMENT ON TABLE public.accounting_entries IS 'Movimenti contabili (partita doppia) generati automaticamente da fatture, pagamenti, note credito/debito';
COMMENT ON COLUMN public.accounting_entries.document_type IS 'Tipo documento: invoice, payment, credit_note, debit_note';
COMMENT ON COLUMN public.accounting_entries.debit_amount IS 'Importo Dare (debito)';
COMMENT ON COLUMN public.accounting_entries.credit_amount IS 'Importo Avere (credito)';
