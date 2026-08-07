# RescueManager — Documento di Progetto (sorgente di verità)

> **Scopo di questo file.** È la fotografia completa di *cosa fa* RescueManager oggi, modulo per modulo, con lo **stato reale** di ogni funzionalità. Serve a ragionare su **roadmap** e **pacchetti commerciali** anche in una sessione separata (es. un altro Claude): dagli questo file come contesto e potrà proporre priorità, pacchetti e decisioni senza dover ri-esplorare il codice.
>
> **Aggiornato:** giugno 2026 · **Fonte:** censimento automatico del codice (335 funzionalità su 13 aree).
> **Legenda stato:** ✅ funziona end-to-end · 🟡 parziale / non completamente cablato · 📋 pianificato (abbozzo/TODO) · ⏸️ disattivato (presente ma spento via flag/modulo) · 🗑️ deprecato.

---

## 1. Cos'è RescueManager

Gestionale **all-in-one per autodemolizioni e soccorso stradale** (mercato italiano). Copre il ciclo completo dell'attività: clienti, veicoli in piazzale, demolizioni con pratica ufficiale (RVFU/ACI), gestione rifiuti normativa (RENTRI), magazzino ricambi con vendita su marketplace, trasporti/soccorso con tracking GPS, preventivi, fatturazione elettronica SDI e contabilità.

- **Target:** autodemolitori, soccorso stradale, officine che smontano/rivendono ricambi.
- **Valore:** un solo software al posto di 4-5 gestionali separati + adempimenti normativi italiani (SDI, RVFU, RENTRI, MUD) integrati.
- **Modello commerciale:** SaaS in abbonamento, piano base + moduli premium a pagamento (vedi §4).

---

## 2. Architettura (alto livello)

| Componente | Tecnologia | Ruolo |
|---|---|---|
| **App desktop** | Electron + React/Vite | Il gestionale principale (operatori in ufficio). Cuore del prodotto. |
| **App mobile** (RescueMobile) | Expo / React Native | App autisti: trasporti, GPS live, demolizioni in campo. |
| **Sito web** | Next.js (Vercel) | Marketing + checkout Stripe + pannello admin staff + **proxy API** (`/api/ai/*`, sync, monitoring). |
| **Database / Auth** | Supabase (Postgres + Auth + Storage + Edge Functions + Realtime) | Dati, autenticazione, RLS multi-tenant, funzioni serverless. |
| **Server VPS** | Node.js (PM2) | Gateway RENTRI (mTLS), OAuth eBay, server SDI Web Service. |
| **Storage file** | Cloudflare R2 (S3-compatible) | Archivio fatture/certificati. |

**Ambienti:** *staging* (`staging.rescuemanager.eu`, branch `staging`) e *produzione* (`rescuemanager.eu`, branch `main`). "Test è test, prod è prod": gli ambienti normativi (SDI, RENTRI) sono fissati per deployment.

**Multi-tenant:** ogni dato è isolato per organizzazione (`org_id`) con Row-Level Security. Ruoli granulari (owner/admin/manager/operator/viewer).

---

## 3. Moduli e funzionalità (stato reale)

I moduli si dividono in **base** (inclusi in ogni piano) e **premium** (add-on a pagamento). In coda i sistemi **trasversali** (team, billing, AI, mobile, infrastruttura).

### 3.1 — 🧾 FATTURAZIONE ELETTRONICA / SDI · *(premium: modulo SDI)*
Emissione, trasmissione e ricezione fatture elettroniche via SDI (FatturaPA 1.2), con PDF professionali. **37 funzioni ✅ / 6 🟡.**
- ✅ Creazione fatture: TD01/TD02/TD04 (nota credito)/TD05/TD06, numerazione progressiva con prefisso configurabile, cliente da rubrica o al volo, PF/PG.
- ✅ Righe con sconto (% o importo) per riga, IVA per riga, autocomplete da preset articoli.
- ✅ Bollo virtuale, ritenuta d'acconto, cassa previdenziale (calcoli normativi completi).
- ✅ Pagamento (MP01-MP23), scadenza, IBAN/BIC/banca precompilati.
- ✅ Validazione locale pre-invio + ✅ invio SDI via Web Service (XML + firma CAdES-BES su VPS) + ✅ invio massivo.
- ✅ Ricezione notifiche SDI (RC/NS/MC/DT/AT) con polling auto, ✅ conferma FO, ✅ **fatture passive ricevute** (inbox, import in DB, visualizzazione XML).
- ✅ PDF fattura (logo + branding + note legali), PDF da XML FatturaPA, storno (TD04), tagging, filtri/ricerca, export CSV, invio email.
- ✅ Lookup Agenzia Entrate (dati da P.IVA), autocomplete indirizzi (Google), calcolo CF, ricerca banche.
- ✅ Ambiente SDI TEST/PROD, badge stato, scadenza invio (12gg), dettagli rifiuto.
- 🟡 Regime fiscale (UI non completa) · 🟡 gestione pagamenti incassi · 🟡 integrazione contabilità (movimenti auto) · 🟡 conservazione sostitutiva · 🟡 timeline notifiche · 🟡 popup post-salvataggio incasso.
- **Integrazioni:** SDI Agenzia Entrate, OpenAPI (P.IVA), OpenAPI E-Signature (Namirial), Google Maps, conservatore digitale, R2.

