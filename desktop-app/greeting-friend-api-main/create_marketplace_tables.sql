-- ============================================
-- CREAZIONE TABELLE MARKETPLACE
-- ============================================

-- Tabella marketplace_connections: credenziali marketplace esterni (eBay, Subito, Shopify)
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ebay', 'subito', 'shopify', 'amazon')),
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
  last_auth_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(org_id, platform)
);

-- Tabella marketplace_listings: annunci marketplace B2B
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  spare_part_id UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  
  -- Dati annuncio
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Immagini (JSON array di URLs)
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Categoria e condizione
  category TEXT,
  condition TEXT CHECK (condition IN ('new', 'used', 'refurbished', 'damaged')),
  
  -- Stato pubblicazione
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold', 'expired', 'deleted')),
  
  -- Metadati
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabella marketplace_offers: offerte su annunci
CREATE TABLE IF NOT EXISTS public.marketplace_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Dati offerta
  offer_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  
  -- Stato
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  
  -- Metadati
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabella marketplace_favorites: preferiti
CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(org_id, listing_id)
);

-- Tabella marketplace_org_stats: statistiche pubblicazioni per org
CREATE TABLE IF NOT EXISTS public.marketplace_org_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Contatori
  total_listings INTEGER DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  sold_listings INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_offers INTEGER DEFAULT 0,
  
  -- Metadati
  last_listing_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(org_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_org ON public.marketplace_connections(org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_platform ON public.marketplace_connections(platform);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_org ON public.marketplace_listings(org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_part ON public.marketplace_listings(spare_part_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_offers_listing ON public.marketplace_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_buyer ON public.marketplace_offers(buyer_org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_status ON public.marketplace_offers(status);

CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_org ON public.marketplace_favorites(org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_listing ON public.marketplace_favorites(listing_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_org_stats_org ON public.marketplace_org_stats(org_id);

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_marketplace_connections_updated_at ON public.marketplace_connections;
CREATE TRIGGER update_marketplace_connections_updated_at
  BEFORE UPDATE ON public.marketplace_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_offers_updated_at ON public.marketplace_offers;
CREATE TRIGGER update_marketplace_offers_updated_at
  BEFORE UPDATE ON public.marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_org_stats_updated_at ON public.marketplace_org_stats;
CREATE TRIGGER update_marketplace_org_stats_updated_at
  BEFORE UPDATE ON public.marketplace_org_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies per marketplace_connections
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_connections_select" ON public.marketplace_connections;
CREATE POLICY "marketplace_connections_select"
  ON public.marketplace_connections FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_connections_insert" ON public.marketplace_connections;
CREATE POLICY "marketplace_connections_insert"
  ON public.marketplace_connections FOR INSERT WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_connections_update" ON public.marketplace_connections;
CREATE POLICY "marketplace_connections_update"
  ON public.marketplace_connections FOR UPDATE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_connections_delete" ON public.marketplace_connections;
CREATE POLICY "marketplace_connections_delete"
  ON public.marketplace_connections FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

-- RLS Policies per marketplace_listings
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_listings_select" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_select"
  ON public.marketplace_listings FOR SELECT USING (
    -- Tutti possono vedere annunci attivi
    status = 'active'
    OR
    -- L'org proprietaria vede tutti i suoi annunci
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_listings_insert" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_insert"
  ON public.marketplace_listings FOR INSERT WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_listings_update" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_update"
  ON public.marketplace_listings FOR UPDATE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_listings_delete" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_delete"
  ON public.marketplace_listings FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

-- RLS Policies per marketplace_offers
ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_offers_select" ON public.marketplace_offers;
CREATE POLICY "marketplace_offers_select"
  ON public.marketplace_offers FOR SELECT USING (
    -- Buyer vede le sue offerte
    buyer_org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
    OR
    -- Seller vede offerte sui suoi annunci
    listing_id IN (
      SELECT ml.id FROM public.marketplace_listings ml
      WHERE ml.org_id IN (
        SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
        UNION
        SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
      )
    )
  );

DROP POLICY IF EXISTS "marketplace_offers_insert" ON public.marketplace_offers;
CREATE POLICY "marketplace_offers_insert"
  ON public.marketplace_offers FOR INSERT WITH CHECK (
    buyer_org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_offers_update" ON public.marketplace_offers;
CREATE POLICY "marketplace_offers_update"
  ON public.marketplace_offers FOR UPDATE USING (
    buyer_org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
    OR
    listing_id IN (
      SELECT ml.id FROM public.marketplace_listings ml
      WHERE ml.org_id IN (
        SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
        UNION
        SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
      )
    )
  );

-- RLS Policies per marketplace_favorites
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_favorites_select" ON public.marketplace_favorites;
CREATE POLICY "marketplace_favorites_select"
  ON public.marketplace_favorites FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_favorites_insert" ON public.marketplace_favorites;
CREATE POLICY "marketplace_favorites_insert"
  ON public.marketplace_favorites FOR INSERT WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_favorites_delete" ON public.marketplace_favorites;
CREATE POLICY "marketplace_favorites_delete"
  ON public.marketplace_favorites FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

-- RLS Policies per marketplace_org_stats
ALTER TABLE public.marketplace_org_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_org_stats_select" ON public.marketplace_org_stats;
CREATE POLICY "marketplace_org_stats_select"
  ON public.marketplace_org_stats FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_org_stats_insert" ON public.marketplace_org_stats;
CREATE POLICY "marketplace_org_stats_insert"
  ON public.marketplace_org_stats FOR INSERT WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_org_stats_update" ON public.marketplace_org_stats;
CREATE POLICY "marketplace_org_stats_update"
  ON public.marketplace_org_stats FOR UPDATE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "marketplace_org_stats_delete" ON public.marketplace_org_stats;
CREATE POLICY "marketplace_org_stats_delete"
  ON public.marketplace_org_stats FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
      UNION
      SELECT p.current_org FROM public.profiles p WHERE p.id = auth.uid() AND p.current_org IS NOT NULL
    )
  );

-- Verifica
SELECT 'Tabelle marketplace create con successo!' as status;
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('marketplace_listings', 'marketplace_offers', 'marketplace_favorites', 'marketplace_org_stats')
ORDER BY tablename, policyname;
