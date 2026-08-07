# SPEC — Flusso Preventivo → Pagamento → Attivazione

> **Stato:** 📋 spec / da implementare a pezzi (NON ancora costruito).
> **Nota sui dati:** le tabelle e i nomi-campo citati qui (es. §8) sono **illustrativi**.
> L'implementazione userà lo **schema reale** del progetto (es. `quotes`/preventivi,
> `org_subscriptions`, `org_settings`, `orgs`, ecc.) — vedi `supabase/STAGING_SCHEMA_LIVE.md`.
> Mappare i concetti della spec sulle nostre tabelle, non crearne di nuove "a parole".
> **Principio:** ogni funzione importante = una pagina con un suo indirizzo (no modali a scomparsa).
> Complementa il documento di architettura admin (`Architettura_Admin_RescueManager.md`, se presente).

---

## 1. Quadro d'insieme: tre entità, tre catene di stato

Tieni separate tre cose. Non mescolarle nello stesso campo.

**Preventivo** (cosa il cliente sta comprando)
`bozza → inviato → accettato → [convertito]` · rami: `rifiutato`, `scaduto`

**Abbonamento** (il contratto/servizio che nasce dal preventivo accettato)
`in_attesa_pagamento → attivo` · rami: `sospeso`, `disdetto`

**Pagamento** (lo stato dell'incasso, vive sull'abbonamento)
`in_attesa → pagato` · rami: `fallito`, `scaduto`

**Organizzazione** (segue il tutto)
`trattativa → (accettazione) → attivazione → cliente_attivo`

Regola: il preventivo accettato **genera** un abbonamento `in_attesa_pagamento`.
Quando il pagamento è `pagato`, l'abbonamento diventa `attivo` e l'org `cliente_attivo`.
Una catena sola, niente duplicati.

---

## 2. Le pagine coinvolte (ognuna importante = pagina propria)

1. **Preventivo — admin** (`/preventivi/:id`): crea, modifica, invia.
2. **Preventivo — pubblica** (`/p/:token`): il cliente vede il preventivo e lo accetta. Link con token, niente login.
3. **Attivazione — admin** (`/attivazione/:org_id`): completa dati, sceglie configurazione e metodo, avvia il pagamento. Flusso centrale.
4. **Stato pagamento** (`/attivazione/:org_id/pagamento` + link pubblico `/pay/:token`): mostra se il pagamento è arrivato. Pagina chiave per il bonifico.

---

## 3. Flusso passo per passo

### Step 1 — Creazione del preventivo (admin)
Pagina Preventivo collegata a un'organizzazione. Campi: organizzazione (esistente o nuova), configurazione (Soccorso stradale / Autodemolitore / Completo), prezzo (precompilato dal listino, modificabile), eventuale sconto o prezzo fondatori, validità (es. 30 giorni), note.
Salva: Preventivo `stato = bozza`, numero progressivo, data, `data_scadenza` calcolata.

### Step 2 — Invio al cliente (admin)
Azione "Invia preventivo": genera token e manda al referente un'email con riepilogo + link alla pagina pubblica.
Salva: `stato = inviato`, `data_invio`, `token`. Evento in cronologia.

### Step 3 — Accettazione
Due strade, stesso risultato:
- **Cliente** (consigliata): su `/p/:token` clicca "Accetto". Niente login, solo token.
- **Admin** (fallback): "Segna come accettato" sulla pagina del preventivo.

Salva: `stato = accettato`, `data_accettazione`, chi/come. Effetti automatici:
- crea **Abbonamento** `in_attesa_pagamento` (copia configurazione + prezzo dal preventivo);
- org → `attivazione`;
- evento in cronologia.

Rami: "Rifiuta" → `rifiutato`, org → `trattativa`/`perso`. Validità superata → `scaduto` (§6).

### Step 4 — Attivazione: dati e metodo (admin)
Pagina Attivazione = checklist a step (non un modale).
1. **Completa Dati Aziendali** per la fattura: P.IVA, CF, PEC, ATECO, sede legale, forma giuridica. Non si incassa senza questi.
2. **Conferma configurazione e prezzo** (dal preventivo).
3. **Scegli metodo:** Stripe (carta) · GoCardless (SEPA) · Bonifico.

Salva: dati aziendali sull'org; metodo sull'abbonamento.

#### Step 4 (dettaglio) — Compilazione e verifica dei Dati Aziendali
Tre ruoli distinti, da non confondere:
1. **Autofill da P.IVA (API registro vivo)** — l'operatore digita la P.IVA; chiamata API Registro Imprese (es. openapi.it) riempie i campi e restituisce **stato attività** (Attiva/Cessata/Sospesa/In Iscrizione), PEC, codice SDI. Fonte più aggiornata.
2. **Autofill da visura caricata** — in alternativa carica il PDF della visura; il sistema estrae i campi (parsing testo, anche via modello che restituisce dati strutturati). È una "lettura" del documento, non una verifica dell'azienda.
3. **Verifica di stato e attualità** — la conferma che l'azienda sia attiva *oggi* passa sempre dall'API sul registro vivo, non dal file. Da visura: si prende la P.IVA estratta e si interroga l'API.

**Controllo manuale (QR Code):** la visura porta il QR "RI" di InfoCamere, scansionabile con app ufficiale (o registroimprese.it/qrcode) per confermare autenticità. Controllo umano **facoltativo**, NON integrazione automatica (il QR è per app/web ufficiali, non API per sviluppatori).

