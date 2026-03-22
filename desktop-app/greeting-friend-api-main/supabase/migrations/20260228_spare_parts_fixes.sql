-- Migrazione: Fix modulo ricambi
-- Data: 2026-02-28
-- Descrizione: Aggiunge shelf_id FK, rimuove campi duplicati, ottimizza schema

-- 1. Aggiungi colonna shelf_id per relazione con shelves
ALTER TABLE public.spare_parts
ADD COLUMN IF NOT EXISTS shelf_id uuid REFERENCES public.shelves(id) ON DELETE SET NULL;

-- 2. Migra i dati esistenti da warehouse_location a shelf_id (se possibile)
-- Cerca di matchare warehouse_location con shelves.code
UPDATE public.spare_parts sp
SET shelf_id = s.id
FROM public.shelves s
WHERE sp.warehouse_location IS NOT NULL
  AND sp.warehouse_location = s.code
  AND sp.org_id = s.org_id
  AND sp.shelf_id IS NULL;

-- 3. Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_shelf_id ON public.spare_parts(shelf_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_org_shelf ON public.spare_parts(org_id, shelf_id) WHERE shelf_id IS NOT NULL;

-- 4. Rimuovi colonne duplicate/inutilizzate per pubblicazione marketplace
-- published_title → usa direttamente name
-- published_description → usa direttamente description
-- Nota: NON eliminiamo le colonne per retrocompatibilità, ma le deprecamo
COMMENT ON COLUMN public.spare_parts.published_title IS 'DEPRECATED: Usa name invece';
COMMENT ON COLUMN public.spare_parts.published_description IS 'DEPRECATED: Usa description invece';

-- 5. Aggiungi constraint per garantire coerenza
ALTER TABLE public.spare_parts
ADD CONSTRAINT check_warehouse_location_or_shelf 
CHECK (
  warehouse_location IS NOT NULL OR 
  shelf_id IS NOT NULL OR 
  (warehouse_location IS NULL AND shelf_id IS NULL)
);

-- 6. Aggiungi colonna per tracciare se le foto sono state caricate
ALTER TABLE public.spare_parts
ADD COLUMN IF NOT EXISTS has_images boolean GENERATED ALWAYS AS (
  CASE 
    WHEN jsonb_array_length(COALESCE(images, '[]'::jsonb)) > 0 THEN true
    ELSE false
  END
) STORED;

-- 7. Crea indice per ricerca ricambi con foto
CREATE INDEX IF NOT EXISTS idx_spare_parts_has_images ON public.spare_parts(has_images) WHERE has_images = true;

-- 8. Aggiungi trigger per aggiornare automaticamente is_published quando ci sono foto e prezzo
CREATE OR REPLACE FUNCTION public.auto_update_spare_part_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Se ha foto, nome, prezzo e non è danneggiato, può essere pubblicato
  IF NEW.has_images = true 
     AND NEW.name IS NOT NULL 
     AND NEW.price_sell IS NOT NULL 
     AND NEW.price_sell > 0
     AND NEW.status != 'damaged'
  THEN
    NEW.is_published := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_publish_spare_part ON public.spare_parts;
CREATE TRIGGER trigger_auto_publish_spare_part
  BEFORE INSERT OR UPDATE ON public.spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_spare_part_published();

-- 9. Aggiungi policy RLS per spare_part_images (se non esiste)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'spare_part_images' 
    AND policyname = 'Users can manage images for their org'
  ) THEN
    CREATE POLICY "Users can manage images for their org"
      ON public.spare_part_images
      FOR ALL
      USING (
        org_id IN (
          SELECT org_id FROM public.org_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 10. Fix RLS policies per spare_parts
-- Drop vecchie policy se esistono
DROP POLICY IF EXISTS "Users can view spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can insert spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can update spare parts for their org" ON public.spare_parts;
DROP POLICY IF EXISTS "Users can delete spare parts for their org" ON public.spare_parts;

-- Crea policy corrette
CREATE POLICY "Users can view spare parts for their org"
  ON public.spare_parts
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert spare parts for their org"
  ON public.spare_parts
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update spare parts for their org"
  ON public.spare_parts
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete spare parts for their org"
  ON public.spare_parts
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- 11. Commenti per documentazione
COMMENT ON COLUMN public.spare_parts.shelf_id IS 'FK verso shelves - ubicazione scaffale del ricambio';
COMMENT ON COLUMN public.spare_parts.warehouse_location IS 'Ubicazione testuale legacy - usa shelf_id per nuovi record';
COMMENT ON COLUMN public.spare_parts.has_images IS 'Computed: true se il ricambio ha almeno una foto';
COMMENT ON TRIGGER trigger_auto_publish_spare_part ON public.spare_parts IS 'Auto-imposta is_published=true quando ricambio ha foto, nome e prezzo';
