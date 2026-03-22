-- Migration: Aggiungi campo rentri_stato per stati dettagliati RENTRI
-- Created: 2025-12-03
-- Description: Distingue stato semplificato (nostro) da stato RENTRI (dettagliato)

-- ==========================================
-- Aggiungi campo rentri_stato
-- ==========================================

ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS rentri_stato VARCHAR(100);

ALTER TABLE rentri_movimenti 
  ADD COLUMN IF NOT EXISTS rentri_stato VARCHAR(100);

-- ==========================================
-- Commenti
-- ==========================================

COMMENT ON COLUMN rentri_formulari.stato IS 
  'Stato semplificato per UI: bozza (locale), trasmesso, accettato, rifiutato, annullato';

COMMENT ON COLUMN rentri_formulari.rentri_stato IS 
  'Stato dettagliato da API RENTRI: InserimentoQuantita, FirmaProduttore, Accettato, etc. - Cambia automaticamente via API';

COMMENT ON COLUMN rentri_movimenti.rentri_stato IS 
  'Stato dettagliato da API RENTRI per il movimento - Aggiornato automaticamente dalla sincronizzazione';

-- ==========================================
-- Stati RENTRI possibili (per reference)
-- ==========================================

-- FIR:
-- - InserimentoQuantita
-- - InserimentoTrasportoIniziale
-- - FirmaProduttoreTrasportatoreIniziale
-- - FirmaTrasportatoreIniziale
-- - FirmaProduttore
-- - InserimentoTrasportoSuccessivo
-- - FirmaTrasportatoreSuccessivo
-- - InserimentoAccettazione
-- - FirmaAccettazione
-- - Accettato
-- - RespintoAccettatoParzialmente
-- - FirmaDestinatarioSuccessivo
-- - FirmaAccettazioneSuccessiva
-- - FirmaAnnullamento
-- - Annullato

-- Stati semplificati (nostri):
-- - bozza: FIR locale, non trasmesso
-- - trasmesso: Inviato a RENTRI (map: InserimentoQuantita, FirmaProduttore, etc.)
-- - accettato: Completato (map: Accettato)
-- - rifiutato: Respinto (map: RespintoAccettatoParzialmente)
-- - annullato: Annullato (map: Annullato)

