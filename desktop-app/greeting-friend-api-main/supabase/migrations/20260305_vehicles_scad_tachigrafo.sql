-- Migration: aggiungi colonna scad_tachigrafo alla tabella vehicles
-- Data: 2026-03-05

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS scad_tachigrafo date;

COMMENT ON COLUMN public.vehicles.scad_tachigrafo IS 'Scadenza tachigrafo digitale';
