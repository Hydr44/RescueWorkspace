## 🎯 Task Strategici - Testing, Ottimizzazione, Bug Fixing

## Focus: Stabilità e Performance per Lancio Beta

### 1️⃣ **Backend Agent** - Audit, Ottimizzazione, Bug Fixing

**Task: `auditCompleto`**
```
Descrizione: Audit completo del backend con focus su sicurezza, performance e bug.

1. RLS POLICIES
   - Verifica tutte le tabelle Supabase abbiano RLS corretto
   - Testa isolamento multi-tenant (2 org non devono vedersi)
   - Fix policy mancanti o errate
   - Report con tutte le modifiche

2. ANALISI BUG
   - Cerca errori comuni: null pointer, race conditions, memory leak
   - Controlla gestione errori in tutte le API routes
   - Verifica validazione input
   - Fix bug trovati

3. OTTIMIZZAZIONE QUERY
   - Identifica query lente (>500ms)
   - Aggiungi indici mancanti
   - Ottimizza JOIN complessi
   - Implementa caching dove serve

4. INCONGRUENZE CODICE
   - Controlla naming inconsistente
   - Verifica import duplicati
   - Trova codice morto (unused functions)
   - Fix TypeScript errors se presenti

File da analizzare:
- supabase/migrations/*.sql
- website/app/api/**/*.js
- desktop-app/src/lib/*.js

NON toccare: rentri_*, sdi_*, rvfu_* (protette)

Output: Report dettagliato + lista fix applicati
```

**Task: `testAPI`**
```
Descrizione: Test completo di tutte le API routes.

Per ogni endpoint:
- Test con dati validi → 200 OK
- Test con dati invalidi → 400 Bad Request
- Test senza auth → 401 Unauthorized
- Test cross-org → 403 Forbidden
- Test edge cases (empty, null, very long strings)

Crea file di test automatici (Vitest o Jest).
Report con coverage e bug trovati.

Focus su:
- /api/transports
- /api/spare-parts
- /api/invoices
- /api/clients
- /api/vehicles
```

---

### 2️⃣ **Desktop Agent** - Bug Fixing, Testing, Ottimizzazione

**Task: `auditDesktopApp`**
```
Descrizione: Audit completo desktop app con focus su stabilità e performance.

1. BUG FIXING
   - Cerca crash potenziali (try/catch mancanti)
   - Verifica gestione errori IPC
   - Controlla memory leak (event listener non rimossi)
   - Fix warning React (key, useEffect dependencies)
   - Risolvi lint errors critici

2. TESTING COMPLETO
   - Testa ogni pagina manualmente
   - Verifica tutti i form (validazione, submit)
   - Testa navigazione (routing, back button)
   - Controlla modali e dialog
   - Verifica offline/online behavior

3. OTTIMIZZAZIONE
   - Identifica componenti lenti (React DevTools Profiler)
   - Aggiungi useMemo/useCallback dove serve
   - Ottimizza re-render inutili
   - Riduci bundle size (lazy loading)

4. REFACTORING IPC (se tempo)
   - electron/ipc.js è 254KB → spezza in moduli
   - ipc/invoices.js, ipc/transports.js, ipc/spare-parts.js, etc.
   - Solo se non rompe nulla

File da analizzare:
- src/pages/**/*.jsx (tutte le pagine)
- src/components/**/*.jsx
- electron/ipc.js
- src/lib/*.js

NON toccare: src/lib/rentri.js, src/lib/sdi.js, src/lib/rvfu.js

Output: Report bug + fix applicati + benchmark performance
```

**Task: `testE2EDesktop`**
```
Descrizione: Test E2E completi per flussi critici.

Flussi da testare (Playwright o Spectron):
1. Login → Dashboard → Logout
2. Crea trasporto → Modifica → Elimina
3. Crea ricambio → Modifica → Elimina
4. Crea cliente → Modifica → Elimina
5. Crea veicolo → Modifica → Elimina

Per ogni flusso:
- Screenshot ad ogni step
- Verifica dati salvati in DB
- Testa validazione errori
- Controlla che non ci siano crash

Output: Test suite automatizzata + report
```

---

### 3️⃣ **Web Agent** - Ottimizzazione Website + Admin Panel Separato

