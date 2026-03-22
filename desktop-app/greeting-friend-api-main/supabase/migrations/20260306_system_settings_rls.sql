-- ============================================================================
-- RLS Policy: Allow authenticated users to READ system_settings
-- Required for desktop app to read feature flags from system_settings
-- (key='feature_flags') via supabaseBrowser() with anon/authenticated key.
-- ============================================================================

-- Allow all authenticated users to read system_settings (feature flags, config)
CREATE POLICY "authenticated_read_system_settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anon to read (for pre-login checks like maintenance mode)
CREATE POLICY "anon_read_system_settings"
  ON public.system_settings
  FOR SELECT
  TO anon
  USING (true);
