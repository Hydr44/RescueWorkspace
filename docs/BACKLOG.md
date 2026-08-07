# RescueManager — Backlog & Ordine di lavoro

> Punto unico per sapere **dove siamo** e **cosa viene dopo**, in ordine.
> Non si implementa "tutto insieme": una cosa alla volta, **spenta di default → staging → prod**.
> Stato completo del prodotto: [`RESCUEMANAGER_PROGETTO.md`](../RESCUEMANAGER_PROGETTO.md).

**Definizione di "fatto" (per ogni voce):** compila (build verde) · funziona end-to-end con un caso reale su staging · non rompe i flussi chiave (login, una fattura, un trasporto) · linguaggio cliente · spenta di default finché non confermata · review fatta.

---

## A. DA DEPLOYARE (pronto nel codice, manca solo il deploy)
- [ ] **AI `/api/ai/chat` su PROD** — route già live su staging; il desktop chiama prod → va portata su `main` (oppure puntare il desktop a staging). Verificare `ANTHROPIC_API_KEY` su Vercel.
- [ ] **Migration RLS `20260612_rls_audit_followup.sql`** — chiude leak `org_invites` + write `rentri_notifiche`/`barcode_lookup`. Va in pari con la modifica `AcceptInvite.jsx` (già nel codice). `supabase db push`.
- [ ] **CORS edge functions** `billing_portal` + `send-team-invite` — sorgente corretto, serve `supabase functions deploy`.
- [x] Migration import `20260613_import_data_staging.sql` — risulta applicata (l'import gira).

## B. IN CORSO / APPENA FATTO
- [x] **Import Excel/CSV** (Settings → Dati): Clienti + Veicoli in piazzale. Categoria piazzale dedotta dal **nome del foglio**. Date blindate. Linguaggio cliente.
- [ ] **Recupero 121 mezzi piazzale** cancellati → ri-importare il file (ora col tag giusto).
- [ ] Opzioni import offerte (da decidere): "Importa tutti i fogli in un colpo"; abilitare entità Ricambi e Veicoli-parco-mezzi.

## C. PROSSIMI WORKSTREAM (spec pronte, da fare a pezzi)

### C1 — Flusso Preventivo → Pagamento → Attivazione  🟡 (F1 fatto)
> **F1 GoCardless server FATTO (2026-06-15)** su `lead-api` (vps-sdi `/opt/lead-api`): `routes/gocardless.js` (redirect-flow/complete/charge + webhook HMAC), live e raggiungibile (401 atteso), auth OK. ⚠️ token **LIVE in /root/.env (da ruotare)**, NON testato end-to-end. Pendenti: webhook nel dashboard GoCardless → `https://lead-api.rescuemanager.eu/webhooks/gocardless`; route proxy nel website; UI admin (F2); **test in sandbox prima di addebiti reali**.

Spec: [`specs/flusso-preventivo-pagamento-attivazione.md`](specs/flusso-preventivo-pagamento-attivazione.md) · **Proposta struttura + GoCardless:** [`specs/proposta-gocardless-attivazione.md`](specs/proposta-gocardless-attivazione.md) · **Dump schema reale:** [`specs/schema-quote-to-cash.sql`](specs/schema-quote-to-cash.sql).
> ⚠️ **Scoperta:** gran parte ESISTE GIÀ (admin panel `LeadActivationModal` + `lead_quotes` 95% completo + Stripe cablato). Si **estende**, non si ricostruisce. GoCardless è da zero (mirror di Stripe sul website). Le fasi sotto sono la versione "spec"; la versione operativa è in F0-F5 della proposta.
È prevalentemente lato **admin/sales** (pannello admin + website), non il gestionale desktop. Da costruire in fasi:
- **C1.0 — Modello stati** (fondamenta): mappare le 3 catene (preventivo / abbonamento / pagamento) + org sullo **schema reale** (no tabelle inventate). Definire le macchine a stati e le transizioni.
- **C1.1 — Preventivo**: pagina admin (crea/modifica/invia) + pagina pubblica `/p/:token` + accettazione (cliente o admin) → genera abbonamento `in_attesa_pagamento`.
- **C1.2 — Attivazione (dati aziendali)**: checklist; autofill P.IVA da API Registro Imprese + autofill da visura caricata + **verifica stato attività** (API = fonte di verità). QR visura = controllo manuale facoltativo.
- **C1.3 — Pagamenti**: Stripe (già c'è) · **Bonifico** (istruzioni + causale univoca + **pagina di stato** + conferma manuale "bonifico ricevuto") · GoCardless (dopo).
- **C1.4 — Attivazione automatica su `pagato`**: abbonamento `attivo`, org `cliente_attivo`, crea utenti, fattura, email benvenuto. Idempotente (una sola attivazione).
- **C1.5 — Promemoria + edge case**: solleciti bonifico/preventivo/rinnovo; scaduti, importi parziali, doppi pagamenti.

> Ordine consigliato: C1.0 → C1.1 → C1.3(bonifico) → C1.4 → poi il resto. Ogni fase è una pagina con indirizzo proprio, spenta finché non testata.

### C2 — Sistema di test per flussi (testare i processi separatamente)  📋
Obiettivo dichiarato: poter **testare ogni processo/flusso in isolamento**, così aggiungere una funzione non rompe le altre.
Approccio proposto (da definire in dettaglio quando si parte, NON ora):
- Test per **macchina a stati**: ogni flusso (preventivo, abbonamento, pagamento, import, invio SDI, ecc.) testato sulle sue transizioni in isolamento, con dati finti.
- **Ambiente di test isolato** (org demo dedicata su staging) per provare un flusso end-to-end senza toccare dati reali.
- **Smoke-test**: script che verifica che i flussi chiave "carichino" prima di ogni rilascio.
- Priorità ai flussi a rischio: pagamento/attivazione, invio SDI/RENTRI, import.

## D. RIFINITURE 🟡 (dal censimento — prioritizzabili al go-to-market)
- Fatture: regime fiscale UI · integrazione contabilità↔fatture · gestione incassi.
- Preventivi: conversione preventivo → fattura.
- Trasporti: tappe multi-stop · notifica push autista · tracker GPS hardware.
- Mobile: notifiche push · offline queue.
- Infra: sync desktop↔cloud (offline).

## E. DECISIONI APERTE (servono prima dell'implementazione)
- [ ] **Marketplace**: rilasciare (e come monetizzare) o congelare? (codice quasi completo, ⏸️ disattivato).
- [ ] **Listino ufficiale**: confermare piani/prezzi e quali moduli "a scelta" per Starter/Professional/Business; eventuali bundle verticali.
- [ ] **Flusso C1**: confermare i 3 metodi di pagamento da supportare da subito (Stripe c'è; bonifico sì; GoCardless quando?).

---

## Come si lavora (promemoria)
1. Si prende **una** voce per volta dal backlog.
2. Si costruisce **additivo** (file/pagine nuove, non riscrivere il cuore) e **spento di default**.
3. Build verde → review → test su **staging** con caso reale → si **accende** → prod.
4. Si spunta qui. Le idee nuove si **scrivono in §C/D**, non si implementano d'impulso.
