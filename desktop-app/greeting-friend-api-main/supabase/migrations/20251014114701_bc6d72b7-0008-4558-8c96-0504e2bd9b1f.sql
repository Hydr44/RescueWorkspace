-- Aggiungi colonne per gestire persone fisiche e aziende

-- Aggiungi cognome (per persone fisiche)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS surname TEXT,
ADD COLUMN IF NOT EXISTS cognome TEXT;

-- Aggiungi codice fiscale (separato da P.IVA)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS tax_code TEXT,
ADD COLUMN IF NOT EXISTS codice_fiscale TEXT;

-- Aggiungi data di nascita
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS data_nascita DATE;

-- Aggiungi sesso (M/F)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F', NULL)),
ADD COLUMN IF NOT EXISTS sesso TEXT CHECK (sesso IN ('M', 'F', NULL));

-- Aggiungi luogo di nascita
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS luogo_nascita TEXT;

-- Aggiungi tipo persona (true = azienda, false = persona fisica)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_company BOOLEAN DEFAULT true;

-- Aggiungi indice per ricerche veloci su codice fiscale
CREATE INDEX IF NOT EXISTS idx_clients_tax_code ON public.clients(tax_code) WHERE tax_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_codice_fiscale ON public.clients(codice_fiscale) WHERE codice_fiscale IS NOT NULL;

-- Commenti per documentazione
COMMENT ON COLUMN public.clients.surname IS 'Cognome del cliente (persone fisiche)';
COMMENT ON COLUMN public.clients.tax_code IS 'Codice fiscale (italiano)';
COMMENT ON COLUMN public.clients.birth_date IS 'Data di nascita';
COMMENT ON COLUMN public.clients.gender IS 'Sesso (M/F)';
COMMENT ON COLUMN public.clients.birth_place IS 'Comune di nascita';
COMMENT ON COLUMN public.clients.is_company IS 'true = Azienda/Persona Giuridica, false = Persona Fisica';