### 3.2 — 🚗 DEMOLIZIONI / RVFU · *(premium: modulo RVFU)*
Pratica ufficiale di demolizione veicoli (Registro Veicoli Fuoriuso) integrata con ACI/Portale del Trasporto. **25 ✅ / 6 🟡 / 1 📋.**
- ✅ Lista + form demolizione (classic e "new" API-first), ricerca/selezione veicolo, creazione pratica RVFU con invio diretto, dettaglio VFU.
- ✅ Conferimento a centro raccolta, annullamento, deleghe operatori, state machine stato VFU (INSERITO→RADIATO→…).
- ✅ Bozza FIR RENTRI da pratica, bozza fattura SDI da pratica, scheda demolizione PDF (6 fasi), email conferma, timeline lavorazione, fascicolo VFU.
- ✅ Normativa applicabile (D.Lgs. 209/03 vs 152/06), causali, ISTAT province/comuni, validazione CF/anagrafica, autenticazione OIDC Portale, credenziali in Settings, modalità demo, local-only mode.
- 🟡 Verifica PRA / radiazione ACI / notifica Portale (dipendono da credenziali) · 🟡 pagamenti PagoPA · 🟡 Kanban VFU · 🟡 integrazione ACI/MIT.
- 📋 OCR libretto circolazione (estrazione dati da scan).
- **Integrazioni:** ACI/PRA, Portale del Trasporto (RVFU API/OIDC), PagoPA, ISTAT, RENTRI, SDI.

### 3.3 — ♻️ RIFIUTI / RENTRI · *(premium: modulo RENTRI)*
Adempimenti rifiuti: registri, formulari FIR, MUD, firma remota. **16 ✅ / 2 🟡 / 1 📋.**
- ✅ Registri cronologici (vidimazione su RENTRI), movimenti carico/scarico (EER), formulari FIR + **xFIR digitali** (ciclo di vita completo).
- ✅ Firma mobile OTP (Cloud Signature Consortium), certificati org multiambiente, limiti quantitativi + alert, MUD annuali, notifiche webhook RENTRI.
- ✅ Setup wizard 5 step, dashboard rifiuti (KPI), sincronizzazione bidirezionale, immutabilità post-RENTRI (guard rail), ambiente test/prod, stampa registri/movimenti/FIR.
- 🟡 Trasmissioni batch + polling · 🟡 validazione IA pre-trasmissione (feature flag `ai_validation`).
- 📋 Report comparativo normativa 209/03 vs 152/06.
- **Integrazioni:** RENTRI API v1.0, CA CSC v2.0 (firma OTP), gateway VPS, MUD, ECOCERVED.

### 3.4 — 🔧 RICAMBI / MAGAZZINO · *(base, flag `ricambi`)*
Magazzino ricambi da demolizione con vendita multicanale. **29 ✅ / 3 🟡 / 1 📋.**
- ✅ Catalogo (foto, codici OEM/EAN/interno, compatibilità), lookup OEM intelligente, descrizioni AI per marketplace, barcode/etichette (Code-128/39/QR) + stampa.
- ✅ Ubicazione/scaffali + mappa magazzino, prezzi e suggerimenti (TecDoc/AutoDoc/eBay), smontaggio da veicolo, batch ricambi, compatibilità veicoli.
- ✅ Pubblicazione marketplace B2B interno, ✅ pubblicazione eBay, foto multiple, anteprima annuncio, ricerca/filtri, dettagli tecnici, scanner barcode, import CSV/JSON distinte, avviso duplicati OEM, cache esterna (TecDoc/AutoDoc).
- 🟡 AI riconoscimento foto · 🟡 ricerca prezzi eBay · 🟡 sincronizzazione VFU→ricambi.
- 📋 Marketplace Shopify/Subito (placeholder).
- **Integrazioni:** TecDoc (RapidAPI), Piloterr/AutoDoc, eBay Browse+Trading, Claude AI, Supabase Storage.

