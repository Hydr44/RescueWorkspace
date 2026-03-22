# 🗄️ **MIGRAZIONE DATABASE SUPABASE**

## 📋 **ISTRUZIONI PER APPLICARE LA MIGRAZIONE:**

### 1. **Vai al Dashboard Supabase**
- Apri [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Seleziona il tuo progetto

### 2. **Apri SQL Editor**
- Clicca su "SQL Editor" nel menu laterale
- Clicca su "New query"

### 3. **Scegli la Versione della Migrazione**

**Opzione A - Versione Completa (con RLS):**
Copia tutto il contenuto del file `supabase/migrations/20250117000000_smart_recognition_tables.sql`

**Opzione B - Versione Semplificata (senza RLS per test):**
Copia tutto il contenuto del file `supabase/migrations/20250117000001_smart_recognition_tables_simple.sql`

**Raccomandazione:** Inizia con la versione semplificata per test, poi passa alla versione completa per produzione.

**Opzione C - Fix RLS (se hai errori 401/42501):**
Copia tutto il contenuto del file `supabase/migrations/20250117000002_fix_rls_policies.sql`

### 4. **Esegui la Query**
- Clicca su "Run" per eseguire la migrazione
- Verifica che non ci siano errori

## 🎯 **COSA CREA QUESTA MIGRAZIONE:**

### ✅ **Tabelle Create:**
1. **`barcode_lookup`** - Cache per i risultati del riconoscimento
2. **`recognition_logs`** - Log di tutti i tentativi di riconoscimento

### ✅ **Funzionalità:**
- **Row Level Security (RLS)** per sicurezza
- **Indici** per performance ottimali
- **Trigger** per aggiornamento automatico timestamp
- **Constraint** per validazione dati

### ✅ **Campi Principali:**
- `barcode` - Codice scansionato
- `recognition_source` - Fonte (tecdoc_api, local_db, etc.)
- `confidence` - Punteggio di confidenza (0.0-1.0)
- `raw_data` - Dati grezzi del riconoscimento

## 🚀 **DOPO LA MIGRAZIONE:**

Il sistema di riconoscimento intelligente funzionerà completamente:
- ✅ Cache dei risultati per performance
- ✅ Log per analytics e debugging
- ✅ Sicurezza con RLS
- ✅ Nessun errore 404

## 📞 **SUPPORTO:**

Se hai problemi con la migrazione, controlla:
1. **Permessi** - Assicurati di essere admin del progetto
2. **Schema** - Verifica che le tabelle `orgs` e `org_members` esistano
3. **RLS** - Controlla che RLS sia abilitato

### ⚠️ **NOTA IMPORTANTE:**
La migrazione è stata aggiornata per essere compatibile con il tuo schema esistente che usa `org_members` invece di `user_orgs`.

**Una volta applicata la migrazione, il sistema TecDoc funzionerà perfettamente!** 🎉
