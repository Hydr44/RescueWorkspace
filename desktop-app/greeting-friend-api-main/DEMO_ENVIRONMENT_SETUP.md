# Demo Environment Setup - RescueManager

Ambiente demo completo per far testare l'applicazione RescueManager agli utenti con dati realistici e protezioni contro operazioni pericolose.

## Caratteristiche

✅ **Dati demo realistici** — Clienti, veicoli, trasporti, fatture, ricambi, rifiuti precaricati  
✅ **Banner visibile** — Modalità demo chiaramente identificata nell'app  
✅ **Operazioni bloccate** — Invio SDI, trasmissione RENTRI, chiamate API RVFU disabilitate  
✅ **Reset automatico** — Dati resettati ogni notte per mantenere la demo pulita  
✅ **Abbonamento completo** — Tutti i moduli attivi (SDI, RENTRI, RVFU, Contabilità)

---

## Setup Iniziale

### 1. Applicare la migrazione SQL

```bash
# Dalla cartella desktop-app/greeting-friend-api-main
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/migrations/20260222_demo_environment.sql
```

Questa migrazione:
- Aggiunge colonna `is_demo` alla tabella `orgs`
- Crea funzione `reset_demo_org()` per il reset notturno

### 2. Creare utente demo su Supabase Auth

1. Vai su Supabase Dashboard → Authentication → Users
2. Crea nuovo utente:
   - **Email:** `demo@rescuemanager.eu`
   - **Password:** `Demo2026!` (o altra password sicura)
   - Conferma email automaticamente

### 3. Eseguire il seed dei dati demo

```bash
# Modifica il file supabase/seeds/demo_seed.sql
# Sostituisci i placeholder con gli UUID reali se necessario
# (lo script crea automaticamente org e user se non esistono)

psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/seeds/demo_seed.sql
```

Il seed crea:
- **1 organizzazione demo** (Autodemolizioni Demo S.r.l.) con flag `is_demo = true`
- **5 clienti** realistici (privati e aziende)
- **3 veicoli/mezzi** aziendali
- **5 trasporti** in vari stati (pending, in_progress, completed)
- **3 fatture** (draft, validated, delivered) con righe e eventi SDI
- **8 ricambi** con categorie, prezzi, ubicazione
- **2 preventivi**
- **2 casi RVFU**
- **2 formulari RENTRI** (FIR)
- **Abbonamento Full** con tutti i moduli attivi

### 4. Configurare cron notturno per reset (opzionale)

Sul server VPS o tramite Supabase Edge Functions:

```bash
# Cron job esempio (ogni notte alle 3:00 AM)
0 3 * * * psql -h <SUPABASE_HOST> -U postgres -d postgres -f /path/to/reset_demo_nightly.sql
```

Dopo il reset, ri-eseguire il seed per ripopolare i dati.

---

## Come Funziona

### Banner Demo

Quando un utente fa login con l'org demo, l'app mostra:

1. **Banner ambra** sotto l'header con testo:
   > "Modalità Demo — Stai esplorando RescueManager con dati di esempio. Le funzioni di invio SDI, RENTRI e RVFU sono disabilitate."

2. **Badge "Demo"** nella status bar in basso (al posto di "Beta"), con animazione pulse

### Operazioni Bloccate

Le seguenti operazioni mostrano un alert e non vengono eseguite:

#### SDI (Fatturazione)
- ❌ Validazione XML fattura
- ❌ Invio fattura al Sistema di Interscambio
- ✅ Visualizzazione fatture, PDF, XML (solo lettura)

#### RENTRI (Rifiuti)
- ❌ Trasmissione formulari (FIR)
- ❌ Trasmissione movimenti
- ❌ Test trasmissione nel wizard setup
- ✅ Creazione/modifica formulari e movimenti (solo locale)

#### RVFU (Demolizioni)
- ❌ Ricerca veicoli tramite API MIT/ACI
- ✅ Creazione/modifica casi RVFU (solo locale)

