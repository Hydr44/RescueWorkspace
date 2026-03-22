# 🤖 RescueManager AI Team

Multi-agent AI development team per accelerare lo sviluppo di RescueManager.

## Team Members

### 👨‍💻 Backend Developer
- **Specializzazione**: API VPS, Supabase, migrazioni SQL, integrazioni governative
- **Tecnologie**: Node.js, PostgreSQL, Express, PM2, Nginx
- **Responsabilità**: SDI, RENTRI, RVFU, RLS policies, performance API

### 💻 Desktop App Developer
- **Specializzazione**: Electron + React desktop app
- **Tecnologie**: Electron 31, React 18, Vite 7, better-sqlite3
- **Responsabilità**: UI/UX, IPC handlers, componenti, hooks, design system

### 🌐 Web Developer
- **Specializzazione**: Website Next.js e admin panel
- **Tecnologie**: Next.js 15, React 19, Tailwind 4, Stripe
- **Responsabilità**: Landing pages, API routes, staff panel, SEO

### 📱 Mobile App Developer
- **Specializzazione**: RescueMobile (Expo + React Native)
- **Tecnologie**: Expo 54, React Native 0.81, expo-router
- **Responsabilità**: App autisti, offline-first, performance mobile

### 🧪 QA Engineer
- **Specializzazione**: Testing, quality assurance, CI/CD
- **Tecnologie**: Vitest, Playwright, GitHub Actions
- **Responsabilità**: Test automation, security audit, regression testing

## Setup

### 1. Installa dipendenze

```bash
cd ai-team
npm install
```

### 2. Configura environment

```bash
cp .env.example .env
# Edita .env e aggiungi le tue API keys
```

**Variabili richieste:**
- `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` (almeno uno)
- `WORKSPACE_ROOT` (path assoluto alla workspace)
- Opzionali: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 3. Avvia il team

```bash
# Solo crew (CLI)
npm start

# Dashboard web + crew
npm run dev
```

### 4. Apri la dashboard

Vai su **http://localhost:3333** nel browser.

## Come usare

### Dashboard Web (consigliato)

1. Apri http://localhost:3333
2. Vedi tutti gli agenti e il loro status (idle/busy)
3. Assegna task tramite i dropdown
4. Monitora progress in tempo reale
5. Vedi risultati e log

### CLI (programmazione)

```javascript
import { crew } from './src/crew.js';

// Assegna singolo task
await crew.assignTask('backend', 'testIntegrations');

// Assegna task custom
await crew.assignTask('desktop', 'fixBug', 'Fix RLS error in InvoiceNew.jsx');

// Esegui task in parallelo
await crew.runParallel([
  { agent: 'backend', task: 'fixRLS' },
  { agent: 'desktop', task: 'createComponent' },
  { agent: 'qa', task: 'createTestSuite' }
]);

// Vedi status
const status = crew.getStatus();
console.log(status);
```

## Task disponibili

### Backend
- `fixRLS` - Fixa RLS policies
- `optimizeAPI` - Ottimizza performance API
- `testIntegrations` - Testa SDI/RENTRI/RVFU
- `createMigration` - Crea migrazione SQL

### Desktop
- `createComponent` - Crea componente React
- `fixBug` - Fixa bug
- `refactorIPC` - Refactoring IPC handlers
- `implementFeature` - Implementa feature completa

### Web
- `createAPIRoute` - Crea API route Next.js
- `optimizeSEO` - Ottimizza SEO
- `consolidateAdminPanel` - Merge admin panel
- `implementLandingPage` - Crea landing page

### Mobile
- `createScreen` - Crea screen React Native
- `fixCrash` - Fixa crash
- `implementOfflineSync` - Implementa sync offline
- `optimizePerformance` - Ottimizza performance

### QA
- `createTestSuite` - Crea test suite
- `validateFix` - Valida fix
- `securityAudit` - Security audit
- `performanceTest` - Performance test
- `setupCI` - Setup CI/CD

## Esempi pratici

### Sprint settimanale

```javascript
// Lunedì: Setup testing
await crew.assignTask('qa', 'setupCI', 'Setup GitHub Actions per desktop app');

// Martedì-Mercoledì: Feature development in parallelo
await crew.runParallel([
  { agent: 'backend', task: 'createMigration', description: 'Migrazione per modulo preventivi' },
  { agent: 'desktop', task: 'implementFeature', description: 'UI preventivi in desktop app' },
  { agent: 'web', task: 'createAPIRoute', description: 'API /api/quotes per preventivi' }
]);

// Giovedì: Testing
await crew.assignTask('qa', 'createTestSuite', 'Test E2E modulo preventivi');

// Venerdì: Fix e polish
await crew.assignTask('desktop', 'fixBug', 'Fix validazione form preventivi');
```

### Hotfix urgente

```javascript
await crew.runParallel([
  { agent: 'backend', task: 'fixRLS', description: 'Fix RLS leak in invoices table' },
  { agent: 'qa', task: 'securityAudit', description: 'Audit completo RLS policies' }
]);
```

### Refactoring grande

```javascript
// Fase 1: Analisi
await crew.assignTask('desktop', 'refactorIPC', 'Analizza ipc.js e proponi struttura modulare');

// Fase 2: Implementazione in parallelo
await crew.runParallel([
  { agent: 'desktop', task: 'refactorIPC', description: 'Modulo IPC invoices' },
  { agent: 'desktop', task: 'refactorIPC', description: 'Modulo IPC transports' },
  { agent: 'desktop', task: 'refactorIPC', description: 'Modulo IPC spare-parts' }
]);

// Fase 3: Testing
await crew.assignTask('qa', 'validateFix', 'Valida refactoring IPC non rompe nulla');
```

## Monitoring

La dashboard mostra:
- ✅ **Status agenti** (idle/busy) in tempo reale
- 📊 **Statistiche** (task attivi, completati, errori)
- 📋 **Task log** con risultati e durata
- 🔴 **Live updates** via WebSocket

## Costi

Dipende dall'LLM usato:
- **GPT-4 Turbo**: ~$0.01-0.03 per task
- **Claude 3.5 Sonnet**: ~$0.015-0.04 per task
- **GPT-3.5 Turbo**: ~$0.001-0.005 per task (meno accurato)

**Stima**: ~€50-150/mese per uso intensivo (20-30 task/giorno)

## Limiti

- Gli agenti NON hanno accesso diretto al filesystem (per sicurezza)
- Ogni task è isolato (no stato condiviso tra task)
- Serve supervisione umana per decisioni architetturali
- Non sostituisce code review umana

## Best Practices

1. **Task specifici**: Descrizioni chiare e misurabili
2. **Parallelizzazione**: Usa `runParallel` per task indipendenti
3. **Iterazione**: Assegna task piccoli, valida, itera
4. **Supervisione**: Controlla risultati prima di committare
5. **Testing**: Sempre validare con QA agent

## Troubleshooting

### "Agent not found"
Verifica che il nome agente sia corretto: `backend`, `desktop`, `web`, `mobile`, `qa`

### "Task not found"
Controlla i task disponibili in `src/agents/[agent]-agent.js`

### WebSocket disconnesso
Riavvia il dashboard server: `npm run dashboard`

### LLM timeout
Riduci complessità del task o aumenta `MAX_ITERATIONS` in `.env`

## Roadmap

- [ ] Integrazione con GitHub (auto-PR)
- [ ] Memory condivisa tra agenti
- [ ] Task scheduling automatico
- [ ] Metrics e analytics avanzati
- [ ] Integrazione Slack/Discord per notifiche
