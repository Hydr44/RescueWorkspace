# Pannello Admin RescueManager — Documento di Design Unificato

> **Stato:** design consolidato (modello **C** deciso). Sostituisce e integra gli abbozzi:
> [`idee-modello-org-e-verifica.md`](idee-modello-org-e-verifica.md),
> [`flusso-preventivo-pagamento-attivazione.md`](flusso-preventivo-pagamento-attivazione.md),
> [`proposta-gocardless-attivazione.md`](proposta-gocardless-attivazione.md),
> [`schema-quote-to-cash.sql`](schema-quote-to-cash.sql).
>
> **Modello deciso (C):** `leads` = l'Organizzazione **nel funnel** (anagrafica + cronologia, un solo stato).
> `orgs` = il **tenant del prodotto**, creato all'attivazione. Identità logica unica; **una copia sola**
> dei dati al passaggio lead→org all'attivazione (no sync bidirezionale).
>
> **Principio UI:** *una funzione importante = una pagina con URL proprio.* I flussi (revisione, attivazione,
> pagamento) sono **pagine dedicate**, non modali a scomparsa.
>
> **Principio dati:** mappare sui nomi-tabella **reali** del DB, non inventarne. Estendere ciò che esiste.
>
> **Backend:** l'admin panel (Electron+React) chiama le API del **website** (`/api/staff/admin/...`,
> base `https://rescuemanager.eu`), che fa da **proxy** verso il VPS `lead-api`. GoCardless vive sul website
> come Stripe (`routes/gocardless.js` server F1 già esistente).

---

## 1. Modello dati finale (mappato sulle tabelle reali)

Confine netto: **prima dell'attivazione i dati vivono sul lead; dopo, sull'org.** Il passaggio copia una volta sola.

### 1.1 Lato FUNNEL (vive su `leads` + tabelle figlie)

| Concetto | Tabella reale | Note |
|---|---|---|
| **Organizzazione nel funnel** (anagrafica + cronologia) | `leads` | già contiene `company`, `vat_number`, `codice_fiscale`, `pec`, `forma_giuridica`, `codice_ateco`, `address_*`. Un solo campo `status` per il funnel. |
| **Demo** | `lead_demos` (+ `leads.demo_org_id` puntatore alla org demo) | la demo è una `orgs` con `is_demo=true`, hard-deleted all'attivazione produzione. |
| **Preventivo** | `lead_quotes` | ~95% completo: stati `draft→sent→viewed→accepted→paid→pending_activation→activated`, `external_payment_*`, `stripe_*`, `auto_activate_on_payment`, `activation_pending`, audit accettazione (`acceptance_ip/user_agent/signature`), rifiuto, versioning (`parent_quote_id`, `version`). |
| **Pagamento — primo addebito** | `lead_quotes` (`paid_at`, `external_payment_*`, `stripe_payment_intent_id`, +`gocardless_*` da aggiungere) | lo stato del **primo** pagamento vive **sul preventivo**, in un posto solo. |
| **Verifica/KYC** (visura + snapshot API + esito) | **da aggiungere**: campi su `lead_quotes` o tabella `lead_verifications` (file R2, snapshot risposta API P.IVA, diff, chi approva, timestamp) | è il gate documentato; vive sul **funnel** perché l'org non esiste ancora. |
| **Cronologia / attività** | `lead_activities` (via `fetchLeadActivities`) + `lead_messages` (email) + `lead_appointments` + `lead_tasks` | timeline unificata già presente. |

### 1.2 Lato CLIENTE (vive su `orgs` + tabelle figlie, post-attivazione)

