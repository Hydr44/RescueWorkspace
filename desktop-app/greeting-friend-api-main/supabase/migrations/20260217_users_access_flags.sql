-- Aggiunge colonne accesso_desktop e accesso_mobile alla tabella users
-- per gestire i flag di accesso piattaforma dal form utenti unificato

ALTER TABLE users ADD COLUMN IF NOT EXISTS accesso_desktop boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accesso_mobile boolean DEFAULT false;
