-- Fix 1: Enable RLS on ddt and ddt_items tables
ALTER TABLE public.ddt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddt_items ENABLE ROW LEVEL SECURITY;

-- Fix 2: Enable RLS on invoice_due table
ALTER TABLE public.invoice_due ENABLE ROW LEVEL SECURITY;

-- Create policies for ddt table (organization-scoped access)
CREATE POLICY "ddt_org_members_select" ON public.ddt
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = ddt.org_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "ddt_org_members_insert" ON public.ddt
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = ddt.org_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "ddt_org_members_update" ON public.ddt
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = ddt.org_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = ddt.org_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "ddt_org_members_delete" ON public.ddt
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = ddt.org_id AND m.user_id = auth.uid()
  ));

-- Create policies for ddt_items table (through ddt relationship)
CREATE POLICY "ddt_items_org_members_select" ON public.ddt_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ddt 
    JOIN public.org_members m ON m.org_id = ddt.org_id
    WHERE ddt.id = ddt_items.ddt_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "ddt_items_org_members_insert" ON public.ddt_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ddt 
    JOIN public.org_members m ON m.org_id = ddt.org_id
    WHERE ddt.id = ddt_items.ddt_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "ddt_items_org_members_update" ON public.ddt_items
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ddt 
    JOIN public.org_members m ON m.org_id = ddt.org_id
    WHERE ddt.id = ddt_items.ddt_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ddt 
    JOIN public.org_members m ON m.org_id = ddt.org_id
    WHERE ddt.id = ddt_items.ddt_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "ddt_items_org_members_delete" ON public.ddt_items
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ddt 
    JOIN public.org_members m ON m.org_id = ddt.org_id
    WHERE ddt.id = ddt_items.ddt_id AND m.user_id = auth.uid()
  ));

-- Create policies for invoice_due table (through invoices relationship)
CREATE POLICY "invoice_due_org_members_select" ON public.invoice_due
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.memberships m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "invoice_due_org_members_insert" ON public.invoice_due
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.memberships m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "invoice_due_org_members_update" ON public.invoice_due
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.memberships m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.memberships m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "invoice_due_org_members_delete" ON public.invoice_due
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.memberships m ON m.org_id = i.org_id
    WHERE i.id = invoice_due.invoice_id AND m.user_id = auth.uid()
  ));