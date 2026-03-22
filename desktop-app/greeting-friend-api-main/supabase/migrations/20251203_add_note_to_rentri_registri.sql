-- Migration: Add note column to rentri_registri
-- Created: 2025-12-03
-- Description: Aggiunge colonna note alla tabella rentri_registri

ALTER TABLE IF EXISTS rentri_registri 
ADD COLUMN IF NOT EXISTS note TEXT;

COMMENT ON COLUMN rentri_registri.note IS 'Note interne sul registro (non trasmesse a RENTRI)';

