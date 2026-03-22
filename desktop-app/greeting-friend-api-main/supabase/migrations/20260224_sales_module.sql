-- Migration: Sales Module (Preventivi + Ordini + Listini)
-- Created: 2026-02-24
-- Description: Modulo vendite completo per RescueManager

-- ============================================================================
-- TABELLA: sales_quotes (Preventivi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Date
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  
  -- Riferimenti
  reference VARCHAR(100),
  
  -- Importi
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Stato: draft, sent, accepted, rejected, expired
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  
  -- Metadati
  notes TEXT,
  terms TEXT,
  internal_notes TEXT,
  
  -- Conversione
  converted_to_order_id UUID,
  converted_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  
  CONSTRAINT unique_quote_number_per_org UNIQUE(org_id, quote_number)
);

CREATE INDEX idx_sales_quotes_org ON sales_quotes(org_id);
CREATE INDEX idx_sales_quotes_client ON sales_quotes(client_id);
CREATE INDEX idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX idx_sales_quotes_date ON sales_quotes(issue_date);

COMMENT ON TABLE sales_quotes IS 'Preventivi di vendita';
COMMENT ON COLUMN sales_quotes.status IS 'draft, sent, accepted, rejected, expired';

-- ============================================================================
-- TABELLA: sales_quote_items (Righe Preventivo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
  
  -- Prodotto: spare_part, vehicle, service
  item_type VARCHAR(20) NOT NULL,
  item_id UUID,
  
  -- Descrizione
  description TEXT NOT NULL,
  sku VARCHAR(100),
  
  -- Quantità e prezzi
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 22,
  
  -- Totali riga
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Metadati
  notes TEXT,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote ON sales_quote_items(quote_id);
CREATE INDEX idx_quote_items_type ON sales_quote_items(item_type, item_id);

COMMENT ON TABLE sales_quote_items IS 'Righe preventivo';
COMMENT ON COLUMN sales_quote_items.item_type IS 'spare_part, vehicle, service';

-- ============================================================================
-- TABELLA: sales_orders (Ordini)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Riferimenti
  quote_id UUID REFERENCES sales_quotes(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  reference VARCHAR(100),
  
  -- Date
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivered_at TIMESTAMP,
  
  -- Importi
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Stato: new, confirmed, preparing, ready, shipped, delivered, invoiced, cancelled
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  
  -- Pagamento
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Spedizione
  shipping_method VARCHAR(50),
  shipping_address TEXT,
  tracking_number VARCHAR(100),
  
  -- Metadati
  notes TEXT,
  internal_notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  CONSTRAINT unique_order_number_per_org UNIQUE(org_id, order_number)
);

CREATE INDEX idx_sales_orders_org ON sales_orders(org_id);
CREATE INDEX idx_sales_orders_client ON sales_orders(client_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_quote ON sales_orders(quote_id);
CREATE INDEX idx_sales_orders_invoice ON sales_orders(invoice_id);

COMMENT ON TABLE sales_orders IS 'Ordini di vendita';
COMMENT ON COLUMN sales_orders.status IS 'new, confirmed, preparing, ready, shipped, delivered, invoiced, cancelled';
COMMENT ON COLUMN sales_orders.payment_status IS 'pending, partial, paid';

-- ============================================================================
-- TABELLA: sales_order_items (Righe Ordine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  
  -- Prodotto
  item_type VARCHAR(20) NOT NULL,
  item_id UUID,
  
  -- Descrizione
  description TEXT NOT NULL,
  sku VARCHAR(100),
  
  -- Quantità e prezzi
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 22,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Stock management
  reserved BOOLEAN DEFAULT FALSE,
  picked BOOLEAN DEFAULT FALSE,
  packed BOOLEAN DEFAULT FALSE,
  
  -- Metadati
  notes TEXT,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON sales_order_items(order_id);
CREATE INDEX idx_order_items_type ON sales_order_items(item_type, item_id);

COMMENT ON TABLE sales_order_items IS 'Righe ordine';

-- ============================================================================
-- TABELLA: price_lists (Listini Prezzi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  
  -- Applicabilità
  is_default BOOLEAN DEFAULT FALSE,
  client_category VARCHAR(50),
  
  -- Regole
  markup_percent DECIMAL(5,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Validità
  valid_from DATE,
  valid_until DATE,
  active BOOLEAN DEFAULT TRUE,
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_price_list_code_per_org UNIQUE(org_id, code)
);

CREATE INDEX idx_price_lists_org ON price_lists(org_id);
CREATE INDEX idx_price_lists_active ON price_lists(active);

COMMENT ON TABLE price_lists IS 'Listini prezzi';

-- ============================================================================
-- TABELLA: price_list_items (Prezzi Specifici)
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  
  -- Prodotto
  item_type VARCHAR(20) NOT NULL,
  item_id UUID NOT NULL,
  
  -- Prezzo
  unit_price DECIMAL(10,2) NOT NULL,
  min_quantity DECIMAL(10,2) DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_price_per_item UNIQUE(price_list_id, item_type, item_id, min_quantity)
);

CREATE INDEX idx_price_list_items_list ON price_list_items(price_list_id);
CREATE INDEX idx_price_list_items_item ON price_list_items(item_type, item_id);

COMMENT ON TABLE price_list_items IS 'Prezzi specifici per prodotto';

-- ============================================================================
-- FUNZIONI: Numerazione automatica preventivi/ordini
-- ============================================================================

-- Funzione per generare numero preventivo
CREATE OR REPLACE FUNCTION next_quote_number(p_org_id UUID, p_year INT DEFAULT NULL)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_year INT;
  v_counter INT;
  v_number VARCHAR(50);
BEGIN
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
  
  -- Trova ultimo numero per org + anno
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quote_number FROM '\d+$') AS INT)
  ), 0) + 1
  INTO v_counter
  FROM sales_quotes
  WHERE org_id = p_org_id
    AND quote_number LIKE 'PREV-' || v_year || '-%';
  
  v_number := 'PREV-' || v_year || '-' || LPAD(v_counter::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Funzione per generare numero ordine
CREATE OR REPLACE FUNCTION next_order_number(p_org_id UUID, p_year INT DEFAULT NULL)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_year INT;
  v_counter INT;
  v_number VARCHAR(50);
BEGIN
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
  
  -- Trova ultimo numero per org + anno
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM '\d+$') AS INT)
  ), 0) + 1
  INTO v_counter
  FROM sales_orders
  WHERE org_id = p_org_id
    AND order_number LIKE 'ORD-' || v_year || '-%';
  
  v_number := 'ORD-' || v_year || '-' || LPAD(v_counter::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-aggiornamento updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_quotes_updated_at
  BEFORE UPDATE ON sales_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_updated_at();

CREATE TRIGGER sales_orders_updated_at
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_updated_at();

CREATE TRIGGER price_lists_updated_at
  BEFORE UPDATE ON price_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_updated_at();

CREATE TRIGGER price_list_items_updated_at
  BEFORE UPDATE ON price_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

-- Preventivi: org members can CRUD
CREATE POLICY sales_quotes_org_members ON sales_quotes
  FOR ALL USING (is_member(org_id));

-- Righe preventivi: via JOIN
CREATE POLICY sales_quote_items_via_quote ON sales_quote_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sales_quotes q
      WHERE q.id = sales_quote_items.quote_id
        AND is_member(q.org_id)
    )
  );

