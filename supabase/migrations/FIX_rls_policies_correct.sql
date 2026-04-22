-- FIX DEFINITIVO: Policy RLS corrette per org_members e orgs
-- Esegui questo DOPO aver testato con RLS disabilitato

-- ============================================
-- 1. PULIZIA POLICY ESISTENTI
-- ============================================

-- Rimuovi tutte le policy esistenti su org_members
DROP POLICY IF EXISTS "Users can view their org memberships" ON org_members;
DROP POLICY IF EXISTS "Users can insert org memberships" ON org_members;
DROP POLICY IF EXISTS "Users can update org memberships" ON org_members;
DROP POLICY IF EXISTS "Users can delete org memberships" ON org_members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON org_members;

-- Rimuovi tutte le policy esistenti su orgs
DROP POLICY IF EXISTS "Users can view orgs they belong to" ON orgs;
DROP POLICY IF EXISTS "Users can insert orgs" ON orgs;
DROP POLICY IF EXISTS "Users can update orgs" ON orgs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON orgs;

-- Rimuovi policy su profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================
-- 2. CREA POLICY CORRETTE
-- ============================================

-- Policy per org_members: ogni utente vede solo le sue membership
CREATE POLICY "Users can view their org memberships"
ON org_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy per orgs: ogni utente vede solo le org di cui è membro
CREATE POLICY "Users can view orgs they belong to"
ON orgs FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy per profiles: ogni utente vede solo il proprio profilo
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- 3. ABILITA RLS
-- ============================================

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. VERIFICA CONFIGURAZIONE
-- ============================================

-- Verifica che RLS sia abilitato
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('org_members', 'orgs', 'profiles')
ORDER BY tablename;

-- Verifica policy create
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('org_members', 'orgs', 'profiles')
ORDER BY tablename, policyname;
