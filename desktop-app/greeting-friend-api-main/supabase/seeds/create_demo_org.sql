-- ============================================================
-- CREAZIONE ORG DEMO - Step 1
-- Eseguire questo script per creare l'organizzazione demo
-- ============================================================

-- Step 1: Crea l'organizzazione demo
DO $$
DECLARE
  v_demo_org_id UUID;
  v_demo_user_id UUID;
BEGIN
  -- Verifica se esiste già un'org demo
  SELECT id INTO v_demo_org_id FROM orgs WHERE is_demo = true LIMIT 1;
  
  IF v_demo_org_id IS NOT NULL THEN
    RAISE NOTICE 'Org demo già esistente: %', v_demo_org_id;
    RETURN;
  END IF;
  
  -- Crea l'organizzazione demo
  INSERT INTO orgs (
    id,
    name,
    number,
    is_demo,
    vat,
    tax_code,
    address,
    phone,
    email,
    website,
    description,
    created_at
  ) VALUES (
    gen_random_uuid(),
    'Autodemolizioni Demo S.r.l.',
    999,  -- Numero org demo
    true,
    '99999999999',
    '99999999999',
    'Via Demo 123, Milano, MI 20100, IT',
    '+39 02 1234567',
    'demo@rescuemanager.eu',
    'https://demo.rescuemanager.eu',
    'Organizzazione demo per test e formazione',
    NOW()
  ) RETURNING id INTO v_demo_org_id;
  
  RAISE NOTICE 'Org demo creata: %', v_demo_org_id;
  
  -- Trova l'utente demo (deve esistere in auth.users)
  -- Email: demo@rescuemanager.eu
  SELECT id INTO v_demo_user_id 
  FROM auth.users 
  WHERE email = 'demo@rescuemanager.eu' 
  LIMIT 1;
  
  IF v_demo_user_id IS NULL THEN
    RAISE NOTICE 'ATTENZIONE: Utente demo@rescuemanager.eu non trovato in auth.users';
    RAISE NOTICE 'Crea prima l''utente tramite Supabase Dashboard → Authentication → Users';
    RAISE NOTICE 'Email: demo@rescuemanager.eu, Password: Demo2026!';
  ELSE
    -- Crea la membership per l'utente demo
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (v_demo_org_id, v_demo_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Membership creata per utente: %', v_demo_user_id;
  END IF;
  
  -- Crea abbonamento demo (Full plan, tutti i moduli attivi)
  INSERT INTO subscriptions (
    org_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    active_modules
  ) VALUES (
    v_demo_org_id,
    'full',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    ARRAY['sdi', 'rentri', 'rvfu', 'accounting', 'fleet', 'quotes', 'ricambi']
  )
  ON CONFLICT (org_id) DO UPDATE
  SET 
    plan_id = 'full',
    status = 'active',
    active_modules = ARRAY['sdi', 'rentri', 'rvfu', 'accounting', 'fleet', 'quotes', 'ricambi'];
  
  RAISE NOTICE 'Abbonamento Full creato per org demo';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'ORG DEMO CREATA CON SUCCESSO!';
  RAISE NOTICE 'Org ID: %', v_demo_org_id;
  RAISE NOTICE 'Ora esegui il seed dei dati: demo_seed_data.sql';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
