-- Fix RLS Policies for Smart Recognition Tables
-- This script temporarily disables RLS to allow testing

-- Temporarily disable RLS for testing
ALTER TABLE public.barcode_lookup DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_logs DISABLE ROW LEVEL SECURITY;

-- Alternative: Create more permissive policies
-- (Uncomment these if you prefer to keep RLS enabled)

/*
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view barcode_lookup for their org" ON public.barcode_lookup;
DROP POLICY IF EXISTS "Users can insert barcode_lookup for their org" ON public.barcode_lookup;
DROP POLICY IF EXISTS "Users can update barcode_lookup for their org" ON public.barcode_lookup;
DROP POLICY IF EXISTS "Users can delete barcode_lookup for their org" ON public.barcode_lookup;

DROP POLICY IF EXISTS "Users can view recognition_logs for their org" ON public.recognition_logs;
DROP POLICY IF EXISTS "Users can insert recognition_logs for their org" ON public.recognition_logs;
DROP POLICY IF EXISTS "Users can update recognition_logs for their org" ON public.recognition_logs;
DROP POLICY IF EXISTS "Users can delete recognition_logs for their org" ON public.recognition_logs;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can manage barcode_lookup" ON public.barcode_lookup
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage recognition_logs" ON public.recognition_logs
  FOR ALL USING (auth.role() = 'authenticated');
*/

-- Re-enable RLS (uncomment when ready)
-- ALTER TABLE public.barcode_lookup ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.recognition_logs ENABLE ROW LEVEL SECURITY;
