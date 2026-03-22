-- Aggiunge colonna materiale_codice per causale M (materiali end-of-waste)
-- Valori RENTRI: ACV, ACM, AA, DIG, AGG, RA, RV, RFA, RR, CC, PLA, LS, CSS, TE, GOM, CU, MC, CF, AF, GCB, ASS, GMV, A
ALTER TABLE rentri_movimenti
  ADD COLUMN IF NOT EXISTS materiale_codice VARCHAR(10);

COMMENT ON COLUMN rentri_movimenti.materiale_codice IS 'Codice materiale RENTRI per causale M (es: RFA, PLA, A)';
