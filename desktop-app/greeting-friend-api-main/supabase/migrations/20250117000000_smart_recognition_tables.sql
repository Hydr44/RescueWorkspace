-- Migration: Smart Recognition Tables
-- Created: 2025-01-17
-- Description: Create tables for smart recognition system

-- Table: public.barcode_lookup
CREATE TABLE IF NOT EXISTS public.barcode_lookup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  barcode text NOT NULL,
  recognized_name text,
  recognized_brand text,
  recognized_oem_code text,
  recognized_category text,
  recognition_source text NOT NULL DEFAULT 'unknown',
  confidence numeric(3,2) DEFAULT 0.0,
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT barcode_lookup_confidence_check CHECK (confidence >= 0.0 AND confidence <= 1.0),
  CONSTRAINT barcode_lookup_barcode_length_check CHECK (length(barcode) >= 3)
);

-- Table: public.recognition_logs
CREATE TABLE IF NOT EXISTS public.recognition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  barcode text NOT NULL,
  recognition_result jsonb NOT NULL,
  processing_time_ms integer DEFAULT 0,
  success boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT recognition_logs_processing_time_check CHECK (processing_time_ms >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_barcode_lookup_org_barcode ON public.barcode_lookup(org_id, barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_lookup_source ON public.barcode_lookup(recognition_source);
CREATE INDEX IF NOT EXISTS idx_barcode_lookup_created_at ON public.barcode_lookup(created_at);

CREATE INDEX IF NOT EXISTS idx_recognition_logs_org_id ON public.recognition_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_barcode ON public.recognition_logs(barcode);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_created_at ON public.recognition_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_success ON public.recognition_logs(success);

-- RLS Policies
ALTER TABLE public.barcode_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's data
CREATE POLICY "Users can view barcode_lookup for their org" ON public.barcode_lookup
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert barcode_lookup for their org" ON public.barcode_lookup
  FOR INSERT WITH CHECK (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update barcode_lookup for their org" ON public.barcode_lookup
  FOR UPDATE USING (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete barcode_lookup for their org" ON public.barcode_lookup
  FOR DELETE USING (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view recognition_logs for their org" ON public.recognition_logs
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert recognition_logs for their org" ON public.recognition_logs
  FOR INSERT WITH CHECK (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update recognition_logs for their org" ON public.recognition_logs
  FOR UPDATE USING (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete recognition_logs for their org" ON public.recognition_logs
  FOR DELETE USING (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid()
  ));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for barcode_lookup
CREATE TRIGGER update_barcode_lookup_updated_at 
  BEFORE UPDATE ON public.barcode_lookup 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.barcode_lookup IS 'Cache for barcode recognition results';
COMMENT ON TABLE public.recognition_logs IS 'Log of all recognition attempts for analytics';

COMMENT ON COLUMN public.barcode_lookup.barcode IS 'The scanned barcode or article number';
COMMENT ON COLUMN public.barcode_lookup.recognition_source IS 'Source of recognition: tecdoc_api, local_db, gs1_free, etc.';
COMMENT ON COLUMN public.barcode_lookup.confidence IS 'Confidence score from 0.0 to 1.0';
COMMENT ON COLUMN public.barcode_lookup.raw_data IS 'Raw response data from the recognition service';

COMMENT ON COLUMN public.recognition_logs.processing_time_ms IS 'Time taken to process the recognition in milliseconds';
COMMENT ON COLUMN public.recognition_logs.recognition_result IS 'Full recognition result as JSON';
COMMENT ON COLUMN public.recognition_logs.error_message IS 'Error message if recognition failed';
