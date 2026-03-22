-- Migration per fixare RLS sulla tabella invoices e invoice_items
-- Disabilita temporaneamente RLS per permettere inserimenti
-- ⚠️ ATTENZIONE: Questa è una soluzione temporanea per sviluppo
-- ⚠️ In produzione, riabilita RLS e usa le policy corrette

-- Rimuovi tutte le policy esistenti prima di disabilitare RLS su invoices
DROP POLICY IF EXISTS "invoices_org_members_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_org_members_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_org_members_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_org_members_delete" ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoices for their org" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their org" ON public.invoices;
DROP POLICY IF EXISTS "Users can update invoices for their org" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete invoices for their org" ON public.invoices;

-- Disabilita RLS su invoices
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

-- Rimuovi tutte le policy esistenti prima di disabilitare RLS su invoice_items
DROP POLICY IF EXISTS "invoice_items_org_members_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_org_members_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_org_members_update" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_org_members_delete" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can view invoice_items for their org" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice_items for their org" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update invoice_items for their org" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice_items for their org" ON public.invoice_items;

-- Disabilita RLS su invoice_items
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;

-- Commenti per ricordare di riabilitare RLS
COMMENT ON TABLE public.invoices IS 
  '⚠️ RLS DISABILITATO - Riabilita RLS con policy corrette prima di produzione';
COMMENT ON TABLE public.invoice_items IS 
  '⚠️ RLS DISABILITATO - Riabilita RLS con policy corrette prima di produzione';

