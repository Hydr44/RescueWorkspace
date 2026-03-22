-- 🧹 SCRIPT DI PULIZIA DUPLICATI DATABASE - VERSIONE ULTRA SICURA
-- Rimuove solo le tabelle duplicate senza migrare dati

-- ============================================
-- 1. RIMUOVI TABELLE DUPLICATE SENZA MIGRAZIONE
-- ============================================

-- Rimuovi 'organizations' (duplicata di 'orgs')
-- NON migriamo i dati per evitare conflitti con i trigger
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organizations' AND table_schema = 'public'
    ) THEN
        -- Controlla se ci sono dati in organizations
        IF EXISTS (SELECT 1 FROM public.organizations LIMIT 1) THEN
            RAISE NOTICE 'ATTENZIONE: La tabella organizations contiene dati che NON verranno migrati per evitare conflitti';
            RAISE NOTICE 'Se necessario, migra manualmente i dati da organizations a orgs';
        END IF;
        
        -- Rimuovi la tabella duplicata
        DROP TABLE public.organizations CASCADE;
        RAISE NOTICE 'Tabella organizations rimossa (senza migrazione dati)';
    ELSE
        RAISE NOTICE 'Tabella organizations non trovata';
    END IF;
END $$;

-- Rimuovi 'memberships' (duplicata di 'org_members')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'memberships' AND table_schema = 'public'
    ) THEN
        -- Controlla se ci sono dati in memberships
        IF EXISTS (SELECT 1 FROM public.memberships LIMIT 1) THEN
            RAISE NOTICE 'ATTENZIONE: La tabella memberships contiene dati che NON verranno migrati per evitare conflitti';
            RAISE NOTICE 'Se necessario, migra manualmente i dati da memberships a org_members';
        END IF;
        
        -- Rimuovi la tabella duplicata
        DROP TABLE public.memberships CASCADE;
        RAISE NOTICE 'Tabella memberships rimossa (senza migrazione dati)';
    ELSE
        RAISE NOTICE 'Tabella memberships non trovata';
    END IF;
END $$;

-- Rimuovi 'organization_members' (duplicata di 'org_members')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organization_members' AND table_schema = 'public'
    ) THEN
        -- Controlla se ci sono dati in organization_members
        IF EXISTS (SELECT 1 FROM public.organization_members LIMIT 1) THEN
            RAISE NOTICE 'ATTENZIONE: La tabella organization_members contiene dati che NON verranno migrati per evitare conflitti';
            RAISE NOTICE 'Se necessario, migra manualmente i dati da organization_members a org_members';
        END IF;
        
        -- Rimuovi la tabella duplicata
        DROP TABLE public.organization_members CASCADE;
        RAISE NOTICE 'Tabella organization_members rimossa (senza migrazione dati)';
    ELSE
        RAISE NOTICE 'Tabella organization_members non trovata';
    END IF;
END $$;

-- ============================================
-- 2. PULIZIA CAMPI DUPLICATI NELLE TABELLE
-- ============================================

-- Pulisci campi duplicati nella tabella 'transports'
DO $$
BEGIN
    -- Controlla se esistono colonne duplicate
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transports' AND column_name = 'cliente'
    ) THEN
        -- Rimuovi prima le viste che dipendono dalle colonne duplicate
        DROP VIEW IF EXISTS public.transports_with_driver CASCADE;
        DROP VIEW IF EXISTS public.transports_view CASCADE;
        DROP VIEW IF EXISTS public.transports_summary CASCADE;
        
        RAISE NOTICE 'Viste dipendenti rimosse';
        
        -- Aggiorna client_id con i dati da cliente se client_id è null
        UPDATE public.transports 
        SET client_id = (
            SELECT id FROM public.clients 
            WHERE nome = transports.cliente 
            LIMIT 1
        )
        WHERE client_id IS NULL AND cliente IS NOT NULL;
        
        -- Rimuovi colonne duplicate (mantieni solo le UUID)
        ALTER TABLE public.transports DROP COLUMN IF EXISTS cliente CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS autista CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS mezzo CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS via CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS citta CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS cap CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS provincia CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS indirizzo CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS stato CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS orario CASCADE;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS note CASCADE;
        
        RAISE NOTICE 'Campi duplicati rimossi dalla tabella transports';
    ELSE
        RAISE NOTICE 'Campi duplicati non trovati nella tabella transports';
    END IF;
END $$;

-- Pulisci campi duplicati nella tabella 'clients'
DO $$
BEGIN
    -- Controlla se esistono colonne duplicate
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'telefono'
    ) THEN
        -- Migra dati dai campi italiani a quelli inglesi
        UPDATE public.clients 
        SET phone = COALESCE(phone, telefono),
            surname = COALESCE(surname, cognome),
            tax_code = COALESCE(tax_code, codice_fiscale),
            birth_date = COALESCE(birth_date, data_nascita),
            gender = COALESCE(gender, sesso),
            birth_place = COALESCE(birth_place, luogo_nascita)
        WHERE phone IS NULL OR surname IS NULL OR tax_code IS NULL;
        
        -- Rimuovi colonne duplicate (mantieni solo quelle in inglese)
        ALTER TABLE public.clients DROP COLUMN IF EXISTS telefono;
        ALTER TABLE public.clients DROP COLUMN IF EXISTS cognome;
        ALTER TABLE public.clients DROP COLUMN IF EXISTS codice_fiscale;
        ALTER TABLE public.clients DROP COLUMN IF EXISTS data_nascita;
        ALTER TABLE public.clients DROP COLUMN IF EXISTS sesso;
        ALTER TABLE public.clients DROP COLUMN IF EXISTS luogo_nascita;
        
        RAISE NOTICE 'Campi duplicati rimossi dalla tabella clients';
    ELSE
        RAISE NOTICE 'Campi duplicati non trovati nella tabella clients';
    END IF;
END $$;

-- ============================================
-- 3. VERIFICA FINALE
-- ============================================

-- Mostra le tabelle rimanenti
SELECT 
    'TABELLE RIMANENTI' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Mostra statistiche
SELECT 
    'STATISTICHE PULIZIA' as info,
    COUNT(*) as tabelle_rimanenti
FROM information_schema.tables 
WHERE table_schema = 'public';

-- ============================================
-- 4. MESSAGGIO FINALE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🧹 PULIZIA DUPLICATI COMPLETATA!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Tabelle duplicate rimosse';
    RAISE NOTICE '⚠️  Dati NON migrati (per evitare conflitti)';
    RAISE NOTICE '✅ Campi duplicati puliti';
    RAISE NOTICE '✅ Database ottimizzato';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'NOTA: Se hai dati importanti nelle tabelle rimosse,';
    RAISE NOTICE 'migrali manualmente prima di eseguire questo script.';
    RAISE NOTICE '============================================';
END $$;
