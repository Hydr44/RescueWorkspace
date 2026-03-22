-- Migration: Marketplace B2B Ricambi tra Demolitori
-- Created: 2026-02-25
-- Description: Sistema marketplace per vendita/acquisto ricambi tra autodemolizioni

-- ============================================================================
-- TABELLA: marketplace_listings (Annunci Ricambi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Riferimento ricambio (opzionale se già in magazzino)
  spare_part_id UUID REFERENCES spare_parts(id) ON DELETE SET NULL,
  
  -- Dati ricambio (se non collegato a spare_parts)
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Veicolo origine
  vehicle_brand VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vin VARCHAR(17),
  
  -- Condizioni e specifiche
  condition VARCHAR(50) DEFAULT 'usato', -- nuovo, usato, ricondizionato, per ricambi
  quality_grade VARCHAR(20), -- A, B, C (A = ottimo, C = danneggiato)
  warranty_days INTEGER DEFAULT 0,
  
  -- Prezzo e disponibilità
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  available_quantity INTEGER DEFAULT 1,
  
  -- Immagini (array di URL)
  images JSONB DEFAULT '[]',
  
  -- Spedizione
  shipping_available BOOLEAN DEFAULT true,
  shipping_cost DECIMAL(10,2),
  pickup_only BOOLEAN DEFAULT false,
  pickup_address TEXT,
  
  -- Stato annuncio
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'expired', 'removed')),
  
  -- Visibilità
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'network', 'private')),
  featured BOOLEAN DEFAULT false,
  
  -- SEO e ricerca
  tags TEXT[], -- array di tag per ricerca
  search_vector tsvector, -- full-text search
  
  -- Statistiche
  views_count INTEGER DEFAULT 0,
  offers_count INTEGER DEFAULT 0,
  
  -- Scadenza
  expires_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  sold_at TIMESTAMP,
  
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_quantity CHECK (quantity >= 0),
  CONSTRAINT valid_available_quantity CHECK (available_quantity >= 0 AND available_quantity <= quantity)
);

