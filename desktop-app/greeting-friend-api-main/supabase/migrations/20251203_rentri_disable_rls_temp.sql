-- Migration TEMPORANEA: Disabilita RLS per Test
-- Created: 2025-12-03
-- Description: Disabilita RLS per permettere test/sviluppo
-- ⚠️ SOLO PER SVILUPPO/TEST - Non per produzione!

-- ==========================================
-- DISABILITA RLS su Tabelle RENTRI
-- ==========================================

ALTER TABLE rentri_formulari DISABLE ROW LEVEL SECURITY;
ALTER TABLE rentri_movimenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE rentri_registri DISABLE ROW LEVEL SECURITY;
ALTER TABLE rentri_codifiche DISABLE ROW LEVEL SECURITY;

-- Note: rentri_org_certificates mantiene RLS per sicurezza certificati

-- ==========================================
-- Per riabilitare in futuro (quando membership è OK):
-- ==========================================

-- ALTER TABLE rentri_formulari ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rentri_movimenti ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rentri_registri ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rentri_codifiche ENABLE ROW LEVEL SECURITY;

