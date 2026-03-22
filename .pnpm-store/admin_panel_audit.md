# 🔍 Audit Completo — Admin Panel (Electron)

Analisi dell'admin panel RescueManager dopo la ristrutturazione (Opzione C). L'app è passata da **7 pagine non funzionanti** a **17 pagine operative** che consumano le API del website.

---

## 1. Mappa Funzionale

| Sezione | Pagine | Dimensione | Stato |
|---------|--------|------------|-------|
| **Dashboard** | [DashboardPage](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/DashboardPage.tsx#7-175) | 6.7K | ✅ 6 KPI + azioni rapide |
| **Clienti** | `ClientsPage` | 29.8K | ✅ Lista + filtri |
| **Preventivi** | `QuotesPage` | 25.5K | ✅ Lista + gestione |
| **Lead** | `LeadsPage` | 38.5K | ✅ Pipeline completa (new → contacted → converted → lost) |
| **Abbonamenti** | `SubscriptionsPage` | 20.5K | ✅ Gestione piani + moduli |
| **Organizzazioni** | `OrganizationsPage` + `OrganizationDetailPage` | 3.7K + 44.6K | ✅ CRUD + dettaglio ricco (moduli, company settings, link attivazione) |
| **Utenti App** | `UsersPage` + `UserDetailPage` | 19.2K + 16.2K | ✅ CRUD + bulk + dettaglio |
| **Staff** | `StaffPage` + `StaffDetailPage` | 11.9K + 10.1K | ✅ CRUD + ruoli |
| **Analytics** | `AnalyticsPage` | 14.1K | ✅ Grafici Recharts |
| **Audit Log** | `AuditLogPage` | 6.3K | ✅ Cronologia azioni staff |
| **Monitoring** | [MonitoringPage](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/MonitoringPage.tsx#565-776) | 29.7K | ✅ Health check real-time (SDI/RENTRI/RVFU/Infra) |
| **Impostazioni** | [SettingsPage](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/SettingsPage.tsx#73-491) | 22.9K | ✅ 4 tab (Controllo, Flags, Config, Sistema) |
| **Login** | `LoginPage` | 4.3K | ✅ Rate limiting + security events |
| **Unauthorized** | `UnauthorizedPage` | 1K | ✅ Pagina errore |

---

## 2. Architettura Tecnica

### Stack
| Layer | Tecnologia |
|-------|------------|
| Runtime | **Electron 40** (main + renderer) |
| Framework | **React 19** + **Vite 6** + **TypeScript** |
| Routing | **React Router v7** (BrowserRouter) |
| Auth | **JWT Staff** custom (login via `/api/staff/auth/login`) |
| Backend | **API website** (`rescuemanager.eu/api/staff/admin/*`) — nessun backend proprio |
| Styling | **Tailwind CSS 3** + design system dark custom |
| Charts | **Recharts** |
| Animations | **Framer Motion** |
| Icons | **Lucide React** |

### Flusso Autenticazione
```
LoginPage → POST /api/staff/auth/login → JWT token
         → localStorage('rm-staff-token')
         → ProtectedRoute → GET /api/staff/auth/me → StaffUser
```
Con: rate limiting (5 tentativi / 15 min), security events log, validazione token locale.

### API Client ([api.ts](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/lib/api.ts) — 398 righe)
Client centralizzato e tipizzato con 15+ funzioni:
- Dashboard stats, Users CRUD + bulk, Staff CRUD, Organizations CRUD + bulk
- Leads CRUD, Sessions + kill, Audit Log, Remote Control
- Org Modules, Company Settings, Activation Links (trial/purchase)

### Electron Main (72 righe — molto leggero)
- Nessun IPC custom (solo `get-app-version`, `get-platform`, `is-electron`)
- Nessun DB locale, nessun email service, nessun OAuth server
- L'app è essenzialmente un browser wrappato in Electron

---

## 3. 🔴 Problemi Critici

### 3.1 Link Dashboard "Dispositivi Online" punta a route inesistente
Il KPI "Dispositivi Online" nella Dashboard punta a `/remote-control` (riga 82 di [DashboardPage.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/DashboardPage.tsx)), ma questa route **non esiste** in [App.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/App.tsx). Dovrebbe puntare a `/monitoring`.

### 3.2 Versione hardcoded nel layout
[AdminLayout.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/components/AdminLayout.tsx) riga 159 mostra `v1.0.0` hardcoded. Il [package.json](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/package.json) dice `0.1.0`. Nessuna delle due è aggiornata dinamicamente.

### 3.3 Nessun RBAC implementato
Il documento di ristrutturazione definisce 6 ruoli (super_admin, admin, marketing, sales, support, staff), ma nel codice attuale **non c'è nessun controllo dei permessi**. `ProtectedRoute` verifica solo se l'utente è autenticato, non il suo ruolo. Qualsiasi staff member può accedere a tutte le pagine.

### 3.4 BrowserRouter invece di HashRouter
L'admin panel usa `BrowserRouter` (riga 28 di [App.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/App.tsx)), ma la desktop app principale usa `HashRouter` per Electron. In Electron, il routing basato su history API **non funziona** con `loadFile()` — serve `HashRouter` o un workaround.

### 3.5 API_BASE fallback inconsistente
In [api.ts](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/lib/api.ts) riga 1: `import.meta.env.DEV ? '' : 'https://rescuemanager.eu'`  →  in dev la base è vuota (richieste relative), ma Vite gira sulla porta 5175 e il website è su Vercel. Serve un proxy Vite o un URL esplicito.

---

## 4. 🟡 Problemi Minori

| # | Problema | Dove |
|---|----------|------|
| 1 | [DashboardPage](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/DashboardPage.tsx#7-175) fa data mapping con [(data as any)](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/App.tsx#22-25) — TypeScript ignorato | [DashboardPage.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/DashboardPage.tsx) L22-29 |
| 2 | `Impostazioni` è nella sezione "Analisi" della sidebar — dovrebbe essere in "Sistema" | [AdminLayout.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/components/AdminLayout.tsx) L54-58 |
| 3 | Nessun `ErrorBoundary` globale — crash dell'app = schermo bianco | [App.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/App.tsx) |
| 4 | [create-staff-user.js](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/create-staff-user.js) script standalone nella root — dovrebbe essere in `scripts/` | Root del progetto |
| 5 | [RISTRUTTURAZIONE_ADMIN_PANEL.md](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/RISTRUTTURAZIONE_ADMIN_PANEL.md) ancora presente nella root — va archiviato | Root del progetto |
| 6 | La sidebar non ha un indicatore di stato dei servizi (l'utente deve navigare a /monitoring per vedere se qualcosa è offline) | [AdminLayout.tsx](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/components/AdminLayout.tsx) |

---

## 5. 🟢 Funzionalità Mancanti

| Funzionalità | Priorità | Note |
|-------------|----------|------|
| **RBAC / Permessi** | 🔴 Alta | Lo schema è definito (6 ruoli, 30+ permessi), ma mai implementato nel frontend |
| **Sessioni Attive** | 🔴 Alta | L'API esiste ([fetchSessions](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/lib/api.ts#294-298), [killSession](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/lib/api.ts#299-302)), ma nessuna pagina la usa |
| **Notifiche Broadcast** | 🟡 Media | Invio messaggi push a tutti gli utenti / organizzazioni specifiche |
| **Export CSV/Excel** | 🟡 Media | Nessuna pagina ha la funzionalità di export |
| **Ricerca globale** | 🟡 Media | A differenza della desktop app, l'admin panel non ha Cmd+K |
| **Dark/Light mode toggle** | 🟢 Bassa | Il tema è fisso dark — il documento di ristrutturazione menzionava il toggle |
| **2FA per Staff** | 🟢 Bassa | Il documento lo menziona come futuro, ma è importante per la sicurezza admin |
| **Auto-updater** | 🟢 Bassa | Come la desktop app, manca l'aggiornamento automatico |

---

## 6. Punti di Forza ✅

- **Monitoring real-time eccellente** — Health check di tutti i servizi VPS con latenza, auto-refresh 30s, toggle moduli direttamente dalla pagina
- **Settings completo** — Manutenzione app + sito, version control, feature flags raggruppati per categoria, configurazione globale con edit inline
- **OrganizationDetailPage ricca** — Dettaglio organizzazione con moduli attivi, company settings, link attivazione trial/purchase
- **API Client completamente tipizzato** — 398 righe di TypeScript con tipi per tutti i modelli (User, Staff, Org, Lead, Subscription, AuditLog, ecc.)
- **Security robusta** — Rate limiting login, validazione token JWT locale, security events logging, password hashing (bcryptjs)
- **Lead Management pipeline** — Sistema CRM base con priorità, assegnazione, tracking date
- **TypeScript everywhere** — A differenza della desktop app (JSX), l'admin panel è tutto in TSX

---

## 7. Confronto con Documento di Ristrutturazione

| Metrica | Prima (Feb 2026) | Ora (Mar 2026) | % Completamento |
|---------|-------------------|----------------|-----------------|
| Pagine | 7 (1 placeholder) | 17 funzionanti | ✅ 100% superato |
| File mancanti | 5 critici | 0 | ✅ 100% |
| CRUD | Solo read + suspend | CRUD completo + bulk | ✅ ~80% |
| Abbonamenti | Assente | `SubscriptionsPage` ✅ | ✅ |
| Lead | Assente | `LeadsPage` ✅ | ✅ |
| Analytics | Placeholder | `AnalyticsPage` con Recharts ✅ | ✅ |
| Audit Log | Assente | `AuditLogPage` ✅ | ✅ |
| Monitoring | Assente | [MonitoringPage](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/MonitoringPage.tsx#565-776) ✅ | ✅ |
| Settings | Assente | [SettingsPage](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/src/pages/SettingsPage.tsx#73-491) con 4 tab ✅ | ✅ |
| Permessi RBAC | Nessuno | ❌ Ancora assente | ⬜ 0% |
| Licenze | Assente | ❌ Ancora assente | ⬜ 0% |
| Sessioni Attive | Assente | API pronta, UI ❌ | ⬜ 50% |

---

## 8. Proposta di Azione — Prioritizzata

1. **🔴 Fix BrowserRouter → HashRouter** — L'app non funziona in Electron production con BrowserRouter
2. **🔴 Fix link Dashboard /remote-control → /monitoring** — KPI card punta a 404
3. **🔴 Implementare RBAC** — Attualmente qualsiasi utente staff ha accesso a tutto
4. **🔴 Creare pagina Sessioni Attive** — L'API è già pronta, manca solo la UI
5. **🟡 Fix API_BASE per dev** — Aggiungere proxy Vite per dev, o env variable corretta
6. **🟡 Versione dinamica** — Leggere da [package.json](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/package.json) o IPC `get-app-version`
7. **🟡 Spostare "Impostazioni"** dalla sezione "Analisi" a una sezione separata "Sistema"
8. **🟡 Aggiungere status indicator servizi nella sidebar** — Semaforo verde/rosso basato su monitoring
9. **🟢 Pulizia** — Spostare [create-staff-user.js](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/create-staff-user.js) in scripts/, archiviare [RISTRUTTURAZIONE_ADMIN_PANEL.md](file:///Users/sign.rascozzarini/Projects/rescuemanager-workspace/admin-panel/RISTRUTTURAZIONE_ADMIN_PANEL.md)
