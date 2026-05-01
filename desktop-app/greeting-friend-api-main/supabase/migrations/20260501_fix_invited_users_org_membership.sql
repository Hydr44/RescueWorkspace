-- Migration: 2026-05-01 — Ripara invitati senza org_members o senza current_org
--
-- Contesto:
--  Il trigger handle_new_user (vedi 20260315_fix_org_members_trigger.sql) crea
--  solo la riga in profiles, NON aggiunge a org_members né setta current_org.
--  Per un periodo, accept-invite/page.tsx faceva affidamento sul trigger e
--  NON eseguiva queste operazioni a livello applicativo.
--
--  Conseguenza: alcuni invitati esistono in auth.users + profiles ma:
--   - non sono in org_members → vengono mostrati come "Nessuna organizzazione" (sito)
--   - oppure org_members c'è ma current_org è null → fallback OrgContext
--     desktop assegnava role="owner" hardcoded (escalation accidentale)
--
-- Questa migration:
--  1. Per ogni invito 'accepted' o 'pending' (utente già registrato), se manca
--     la riga in org_members → la crea con il role dell'invito
--  2. Per ogni utente che ha ESATTAMENTE UN org_member ma profiles.current_org
--     è null → setta current_org all'unica org di cui è membro
--  3. Marca come 'accepted' gli inviti 'pending' di utenti già registrati
--
-- Idempotente.

BEGIN;

-- 1. Aggiungi a org_members chiunque abbia un invito accettato/pending ma manca dalla tabella
INSERT INTO public.org_members (user_id, org_id, role, created_at)
SELECT DISTINCT
  u.id AS user_id,
  inv.org_id,
  COALESCE(inv.role, 'operator') AS role,
  COALESCE(inv.accepted_at, NOW()) AS created_at
FROM public.org_invites inv
JOIN auth.users u ON LOWER(u.email) = LOWER(inv.email)
LEFT JOIN public.org_members om
  ON om.user_id = u.id AND om.org_id = inv.org_id
WHERE om.user_id IS NULL
  AND inv.status IN ('accepted', 'pending')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 2. Setta profiles.current_org per utenti con esattamente UNA membership e current_org NULL
UPDATE public.profiles p
SET current_org = sub.org_id
FROM (
  SELECT om.user_id, MIN(om.org_id) AS org_id, COUNT(*) AS cnt
  FROM public.org_members om
  GROUP BY om.user_id
  HAVING COUNT(*) = 1
) sub
WHERE p.id = sub.user_id
  AND p.current_org IS NULL;

-- 3. Marca come accepted gli inviti pending di utenti già registrati e già in org_members
UPDATE public.org_invites inv
SET status = 'accepted',
    accepted_at = COALESCE(inv.accepted_at, NOW())
FROM auth.users u
JOIN public.org_members om ON om.user_id = u.id
WHERE LOWER(u.email) = LOWER(inv.email)
  AND om.org_id = inv.org_id
  AND inv.status = 'pending';

-- Report
DO $$
DECLARE
  cnt_members INTEGER;
  cnt_profiles INTEGER;
  cnt_invites INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt_members FROM public.org_members;
  SELECT COUNT(*) INTO cnt_profiles FROM public.profiles WHERE current_org IS NOT NULL;
  SELECT COUNT(*) INTO cnt_invites FROM public.org_invites WHERE status = 'accepted';
  RAISE NOTICE '=== Fix invitati completato ===';
  RAISE NOTICE 'Membership totali: %', cnt_members;
  RAISE NOTICE 'Profili con current_org: %', cnt_profiles;
  RAISE NOTICE 'Inviti accettati: %', cnt_invites;
END $$;

COMMIT;
