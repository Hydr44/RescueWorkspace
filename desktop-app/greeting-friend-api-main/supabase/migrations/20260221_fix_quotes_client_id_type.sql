-- Migrazione: Fix tipo client_id in quotes da bigint a uuid
-- Data: 21 Febbraio 2026
-- Fix: invalid input syntax for type bigint (client_id deve essere uuid per FK a clients)

-- Rimuovi la foreign key esistente se presente
ALTER TABLE public.quotes 
DROP CONSTRAINT IF EXISTS quotes_client_id_fkey;

-- Cambia il tipo della colonna da bigint a uuid
-- Prima svuota eventuali valori non compatibili
UPDATE public.quotes SET client_id = NULL WHERE client_id IS NOT NULL;

-- Cambia il tipo
ALTER TABLE public.quotes 
ALTER COLUMN client_id TYPE uuid USING NULL;

-- Ricrea la foreign key verso clients
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Commento
COMMENT ON COLUMN public.quotes.client_id IS 'FK verso clients (uuid)';