**Task: `auditWebsite`**
```
Descrizione: Audit completo website Next.js + admin panel React.

1. WEBSITE (rescuemanager.eu)
   - Analizza performance (Lighthouse score)
   - Ottimizza immagini (Next/Image)
   - Implementa caching headers
   - Fix SEO issues
   - Verifica responsive design
   - Test su mobile/tablet/desktop

2. ADMIN PANEL (admin-panel/ - RESTA SEPARATO)
   - Fix bug UI (bottoni rotti, form non funzionanti)
   - Test tutte le pagine
   - Verifica autenticazione staff
   - Ottimizza bundle size
   - Fix warning console

3. API ROUTES
   - Verifica error handling
   - Aggiungi rate limiting dove serve
   - Ottimizza query Supabase
   - Test con Postman/curl

4. BUG FIXING
   - Cerca 404 errors
   - Fix broken links
   - Verifica CORS issues
   - Test form validation

File da analizzare:
- website/app/**/*.js (tutte le pages)
- website/app/api/**/*.js (tutte le API)
- admin-panel/src/**/*.jsx

Output: Report con fix + Lighthouse score prima/dopo
```

**Task: `testWebsiteComplete`**
```
Descrizione: Test completo website e admin panel.

WEBSITE:
- Test tutti i link (no 404)
- Test form contatto/newsletter
- Verifica Stripe checkout
- Test login/signup/password reset
- Verifica email inviate

ADMIN PANEL:
- Test login staff
- Test CRUD organizations
- Test CRUD subscriptions
- Test analytics dashboard
- Verifica permissions (solo admin)

Output: Checklist completa + screenshot + bug trovati
```

---

### 4️⃣ **Mobile Agent** - Testing e Stabilità RescueMobile

**Task: `auditMobileApp`**
```
Descrizione: Audit completo RescueMobile con focus su crash e performance.

1. CRASH FIXING
   - Cerca crash potenziali (null checks mancanti)
   - Verifica error boundaries
   - Test su iOS e Android (se possibile)
   - Fix warning Expo
   - Gestione errori network

2. TESTING COMPLETO
   - Testa ogni screen manualmente
   - Verifica navigazione (tab, stack, modal)
   - Test form (validazione, submit)
   - Controlla liste (scroll, refresh)
   - Verifica immagini/icone

3. OTTIMIZZAZIONE
   - Riduci bundle size
   - Ottimizza immagini
   - Lazy loading componenti pesanti
   - Test performance su device low-end
   - Memoria usage check

4. OFFLINE BEHAVIOR
   - Test senza connessione
   - Verifica messaggi errore
   - Controlla sync quando torna online

File da analizzare:
- RescueMobile/app/**/*.js
- RescueMobile/lib/*.js

Output: Report crash + fix + performance metrics
```

**Task: `testMobileComplete`**
```
Descrizione: Test completo app mobile su tutti i flussi.

Flussi da testare:
1. Login → Dashboard → Logout
2. Lista trasporti → Dettaglio → Navigazione Maps
3. Lista ricambi → Dettaglio → Modifica stato
4. Profilo → Switch org → Logout
5. Offline mode → Modifica → Sync online

Per ogni flusso:
- Screenshot ogni step
- Verifica dati salvati
- Test validazione
- Controlla crash

Output: Checklist + screenshot + bug report
```

---

### 5️⃣ **QA Agent** - Testing Completo, CI/CD, Security Audit

**Task: `setupCICD`**
```
Descrizione: Setup CI/CD completo per tutti i progetti.

1. DESKTOP APP
   - .github/workflows/desktop-app.yml
   - Lint, Build, Test, Package
   - Trigger: push, PR, tag

2. WEBSITE
   - Vercel già configurato
   - Aggiungi test E2E pre-deploy
   - Lighthouse CI check

3. ADMIN PANEL
   - .github/workflows/admin-panel.yml
   - Lint, Build, Test
   - Deploy su Netlify/Vercel

4. MOBILE APP
   - EAS Build config
   - Test su Expo Go
   - Preview builds

Output: Tutti i workflow funzionanti + badge README
```

**Task: `securityAudit`**
```
Descrizione: Security audit completo di tutto il progetto.

1. DATABASE
   - Verifica RLS su TUTTE le tabelle
   - Test SQL injection
   - Controlla password hashing
   - Verifica API keys non esposte

2. API ROUTES
   - Test auth bypass
   - Verifica CORS corretto
   - Test rate limiting
   - Controlla input validation

3. DESKTOP APP
   - Verifica IPC security
   - Controlla localStorage sensitive data
   - Test XSS vulnerabilities

4. DEPENDENCIES
   - npm audit fix
   - Aggiorna pacchetti vulnerabili
   - Rimuovi dipendenze inutilizzate

Output: Report security + fix critici applicati
```

