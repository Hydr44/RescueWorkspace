-- Migrazione: Codici brevi progressivi per clienti, trasporti e organizzazioni
-- Sostituisce gli UUID lunghi con codici leggibili: CL0001, TR0001, ORG0001

-- ============================================================
-- 1. Aggiungere colonna `number` a clients, transports e orgs
-- ============================================================

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS number INTEGER;

ALTER TABLE public.transports
ADD COLUMN IF NOT EXISTS number INTEGER;

ALTER TABLE public.orgs
ADD COLUMN IF NOT EXISTS number INTEGER;

-- Indici unici per org_id + number (un numero per org)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_org_number
  ON public.clients(org_id, number) WHERE number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transports_org_number
  ON public.transports(org_id, number) WHERE number IS NOT NULL;

-- Indice unico globale per orgs (non per org_id, è globale)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_number
  ON public.orgs(number) WHERE number IS NOT NULL;

-- ============================================================
-- 2. Popolare i numeri per i record esistenti
-- ============================================================

-- Clienti: assegna numeri progressivi per org in ordine di creazione
WITH numbered AS (
  SELECT id, org_id,
    ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at, id) AS rn
  FROM public.clients
  WHERE number IS NULL
)
UPDATE public.clients c
SET number = numbered.rn
FROM numbered
WHERE c.id = numbered.id;

-- Trasporti: assegna numeri progressivi per org in ordine di creazione
WITH numbered AS (
  SELECT id, org_id,
    ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at, id) AS rn
  FROM public.transports
  WHERE number IS NULL
)
UPDATE public.transports t
SET number = numbered.rn
FROM numbered
WHERE t.id = numbered.id;

-- Organizzazioni: assegna numeri progressivi globali in ordine di creazione
WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM public.orgs
  WHERE number IS NULL
)
UPDATE public.orgs o
SET number = numbered.rn
FROM numbered
WHERE o.id = numbered.id;

-- ============================================================
-- 3. Tabella contatori per generare numeri atomicamente
-- ============================================================

CREATE TABLE IF NOT EXISTS entity_counters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'client', 'transport'
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, entity_type)
);

ALTER TABLE entity_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own org entity counters"
  ON entity_counters FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Inizializza contatori con il max attuale
INSERT INTO entity_counters (org_id, entity_type, last_number)
SELECT org_id, 'client', COALESCE(MAX(number), 0)
FROM public.clients
WHERE org_id IS NOT NULL
GROUP BY org_id
ON CONFLICT (org_id, entity_type) DO UPDATE SET last_number = EXCLUDED.last_number;

INSERT INTO entity_counters (org_id, entity_type, last_number)
SELECT org_id, 'transport', COALESCE(MAX(number), 0)
FROM public.transports
WHERE org_id IS NOT NULL
GROUP BY org_id
ON CONFLICT (org_id, entity_type) DO UPDATE SET last_number = EXCLUDED.last_number;

-- ============================================================
-- 4. Funzione RPC: genera prossimo numero entità
-- ============================================================

CREATE OR REPLACE FUNCTION next_entity_number(
  p_org_id UUID,
  p_entity_type TEXT -- 'client' o 'transport'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO entity_counters (org_id, entity_type, last_number)
  VALUES (p_org_id, p_entity_type, 1)
  ON CONFLICT (org_id, entity_type)
  DO UPDATE SET
    last_number = entity_counters.last_number + 1,
    updated_at = now()
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

-- ============================================================
-- 5. Trigger: assegna number automaticamente su INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION auto_assign_client_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.number IS NULL AND NEW.org_id IS NOT NULL THEN
    NEW.number := next_entity_number(NEW.org_id, 'client');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_assign_transport_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.number IS NULL AND NEW.org_id IS NOT NULL THEN
    NEW.number := next_entity_number(NEW.org_id, 'transport');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_client_number ON public.clients;
CREATE TRIGGER trg_auto_client_number
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_client_number();

DROP TRIGGER IF EXISTS trg_auto_transport_number ON public.transports;
CREATE TRIGGER trg_auto_transport_number
  BEFORE INSERT ON public.transports
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_transport_number();

-- ============================================================
-- 6. Contatore globale per organizzazioni (non per org)
-- ============================================================

CREATE TABLE IF NOT EXISTS global_counters (
  key TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inizializza contatore org con il max attuale
INSERT INTO global_counters (key, last_number)
SELECT 'org', COALESCE(MAX(number), 0)
FROM public.orgs
ON CONFLICT (key) DO UPDATE SET last_number = EXCLUDED.last_number;

-- Funzione per generare prossimo numero org (globale)
CREATE OR REPLACE FUNCTION next_org_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO global_counters (key, last_number)
  VALUES ('org', 1)
  ON CONFLICT (key)
  DO UPDATE SET
    last_number = global_counters.last_number + 1,
    updated_at = now()
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

-- Trigger: assegna number automaticamente alle org su INSERT
CREATE OR REPLACE FUNCTION auto_assign_org_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number := next_org_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_org_number ON public.orgs;
CREATE TRIGGER trg_auto_org_number
  BEFORE INSERT ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_org_number();

-- ============================================================
-- Commenti
-- ============================================================
COMMENT ON COLUMN public.clients.number IS 'Numero progressivo cliente per organizzazione (CL0001, CL0002...)';
COMMENT ON COLUMN public.transports.number IS 'Numero progressivo trasporto per organizzazione (TR0001, TR0002...)';
COMMENT ON COLUMN public.orgs.number IS 'Numero progressivo organizzazione globale (ORG0001, ORG0002...)';
COMMENT ON TABLE entity_counters IS 'Contatori atomici per numeri progressivi entità (clienti, trasporti) per org';
COMMENT ON TABLE global_counters IS 'Contatori atomici globali (organizzazioni)';
COMMENT ON FUNCTION next_entity_number IS 'Genera prossimo numero progressivo per entità (client/transport) per org';
COMMENT ON FUNCTION next_org_number IS 'Genera prossimo numero progressivo globale per organizzazioni';
