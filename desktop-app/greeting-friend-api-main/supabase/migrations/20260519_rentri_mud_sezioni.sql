-- P1.3 — MUD discriminato per sezione filiera VFU (AUT / ROT / FRA)
--
-- Modello deciso:
--  * Quali sezioni opera un'org → org_settings (key='rentri_filiera',
--    value={"sezioni_attivate":["AUT",...]}), configurato dall'admin-panel.
--    Assenza della chiave ⇒ default ['AUT'] (gestito nel codice).
--  * Discriminazione movimento: per ruolo org; se l'org opera più sezioni
--    il registro cronologico porta il tag `sezione` e i movimenti la
--    ereditano via registro_id.
--  * Il MUD diventa per-sezione: un MUD per (org, anno, sezione).
--
-- AUT = Autodemolitore · ROT = Rottamatore · FRA = Frantumatore

-- 1. Tag sezione sul registro cronologico (default AUT = caso più comune)
ALTER TABLE public.rentri_registri
  ADD COLUMN IF NOT EXISTS sezione varchar(3) NOT NULL DEFAULT 'AUT';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rentri_registri_sezione_chk'
  ) THEN
    ALTER TABLE public.rentri_registri
      ADD CONSTRAINT rentri_registri_sezione_chk
      CHECK (sezione IN ('AUT','ROT','FRA'));
  END IF;
END$$;

-- 2. Sezione sul MUD + unicità per (org, anno, sezione)
ALTER TABLE public.rentri_mud
  ADD COLUMN IF NOT EXISTS sezione varchar(3) NOT NULL DEFAULT 'AUT';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rentri_mud_sezione_chk'
  ) THEN
    ALTER TABLE public.rentri_mud
      ADD CONSTRAINT rentri_mud_sezione_chk
      CHECK (sezione IN ('AUT','ROT','FRA'));
  END IF;
END$$;

-- Sostituisce UNIQUE(org_id, anno) → UNIQUE(org_id, anno, sezione)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rentri_mud_org_id_anno_key'
  ) THEN
    ALTER TABLE public.rentri_mud DROP CONSTRAINT rentri_mud_org_id_anno_key;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rentri_mud_org_anno_sezione_key'
  ) THEN
    ALTER TABLE public.rentri_mud
      ADD CONSTRAINT rentri_mud_org_anno_sezione_key
      UNIQUE (org_id, anno, sezione);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_rentri_registri_sezione
  ON public.rentri_registri(org_id, sezione);
CREATE INDEX IF NOT EXISTS idx_rentri_mud_sezione
  ON public.rentri_mud(org_id, anno, sezione);

COMMENT ON COLUMN public.rentri_registri.sezione IS
  'Sezione filiera VFU del registro: AUT|ROT|FRA. I movimenti ereditano questa sezione via registro_id.';
COMMENT ON COLUMN public.rentri_mud.sezione IS
  'Sezione filiera VFU del MUD: AUT|ROT|FRA. Un MUD per (org, anno, sezione).';