CREATE INDEX idx_marketplace_listings_org ON marketplace_listings(org_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX idx_marketplace_listings_brand ON marketplace_listings(vehicle_brand);
CREATE INDEX idx_marketplace_listings_price ON marketplace_listings(price);
CREATE INDEX idx_marketplace_listings_created ON marketplace_listings(created_at DESC);
CREATE INDEX idx_marketplace_listings_search ON marketplace_listings USING gin(search_vector);
CREATE INDEX idx_marketplace_listings_tags ON marketplace_listings USING gin(tags);

-- Trigger per aggiornare search_vector automaticamente
CREATE OR REPLACE FUNCTION update_marketplace_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('italian', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('italian', coalesce(NEW.vehicle_brand, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(NEW.vehicle_model, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_listing_search
  BEFORE INSERT OR UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_listing_search_vector();

COMMENT ON TABLE marketplace_listings IS 'Annunci marketplace ricambi tra demolitori';
COMMENT ON COLUMN marketplace_listings.status IS 'draft, active, sold, expired, removed';
COMMENT ON COLUMN marketplace_listings.visibility IS 'public = tutti, network = solo demolitori verificati, private = solo contatti diretti';

-- ============================================================================
-- TABELLA: marketplace_offers (Offerte su Annunci)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  
  -- Chi fa l'offerta
  buyer_org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES auth.users(id),
  
  -- Dettagli offerta
  quantity INTEGER NOT NULL DEFAULT 1,
  offered_price DECIMAL(10,2) NOT NULL,
  message TEXT,
  
  -- Condizioni aggiuntive
  include_shipping BOOLEAN DEFAULT true,
  pickup_preferred BOOLEAN DEFAULT false,
  payment_method VARCHAR(50), -- bank_transfer, cash, card
  
  -- Stato offerta
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled', 'completed')),
  
  -- Risposta venditore
  seller_response TEXT,
  counter_offer_price DECIMAL(10,2),
  
  -- Conversione in ordine
  order_id UUID, -- riferimento a sales_orders quando accettata
  
  -- Scadenza offerta
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  CONSTRAINT positive_offered_price CHECK (offered_price >= 0),
  CONSTRAINT positive_quantity_offer CHECK (quantity > 0)
);

CREATE INDEX idx_marketplace_offers_listing ON marketplace_offers(listing_id);
CREATE INDEX idx_marketplace_offers_buyer ON marketplace_offers(buyer_org_id);
CREATE INDEX idx_marketplace_offers_status ON marketplace_offers(status);
CREATE INDEX idx_marketplace_offers_created ON marketplace_offers(created_at DESC);

COMMENT ON TABLE marketplace_offers IS 'Offerte di acquisto su annunci marketplace';
COMMENT ON COLUMN marketplace_offers.status IS 'pending, accepted, rejected, expired, cancelled, completed';

-- ============================================================================
-- TABELLA: marketplace_messages (Messaggi tra Demolitori)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contesto conversazione
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES marketplace_offers(id) ON DELETE CASCADE,
  
  -- Mittente e destinatario
  sender_org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id),
  recipient_org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Contenuto messaggio
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- array di URL file allegati
  
  -- Stato messaggio
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Thread (per raggruppare conversazioni)
  thread_id UUID, -- primo messaggio ha thread_id = id, risposte usano stesso thread_id
  parent_message_id UUID REFERENCES marketplace_messages(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT different_orgs CHECK (sender_org_id != recipient_org_id)
);

CREATE INDEX idx_marketplace_messages_listing ON marketplace_messages(listing_id);
CREATE INDEX idx_marketplace_messages_offer ON marketplace_messages(offer_id);
CREATE INDEX idx_marketplace_messages_sender ON marketplace_messages(sender_org_id);
CREATE INDEX idx_marketplace_messages_recipient ON marketplace_messages(recipient_org_id);
CREATE INDEX idx_marketplace_messages_thread ON marketplace_messages(thread_id);
CREATE INDEX idx_marketplace_messages_created ON marketplace_messages(created_at DESC);
CREATE INDEX idx_marketplace_messages_unread ON marketplace_messages(recipient_org_id, is_read) WHERE is_read = false;

COMMENT ON TABLE marketplace_messages IS 'Messaggi privati tra demolitori per trattative';

-- ============================================================================
-- TABELLA: marketplace_favorites (Annunci Salvati)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_favorite UNIQUE(org_id, listing_id)
);

CREATE INDEX idx_marketplace_favorites_org ON marketplace_favorites(org_id);
CREATE INDEX idx_marketplace_favorites_listing ON marketplace_favorites(listing_id);

COMMENT ON TABLE marketplace_favorites IS 'Annunci salvati/preferiti dagli utenti';

-- ============================================================================
-- TABELLA: marketplace_reviews (Recensioni Transazioni)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Riferimenti
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES marketplace_offers(id) ON DELETE SET NULL,
  order_id UUID, -- riferimento a sales_orders
  
  -- Chi recensisce chi
  reviewer_org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  reviewed_org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Valutazione
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Categorie valutazione
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  
  -- Risposta del recensito
  response TEXT,
  response_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT different_orgs_review CHECK (reviewer_org_id != reviewed_org_id),
  CONSTRAINT unique_review UNIQUE(offer_id, reviewer_org_id)
);

CREATE INDEX idx_marketplace_reviews_reviewed ON marketplace_reviews(reviewed_org_id);
CREATE INDEX idx_marketplace_reviews_reviewer ON marketplace_reviews(reviewer_org_id);
CREATE INDEX idx_marketplace_reviews_rating ON marketplace_reviews(rating);

COMMENT ON TABLE marketplace_reviews IS 'Recensioni e feedback su transazioni marketplace';

-- ============================================================================
-- TABELLA: marketplace_org_stats (Statistiche Reputazione Org)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_org_stats (
  org_id UUID PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Statistiche venditore
  listings_count INTEGER DEFAULT 0,
  active_listings_count INTEGER DEFAULT 0,
  sold_items_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Statistiche acquirente
  purchases_count INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  
  -- Reputazione
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  positive_reviews INTEGER DEFAULT 0,
  negative_reviews INTEGER DEFAULT 0,
  
  -- Affidabilità
  response_rate DECIMAL(5,2) DEFAULT 0, -- % risposte a messaggi
  avg_response_time_hours INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0, -- % ordini completati
  
  -- Badge e certificazioni
  verified_seller BOOLEAN DEFAULT false,
  premium_member BOOLEAN DEFAULT false,
  badges JSONB DEFAULT '[]', -- array di badge guadagnati
  
  -- Ultimo aggiornamento
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_org_stats_rating ON marketplace_org_stats(average_rating DESC);
CREATE INDEX idx_marketplace_org_stats_verified ON marketplace_org_stats(verified_seller) WHERE verified_seller = true;

COMMENT ON TABLE marketplace_org_stats IS 'Statistiche aggregate e reputazione organizzazioni nel marketplace';

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_org_stats ENABLE ROW LEVEL SECURITY;

-- Policy marketplace_listings
CREATE POLICY "Users can view active public listings"
  ON marketplace_listings FOR SELECT
  USING (
    status = 'active' AND visibility = 'public'
    OR org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their org listings"
  ON marketplace_listings FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Policy marketplace_offers
CREATE POLICY "Users can view offers related to their org"
  ON marketplace_offers FOR SELECT
  USING (
    buyer_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    OR listing_id IN (SELECT id FROM marketplace_listings WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can create offers for their org"
  ON marketplace_offers FOR INSERT
  WITH CHECK (buyer_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their org offers"
  ON marketplace_offers FOR UPDATE
  USING (
    buyer_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    OR listing_id IN (SELECT id FROM marketplace_listings WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  );

-- Policy marketplace_messages
CREATE POLICY "Users can view messages for their org"
  ON marketplace_messages FOR SELECT
  USING (
    sender_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    OR recipient_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages from their org"
  ON marketplace_messages FOR INSERT
  WITH CHECK (sender_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update messages sent to their org"
  ON marketplace_messages FOR UPDATE
  USING (recipient_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Policy marketplace_favorites
CREATE POLICY "Users can manage their org favorites"
  ON marketplace_favorites FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Policy marketplace_reviews
CREATE POLICY "Users can view all reviews"
  ON marketplace_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their org"
  ON marketplace_reviews FOR INSERT
  WITH CHECK (reviewer_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Reviewed org can respond to reviews"
  ON marketplace_reviews FOR UPDATE
  USING (reviewed_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Policy marketplace_org_stats
CREATE POLICY "Users can view all org stats"
  ON marketplace_org_stats FOR SELECT
  USING (true);

-- ============================================================================
-- FUNZIONI HELPER
-- ============================================================================

-- Funzione per aggiornare contatore offerte su listing
CREATE OR REPLACE FUNCTION update_listing_offers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_listings 
    SET offers_count = offers_count + 1 
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_listings 
    SET offers_count = GREATEST(0, offers_count - 1) 
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_listing_offers_count
  AFTER INSERT OR DELETE ON marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_offers_count();

-- Funzione per aggiornare statistiche org
CREATE OR REPLACE FUNCTION update_marketplace_org_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserisci o aggiorna stats per org venditore
  INSERT INTO marketplace_org_stats (org_id)
  SELECT DISTINCT org_id FROM marketplace_listings WHERE org_id = NEW.org_id
  ON CONFLICT (org_id) DO NOTHING;
  
  -- Aggiorna contatori
  UPDATE marketplace_org_stats
  SET 
    listings_count = (SELECT COUNT(*) FROM marketplace_listings WHERE org_id = NEW.org_id),
    active_listings_count = (SELECT COUNT(*) FROM marketplace_listings WHERE org_id = NEW.org_id AND status = 'active'),
    sold_items_count = (SELECT COUNT(*) FROM marketplace_listings WHERE org_id = NEW.org_id AND status = 'sold'),
    updated_at = NOW()
  WHERE org_id = NEW.org_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_org_stats
  AFTER INSERT OR UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_org_stats();
