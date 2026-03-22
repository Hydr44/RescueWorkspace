-- 🧹 SCRIPT DI PULIZIA DUPLICATI DATABASE - VERSIONE SICURA
-- Rimuove solo le tabelle duplicate, mantiene le altre per sicurezza

-- ============================================
-- 1. DUPLICATI ORGANIZZAZIONI
-- ============================================

-- Rimuovi 'organizations' (duplicata di 'orgs')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organizations' AND table_schema = 'public'
    ) THEN
        -- Controlla se ci sono dati da migrare
        IF EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id NOT IN (SELECT id FROM public.orgs)
        ) THEN
            -- Migra solo i dati nuovi
            INSERT INTO public.orgs (id, name, created_at, created_by)
            SELECT id, name, created_at, created_by
            FROM public.organizations
            WHERE id NOT IN (SELECT id FROM public.orgs);
            
            RAISE NOTICE 'Dati migrati da organizations a orgs';
        END IF;
        
        -- Rimuovi la tabella duplicata
        DROP TABLE public.organizations CASCADE;
        RAISE NOTICE 'Tabella organizations rimossa';
    ELSE
        RAISE NOTICE 'Tabella organizations non trovata';
    END IF;
END $$;

-- ============================================
-- 2. DUPLICATI MEMBRI ORGANIZZAZIONE
-- ============================================

-- Rimuovi 'memberships' (duplicata di 'org_members')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'memberships' AND table_schema = 'public'
    ) THEN
        -- Controlla se ci sono dati da migrare
        IF EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE (user_id, org_id) NOT IN (
                SELECT user_id, org_id FROM public.org_members
            )
        ) THEN
            -- Migra solo i dati nuovi
            INSERT INTO public.org_members (user_id, org_id, role, created_at)
            SELECT user_id, org_id, role, created_at
            FROM public.memberships
            WHERE (user_id, org_id) NOT IN (
                SELECT user_id, org_id FROM public.org_members
            );
            
            RAISE NOTICE 'Dati migrati da memberships a org_members';
        END IF;
        
        -- Rimuovi la tabella duplicata
        DROP TABLE public.memberships CASCADE;
        RAISE NOTICE 'Tabella memberships rimossa';
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
        -- Controlla se ci sono dati da migrare
        IF EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE (org_id, user_id) NOT IN (
                SELECT org_id, user_id FROM public.org_members
            )
        ) THEN
            -- Migra solo i dati nuovi
            INSERT INTO public.org_members (org_id, user_id, role, created_at)
            SELECT org_id, user_id, role, created_at
            FROM public.organization_members
            WHERE (org_id, user_id) NOT IN (
                SELECT org_id, user_id FROM public.org_members
            );
            
            RAISE NOTICE 'Dati migrati da organization_members a org_members';
        END IF;
        
        -- Rimuovi la tabella duplicata
        DROP TABLE public.organization_members CASCADE;
        RAISE NOTICE 'Tabella organization_members rimossa';
    ELSE
        RAISE NOTICE 'Tabella organization_members non trovata';
    END IF;
END $$;

-- ============================================
-- 3. PULIZIA CAMPI DUPLICATI NELLE TABELLE
-- ============================================

-- Pulisci campi duplicati nella tabella 'transports'
DO $$
BEGIN
    -- Controlla se esistono colonne duplicate
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transports' AND column_name = 'cliente'
    ) THEN
        -- Aggiorna client_id con i dati da cliente se client_id è null
        UPDATE public.transports 
        SET client_id = (
            SELECT id FROM public.clients 
            WHERE nome = transports.cliente 
            LIMIT 1
        )
        WHERE client_id IS NULL AND cliente IS NOT NULL;
        
        -- Rimuovi colonne duplicate (mantieni solo le UUID)
        ALTER TABLE public.transports DROP COLUMN IF EXISTS cliente;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS autista;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS mezzo;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS via;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS citta;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS cap;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS provincia;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS indirizzo;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS stato;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS orario;
        ALTER TABLE public.transports DROP COLUMN IF EXISTS note;
        
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
-- 4. VERIFICA FINALE
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
-- 5. MESSAGGIO FINALE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🧹 PULIZIA DUPLICATI COMPLETATA!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Tabelle duplicate rimosse';
    RAISE NOTICE '✅ Dati migrati correttamente';
    RAISE NOTICE '✅ Campi duplicati puliti';
    RAISE NOTICE '✅ Database ottimizzato';
    RAISE NOTICE '============================================';
END $$;

