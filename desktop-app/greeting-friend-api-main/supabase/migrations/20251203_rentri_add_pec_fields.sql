-- Migration: Aggiungi campi PEC e Rimorchio a Formulari
-- Created: 2025-12-03
-- Description: Campi opzionali ma consigliati per FIR completi

-- ==========================================
-- PEC e Rimorchio per Formulari
-- ==========================================

ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS produttore_pec VARCHAR(255),
  ADD COLUMN IF NOT EXISTS trasportatore_pec VARCHAR(255),
  ADD COLUMN IF NOT EXISTS destinatario_pec VARCHAR(255),
  ADD COLUMN IF NOT EXISTS trasportatore_rimorchio VARCHAR(20);

-- Commenti
COMMENT ON COLUMN rentri_formulari.produttore_pec IS 
  'PEC del produttore - Opzionale ma consigliato per comunicazioni ufficiali';

COMMENT ON COLUMN rentri_formulari.trasportatore_pec IS 
  'PEC del trasportatore - Opzionale ma consigliato';

COMMENT ON COLUMN rentri_formulari.destinatario_pec IS 
  'PEC del destinatario - Opzionale ma consigliato';

COMMENT ON COLUMN rentri_formulari.trasportatore_rimorchio IS 
  'Targa rimorchio trasportatore - Opzionale, solo se presente';

-- Fine migration

