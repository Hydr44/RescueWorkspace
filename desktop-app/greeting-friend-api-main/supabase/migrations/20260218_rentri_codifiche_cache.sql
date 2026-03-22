-- Migrazione: Cache Locale Codifiche RENTRI
-- Data: 2026-02-18
-- Descrizione: Tabelle per cache locale delle codifiche RENTRI (EER, unità misura, operazioni, ecc.)

-- =====================================================
-- TABELLA: rentri_codifiche_cache
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rentri_codifiche_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabella text NOT NULL, -- CodiciEER, UnitaMisura, OperazioniAmmesse, ecc.
  codice text NOT NULL,
  descrizione text NOT NULL,
  descrizione_estesa text,
  categoria text,
  sottocategoria text,
  stato_fisico text, -- Solo per CodiciEER
  pericoloso boolean DEFAULT false, -- Solo per CodiciEER
  hp_codes text[], -- Classi pericolo (HP1-HP15) per CodiciEER
  metadata jsonb DEFAULT '{}', -- Altri dati specifici per tabella
  search_vector tsvector, -- Per ricerca full-text
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_codifica UNIQUE (tabella, codice)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_rentri_codifiche_tabella ON public.rentri_codifiche_cache(tabella);
CREATE INDEX IF NOT EXISTS idx_rentri_codifiche_codice ON public.rentri_codifiche_cache(codice);
CREATE INDEX IF NOT EXISTS idx_rentri_codifiche_search ON public.rentri_codifiche_cache USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_rentri_codifiche_categoria ON public.rentri_codifiche_cache(categoria) WHERE categoria IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rentri_codifiche_pericoloso ON public.rentri_codifiche_cache(pericoloso) WHERE pericoloso = true;