### 3.5 — 🛒 MARKETPLACE · ⏸️ *(modulo disattivato — da decidere)*
**19 funzioni ✅ a livello di codice, ma il modulo è SPENTO.** Va deciso se/quando rilasciarlo.
- Esterni: connessione eBay (OAuth), Shopify (parziale 🟡), Subito.it (export CSV).
- B2B interno (rete demolitori): creazione annunci, ricerca/browse, offerte/controproposte, messaggistica privata, preferiti, **recensioni & reputazione** (org-scoped), statistiche/badge org, gestione "miei annunci", sync magazzino→marketplace, RLS dedicata.
- **Nota:** funzionalmente quasi completo, ma da prodotto è disattivato. Decisione aperta (vedi §6).

### 3.6 — 🚚 TRASPORTI / TRACKING GPS · *(base: `trasporti` + `tracking`)*
Gestione trasporti e soccorso stradale con mappa live. **23 ✅ / 3 🟡.**
- ✅ Lista + CRUD trasporti, 4 tipologie servizio (Standard, **Soccorso Stradale**, Conto Terzi, Mezzi Speciali), mappa pickup/dropoff (Leaflet/OSM), tariffario dinamico (base + €/km + supplementi), assegnazione autista/veicolo.
- ✅ **Tracking live** (mappa con posizioni autisti), dispositivi GPS via app mobile (pairing QR), impostazioni globali GPS (intervallo, on/off, modalità), lista dispositivi.
- ✅ Preset soccorso, committenti conto terzi, indirizzi frequenti/depositi, tariffario base, export PDF/CSV, stati trasporto, urgenza, validazione, draft localStorage, auto-save.
- 🟡 Tappe intermedie multi-stop · 🟡 notifica push autista · 🟡 tracker hardware (Teltonika/Queclink/OBD — form pronto, server TCP parziale).
- **Integrazioni:** Nominatim/OSRM, Supabase Realtime, Leaflet, (Google Maps alt.).

### 3.7 — 🅿️ PIAZZALE · *(base: `piazzale`)*
Gestione veicoli in piazzale (sequestri, confische, demolizioni). **parte di 16 ✅ / 4 🟡.**
- ✅ Lista (griglia/lista) con filtri per tag, dettaglio veicolo, creazione/modifica (zona, posizione, tag categoria, foto ingresso, pratiche), export CSV, multi-select azioni bulk, avviso permanenza >60 giorni.
- ✅ **Import Excel/CSV** (clienti + piazzale; categoria dedotta dal nome del foglio).
- 🟡 Configurazione zone (Impostazioni).

### 3.8 — 👥 CLIENTI / CRM · *(base: `clienti`)*
Anagrafica clienti con CRM leggero. **parte di 16 ✅ / 4 🟡.**
- ✅ Lista con KPI, dettaglio CRM, creazione/modifica (PF/PG, categoria), auto-fill P.IVA (OpenAPI), calcolo CF, autocomplete indirizzo/comuni, timeline attività, validazione requisiti configurabile, export CSV, **import Excel/CSV**.
- 🟡 Pipeline clienti · 🟡 tag clienti.

### 3.9 — 📄 PREVENTIVI · *(base: `preventivi`)*
**6 ✅ / 1 🟡.** Lista/ricerca/filtri, creazione (numero auto, righe, sconti), PDF (Electron), invio email, **catalogo voci condiviso con le fatture**. 🟡 conversione preventivo→fattura.

### 3.10 — 📅 CALENDARIO · *(base: `calendario`)*
**5 ✅.** Viste settimana/mese/lista, giorni festivi, eventi (appuntamenti/scadenze/promemoria), trasporti programmati, impostazioni (vista/durata/weekend).

### 3.11 — 📊 CONTABILITÀ · *(premium: modulo `contabilita`)*
**4 ✅ / 1 🟡.** Prima nota (partita doppia), piano dei conti, generazione automatica movimenti da fatture, autofattura SDI (TD18/TD19). 🟡 dashboard reporting.

---

## 4. Piani e pacchetti commerciali

