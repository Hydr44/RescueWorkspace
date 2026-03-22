-- Aggiunge colonna normativa_applicabile alla tabella demolition_cases
-- Usata per classificare le pratiche di demolizione per normativa (209/03 vs 152/06)
-- per il report di conformità richiesto dagli enti di ispezione

ALTER TABLE demolition_cases
  ADD COLUMN IF NOT EXISTS normativa_applicabile text NOT NULL DEFAULT '209/03'
  CHECK (normativa_applicabile IN ('209/03', '152/06'));

COMMENT ON COLUMN demolition_cases.normativa_applicabile IS
  'Normativa applicabile al veicolo: 209/03 (VFU: M1, N1, L) oppure 152/06 (rifiuti speciali: N2, N3, M2, M3, ecc.)';
