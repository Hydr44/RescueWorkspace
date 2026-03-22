-- Migration: Aggiunge attivita_rec_smalt a rentri_registri
-- Created: 2026-02-19
-- Description: Campo obbligatorio RENTRI quando attivita contiene Recupero o Smaltimento
-- Ref: POST /anagrafiche/v1.0/operatore/registri → attivita_rec_smalt[] required if Recupero/Smaltimento

ALTER TABLE rentri_registri
  ADD COLUMN IF NOT EXISTS attivita_rec_smalt TEXT[];

COMMENT ON COLUMN rentri_registri.attivita_rec_smalt IS 'Codici operazioni recupero/smaltimento (obbligatorio se attivita contiene Recupero o Smaltimento). Es: R13, D15';
