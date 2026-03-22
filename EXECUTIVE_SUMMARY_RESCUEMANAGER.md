# RescueManager — Executive Summary

## 1. Visione del Progetto

RescueManager è una **piattaforma SaaS verticale** progettata specificamente per le **autodemolizioni italiane**. L'obiettivo è digitalizzare completamente l'operatività di queste aziende, sostituendo fogli Excel, software obsoleti e processi manuali con un ecosistema integrato multi-piattaforma.

La visione è diventare il **sistema operativo unico** per le autodemolizioni: dalla gestione dei veicoli demoliti alla vendita dei ricambi, dalla fatturazione elettronica alla tracciabilità dei rifiuti, tutto in un'unica piattaforma connessa ai sistemi governativi italiani.

---

## 2. Target di Mercato

- **Settore:** Autodemolizioni / Centri di raccolta veicoli fuori uso
- **Mercato Italia:** ~2.000 aziende attive
- **Problema:** Settore altamente regolamentato con obblighi normativi complessi (RENTRI, RVFU, SDI), attualmente gestiti con software frammentati, costosi e non integrati
- **Differenziatore chiave:** Integrazioni governative native (SDI, RENTRI, RVFU) che nessun competitor offre in un'unica piattaforma
- **Pricing:**
  - **Starter:** €179/mese o €1.800/anno — Base + 1 modulo
  - **Professional:** €279/mese o €2.800/anno — Base + 2 moduli
  - **Business:** €359/mese o €3.600/anno — Base + 3 moduli
  - **Full:** €449/mese o €4.500/anno — Tutti i moduli

---

## 3. Componenti della Piattaforma (5 applicazioni)

### 3.1 Desktop App (Electron)
- **Stack:** Electron 31 + Vite 7 + React 18 + better-sqlite3
- **Dimensione:** 58 pagine, 60 componenti, 14 hooks custom, 45 librerie
- **Funzione:** Applicazione principale per operatori in sede. Gestisce trasporti, clienti, veicoli, fatturazione, ricambi, contabilità, rifiuti
- **Design:** Dark mode navy, font Inter, sidebar con 3 sezioni (Operativo, Anagrafiche, Analisi)
- **Database locale:** SQLite per operatività offline, sincronizzazione con Supabase cloud

### 3.2 Website (Next.js)
- **Stack:** Next.js 15 + React 19 + Tailwind 4 + Supabase + Stripe
- **Dimensione:** 150+ API routes
- **Deploy:** Vercel (rescuemanager.eu)
- **Funzione:** Sito pubblico, area clienti, gestione abbonamenti, pannello staff, API backend

### 3.3 Admin Panel
- **Stack:** React SPA + Vite + Tailwind + Recharts
- **Porta dev:** 5174
- **Funzione:** Pannello amministrativo interno per gestione organizzazioni, utenti, abbonamenti, analytics, moduli, link di attivazione

### 3.4 Mobile App (React Native / Expo)
- **Stack:** Expo 54 + React Native 0.81 + expo-router 6 + Supabase
- **Completamento:** ~90%
- **Funzione:** App per autisti e operatori sul campo. 4 tab: Home, Trasporti, Ricambi, Profilo
- **Features:** Lista trasporti con filtri, dettaglio con navigazione Maps, gestione ricambi con lookup TecDoc, cambio stato in tempo reale

### 3.5 Shared API (placeholder)
- **Stato:** Struttura creata, non ancora implementata
- **Obiettivo futuro:** Centralizzare la logica API condivisa tra le piattaforme

---

## 4. Moduli Specializzati

### 4.1 Modulo SDI — Fatturazione Elettronica
- **Protocollo:** SFTP diretto con Sistema di Interscambio (Agenzia delle Entrate)
- **Funzionalità completate:**
  - Generazione XML FatturaPA conforme
  - Firma digitale P7M e cifratura
  - Trasmissione via SFTP
  - Ricezione notifiche SDI (esito, scarto, mancata consegna)
  - Import fatture passive (ciclo passivo)
  - Validazione XML client-side
  - Generazione PDF da XML
  - Numerazione automatica fatture
  - Conservazione sostitutiva digitale
  - Nota di credito TD04 per storno fatture accettate
  - Bollo virtuale, ritenuta d'acconto, cassa previdenziale
  - Gestione pagamenti e solleciti
- **Infrastruttura VPS:** Server dedicato su 217.154.118.37, PM2 cluster mode, certificati firma/cifratura
- **Nodo SDI:** Id Nodo 02166430856, protocollo 2.0

### 4.2 Modulo RENTRI — Registro Elettronico Tracciabilità Rifiuti
- **Integrazione:** API REST verso demoapi.rentri.gov.it con autenticazione JWT
- **Funzionalità completate:**
  - Formulari di identificazione rifiuti (FIR) completi
  - Registri di carico/scarico
  - Movimenti
  - Certificati
  - Validazione AI dei formulari
  - Polling transazioni
- **Form completo:** Produttore, Trasportatore, Destinatario, Rifiuti (ADR, analisi, classificazione), Trasporto, Intermediari, Annotazioni
- **Infrastruttura VPS:** rentri-api (porta 3003), rentri-polling, certificato demo in DB

