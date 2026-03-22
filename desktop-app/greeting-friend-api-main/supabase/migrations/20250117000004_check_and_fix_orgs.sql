-- Check and Fix Organizations Table
-- This script checks if orgs exist and creates one if needed

-- Check existing organizations
SELECT 'Existing orgs:' as info, id, name, created_at FROM public.orgs ORDER BY created_at LIMIT 5;

-- Create a default organization if none exists
INSERT INTO public.orgs (id, name, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Default Organization',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.orgs LIMIT 1
);

-- Verify the organization was created
SELECT 'After fix:' as info, id, name, created_at FROM public.orgs ORDER BY created_at LIMIT 5;
