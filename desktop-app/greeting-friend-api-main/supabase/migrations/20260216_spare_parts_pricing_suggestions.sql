-- Pricing suggestions per spare parts
-- Supporta suggerimenti da Piloterr AutoDoc + markup automatico

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS suggested_price_autodoc DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS suggested_price_ebay DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_markup_percent DECIMAL(5,2) DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS autodoc_availability JSONB,
ADD COLUMN IF NOT EXISTS autodoc_delivery_days VARCHAR(20);

COMMENT ON COLUMN spare_parts.suggested_price_autodoc IS 'Prezzo suggerito da Piloterr AutoDoc API';
COMMENT ON COLUMN spare_parts.suggested_price_ebay IS 'Prezzo medio da scraping eBay/Subito';
COMMENT ON COLUMN spare_parts.price_markup_percent IS 'Percentuale markup applicata (default 30%)';
COMMENT ON COLUMN spare_parts.last_price_check IS 'Ultimo aggiornamento prezzi suggeriti';
COMMENT ON COLUMN spare_parts.autodoc_availability IS 'Stock e disponibilità da AutoDoc {in_stock, quantity, delivery_days}';
COMMENT ON COLUMN spare_parts.autodoc_delivery_days IS 'Stima giorni consegna da AutoDoc';

-- Indice per ottimizzare query su ricambi con prezzi obsoleti
CREATE INDEX IF NOT EXISTS idx_spare_parts_price_check 
ON spare_parts(last_price_check) 
WHERE last_price_check IS NOT NULL;