### 4.3 Modulo RVFU — Registro Veicoli Fuori Uso (MIT)
- **Integrazione:** API REST Motorizzazione Civile / ACI
- **Protocollo:** OAuth2 Authorization Code Flow → id_token Bearer
- **Stato:** Codice completato, **bloccato lato server** (403 Forbidden su tutte le API REST)
- **Causa:** Configurazione server-side ACI/MIT non ancora completata per il nostro client_id
- **Email inviata:** Gennaio 2026, in attesa di risposta

### 4.4 Modulo Contabilità
- **Funzionalità:** Prima nota, piano dei conti, partita doppia
- **Integrazione:** Collegato alla fatturazione per registrazioni automatiche

---

## 5. Infrastruttura Tecnica

### Database
- **Supabase PostgreSQL** cloud
- **86 migrazioni SQL** applicate
- **78 tabelle** con Row Level Security (RLS) attivo
- **Policy pattern:** Org-scoped (is_member), User-scoped (auth.uid), Staff-only, Lookup globali
- **Tabelle principali:** orgs, profiles, org_members, transports, vehicles, clients, invoices, invoice_items, spare_parts, rentri_formulari, org_subscriptions, org_modules

### VPS (217.154.118.37)
- **3 servizi PM2:**
  - `sdi-sftp-server` — Trasmissione fatture, generazione XML, notifiche SDI
  - `rentri-api` (porta 3003) — Proxy autenticato verso API RENTRI
  - `assist-server` (porta 3100) — Sistema di assistenza remota clienti
- **Nginx** con SSL Let's Encrypt
- **Certificati SDI:** Firma P12, Cifratura P12, Sogei pubblica PEM

### AI Assistant (integrato)
- **Backend:** /opt/rentri-api/routes/ai-assist.js (porta 3003)
- **Frontend:** AIContext provider + AiAssistantPanel (inline/floating)
- **Funzionalità:** Knowledge base per modulo, pattern matching domande comuni, azioni AI (suggest_value, fill_multiple, create_record con conferma utente), context-aware (dati azienda, form state, campi vuoti)

### Integrazioni Esterne
- **TecDoc API** (RapidAPI Pro $29/mese) — Catalogo ricambi auto, cross-reference, VIN decoder
- **Stripe** — Pagamenti abbonamenti
- **Supabase Auth** — Autenticazione utenti
- **Let's Encrypt** — Certificati SSL

---

## 6. Stato Attuale del Progetto (Febbraio 2026)

### Completato ✅
- Desktop app funzionante con 58 pagine
- Mobile app al 90%
- Website live su Vercel
- Admin panel operativo
- Modulo SDI completo (trasmissione, ricezione, storno, pagamenti, conservazione)
- Modulo RENTRI completo (formulari, registri, movimenti, certificati)
- Modulo Contabilità base
- Sistema abbonamenti con piani e moduli
- RLS completo su 78 tabelle
- AI Assistant integrato
- Sistema assistenza remota clienti
- Integrazione TecDoc per ricambi
- Design system dark mode navy

### In attesa / Bloccato ⏳
- Modulo RVFU: bloccato da 403 server-side ACI/MIT
- Shared API: non ancora implementata

---

## 7. Roadmap

### Breve termine (Q1 2026)
- Risolvere blocco RVFU con ACI/MIT
- Completare mobile app al 100%
- Onboarding primi clienti pilota
- Test end-to-end completi su tutti i moduli

### Medio termine (Q2-Q3 2026)
- Go-to-market con primi 10 clienti paganti
- Implementare Shared API per centralizzare logica
- CI/CD pipeline
- Test framework (attualmente assente)
- Refactoring ipc.js monolitico (254KB)
- Standardizzare codebase (attualmente mix JSX/TSX)

### Lungo termine (Q4 2026 — 2027)
- Scalare a 30+ clienti (target €120k ARR)
- Marketplace ricambi integrato
- App mobile per clienti finali
- Integrazioni con altri sistemi gestionali
- Espansione funzionalità AI

---

## 8. Valutazione Economica

| Scenario | Valore stimato |
|---|---|
| Asset tecnologico puro | €130.000 – €200.000 |
| Con 10 clienti attivi | €250.000 – €400.000 |
| Con 30 clienti (€120k ARR) | €360.000 – €600.000 |
| Saturazione 10% mercato (200 clienti, €800k ARR) | €2.4M – €4M |

---

## 9. Dati Aziendali

- **Titolare:** Scozzarini, Emmanuel Salvatore
- **P.IVA:** 02166430856
- **CF:** SCZMNL05L21D960T
- **PEC:** rescuemanager@legalmail.it
- **Email:** info@rescuemanager.eu
- **Tel:** 3921723028
- **Dominio:** rescuemanager.eu (Vercel)
- **VPS:** 217.154.118.37

---

## 10. Numeri Chiave del Progetto

| Metrica | Valore |
|---|---|
| Pagine desktop app | 58 |
| Componenti React | 60+ |
| Hooks custom | 14 |
| Librerie/moduli | 45 |
| API routes website | 150+ |
| Migrazioni SQL | 86 |
| Tabelle DB con RLS | 78 |
| Servizi VPS (PM2) | 3 |
| Integrazioni governative | 3 (SDI, RENTRI, RVFU) |
| Piattaforme | 5 (Desktop, Web, Admin, Mobile, VPS) |
| File .md documentazione | 130+ |
