-- Aggiunge colonna tags alla tabella invoices per categorizzazione fatture
-- Tags è un array di testo per permettere tag multipli per fattura

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Crea indice per ricerca veloce sui tag
CREATE INDEX IF NOT EXISTS idx_invoices_tags ON public.invoices USING GIN (tags);

-- Commento sulla colonna
COMMENT ON COLUMN public.invoices.tags IS 'Array di tag per categorizzare le fatture (es. Urgente, Pagata, In sospeso)';
