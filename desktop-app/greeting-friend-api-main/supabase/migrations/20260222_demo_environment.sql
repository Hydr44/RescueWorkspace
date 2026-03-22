-- ============================================================
-- DEMO ENVIRONMENT SETUP
-- Aggiunge flag is_demo su orgs e crea dati demo realistici
-- ============================================================

-- 1. Aggiungere colonna is_demo alla tabella orgs
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- 2. Creare funzione per reset demo (usata dal cron notturno)
CREATE OR REPLACE FUNCTION reset_demo_org(demo_org_id UUID)
RETURNS void AS $$
BEGIN
  -- Elimina dati esistenti dell'org demo (ordine per FK)
  DELETE FROM sdi_events WHERE invoice_id IN (SELECT id FROM invoices WHERE org_id = demo_org_id);
  DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE org_id = demo_org_id);
  DELETE FROM invoice_reminders WHERE invoice_id IN (SELECT id FROM invoices WHERE org_id = demo_org_id);
  DELETE FROM invoices WHERE org_id = demo_org_id;
  DELETE FROM spare_parts WHERE org_id = demo_org_id;
  DELETE FROM transports WHERE org_id = demo_org_id;
  DELETE FROM vehicles WHERE org_id = demo_org_id;
  DELETE FROM clients WHERE org_id = demo_org_id;
  DELETE FROM rentri_formulari WHERE org_id = demo_org_id;
  DELETE FROM rentri_movimenti WHERE org_id = demo_org_id;
  DELETE FROM rentri_registri WHERE org_id = demo_org_id;
  DELETE FROM rvfu_cases WHERE org_id = demo_org_id;
  DELETE FROM quotes WHERE org_id = demo_org_id;
  DELETE FROM accounting_entries WHERE org_id = demo_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Policy RLS: chiunque autenticato può leggere il flag is_demo della propria org
-- (già coperto dalle policy esistenti su orgs)

COMMENT ON COLUMN orgs.is_demo IS 'Flag per organizzazioni demo. Le org demo hanno restrizioni: no invio SDI/RENTRI/RVFU reale, dati resettati ogni notte.';
