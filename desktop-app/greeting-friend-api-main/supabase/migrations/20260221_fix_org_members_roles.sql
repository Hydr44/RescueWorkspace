-- Migrazione: Fix constraint ruoli in org_members
-- Data: 21 Febbraio 2026
-- Fix: new row for relation "org_members" violates check constraint "org_members_role_check"

-- Rimuovi il vecchio constraint
ALTER TABLE public.org_members 
DROP CONSTRAINT IF EXISTS org_members_role_check;

-- Aggiungi il nuovo constraint con tutti i ruoli usati dall'app
ALTER TABLE public.org_members 
ADD CONSTRAINT org_members_role_check 
CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'operator'::text, 'viewer'::text, 'member'::text]));

-- Commento
COMMENT ON COLUMN public.org_members.role IS 'Ruolo utente: owner, admin, manager, operator, viewer (member deprecato)';