**Comportamento:**
- `Attiva` → ok, prosegue.
- `Cessata`/`Sospesa`/non trovata → avviso visibile; attivazione bloccata o conferma esplicita operatore.
- API non trova nulla → inserimento manuale come ripiego; campi sempre modificabili.
- Dati Registro Imprese sono pubblici: nessun problema privacy.

**In sintesi:** visura = scorciatoia per riempire i campi; API = fonte di verità per stato/attualità; QR = controllo autenticità a occhio, manuale.

### Step 5 — Pagamento, per metodo
**Stripe (carta) — già configurato:** checkout/link Stripe; webhook → `pagato`; ricorrente automatico ai rinnovi.
**GoCardless (SEPA):** flusso mandato (firma una volta); primo addebito → webhook → `pagato`; rinnovi automatici.
**Bonifico (manuale) — caso chiave:**
- Genera **istruzioni**: importo, IBAN azienda, **causale univoca** (es. numero preventivo / id abbonamento) per riconoscere il bonifico.
- `pagamento = in_attesa`. Si apre la **pagina di stato** (§4).
- Nessuna conferma automatica: l'admin segna "Bonifico ricevuto" → `pagato`.

### Step 6 — Attivazione automatica su "pagato"
Appena `pagamento = pagato` (qualsiasi metodo), in automatico:
- abbonamento → `attivo`, con `data_inizio` e `data_rinnovo` (+12 mesi);
- org → `cliente_attivo`;
- crea **Utenti del cliente** (operatori) e attiva l'accesso;
- emetti **fattura elettronica** + email di benvenuto con credenziali.

Una sola condizione accende tutto: lo stato del pagamento. Identica per i tre metodi.

---

## 4. La pagina di Stato Pagamento (in dettaglio)
Serve soprattutto al bonifico, ma vale per tutti.

**Lato admin, per stato:**
- `in_attesa`: importo, metodo, e — se bonifico — IBAN e causale; pulsante **"Segna bonifico ricevuto"**; da quanti giorni è in attesa.
- `pagato`: data e metodo; link alla scheda cliente attivo; nessuna azione.
- `fallito` (Stripe/GoCardless): motivo, "Riprova" o "Passa a bonifico".
- `scaduto`: bonifico non arrivato entro i giorni previsti; "Sollecita" o "Annulla".

**Lato cliente (`/pay/:token`, opzionale ma utile):** sola lettura — "In attesa del tuo bonifico" (importo/IBAN/causale) oppure "Pagamento ricevuto, servizio attivo".

**Conferma bonifico (riconciliazione manuale):** al click "Segna bonifico ricevuto", il sistema chiede conferma dell'importo (evita attivazione con pagamento parziale/sbagliato). Confermato → `pagato` → attivazione automatica (§6). **Per ora nessuna riconciliazione bancaria automatica.**

---

## 5. Promemoria collegati (modulo Task/Notifiche)
- bonifico `in_attesa` da più di X giorni → "sollecita bonifico";
- preventivo `inviato` in scadenza → "ricontatta";
- abbonamento con `data_rinnovo` vicina → "rinnovo in scadenza".

---

## 6. Stati ed edge case (da gestire esplicitamente)
- **Preventivo scaduto:** validità superata senza accettazione → `scaduto`; riproponibile (duplica con nuova validità).
- **Preventivo rifiutato:** org → `trattativa`/`perso`, con motivo.
- **Bonifico non arrivato entro X giorni:** pagamento → `scaduto`; non attivare; sollecito/annullamento.
- **Importo bonifico errato/parziale:** non attivare; segnalare e gestire a mano.
- **Pagamento fallito (carta/SEPA):** resta `in_attesa_pagamento`; ritentare o ripiegare su bonifico.
- **Doppio pagamento / pagamento dopo scadenza:** l'attivazione scatta una sola volta, sullo stato `pagato`.

---

## 7. Cosa NON costruire adesso (lean)
- Nessun portale cliente completo: bastano pagina pubblica preventivo + pagina stato, entrambe con token, senza login.
- Nessuna riconciliazione bancaria automatica: il bonifico lo conferma l'admin.
- Lo stato del pagamento vive in un solo posto (sull'abbonamento); le pagine lo leggono, non lo duplicano.

---

## 8. Riepilogo dati salvati (ILLUSTRATIVO — mappare sullo schema reale)

> ⚠️ Tabella concettuale. I nomi reali vanno presi dal nostro schema
> (`org_subscriptions`, `org_settings`, `quotes`/preventivi, `orgs`, ecc.).

| Quando | Entità | Cosa si salva (concetto) |
|---|---|---|
| Creazione | Preventivo | org, configurazione, prezzo, sconto, validità, stato=bozza |
| Invio | Preventivo | stato=inviato, data_invio, token |
| Accettazione | Preventivo | stato=accettato, data, da chi |
| Accettazione | Abbonamento | creato in_attesa_pagamento (config+prezzo dal preventivo) |
| Accettazione | Organizzazione | stato=attivazione |
| Dati aziendali | Organizzazione | p_iva, cf, pec, ateco, sede, forma_giuridica |
| Scelta metodo | Abbonamento | metodo_pagamento |
| Avvio pagamento | Abbonamento | pagamento=in_attesa; (bonifico: causale/IBAN) |
| Pagamento ok | Abbonamento | pagamento=pagato, stato=attivo, data_inizio, data_rinnovo |
| Pagamento ok | Organizzazione | stato=cliente_attivo |
| Pagamento ok | Utente cliente | creati e attivati |
