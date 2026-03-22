-- Add missing columns to existing quote_presets table
-- The table already exists with basic structure, we need to add missing columns

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add unit column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_presets' AND column_name = 'unit') THEN
    ALTER TABLE public.quote_presets ADD COLUMN unit text DEFAULT 'PZ' NOT NULL;
  END IF;

  -- Add vat_perc column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_presets' AND column_name = 'vat_perc') THEN
    ALTER TABLE public.quote_presets ADD COLUMN vat_perc numeric DEFAULT 22 NOT NULL CHECK (vat_perc >= 0);
  END IF;

  -- Add created_by column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_presets' AND column_name = 'created_by') THEN
    ALTER TABLE public.quote_presets ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add updated_by column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_presets' AND column_name = 'updated_by') THEN
    ALTER TABLE public.quote_presets ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_presets' AND column_name = 'updated_at') THEN
    ALTER TABLE public.quote_presets ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create trigger for updated_at (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS quote_presets_updated_at ON public.quote_presets;
CREATE TRIGGER quote_presets_updated_at 
  BEFORE UPDATE ON public.quote_presets 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_presets_org_id ON public.quote_presets(org_id);
CREATE INDEX IF NOT EXISTS idx_quote_presets_org_ord ON public.quote_presets(org_id, ord);

-- RLS Policies
-- =====================
-- quote_presets (org-scoped, read per membri, write per admin)
-- =====================
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "quote_presets_select" ON public.quote_presets;
  DROP POLICY IF EXISTS "quote_presets_insert" ON public.quote_presets;
  DROP POLICY IF EXISTS "quote_presets_update" ON public.quote_presets;
  DROP POLICY IF EXISTS "quote_presets_delete" ON public.quote_presets;

  -- Create new policies
  CREATE POLICY "quote_presets_select" ON public.quote_presets FOR SELECT
    USING (is_member(org_id));

  CREATE POLICY "quote_presets_insert" ON public.quote_presets FOR INSERT
    WITH CHECK (is_org_admin(org_id));

  CREATE POLICY "quote_presets_update" ON public.quote_presets FOR UPDATE
    USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));

  CREATE POLICY "quote_presets_delete" ON public.quote_presets FOR DELETE
    USING (is_org_admin(org_id));
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.quote_presets ENABLE ROW LEVEL SECURITY;
