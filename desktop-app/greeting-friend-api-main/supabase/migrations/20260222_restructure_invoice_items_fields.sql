-- Ristruttura campi invoice_items:
-- - descr diventa item_code (codice articolo)
-- - Nuovo campo item_description (descrizione personalizzata dall'operatore)

-- Aggiungi nuovo campo per descrizione personalizzata
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS item_description text;

-- Rinomina descr in item_code (mantiene i dati esistenti)
ALTER TABLE public.invoice_items 
RENAME COLUMN descr TO item_code;

-- Commenti sulle colonne
COMMENT ON COLUMN public.invoice_items.item_code IS 'Codice articolo/servizio (ex descr)';
COMMENT ON COLUMN public.invoice_items.item_description IS 'Descrizione personalizzata dell''articolo/servizio inserita dall''operatore';

-- Aggiorna la funzione di riassunto AI per usare item_description se disponibile, altrimenti item_code
-- Nota: il riassunto AI userà item_description come priorità, poi item_code come fallback
