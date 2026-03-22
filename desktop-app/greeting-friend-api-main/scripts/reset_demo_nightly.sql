-- ============================================================
-- RESET DEMO NIGHTLY - Script per cron notturno
-- Da eseguire ogni notte per resettare i dati demo
-- ============================================================

-- Trova l'org demo (is_demo = true)
DO $$
DECLARE
  v_demo_org_id UUID;
BEGIN
  -- Trova l'org demo
  SELECT id INTO v_demo_org_id FROM orgs WHERE is_demo = true LIMIT 1;
  
  IF v_demo_org_id IS NULL THEN
    RAISE NOTICE 'Nessuna org demo trovata (is_demo = true)';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Reset org demo: %', v_demo_org_id;
  
  -- Chiama la funzione di reset
  PERFORM reset_demo_org(v_demo_org_id);
  
  -- Re-seed i dati demo
  -- (Qui andrebbero eseguiti gli INSERT del seed, ma per semplicità
  --  si può eseguire il seed SQL completo separatamente dopo il reset)
  
  RAISE NOTICE 'Reset completato. Eseguire il seed SQL per ripopolare i dati.';
END $$;