### 4.1 — Piani (abbonamento)
| Piano | Prezzo | Moduli premium inclusi |
|---|---|---|
| **Free / Trial** | €0 (trial 14 giorni) | nessuno (solo base) |
| **Starter** | €179/mese · €1.800/anno | 1 modulo a scelta |
| **Professional** | €279/mese · €2.800/anno | 2 moduli a scelta |
| **Business** | €3.600/anno | 3 moduli a scelta |
| **Full** | €4.500/anno | tutti i moduli |
| **Custom** | personalizzato | su misura (gestito da admin) |

*(prezzi come da codice: `plans.js` / `BillingSettings`. Da confermare/uniformare per il listino ufficiale.)*

### 4.2 — Moduli PREMIUM (add-on, contano per il piano)
| Modulo | Cosa sblocca |
|---|---|
| **SDI** | Fatturazione elettronica (§3.1) |
| **RVFU** | Demolizioni / pratica veicoli fuoriuso (§3.2) |
| **RENTRI** | Rifiuti / registri / FIR / MUD (§3.3) |
| **Contabilità** | Prima nota / piano conti / autofatture (§3.11) |

### 4.3 — Moduli BASE (inclusi in ogni piano)
Clienti/CRM · Trasporti · Tracking GPS · Piazzale · Ricambi · Preventivi · Calendario · Mezzi · Autisti · Report.
*(Marketplace è tecnicamente un modulo base `marketplace` ma è ⏸️ disattivato.)*

### 4.4 — Come è implementato il gating (per chi struttura i pacchetti)
- **`org_subscriptions`** → piano + stato (active/trial/past_due/canceled) + Stripe.
- **`orgs.desktop_modules`** (array) → fonte canonica dei moduli attivi per l'org (nomi UI).
- **`system_settings.feature_flags`** → kill-switch globali per feature non ancora rilasciate (es. `rvfu_enabled`, `marketplace_enabled`).
- **`org_settings.key='features'`** → override per-org di singole feature.
- Lato app: `useSubscription`, `useFeatureFlags`, `SubscriptionGate` (blocca se scaduto), `ModuleGuard` (gating per modulo). Org `is_demo=true` bypassa il gate ma blocca invii reali SDI/RENTRI/RVFU.

> **Leva chiave per la roadmap:** ogni feature nuova nasce **spenta** (feature flag / `enabled:false`) e si accende quando è pronta. È il meccanismo che evita che "una modifica rompa il resto" e permette di rilasciare a pezzi.

---

## 5. Sistemi trasversali

### 5.1 — 👤 Team / Auth / Ruoli / Sicurezza — **20 ✅ / 4 🟡 / 2 📋**
Membri org, inviti email (token + scadenza + reinvio + annullo), accettazione invito, **5 ruoli gerarchici** (owner/admin/manager/operator/viewer) con permessi su 40+ azioni, assegnazione ruoli subordinati, rimozione membri, OrgContext (switch org), filtro tab Settings per ruolo/moduli, sessione attiva, email verificata, RPC SECURITY DEFINER (anti-escalation), RLS su `org_members`, OAuth RVFU/RENTRI, cambio password.
🟡 Users page (operatori legacy) · 🟡 stato sicurezza/audit log · 🟡 resend verifica. 📋 2FA/TOTP · 📋 security audit log backend.

### 5.2 — 💳 Billing / Abbonamenti — **19 ✅ / 3 🟡** (dettaglio in §4)
Checkout Stripe (web), Billing Portal (web + edge function desktop), webhook Stripe, trial 14gg, BillingSettings desktop. 🟡 billing custom/manuale (admin) · 🟡 staff audit log · 🟡 gestione fallback webhook.

### 5.3 — ⚙️ Impostazioni — **24 ✅ / 8 🟡**
Hub di configurazione: Profilo, Organizzazione (info azienda, sede, logo&brand, orari, zona pericolosa/delete org), Team, Abbonamento, Sicurezza, Notifiche (cloud + SMTP desktop), Fatturazione SDI, Demolizione (credenziali RVFU + template fattura), Tracking GPS, Rifiuti RENTRI (limiti/certificati/firma), Marketplace OAuth, **Dati & Backup (export/import + import Excel)**, Aspetto. Infrastruttura UI: validatori, dirty-tracking + StickySaveBar, filtro tab per ruolo/moduli.
🟡 sede&contatti, log attività, general settings, CRM clienti inline, piazzale inline, calendario inline (alcune di queste cablate di recente).