-- Ordini: org members can CRUD
CREATE POLICY sales_orders_org_members ON sales_orders
  FOR ALL USING (is_member(org_id));

-- Righe ordini: via JOIN
CREATE POLICY sales_order_items_via_order ON sales_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sales_orders o
      WHERE o.id = sales_order_items.order_id
        AND is_member(o.org_id)
    )
  );

-- Listini: org members can CRUD
CREATE POLICY price_lists_org_members ON price_lists
  FOR ALL USING (is_member(org_id));

-- Prezzi listino: via JOIN
CREATE POLICY price_list_items_via_list ON price_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM price_lists pl
      WHERE pl.id = price_list_items.price_list_id
        AND is_member(pl.org_id)
    )
  );

-- ============================================================================
-- SEED DATA: Listino Base
-- ============================================================================

-- Inserisci listino base per ogni org esistente
INSERT INTO price_lists (org_id, name, code, is_default, markup_percent, active)
SELECT 
  id,
  'Listino Base',
  'BASE',
  true,
  30.00, -- 30% markup default
  true
FROM orgs
WHERE NOT EXISTS (
  SELECT 1 FROM price_lists pl
  WHERE pl.org_id = orgs.id AND pl.code = 'BASE'
);

COMMENT ON TABLE sales_quotes IS 'Modulo Vendite - Preventivi';
COMMENT ON TABLE sales_orders IS 'Modulo Vendite - Ordini';
