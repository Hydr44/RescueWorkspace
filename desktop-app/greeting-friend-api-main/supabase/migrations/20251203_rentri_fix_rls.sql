-- Migration: Fix RLS Policies per RENTRI
-- Created: 2025-12-03
-- Description: Drop e ricrea policies RLS per INSERT/UPDATE/DELETE

-- ==========================================
-- RENTRI_FORMULARI - RLS Policies
-- ==========================================

-- Enable RLS (safe if già abilitato)
ALTER TABLE rentri_formulari ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (se esistono)
DROP POLICY IF EXISTS "Users can view formulari of their org" ON rentri_formulari;
DROP POLICY IF EXISTS "Users can create formulari for their org" ON rentri_formulari;
DROP POLICY IF EXISTS "Users can update formulari of their org" ON rentri_formulari;
DROP POLICY IF EXISTS "Users can delete formulari of their org" ON rentri_formulari;

-- Ricrea policies complete
CREATE POLICY "Users can view formulari of their org"
  ON rentri_formulari FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create formulari for their org"
  ON rentri_formulari FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update formulari of their org"
  ON rentri_formulari FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete formulari of their org"
  ON rentri_formulari FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- RENTRI_MOVIMENTI - RLS Policies
-- ==========================================

ALTER TABLE rentri_movimenti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view movimenti of their org" ON rentri_movimenti;
DROP POLICY IF EXISTS "Users can create movimenti for their org" ON rentri_movimenti;
DROP POLICY IF EXISTS "Users can update movimenti of their org" ON rentri_movimenti;
DROP POLICY IF EXISTS "Users can delete movimenti of their org" ON rentri_movimenti;

CREATE POLICY "Users can view movimenti of their org"
  ON rentri_movimenti FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create movimenti for their org"
  ON rentri_movimenti FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update movimenti of their org"
  ON rentri_movimenti FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete movimenti of their org"
  ON rentri_movimenti FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- RENTRI_REGISTRI - RLS Policies
-- ==========================================

ALTER TABLE rentri_registri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view registri of their org" ON rentri_registri;
DROP POLICY IF EXISTS "Users can create registri for their org" ON rentri_registri;
DROP POLICY IF EXISTS "Users can update registri of their org" ON rentri_registri;
DROP POLICY IF EXISTS "Users can delete registri of their org" ON rentri_registri;

CREATE POLICY "Users can view registri of their org"
  ON rentri_registri FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create registri for their org"
  ON rentri_registri FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update registri of their org"
  ON rentri_registri FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete registri of their org"
  ON rentri_registri FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- RENTRI_CODIFICHE - RLS Policies (Read-Only)
-- ==========================================

ALTER TABLE rentri_codifiche ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view codifiche" ON rentri_codifiche;

CREATE POLICY "Everyone can view codifiche"
  ON rentri_codifiche FOR SELECT
  USING (true);

-- ==========================================
-- FINE - RLS Complete per RENTRI
-- ==========================================