### 5.4 — 📱 App mobile (RescueMobile) — **16 ✅ / 6 🟡**
Login magic-link via pairing QR + email/password, home "oggi", gestione trasporti (lista/dettaglio/stati), **GPS live in background** durante i trasporti, demolizioni (9 fasi con foto), profilo autista, heartbeat online/offline, moduli dinamici (feature gates), realtime sync, design system NativeWind.
🟡 modulo ricambi · 🟡 notifiche push · 🟡 consent firma trasporto · 🟡 offline queue (WIP) · 🟡 onboarding gate · 🟡 barcode scanner.

### 5.5 — 🛠️ Infrastruttura + AI + Remote control — **19 ✅ / 5 🟡**
Proxy AI Claude server-side (`/api/ai/chat`, `/api/ai/scan`), remote control + heartbeat, check manutenzione remoto, **auto-update Electron obbligatorio**, version check API, edge functions (sdi_send/webhook, aci_check, rvfu-sync, send-email/team-invite, stripe_webhook, billing_portal, transport_portal_notify, check-vfu-deadlines, recognize-spare-part), gateway VPS (RENTRI mTLS, eBay OAuth, SDI WS), R2 storage, feature flags admin.
🟡 sync service desktop/server · 🟡 recognize-spare-part · 🟡 rvfu-sync/documents.
- **Integrazioni esterne complessive:** SDI, RENTRI, ACI/PRA, Portale del Trasporto (RVFU), OpenAPI (P.IVA + firma), Stripe, Resend (email), eBay, Shopify, Subito, Google Maps, Nominatim/OSRM, ISTAT, Cloudflare R2, Anthropic Claude.

---

## 6. Stato del progetto + decisioni aperte (per la roadmap)

### 6.1 — Sintesi numerica
Su **335 funzionalità** censite: **~277 ✅ funzionanti (83%)**, **~53 🟡 parziali (16%)**, **~5 📋 pianificate (1%)**. Il prodotto ha un nucleo molto solido; il lavoro residuo è soprattutto rifinitura (🟡) e poche feature nuove (📋).

### 6.2 — Pronto / quasi pronto
Fatturazione SDI, Trasporti+GPS, Clienti, Piazzale, Preventivi, Calendario, Ricambi, Team/Ruoli, Billing/Abbonamenti, Impostazioni, App mobile (trasporti+demolizioni).

### 6.3 — Decisioni aperte (da prendere con la sessione roadmap)
1. **Marketplace** ⏸️ — codice quasi completo ma disattivato. Decidere: rilasciare (e come monetizzare: incluso? add-on?) o congelare.
2. **Listino ufficiale** — confermare prezzi/piani (§4.1) e quali moduli "a scelta" per Starter/Professional/Business; definire eventuali bundle verticali (es. "Autodemolitore completo" = RVFU+RENTRI+SDI).
3. **Rifinire i 🟡** prioritari per il go-to-market: regime fiscale UI, conversione preventivo→fattura, integrazione contabilità↔fatture, notifiche push (mobile+desktop), tracker GPS hardware.
4. **Feature 📋**: OCR libretto (RVFU), 2FA, report normativo 209/152, marketplace Shopify/Subito.
5. **Infrastruttura**: completare sync desktop↔cloud (offline), e portare a regime gli endpoint AI su prod.

---

## 7. Come usare questo documento (per l'altra sessione Claude)

- **È una fotografia, non codice da eseguire.** Usalo per ragionare su priorità, pacchetti, naming, listino.
- Per ogni proposta di roadmap, **parti dallo stato reale** (✅/🟡/📋/⏸️): non re-implementare ciò che è ✅; concentra gli sforzi sui 🟡 ad alto valore e sulle decisioni di §6.3.
- Per i **pacchetti**: la mappa "feature → modulo" è in §3 (etichetta accanto al titolo) e §4. I moduli premium sono 4 (SDI, RVFU, RENTRI, Contabilità); il resto è base.
- **Principio operativo del progetto:** ogni cosa nuova nasce *spenta* (feature flag) → testata su *staging* → accesa in *prod*. Non esiste "tutto il progetto finito": esistono *moduli stabili*. "Pronto" = i moduli che servono al cliente funzionano in modo affidabile.
- Dettaglio tecnico completo (file, tabelle): vedi `supabase/STAGING_SCHEMA_LIVE.md` (schema DB) e i singoli `RAPPORTO_*.md` / `ANALISI_*.md` nel workspace.