-- Trigger per aggiornare search_vector automaticamente
CREATE OR REPLACE FUNCTION update_rentri_codifiche_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('italian', coalesce(NEW.codice, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(NEW.descrizione, '')), 'B') ||
    setweight(to_tsvector('italian', coalesce(NEW.descrizione_estesa, '')), 'C') ||
    setweight(to_tsvector('italian', coalesce(NEW.categoria, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rentri_codifiche_search_vector
  BEFORE INSERT OR UPDATE ON public.rentri_codifiche_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_rentri_codifiche_search_vector();

-- =====================================================
-- TABELLA: rentri_trasmissioni
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rentri_trasmissioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'movimenti', 'formulario', 'vidimazione'
  transazione_id text, -- GUID RENTRI per operazioni asincrone
  stato text NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, error
  payload jsonb NOT NULL, -- Dati inviati
  response jsonb, -- Risposta RENTRI
  errore text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_stato CHECK (stato IN ('pending', 'in_progress', 'completed', 'error', 'cancelled'))
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_rentri_trasmissioni_org ON public.rentri_trasmissioni(org_id);
CREATE INDEX IF NOT EXISTS idx_rentri_trasmissioni_stato ON public.rentri_trasmissioni(stato);
CREATE INDEX IF NOT EXISTS idx_rentri_trasmissioni_tipo ON public.rentri_trasmissioni(tipo);
CREATE INDEX IF NOT EXISTS idx_rentri_trasmissioni_transazione ON public.rentri_trasmissioni(transazione_id) WHERE transazione_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rentri_trasmissioni_retry ON public.rentri_trasmissioni(next_retry_at) WHERE stato = 'error' AND retry_count < max_retries;

-- =====================================================
-- TABELLA: rentri_sync_log
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rentri_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  tabella text NOT NULL, -- Nome tabella codifiche sincronizzata
  records_added integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_deleted integer DEFAULT 0,
  sync_duration_ms integer,
  success boolean DEFAULT true,
  error_message text,
  synced_at timestamptz DEFAULT now()
);

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_rentri_sync_log_org ON public.rentri_sync_log(org_id);
CREATE INDEX IF NOT EXISTS idx_rentri_sync_log_tabella ON public.rentri_sync_log(tabella);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- rentri_codifiche_cache: Read-only per tutti gli autenticati (cache condivisa)
ALTER TABLE public.rentri_codifiche_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Codifiche RENTRI leggibili da tutti"
  ON public.rentri_codifiche_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- rentri_trasmissioni: Org-scoped
ALTER TABLE public.rentri_trasmissioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trasmissioni RENTRI visibili ai membri org"
  ON public.rentri_trasmissioni
  FOR SELECT
  TO authenticated
  USING (is_member(org_id));

CREATE POLICY "Trasmissioni RENTRI creabili dai membri org"
  ON public.rentri_trasmissioni
  FOR INSERT
  TO authenticated
  WITH CHECK (is_member(org_id));

CREATE POLICY "Trasmissioni RENTRI aggiornabili dai membri org"
  ON public.rentri_trasmissioni
  FOR UPDATE
  TO authenticated
  USING (is_member(org_id));

-- rentri_sync_log: Org-scoped read-only
ALTER TABLE public.rentri_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sync log RENTRI visibile ai membri org"
  ON public.rentri_sync_log
  FOR SELECT
  TO authenticated
  USING (is_member(org_id));

-- =====================================================
-- FUNZIONI HELPER
-- =====================================================

-- Funzione per cercare codici EER
CREATE OR REPLACE FUNCTION search_codici_eer(
  search_query text,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  codice text,
  descrizione text,
  descrizione_estesa text,
  categoria text,
  pericoloso boolean,
  hp_codes text[],
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.codice,
    c.descrizione,
    c.descrizione_estesa,
    c.categoria,
    c.pericoloso,
    c.hp_codes,
    ts_rank(c.search_vector, plainto_tsquery('italian', search_query)) as rank
  FROM public.rentri_codifiche_cache c
  WHERE c.tabella = 'CodiciEER'
    AND (
      c.search_vector @@ plainto_tsquery('italian', search_query)
      OR c.codice ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE WHEN c.codice ILIKE search_query || '%' THEN 0 ELSE 1 END,
    rank DESC,
    c.codice
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funzione per ottenere statistiche cache
CREATE OR REPLACE FUNCTION get_rentri_cache_stats()
RETURNS TABLE (
  tabella text,
  count bigint,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.tabella,
    COUNT(*) as count,
    MAX(c.last_updated) as last_updated
  FROM public.rentri_codifiche_cache c
  GROUP BY c.tabella
  ORDER BY c.tabella;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funzione per pulire trasmissioni vecchie (>30 giorni)
CREATE OR REPLACE FUNCTION cleanup_old_rentri_trasmissioni()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rentri_trasmissioni
  WHERE completed_at < now() - interval '30 days'
    AND stato IN ('completed', 'cancelled');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTI
-- =====================================================

COMMENT ON TABLE public.rentri_codifiche_cache IS 'Cache locale delle codifiche RENTRI per lookup veloce';
COMMENT ON TABLE public.rentri_trasmissioni IS 'Log delle trasmissioni a RENTRI con gestione retry';
COMMENT ON TABLE public.rentri_sync_log IS 'Log sincronizzazioni codifiche RENTRI';

COMMENT ON COLUMN public.rentri_codifiche_cache.tabella IS 'Nome tabella codifica: CodiciEER, UnitaMisura, OperazioniAmmesse, ecc.';
COMMENT ON COLUMN public.rentri_codifiche_cache.search_vector IS 'Vector per ricerca full-text (auto-generato)';
COMMENT ON COLUMN public.rentri_trasmissioni.transazione_id IS 'GUID RENTRI per operazioni asincrone';
COMMENT ON COLUMN public.rentri_trasmissioni.retry_count IS 'Numero tentativi effettuati';
COMMENT ON COLUMN public.rentri_trasmissioni.next_retry_at IS 'Timestamp prossimo retry (se in errore)';
