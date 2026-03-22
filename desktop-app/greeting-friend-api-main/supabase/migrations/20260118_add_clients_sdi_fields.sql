-- Migration: Aggiungi campi SDI a clients
-- Created: 2026-01-18
-- Description: Aggiunge campi codice_destinatario e pec alla tabella clients per allineare con invoices

-- ==========================================
-- COLONNE CLIENTS - Campi SDI
-- ==========================================

-- Codice Destinatario SDI (7 caratteri o "0000000" per B2C)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS codice_destinatario TEXT;

-- PEC (Posta Elettronica Certificata) per SDI
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS pec TEXT;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_clients_codice_destinatario ON public.clients(codice_destinatario) WHERE codice_destinatario IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_pec ON public.clients(pec) WHERE pec IS NOT NULL;

-- Commenti per documentazione
COMMENT ON COLUMN public.clients.codice_destinatario IS 'Codice Destinatario SDI (7 caratteri) o "0000000" per B2C';
COMMENT ON COLUMN public.clients.pec IS 'PEC (Posta Elettronica Certificata) per ricezione fatture elettroniche SDI';
