-- Migrazione: Aggiungi colonna 'marca' mancante alla tabella vehicles
-- Data: 21 Febbraio 2026
-- Fix: Could not find the 'marca' column of 'vehicles' in the schema cache

-- La tabella vehicles esiste già, aggiungiamo solo la colonna marca
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS marca text;

-- Aggiungi colonne aggiuntive utili se non esistono
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS anno integer;

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS cilindrata integer;

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS kw integer;

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS cv integer;

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS alimentazione text;

-- Aggiungi colonne scadenze se non esistono
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS scad_assicurazione text;

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS scad_revisione text;

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS scad_bollo text;

-- Rimuovi constraint NOT NULL da plate (targa può essere NULL per veicoli in demolizione)
ALTER TABLE public.vehicles 
ALTER COLUMN plate DROP NOT NULL;

-- Commenti per documentazione
COMMENT ON COLUMN public.vehicles.marca IS 'Marca del veicolo (es. Fiat, Ford, Mercedes)';
COMMENT ON COLUMN public.vehicles.modello IS 'Modello del veicolo (es. Ducato, Transit, Sprinter)';
COMMENT ON COLUMN public.vehicles.anno IS 'Anno di immatricolazione';
COMMENT ON COLUMN public.vehicles.alimentazione IS 'Tipo alimentazione: benzina, diesel, gpl, metano, elettrico, ibrido';
