# F5 — Onboarding cliente guidato + stato pratica (architettura)

> Flusso definito con l'utente. Principio: riusare ciò che esiste, token = `public_uuid` del preventivo.
> Formati visura: **solo PDF**.

## ✅ DECISIONI PRESE (modello autoritativo, confermato dall'utente)

1. **Org creata SOLO all'approvazione** (non al pagamento). Pre-approvazione il cliente è un **LEAD** con
   token pubblico (`public_uuid`); fa il wizard SENZA account. All'approvazione in Revisione → `activateQuote`
   crea org+utenti+fattura+email (com'è già). → niente gate da costruire, refund/cleanup banali, zero doppioni.
   La pagina onboarding ESISTENTE = setup al PRIMO login DOPO l'approvazione.
2. **Garanzia pagamento (il pagamento non si perde MAI)**: il webhook registra il pagamento sul **preventivo**
   (`lead_quotes.paid_at` + payment_intent/mandate) **subito**, indipendentemente dall'org; i soldi restano
   trattenuti da Stripe/GoCardless. + **webhook idempotente** + **job di riconciliazione** (interroga Stripe/GC
   per pagamenti non agganciati) + vista admin **"pagamenti orfani"**. Impossibile perdere un pagamento.
3. **Pagato ⇒ `leads.status='in_verifica'`** (guardato: solo da quote_sent/trattativa). È il trigger che mette
   il lead in coda Revisione. Vale per Stripe, GoCardless (a charge confermato) e bonifico manuale.
4. **Rifiuto = "in sospeso + correzione" (NO auto-refund)**: se qualcosa non va, la pratica resta **in sospeso**,
   al cliente arriva la **motivazione** (email + magic link), lui **corregge e ripresenta** → torna `in_verifica`.
   Il pagamento resta trattenuto. Il rifiuto definitivo con rimborso è un'azione **rara e manuale** (caso per caso).
5. **Idempotenza attivazione**: `activateQuote` in transazione + chiave idempotente + UNIQUE(1 quote attivato per
   lead) → niente org/utenti/email duplicati da doppio click o retry webhook.

➡️ Conseguenza: **non serve** il gate accesso post-pagamento (gap #2) né la sospensione-org (gap #12) — non c'è
org prima dell'approvazione. I gap restanti (AI contract, mismatch P.IVA, audit/KYC, email, SLA, GDPR) restano.

## 0. Esiste già
- Pagina pubblica preventivo `/quotes/[uuid]` + `/api/quotes/[uuid]`: accetta, paga (Stripe checkout), stati.
- R2 (`r2-storage.ts`), tabella `lead_documents` (`document_type='visura'`), AI Claude (route `api/ai/*`), Revisione (F3).

## 1. Flusso cliente (la visione)
```
Cliente paga (Stripe success)
   → "Pagamento completato. A breve verrai reindirizzato alla configurazione della tua azienda."
   → WIZARD "Aiutaci a configurare la tua azienda" (step + timeline):

   [0] Verifica email (OTP) — gate all'ingresso del wizard
        → codice 6 cifre inviato all'email del lead (anti-frode link inoltrato)
        → cookie di sessione (7gg): ripresa sullo stesso dispositivo salta l'OTP
   [1] Carica la visura camerale (PDF)
        → upload R2 (presign validato sul uuid)
   [2] Analisi automatica della visura (AI/Claude) → estrae: ragione sociale, P.IVA, CF,
       PEC, ATECO, forma giuridica, sede, codice SDI
        → mostra i dati estratti
   [3] "I dati sono corretti?"
        • Sì  → invia in REVISIONE → "Inviata ✓ — riceverai l'esito entro 24 ore"
        • Modifica → tasto Modifica accanto a ogni campo → il cliente corregge/integra → invia
   [4] (se servono altre impostazioni, le imposta qui nel wizard)

   Dopo l'invio: il cliente ha accesso SOLO a una PAGINA STATO PRATICA:
        "In verifica" / "Approvata, attivazione in corso" / "Serve una correzione: …"
```

## 2. Mappatura tecnica

| # | Componente | Dove | Note |
|---|---|---|---|
| A | **Stripe success → redirect** al wizard | `api/checkout` / quote accept flow | `success_url = /configura/:uuid` |
| B | **Wizard** `/configura/[uuid]` (pubblico, step+timeline) | `app/configura/[uuid]/page.tsx` 🆕 | token = uuid del preventivo |
| B0 | **OTP send/verify/status** (gate verifica email) | `api/quotes/[uuid]/otp/{send,verify,status}` 🆕 | codice 6 cifre, hash SHA-256, TTL 10min, 5 tentativi, rate-limit 5/ora; cookie sessione 7gg per ripresa. Tabella `email_otp` (service_role only), helper `lib/otp.ts` |
| C | **Presign visura** (PDF, key lead-scoped, valida uuid+paid) | `api/quotes/[uuid]/visura/presign` 🆕 | solo PDF, cap dimensione |
| D | **Finalize** → riga `lead_documents` | `api/quotes/[uuid]/visura/finalize` 🆕 | |
| E | **Analizza visura** (AI/Claude → dati strutturati) | `api/quotes/[uuid]/visura/analyze` 🆕 | PDF→Claude document → JSON campi |
| F | **Conferma/Modifica** → aggiorna campi lead + `status=in_verifica` | `api/quotes/[uuid]/submit-verifica` 🆕 | aggiorna `leads.*` + invia in verifica |
| G | **Pagina STATO PRATICA** (solo lettura, solo questa al cliente) | `app/pratica/[uuid]/page.tsx` 🆕 | legge stato lead/quote |
| H | **Revisione (admin)** mostra/scarica la visura | `RevisionePage.tsx` + `fetchLeadDocuments` | presign GET staff-only |

## 3. Sicurezza
- Tutte le route pubbliche **validano il `public_uuid`** (solo chi ha il link, solo per quel lead).
- Upload consentito **solo se preventivo `paid`** (lead `in_verifica`/pre-verifica). Key R2 **lead-scoped**, content-type **application/pdf**, **size cap**.
- L'analisi AI gira **server-side** (ANTHROPIC_API_KEY su Vercel). Output = solo suggerimento, il cliente conferma.
- I dati che il cliente conferma/modifica aggiornano `leads.*`; l'attivazione resta **gate umano** in Revisione.
- Download visura **solo staff** (presign GET autenticato).

## 4. Stati pratica (lato cliente)
`in_verifica` → "In verifica (esito entro 24h)" · `trattativa` (post-correzione richiesta) → "Serve una correzione" ·
`attivato` → "Approvata — attivazione in corso". Lo stato vive su `leads.status` (già esistente), la pagina lo legge.

## 5. Ripresa pratica (resumability) — DOPO il pagamento niente va perso

**Requisito:** il cliente ha PAGATO. Se si disconnette / perde la connessione / chiude il browser /
cambia dispositivo a metà onboarding, **non deve perdere la pratica**: rientrando vede la **pagina Stato
Pratica** con un tasto **"Riprendi la pratica"** che lo riporta **esattamente allo step dove era rimasto**.

**Come (persistenza server-side, non solo client):**
- Lo **stato di avanzamento dell'onboarding è salvato lato server**, step per step, man mano che il cliente
  procede — NON tenuto solo nello state React (che muore alla disconnessione). Ogni step "committa" il suo
  risultato appena fatto:
  - dati azienda salvati → `org_settings.company` (già così oggi)
  - visura caricata → riga in `lead_documents` (storage_path su R2)
  - analisi AI → salvata (es. su `lead_documents.notes` / campo dedicato) così non si ri-analizza
  - dati confermati/modificati → aggiornati sul lead/org
  - inviata in revisione → `leads.status='in_verifica'`
- Un **campo "step corrente"** (es. `onboarding_step` / `verification_status` su org o profilo) traccia il
  punto, oppure lo si **deriva dai dati persistiti** (visura assente → step "carica"; visura presente ma non
  confermata → step "conferma"; confermata+inviata → stato "in verifica"). Derivare dallo stato reale è più
  robusto (niente flag che si disallinea).
- **La pagina Stato Pratica è l'hub di ripresa**: è l'unica pagina a cui il cliente accede dopo il pagamento.
  Mostra: stato pratica + (se non completata) bottone **"Riprendi la pratica"** → wizard allo step giusto;
  (se completata/in verifica) il messaggio "In verifica, esito entro 24h".

**Gate di accesso (coerente):** post-pagamento il cliente atterra SEMPRE sulla pagina Stato (gate redirect).
Da lì riprende o vede l'esito. Niente accesso al resto finché non approvato.

## 6. Gap da chiudere prima di codare (da completeness-critic, 6 agenti)

> Il piano ha lo scheletro giusto (wizard ripristinabile, upload, analisi AI, revisione umana) ma manca la
> **colla degli stati** e gli **edge case soldi/compliance**. 22 gap; i 6 CRITICI vanno decisi prima.

### 🔴 CRITICI (cambiano architettura / bloccano il flusso)
1. **Webhook → `leads.status='in_verifica'`**: oggi il webhook pagamento setta solo `quote.status='paid'`, MAI
   `in_verifica` → i lead pagati non arrivano in coda Revisione e il flusso si pianta. Aggiungere in Stripe/GoCardless
   webhook + "segna bonifico" admin (guardato: solo da quote_sent/trattativa).
2. **Meccanismo del gate accesso**: il piano dice "solo pagina stato" ma non *come*. Definire flag + redirect
   middleware + RLS/403 sui dati org finché non approvato.
3. **⚑ DECISIONE CHIAVE — quando si crea l'org**: al **pagamento** (shadow, serve gate+refund+cleanup) vs **solo
   all'approvazione** (consigliato: refund/cleanup semplici, niente gate, `activateQuote` funziona com'è; il cliente
   pre-approvazione è un LEAD con token pubblico, non un'org). Determina TUTTO il resto.
4. **Idempotenza attivazione**: `activateQuote` crea org+utenti+fattura+email senza idempotency → doppio click /
   retry webhook = org/utenti/email duplicati. Transazione + chiave idempotente + UNIQUE(quote attivato per lead).
5. **Rifiuto (Respingi) → conseguenze**: oggi setta solo `lost`, ma l'abbonamento resta attivo e si rinnova, niente
   refund, niente cleanup visura (GDPR/chargeback). Definire: cancella subscription + refund (entro grace) + retention.
6. **"Richiedi correzione" → notifica + ripresa**: oggi solo nota interna, nessuna email/link → cliente bloccato.
   Email con motivo + magic link a `/configura`, riprende allo step conferma, al reinvio torna `in_verifica`.

### 🟠 ALTI
7. **Contratto AI**: schema JSON fisso + confidenza per-campo + fallback "non leggibile → compila a mano"; persisti
   risultato su `lead_documents` (no re-analisi alla ripresa).
8. **Mismatch P.IVA visura vs preventivo** (anti-frode): confronto all'analisi + warning + flag per la Revisione.
9. **Fallimento PRIMO pagamento** (Stripe decline / mandato GC fallito / SEPA rifiutato dopo giorni): tracking +
   webhook + email "riprova/passa a bonifico" + task admin. No auto-retry SEPA.
10. **Audit/KYC immutabile all'approvazione**: chi approva, snapshot risposta API P.IVA, key visura, diff
    AI-vs-cliente. Copiare i dati org DALLO snapshot confermato, non dal lead ancora editabile.
11. **Lock prezzo all'accettazione** + verifica importo Stripe vs snapshot.
12. **Sospendi l'org esistente** se un lead torna a trattativa/perso (evita doppia org alla ri-approvazione).
13. **RBAC Revisione** (chi può approvare/respingere; sales no) + log dell'attore.
14. **SLA pratica pagata-abbandonata**: reminder gg3/7, auto-cancel+refund ~gg10, flag in coda.
15. **GoCardless/bonifico timeline + payment_method**: quando è "pagato" per il trigger in_verifica; settare
    `org_subscriptions.payment_method` reale (non hardcoded stripe).

### 🟡 MEDI
16. Quote orfani/superseded/cancelled + pagamenti orfani (webhook no-op + vista "pagamenti orfani").
17. Validazione upload: cap (es. 10MB) + magic-bytes (non estensione) + PDF cifrato/corrotto + rate-limit.
18. RLS su `lead_documents` + download staff audited + consenso DPA/retention per la visura inviata all'AI.
19. Validazione server dei campi editati dal cliente (P.IVA/CF/PEC/ATECO) + snapshot conferma + diff.
20. Email benvenuto/attivazione (set-password + moduli) + email "in verifica, esito 24h" + notifica admin.
21. Piano/moduli **bloccati** al preventivo (F5 = solo conferma dati, no upsell qui).
22. Visibilità SLA/aging nella coda Revisione (timestamp ingresso + badge >24h + paginazione).

## 7. Ordine build
1. **Backend**: presign (C) + finalize (D) + analyze (E) + submit-verifica (F) — **ognuno persiste il suo step**. Validazione uuid/sessione centralizzata.
2. **Stato pratica** (G) come **hub** (stato + "Riprendi la pratica" che deriva lo step dai dati persistiti) + **gate** redirect post-pagamento.
3. **Wizard** (estensione `/onboarding`): step 3-5 che leggono/salvano lo stato persistito (ripresa nativa).
4. **Revisione** mostra/scarica visura (H) + `fetchLeadDocuments`.
5. Build/verify → staging.

## 8. Review adversariale OTP (2026-06-18) — esito e fix
Workflow 4 dimensioni (route/sicurezza/wizard/dati) + verifica adversariale per ogni finding sul codice reale.
11 confermati su 17. Corretti:
- 🔴 **CRITICO — OTP non applicato server-side**: `visura/analyze` e `visura/submit` validavano solo
  `public_uuid + paid`, mai l'OTP → chi aveva il link saltava la verifica via richiesta diretta. **FIX**:
  `lib/otp-guard.ts` `hasVerifiedOtp(req, uuid)` (cookie sessione → riga `email_otp` verificata), chiamato in
  entrambe le route (401 `otp_required` se assente). Il gate ora è reale, non solo UI.
- 🟠 **Rate-limit `checkRateLimit` inefficace su Vercel** (Map in-process, ricreata per invocazione). **FIX**
  parziale: `otp/send` ha un **throttle durable** (intervallo min 30s via ultima riga a DB); la Map resta come
  secondo livello soft. *Residuo*: cap windowed 5/ora ancora non durable cross-istanza (vale anche per
  `visura/analyze`). Brute-force resta impraticabile: codice random ad ogni invio + attempts cap 5 + throttle.
- 🟡 **send ignorava l'esito email** (diceva "inviato" anche se falliva). **FIX**: propaga 502 + rollback riga.
- 🟡 **verify**: tie-break ordering su `id` (race doppio insert).
- 🟡 **wizard polling**: niente cleanup → setState post-unmount. **FIX**: timer ref + flag `alive`.
- 🟡 **retention/FK**: `email_otp.quote_uuid` text senza FK/cascade (righe con email in chiaro orfane alla
  cancellazione lead). **FIX**: migration opzionale `20260618_email_otp_hardening.sql` (uuid + ON DELETE
  CASCADE). *Residuo*: nessun job di purge periodico delle righe verificate (cleanup solo a cascata).
- Confermati corretti (no-fix, già a posto): FK join `lead_quotes_lead_id_fkey`, allowlist `status` paid,
  cookie per-uuid non replayable cross-quote, RLS service-role-only, masking email.

**Residui noti (non bloccanti il test, hardening futuro)**: rate-limit windowed durable (Upstash/DB-counter su
`send`+`analyze`); job retention `email_otp`; validazione magic-bytes PDF (gap #17).