| Concetto | Tabella reale | Note |
|---|---|---|
| **Tenant del prodotto** | `orgs` | `converted_from_lead_id` lega l'org al lead d'origine. `is_demo`, `web/desktop_access_enabled`, `desktop_modules`. |
| **Dati aziendali autoritativi** | `org_settings.company` (EAV) | qui leggono app desktop + SDI. È la copia **verificata** del lead. Da qui in poi è l'org la fonte di verità; il lead resta storia congelata. |
| **Abbonamento** | `org_subscriptions` | `status`, `plan`, `current_period_end`, `billing_type`, `modules`, `stripe_subscription_id`. **Da aggiungere** (vedi §4): `payment_method`, `gocardless_*`, `auto_renew`, `suspended_at/reason`, `cancelled_at/reason`, `last_payment_date`, enum CHECK su `status`. |
| **Pagamenti ricorrenti (rinnovi)** | **da aggiungere (fase 2)** `subscription_payments` | i rinnovi non hanno oggi una tabella unica. Non serve per il primo rilascio. |
| **Utenti del cliente** (operatori) | `profiles` (+ membership org) | creati/attivati al `pagato`. |
| **Feature flags / moduli** | `org_settings.features` + `org_modules` | kill-switch reali; vedi WIRED_FLAGS in SettingsPage. |
| **Fatturazione / incassi cliente attivo** | `invoices` + `invoice_payments` | già esistono. |

### 1.3 Listino / prezzi / template (NON hardcoded — punto da correggere)

| Concetto | Tabella reale | Stato |
|---|---|---|
| **Listino piani** | `plans` (`id`, `label`, `monthly_price`, `yearly_price`, `max_modules`, `is_active`, `sort_order`) | tabella **esiste** ma oggi `NewLeadQuotePage.tsx` ha prezzi **hardcoded** (`29.99`, `19.99`…). → spostare su `plans` + un listino moduli speciali. |
| **Template email** | `email_templates` (via `fetchEmailTemplates`) | già DB-driven (categoria `activation`/altro). |
| **Token pagine pubbliche** | `lead_quotes.public_uuid` (preventivo) · `plan_activation_links.token` | preventivo pubblico e link attivazione già a token. |

### 1.4 Il mapping lead → org (one-time, all'approvazione)

Copia **una volta, una direzione**, all'approvazione della verifica. Niente sync bidirezionale.

| `leads` | → | `orgs` / `org_settings.company` |
|---|---|---|
| `company` / `name` | → | `orgs.name` + `company.company_name` |
| `vat_number` | → | `company.vat` |
| `codice_fiscale` | → | `company.tax_code` |
| `pec` | → | `company.pec` |
| `forma_giuridica` | → | `company.forma_giuridica` |
| `codice_ateco` | → | `company.codice_ateco` |
| `address_street/city/province/postal_code` | → | `company.address` (oggetto) |
| (da API P.IVA) codice destinatario SDI | → | `company.codice_destinatario` |

Post-attivazione il cliente modifica questi dati **nel prodotto** (OrganizationSettings → `org_settings.company`). Il lead non si tocca più.

---

## 2. Le due macchine a stati

