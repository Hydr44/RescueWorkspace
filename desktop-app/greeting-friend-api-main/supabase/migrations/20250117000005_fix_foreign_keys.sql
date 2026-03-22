-- Fix Foreign Key References for Smart Recognition Tables
-- This script updates the foreign key constraints to use the correct organizations table

-- Drop existing foreign key constraints
ALTER TABLE public.barcode_lookup DROP CONSTRAINT IF EXISTS barcode_lookup_org_id_fkey;
ALTER TABLE public.recognition_logs DROP CONSTRAINT IF EXISTS recognition_logs_org_id_fkey;

-- Add new foreign key constraints pointing to organizations table
ALTER TABLE public.barcode_lookup 
ADD CONSTRAINT barcode_lookup_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.organizations(id);

ALTER TABLE public.recognition_logs 
ADD CONSTRAINT recognition_logs_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.organizations(id);

-- Verify the changes
SELECT 
  'barcode_lookup' as table_name,
  constraint_name,
  table_name as ref_table
FROM information_schema.table_constraints 
WHERE table_name = 'barcode_lookup' AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 
  'recognition_logs' as table_name,
  constraint_name,
  table_name as ref_table
FROM information_schema.table_constraints 
WHERE table_name = 'recognition_logs' AND constraint_type = 'FOREIGN KEY';
