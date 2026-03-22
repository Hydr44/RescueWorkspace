-- Migration: Cookie Consents Tracking (GDPR Compliance)
-- Created: 2026-03-19
-- Purpose: Tracciare consensi cookie per audit GDPR e conformità normativa

-- Tabella per salvare i consensi cookie
CREATE TABLE IF NOT EXISTS public.cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificazione utente (opzionale se non autenticato)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL, -- Identificatore sessione browser
  
  -- Preferenze cookie
  essential boolean NOT NULL DEFAULT true,
  analytics boolean NOT NULL DEFAULT false,
  functional boolean NOT NULL DEFAULT false,
  marketing boolean NOT NULL DEFAULT false,
  
  -- Metadati tecnici per audit
  ip_address inet,
  user_agent text,
  consent_version text DEFAULT '1.0', -- Versione cookie policy
  
  -- Timestamp
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indici per performance
CREATE INDEX idx_cookie_consents_user_id ON public.cookie_consents(user_id);
CREATE INDEX idx_cookie_consents_session_id ON public.cookie_consents(session_id);
CREATE INDEX idx_cookie_consents_created_at ON public.cookie_consents(created_at DESC);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_cookie_consent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cookie_consent_timestamp
  BEFORE UPDATE ON public.cookie_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_cookie_consent_timestamp();

-- RLS Policies
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Chiunque può inserire (anche anonimi)
CREATE POLICY "Allow anonymous insert cookie consents"
  ON public.cookie_consents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Gli utenti autenticati possono vedere solo i propri consensi
CREATE POLICY "Users can view own cookie consents"
  ON public.cookie_consents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role può vedere tutto (per admin/audit)
CREATE POLICY "Service role full access to cookie consents"
  ON public.cookie_consents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Commenti per documentazione
COMMENT ON TABLE public.cookie_consents IS 'Tracciamento consensi cookie per conformità GDPR (Reg. UE 2016/679) e Provvedimento Garante n. 231/2021';
COMMENT ON COLUMN public.cookie_consents.session_id IS 'Identificatore univoco sessione browser (generato client-side)';
COMMENT ON COLUMN public.cookie_consents.consent_version IS 'Versione della cookie policy al momento del consenso';
COMMENT ON COLUMN public.cookie_consents.ip_address IS 'Indirizzo IP mascherato (ultimo ottetto rimosso per privacy)';
