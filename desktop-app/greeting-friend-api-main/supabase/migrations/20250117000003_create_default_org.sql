-- Create Default Organization for Smart Recognition
-- This script creates a default organization if none exists

-- Insert a default organization if none exists
INSERT INTO public.orgs (id, name, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Default Organization',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.orgs LIMIT 1
);

-- Alternative: Use the first existing organization
-- This query will show you existing orgs
SELECT id, name, created_at FROM public.orgs ORDER BY created_at LIMIT 5;