Sono **due** catene separate, una per il funnel (sul lead), una per il cliente (sull'org/abbonamento).
Non mescolarle nello stesso campo. Sotto, le entità "compagne" (preventivo, pagamento, abbonamento)
restano catene proprie ma **subordinate**: nessun duplicato di stato.

### 2.1 Funnel — `leads.status`

> ⚠️ Oggi l'enum reale è `new | contacted | demo_active | quote_sent | converted | lost`.
> Il modello (C) richiede di **introdurre** `trattativa` e soprattutto **`in_verifica`** (con `converted`→`attivato`).

```
                ┌─────────── (no risposta / non interessato) ─────────────► perso
                │
  lead ──contatto──► contattato ──demo──► demo_attiva ──preventivo──► trattativa
   (new)            (contacted)          (demo_active)   (quote_sent)
                                                              │
                                            (preventivo accettato + pagamento ok)
                                                              ▼
                                                        in_verifica ──(respinto/correzione)──► trattativa / perso
                                                              │
                                                       (verifica approvata)
                                                              ▼
                                              [ATTIVAZIONE: crea org] ──► attivato (→ passa alla macchina cliente)
```

| Transizione | Chi/Cosa la scatena |
|---|---|
| lead → contattato | operatore registra primo contatto (`setLeadFirstContact`) |
| contattato → demo_attiva | operatore attiva demo (`activateDemo` → crea org `is_demo`) |
| → trattativa | operatore crea/invia preventivo (`createLeadQuote`/`sendLeadQuote`); preventivo `sent` |
| trattativa → **in_verifica** | **pagamento OK** (cliente accetta su `/p/:token` o Stripe/GoCardless webhook, oppure admin registra bonifico) → il preventivo va `paid`, il lead entra in **verifica** (NON ancora attivo) |
| in_verifica → **attivato** | **admin Approva** sulla pagina Revisione (verifica visura + snapshot API OK) → scatta l'Attivazione (crea org, copia dati, attiva utenti, fattura, email benvenuto) |
| in_verifica → trattativa | admin "Richiedi correzione" (dati/visura non quadrano) |
| qualsiasi → perso | admin "Segna perso" (`lost_reason`, `lost_to_competitor`) |

**Policy:** *blocca-fino-a-verifica.* L'account non è vivo finché l'admin non approva. Coerente con "appena ci siamo, attiviamo tutto". Niente "attiva subito, verifica dopo".

**Fase `in_verifica` in dettaglio (pagamento→verifica→approvazione→attivazione):**
- *Lato cliente* (pagina a token, no login, stile preventivo pubblico): "Stiamo verificando le tue informazioni", mostra dati autocompilati da API P.IVA per conferma/correzione, **carica la visura camerale (PDF)**.
- *Verifica semi-automatica*: (1) **API Registro Imprese** = fonte di verità (stato `Attiva`, PEC, codice SDI, ATECO, sede); (2) **parsing visura** (OCR/AI → dati strutturati) e **diff** vs API + dati inseriti, con flag discrepanze; (3) opz. QR InfoCamere = controllo autenticità a occhio. **ATECO** = segnale anti-frode (settore coerente: 38.31 / 45.x / 49.4) + suggerimento config (demolizione → RVFU/RENTRI).
- *Lato admin* = **Pagina Revisione** (§3): lista `in_verifica`, dati + esito API + dati visura + diff/flag → **Approva** / **Richiedi correzione** / **Respingi**. Gate umano loggato.
- *Si salva (audit/KYC-lite)*: file visura (R2), **snapshot risposta API**, chi approva, timestamp, esito.

### 2.2 Cliente — `org_subscriptions.status` (con `orgs`)

```
  (attivazione crea org)──► cliente_attivo ──(mancato pagamento / richiesta)──► sospeso
                                  │   ▲                                            │
                                  │   └────────────(ripristino pagamento)─────────┘
                                  │
                          (disdetta cliente / fine contratto)
                                  ▼
                               disdetto
```

| Transizione | Chi/Cosa la scatena |
|---|---|
| → cliente_attivo | automatico al `pagato` (qualunque metodo): `org_subscriptions.status=active`, `data_inizio`/`data_rinnovo`, utenti creati, fattura + email |
| cliente_attivo → sospeso | mancato pagamento rinnovo (webhook fail) **o** sospensione manuale admin (`suspended_at`, `suspension_reason`) → kill-switch accesso |
| sospeso → cliente_attivo | pagamento ripristinato / admin riattiva |
| cliente_attivo/sospeso → disdetto | disdetta cliente o fine contratto (`cancelled_at`, `cancellation_reason`); accesso revocato |

### 2.3 Catene subordinate (lette, mai duplicate)

- **Preventivo** (`lead_quotes.status`): `draft → sent → viewed → accepted → paid → pending_activation → activated`; rami `rejected`, `expired`, `superseded`, `cancelled`.
- **Pagamento primo** (sul preventivo): `in_attesa → pagato`; rami `fallito`, `scaduto`. Identico per Stripe / GoCardless / bonifico — **una sola condizione** (`pagato`) accende l'attivazione.
- **Abbonamento** (`org_subscriptions.status`): `pending_payment → active`; rami `suspended`, `cancelled`, `expired`.

> Regola d'oro: il preventivo accettato **genera** l'abbonamento `pending_payment`; al `pagato` l'abbonamento diventa `active` e l'org `cliente_attivo`. Una catena sola, niente duplicati.

---

## 3. Mappa PAGINE (una funzione = una pagina con URL)

Principio: poche colonne/campi, 2-3 azioni chiare. ✅ = esiste · 🆕 = da creare · 🔧 = da estendere/rifare.

| # | Pagina | URL | Stato | Cosa vedo (poche colonne/campi) | Cosa faccio (2-3 azioni) |
|---|---|---|---|---|---|
| 1 | **Lead / Funnel** | `/leads`, `/leads/:id` | ✅🔧 `LeadsPage`, `LeadDetailPage` | Lista: nome/azienda, stato funnel (badge), priorità, ultimo contatto. Dettaglio: anagrafica + cronologia (timeline) | Crea/modifica lead · avanza stato · apri Demo/Preventivo |
| 2 | **Demo** | `/leads/:id/demos/:demoId` | ✅ `LeadDemoDetailPage` | Moduli abilitati, scadenza, login/uso, tipo (showcase/trial/pilot) | Attiva/estendi demo · cambia moduli · converti→preventivo |
| 3 | **Revisione** (verifica visura+dati) | `/leads/:id/revisione` o `/revisione` (coda) | 🆕 | Coda lead `in_verifica`: dati autocompilati, **esito API P.IVA** (Attiva/Cessata), **dati estratti visura**, **diff/flag**, ATECO coerente? | **Approva** (→ Attivazione) · **Richiedi correzione** · **Respingi** |
| 4 | **Attivazione** (pagina dedicata) | `/leads/:id/quotes/:qid/attivazione` | 🆕 (sostituisce `LeadActivationModal`) | Checklist a step (no modale): dati aziendali per fattura, conferma config+prezzo dal preventivo, moduli, trial, email benvenuto | **Attiva account** (crea org, copia dati, utenti, fattura) · invia email · note interne |
| 5 | **Stato Pagamento** | `/leads/:id/quotes/:qid/pagamento` | 🆕 (oggi è modal+bell) | Importo, metodo; se bonifico: IBAN + **causale univoca**; stato (in_attesa/pagato/fallito/scaduto), giorni in attesa | **Segna bonifico ricevuto** (con conferma importo) · Sollecita · Riprova/passa a bonifico |
| 6 | **Clienti** | `/clients`, `/clients/:id` | ✅ `ClientsPage`, `ClientDetailPage` | Lista: azienda, stato cliente, piano, scadenza, n° membri. Dettaglio: tab Panoramica/Abbonamento/Membri/Moduli/Controlli/Attività/Provenienza | Sospendi/riattiva/disdici · gestisci moduli · apri abbonamento |
| 7 | **Preventivi** | `/quotes`, `/leads/:id/quotes/:qid`, `/leads/:id/quotes/new` | ✅🔧 `QuotesPage`, `LeadQuoteDetailPage`, `NewLeadQuotePage` | Lista: numero, cliente, importo, stato, scadenza. Dettaglio/nuovo: piano, moduli, prezzo **dal listino**, sconto, validità | Crea/invia/duplica · accetta (fallback admin) · vai a Pagamento/Attivazione |
| 8 | **Pagamenti / Incassi** | `/pagamenti` (+ `/clients/:id` tab) | 🆕 (vista trasversale) | Primi pagamenti (da `lead_quotes`) + rinnovi (`subscription_payments` F2) + `invoice_payments`: importo, metodo, stato, scadenza | Segna ricevuto · sollecita · esporta |
| 9 | **Task / Promemoria** | `/task` (+ widget) | ✅🔧 `MyTasksWidget`, `LeadTasksPanel` (oggi solo widget/pannello) | Coda task: titolo, lead/cliente, priorità, scadenza, stato | Crea/completa task · genera follow-up (`generateFollowups`) |
| 10 | **Supporto** | `/support` | ✅ `SupportPage` | Ticket: oggetto, cliente, stato (open/pending/…), priorità | Rispondi · cambia stato · chiudi |
| 11 | **Impostazioni** (listino/prezzi/template, NON hardcoded) | `/settings` | ✅🔧 `SettingsPage` (tab: controllo/flags/config/info) | Aggiungere tab **Listino** (`plans` + prezzi moduli) e **Template** (`email_templates`); feature flags con badge collegato/segnaposto | Modifica prezzi/piani · modifica template · toggle flag globali/manutenzione |
| 12 | **Staff / Ruoli** | `/staff`, `/staff/new`, `/staff/:id` | ✅ `StaffPage`, `NewStaffPage`, `StaffDetailPage` | Lista: nome, ruolo, stato, ultimo accesso | Crea/disattiva staff · cambia ruolo (RBAC `roleAllowedPaths`) · termina sessione |
| 13 | **Ricerca globale** | top-bar (⌘K) | 🆕 | Risultati mescolati: lead, clienti, preventivi, ticket | Salta alla scheda |
| — | Dashboard | `/dashboard` | ✅ `DashboardPage` | KPI funnel + cliente | — |
| — | Sessioni / Monitoring / Audit | `/sessions`,`/monitoring`,`/audit`,`/org-audit` | ✅ | (vedi §5: rimandare l'avanzato) | — |

> Le 3 **pagine pubbliche a token** (lato cliente, no login) vivono sul **website**, non nel panel:
> `/p/:token` (preventivo) · pagina **Verifica** (carica visura) · `/pay/:token` (stato pagamento, read-only).

---

## 4. Cosa riusare vs cosa rifare + ordine di rebuild

### 4.1 RIUSARE così com'è (non toccare)
- **`leads` + `lead_quotes` + `lead_demos`**: schema ricco e quasi completo. Niente tabelle nuove "a parole".
- Flusso preventivo (`NewLeadQuotePage` → `LeadQuoteDetailPage`), demo, email (`email_templates`), task/appuntamenti, RBAC staff, Stripe (interamente cablato sul website).
- `ClientsPage`/`ClientDetailPage` (org unificata: org + subscription + members + moduli).
- `lib/api.ts` (1586 righe): tutte le funzioni `fetch*`/`activateQuote`/`recordExternalPayment`/`clientAction` ecc. — **estendere**, non riscrivere.

### 4.2 RIFARE / TRASFORMARE
- **`LeadActivationModal` → pagina Attivazione dedicata** (#4): il flusso centrale non deve essere un modale.
- **`PendingActivationsBell` (modal+bell) → pagina Stato Pagamento dedicata** (#5) + coda Revisione (#3). Il bell resta come *scorciatoia*, non come luogo del flusso.
- **Prezzi hardcoded in `NewLeadQuotePage` → listino DB** (`plans` + prezzi moduli in Impostazioni).
- **`leads.status`**: introdurre `trattativa` e `in_verifica` (oggi mancano); rinominare `converted`→`attivato` lato funnel.
- **`org_subscriptions`**: enum CHECK su `status` + colonne `payment_method`/`gocardless_*`/`auto_renew`/`suspended_at`/`cancelled_at`/`last_payment_date`.

### 4.3 NUOVO da costruire
- Pagine **Revisione** (#3), **Attivazione** (#4), **Stato Pagamento** (#5), **Pagamenti/Incassi** (#8), **Task** come pagina (#9), **Ricerca globale** (#13), tab **Listino/Template** in Impostazioni (#11).
- **GoCardless**: server F1 sul website (redirect-flow + complete + webhook + primo addebito) — mirror di Stripe, in sandbox; widget nel panel; funzioni `api.ts`.
- **Verifica/KYC**: upload visura (R2), chiamata API P.IVA + snapshot, parsing/diff, record audit.
- 3 **pagine pubbliche a token** sul website (preventivo / verifica / pagamento).

### 4.4 Ordine di rebuild consigliato (fasi)
- **F1 — Schema & stati:** introdurre `trattativa`/`in_verifica` su `leads`; enum + colonne `org_subscriptions` (sospensione/disdetta); spostare il listino su `plans`. Base solida prima delle UI.
- **F2 — Attivazione & Pagamento come pagine:** `LeadActivationModal` → pagina **Attivazione** (#4); estrai **Stato Pagamento** (#5) da bell/modal. (Bell resta scorciatoia.)
- **F3 — Revisione/Verifica (`in_verifica`):** pagina **Revisione** (#3) + upload visura (R2) + API P.IVA + snapshot/diff + mapping lead→org all'approvazione.
- **F4 — GoCardless:** server website (sandbox) + widget panel + funzioni api.ts + ricorrenza a scelta (`auto_renew`).
- **F5 — Pagine pubbliche a token:** preventivo / verifica / `/pay/:token` (read-only) sul website.
- **F6 — Listino/Template + Pagamenti/Incassi + Task pagina + Ricerca globale:** completa Impostazioni (#11), vista incassi (#8), Task (#9), ⌘K (#13).
- **F7 (rimandabile) — Avanzato:** `subscription_payments` (rinnovi), `orgs.lifecycle_status` unico, audit/monitoring/analytics avanzati.

Ogni fase: spenta di default → sandbox/staging → prod.

---

## 5. Cosa RIMANDARE (lean — non costruire adesso)

- **Analytics avanzate / BI**: `AnalyticsPage` esiste; non costruirci dashboard predittive (lead_score, churn_risk, LTV/MRR sono già colonne ma con zero clienti non servono feature).
- **Audit/monitoring avanzato**: `AuditLogPage`, `OrgAuditPage`, `MonitoringPage`, `SessionsPage` restano basici. Niente alerting/log retention complessi ora.
- **Riconciliazione bancaria automatica**: il bonifico lo conferma l'admin a mano ("Segna bonifico ricevuto"). Nessun match estratto-conto.
- **Portale cliente completo**: bastano le 3 pagine pubbliche a token (preventivo/verifica/pagamento), senza login.
- **`subscription_payments` (rinnovi) + `orgs.lifecycle_status` unico**: fase 2/3. Per il primo rilascio (primo pagamento + attivazione) non servono.
- **QR InfoCamere automatico**: il QR è per app/web ufficiali, non API — resta controllo manuale a occhio, facoltativo.
- **Feature dedicate su ATECO**: tienilo come segnale di verifica + suggerimento config; niente segmentazione/marketing builder ora.

---

### Sommario operativo
- Modello **C**: lead = funnel (anagrafica/preventivo/demo/verifica) · org = tenant (abbonamento/utenti); copia dati one-time all'approvazione.
- Due macchine: **funnel** (lead→contattato→demo→trattativa→**in_verifica**→attivato/perso) e **cliente** (attivo↔sospeso→disdetto).
- Gate `in_verifica`: pagamento→verifica visura+API P.IVA→approvazione umana→attivazione (crea org).
- Flussi = **pagine** (Revisione, Attivazione, Stato Pagamento), non modali. Prezzi dal **listino** `plans`, non hardcoded.

---

## 6. Avanzamento rebuild (log)

### F1 — Schema & stati ✅ (parte lato codice)
- **Modulo unico stati funnel**: `admin-panel/src/lib/leadStatus.ts` — fonte di verità per la catena
  `new → contacted → demo_active → quote_sent → trattativa → in_verifica → attivato (+ lost)`,
  con `funnelLabel()`/`funnelColor()`/`normalizeFunnelStatus()`. `converted` è alias storico di `attivato`.
- **Cablato**: `LeadsPage` (badge, filtro esteso a tutta la catena, pill destinatari, KPI "Attivati"),
  `LeadDetailPage` (badge), `AnalyticsPage` (breakdown per stato), type `Lead.status` in `lib/api.ts`.
- `leads.status` è **testo libero** a DB → nessuna migration per i nuovi stati (solo codice).
- **Schema abbonamento** (sospensione/disdetta/payment_method/gocardless/auto_renew): già pronto in
  `website/supabase/migrations/20260615_gocardless_activation_fase0.sql` — **da applicare TU** (no deploy in autonomia).
  CHECK su `org_subscriptions.status` lasciato **commentato** (rischioso su dati esistenti).
- **Listino → `plans` (admin) ✅ slice sicuro**: nuovo `admin-panel/src/lib/listino.ts` (Plan + `LISTINO_FALLBACK`
  allineato al seed DB + `ANNUAL_DISCOUNT`/`BIENNIAL_DISCOUNT` + `SPECIAL_MODULE_DEFAULT_PRICES` + `fmtPlanPrice`),
  `fetchPlans()` in `api.ts` (legge DB `plans`, import **dinamico** di supabase, fallback su NaN/negativi/vuoto).
  `SubscriptionsPage` ora legge il listino DB (rimossi i prezzi sbagliati 19,99/98,99/149,99). `NewLeadQuotePage`
  prende i default moduli + sconto annuale dal listino (invariato).
- **⚠️ Scoperta**: il listino è duplicato/incoerente su 4 fonti + tassonomia piani divergente in `NewLeadQuotePage` +
  mapping Stripe copiato 6× sul website. Dettaglio e decisioni aperte in **`listino-inconsistenze.md`**.
  La parte customer-facing (desktop/website) e la consolidazione Stripe sono **deploy-bound** → da fare con l'utente.

### F1.5 — Listino editabile + tassonomia unificata ✅
- **Tassonomia canonica decisa**: `starter/professional/business/full` (+ `custom`=Su misura). Allargato `plan_type`→`string`.
- **Editor listino**: tab **Impostazioni → Listino** (`ListinoEditor`) → nuova route website `/api/staff/admin/plans`
  (GET/PUT, service_role + auth admin, prezzi in centesimi). `fetchPlansAdmin`/`savePlan` in api.ts (euro↔centesimi).
- **Unificate** etichette+selettori piano via `planOptions`/`planLabel` (lib/listino.ts) in NewLeadQuotePage,
  LeadDetailPage, LeadQuoteDetailPage, ClientsPage. Niente più `flotta/enterprise` hardcoded.
- Review avversariale (4 lenti, 9 finding): regressioni tassonomia fixate; round-trip €↔cent verificato;
  i finding "sync" (sito/desktop/Stripe ancora hardcoded) = **non auto-sincronizzati**, vedi `listino-inconsistenze.md`.
- **Push website**: la sola modifica website è la **nuova route** `/api/staff/admin/plans` (additiva). Build admin verde.

### F3 — Revisione / verifica (in_verifica) ✅ (core)
- **Pagina Revisione** (`admin-panel/src/pages/RevisionePage.tsx`, route `/revisione` + nav in 3 punti:
  AdminLayout, MODULE_CATALOG, ROLE_MODULE_ACCESS): coda dei lead `in_verifica` con dati aziendali,
  **verifica P.IVA** (Registro Imprese) con diff vs dati inseriti, e azioni **Approva** (→ `activateQuote`,
  crea org/utenti/email), **Richiedi correzione** (→ trattativa), **Respingi** (→ perso).
- **Route P.IVA**: `website/src/app/api/staff/admin/company-lookup` (OpenAPI.it server-side, OAuth Basic,
  graceful se `OPENAPI_API_KEY`/`OPENAPI_EMAIL` mancanti su Vercel; P.IVA validata `^[0-9]{11}$`). Su staging.
- **Ingresso coda**: bottone "Invia in verifica" su LeadDetailPage (lead con preventivo pagato → `in_verifica`).
  L'ingresso AUTOMATICO al pagamento (webhook) è backend/deploy → F-successiva.
- Helpers api.ts: `fetchRevisioni`, `verifyCompanyPiva`, `setLeadStatus`. Review avversariale (blocker
  path-traversal + quote-selection + error-msg) tutti fixati. Build verde.
- ❌ ancora F5: upload visura camerale lato cliente (pagina pubblica a token) → la Revisione lo mostrerà.

### F2 — Attivazione come pagina ✅ (Attivazione) · ⏳ (Stato Pagamento)
- **Pagina Attivazione dedicata**: `admin-panel/src/pages/ActivationPage.tsx`
  (`/leads/:id/quotes/:qid/attivazione`, route in `App.tsx`). Riusa `LeadActivationModal`
  (stessa logica) ma con URL proprio: ricaricabile/linkabile. I due bottoni "Attiva account" in
  `LeadDetailPage` ora **navigano** alla pagina (prima aprivano il modale).
- Il modale è ancora montato in `LeadDetailPage` come **fallback** (non più innescato) — si rimuove
  dopo che confermi che la pagina funziona sull'app Electron.
- ⏳ **Stato Pagamento** (#5) come pagina: ancora da estrarre da bell/modal.
- Build verde + `tsc --noEmit` pulito.