### Hook `useDemo`

Tutti i componenti usano l'hook `useDemo()` per rilevare la modalità demo:

```javascript
import { useDemo } from '@/hooks/useDemo';

function MyComponent() {
  const { isDemo } = useDemo();
  
  function handleDangerousAction() {
    if (isDemo) {
      alert("🔒 Modalità Demo\n\nQuesta funzione non è disponibile in modalità demo.");
      return;
    }
    // ... azione reale
  }
}
```

---

## Distribuzione agli Utenti

### Opzione 1: Credenziali condivise

Fornisci agli utenti:
- **URL app:** (link download Electron o web app)
- **Email:** `demo@rescuemanager.eu`
- **Password:** `Demo2026!`

### Opzione 2: Landing page demo

Crea una pagina web con:
- Descrizione della demo
- Link download app
- Credenziali pre-compilate
- Video tutorial (opzionale)

### Opzione 3: Account demo multipli

Crea più account demo (demo1@, demo2@, ...) tutti collegati alla stessa org demo per permettere test simultanei.

---

## Manutenzione

### Reset manuale

```sql
-- Trova l'org demo
SELECT id, name FROM orgs WHERE is_demo = true;

-- Reset dati
SELECT reset_demo_org('<UUID_ORG_DEMO>');

-- Re-seed
\i supabase/seeds/demo_seed.sql
```

### Monitoraggio

Controlla periodicamente:
- Spazio DB occupato dall'org demo
- Numero di utenti connessi
- Log errori (se gli utenti provano operazioni bloccate)

### Aggiornamento dati demo

Per aggiornare i dati demo (es. nuove fatture, clienti):
1. Modifica `supabase/seeds/demo_seed.sql`
2. Esegui reset + seed
3. Testa che tutto funzioni

---

## File Modificati/Creati

### Migrazioni SQL
- `supabase/migrations/20260222_demo_environment.sql` — Flag is_demo + funzione reset

### Seed
- `supabase/seeds/demo_seed.sql` — Dati demo completi

### Hook
- `src/hooks/useDemo.js` — Hook per rilevare modalità demo

### Componenti modificati
- `src/components/Shell.jsx` — Banner demo + badge status bar
- `src/pages/InvoiceForm.jsx` — Blocco SDI send/validate
- `src/pages/RifiutiFormularioFormPDF.jsx` — Blocco RENTRI trasmissione FIR
- `src/pages/RifiutiMovimentoForm.jsx` — Blocco RENTRI trasmissione movimenti
- `src/pages/RifiutiSetupWizard.jsx` — Blocco test trasmissione
- `src/pages/DemolizioneRVFUForm.jsx` — Blocco ricerca veicoli RVFU

### Script
- `scripts/reset_demo_nightly.sql` — Script cron per reset notturno

---

## Troubleshooting

### L'utente non vede il banner demo

Verifica che:
1. L'org abbia `is_demo = true` nel DB
2. L'hook `useDemo` sia importato correttamente
3. Non ci siano errori console nel browser

### Le operazioni non sono bloccate

Verifica che:
1. Il componente usi `const { isDemo } = useDemo()`
2. Il check `if (isDemo)` sia presente prima dell'azione pericolosa
3. L'utente sia loggato con l'org demo corretta

### Il seed fallisce

Verifica che:
1. L'utente `demo@rescuemanager.eu` esista in Supabase Auth
2. Le tabelle esistano (migrazioni applicate)
3. Non ci siano vincoli FK violati

---

## Prossimi Passi

1. ✅ Migrazione SQL applicata
2. ✅ Seed dati demo eseguito
3. ✅ Hook useDemo implementato
4. ✅ Banner e blocchi attivi
5. ⏳ Cron reset notturno configurato (opzionale)
6. ⏳ Landing page demo creata (opzionale)
7. ⏳ Test completo con utenti reali

---

## Contatti

Per problemi o domande sull'ambiente demo:
- **Email:** info@rescuemanager.eu
- **Tel:** 3921723028
