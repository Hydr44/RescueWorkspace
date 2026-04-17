-- Migration: Add vehicle info fields to demolition_cases
-- Created: 2026-04-13
-- Purpose: Fix dashboard error - add marca, modello columns

ALTER TABLE demolition_cases
  ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
  ADD COLUMN IF NOT EXISTS modello VARCHAR(150);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_demolition_cases_marca_modello 
  ON demolition_cases(marca, modello);

COMMENT ON COLUMN demolition_cases.marca IS 'Vehicle brand/manufacturer';
COMMENT ON COLUMN demolition_cases.modello IS 'Vehicle model';
