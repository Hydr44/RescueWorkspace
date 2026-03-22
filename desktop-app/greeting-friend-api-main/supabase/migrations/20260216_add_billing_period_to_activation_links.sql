-- Migrazione: Aggiunge billing_period a plan_activation_links per gestire abbonamenti mensili/annuali
-- Data: 2026-02-16
-- Autore: Sistema abbonamenti migliorato

-- Aggiungi colonna billing_period (monthly/annual) per link purchase
ALTER TABLE plan_activation_links 
ADD COLUMN IF NOT EXISTS billing_period VARCHAR(10) CHECK (billing_period IN ('monthly', 'annual'));

-- Commento sulla colonna
COMMENT ON COLUMN plan_activation_links.billing_period IS 'Periodo di fatturazione per link purchase: monthly o annual. NULL per link trial.';
