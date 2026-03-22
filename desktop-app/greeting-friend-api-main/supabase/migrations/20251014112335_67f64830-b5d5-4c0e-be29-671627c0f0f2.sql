-- Tabella per le richieste di assistenza
CREATE TABLE IF NOT EXISTS public.assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  phone TEXT NOT NULL,
  note TEXT,
  token TEXT UNIQUE,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Abilita RLS
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;

-- Policy: membri dell'org possono vedere le richieste della loro org
CREATE POLICY "assistance_requests_select_org" ON public.assistance_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = assistance_requests.org_id
        AND m.user_id = auth.uid()
    )
  );

-- Policy: membri dell'org possono inserire richieste
CREATE POLICY "assistance_requests_insert_org" ON public.assistance_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = assistance_requests.org_id
        AND m.user_id = auth.uid()
    )
  );

-- Policy: membri dell'org possono cancellare richieste
CREATE POLICY "assistance_requests_delete_org" ON public.assistance_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = assistance_requests.org_id
        AND m.user_id = auth.uid()
    )
  );

-- Funzione per generare token di assistenza
CREATE OR REPLACE FUNCTION public.generate_assistance_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Genera un token casuale (8 caratteri alfanumerici)
  v_token := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  RETURN v_token;
END;
$$;