**Task: `testSuiteCompleta`**
```
Descrizione: Crea test suite E2E completa per tutti i progetti.

DESKTOP APP (Playwright):
- Login/Logout
- CRUD Trasporti
- CRUD Ricambi
- CRUD Clienti
- CRUD Veicoli

WEBSITE (Playwright):
- Homepage → Pricing → Signup
- Login → Dashboard staff
- Password reset flow

ADMIN PANEL (Playwright):
- Login staff
- CRUD Organizations
- CRUD Subscriptions

MOBILE (Detox o manual):
- Login → Dashboard
- Trasporti flow
- Ricambi flow

Output: Test suite automatizzata + coverage report
```

---

## 🚀 Ordine di Esecuzione Consigliato

### Fase 1: AUDIT E BUG FIXING (Settimana 1)

**Giorno 1-2**: Audit completo parallelo
```bash
# Tutti gli agenti lavorano in parallelo
Backend: auditCompleto (RLS + bug + ottimizzazione + incongruenze)
Desktop: auditDesktopApp (bug + testing + ottimizzazione)
Web: auditWebsite (website + admin panel + API)
Mobile: auditMobileApp (crash + performance + testing)
QA: securityAudit (security completo)
```

**Giorno 3**: Review e fix critici
```bash
# Review risultati audit
- Leggi tutti i report generati
- Identifica bug critici
- Fai fix immediati se necessario
```

### Fase 2: TESTING COMPLETO (Settimana 1-2)

**Giorno 4-5**: Setup CI/CD + Test automatizzati
```bash
# Parallelo
QA: setupCICD (tutti i progetti)
QA: testSuiteCompleta (E2E tutti i flussi)
Backend: testAPI (test automatici API)
Desktop: testE2EDesktop (Playwright)
Web: testWebsiteComplete (website + admin)
Mobile: testMobileComplete (tutti i flussi)
```

### Fase 3: OTTIMIZZAZIONE (Settimana 2)

**Giorno 6-7**: Performance e polish
```bash
# Sequenziale (dopo aver fixato i bug)
Backend: Ottimizzazione query + indici + caching
Desktop: Ottimizzazione bundle + lazy loading
Web: Lighthouse 90+ score
Mobile: Performance su low-end devices
```

---

## 📋 Come Assegnare i Task

### Via Dashboard (http://localhost:3333)
1. Seleziona agente dal dropdown
2. Seleziona task
3. (Opzionale) Copia descrizione da sopra nel campo custom
4. Clicca "Assign Task"

### Via CLI
```javascript
import { crew } from './src/crew.js';

// Task singolo
await crew.assignTask('backend', 'fixRLS', 
  'Audit completo RLS policies su tutte le tabelle Supabase...'
);

// Task paralleli (Sprint 1, Giorno 1-2)
await crew.runParallel([
  { agent: 'backend', task: 'fixRLS', description: '...' },
  { agent: 'desktop', task: 'refactorIPC', description: '...' },
  { agent: 'qa', task: 'setupCI', description: '...' }
]);
```

---

## ⚠️ Note Importanti

1. **Moduli Protetti**: Gli agenti NON possono modificare:
   - `moduli/RENTRI-project/*`
   - `moduli/SDI-SFTP/*`
   - `moduli/demolizioni/*`
   - File con `rentri`, `sdi`, `rvfu` nel path

2. **Approvazione Manuale**: Per modifiche a Invoice* pages, chiedi conferma

3. **Testing**: Dopo ogni task, l'agente dovrebbe testare le modifiche

4. **Rollback**: Se qualcosa va storto, usa git per rollback:
   ```bash
   git status
   git diff
   git checkout -- <file>  # se necessario
   ```

---

## 🎯 Obiettivo Finale

**Entro 2 settimane**:
- ✅ **Zero bug critici** - App stabile senza crash
- ✅ **RLS sicuro al 100%** - Isolamento multi-tenant perfetto
- ✅ **Performance ottimizzate** - Caricamenti <500ms
- ✅ **Test automatizzati** - Coverage >80% flussi critici
- ✅ **CI/CD funzionante** - Deploy automatico con test
- ✅ **Security audit passato** - Nessuna vulnerabilità critica
- ✅ **Admin panel stabile** - Separato e funzionante
- ✅ **Mobile app testata** - Funziona su iOS e Android
- ✅ **Codice pulito** - No warning, no codice morto, naming consistente

**Risultato**: App production-ready per lancio beta con primi 3-5 clienti! 🚀

## 📊 Metriche di Successo

- **Bug critici**: 0
- **Bug minori**: <10
- **Test coverage**: >80%
- **Lighthouse score**: >90
- **RLS test**: 100% pass
- **Security vulnerabilities**: 0 critical, <5 medium
- **Performance**: API <500ms, UI <100ms
- **Uptime**: 99.9%
