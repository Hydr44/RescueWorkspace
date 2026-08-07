# Proposta struttura — Attivazione cliente + GoCardless (admin panel)

> Proposta (NON implementata). Riferimenti: spec [`flusso-preventivo-pagamento-attivazione.md`](flusso-preventivo-pagamento-attivazione.md), schema reale [`schema-quote-to-cash.sql`](schema-quote-to-cash.sql).
> **Principio chiave:** estendere ciò che esiste, NON ricostruire; usare le tabelle reali, non inventarne.

---

## 0. Scoperta importante: gran parte ESISTE GIÀ

Il flusso "preventivo → pagamento → attivazione" è **già implementato** nell'admin panel, in forma leggermente diversa dalla spec:
- **Admin panel** (Electron+React, `admin-panel/`): `LeadsPage` → `LeadDetailPage` → `NewLeadQuotePage` / `LeadQuoteDetailPage`, **`LeadActivationModal`** (2 step: pagamento → configurazione+attivazione), **`PendingActivationsBell`** (attivazioni in attesa), API `recordExternalPayment` + `activateQuote`.
- **DB**: `lead_quotes` è **~95% completo** (stati draft→sent→viewed→accepted→paid→activated, `external_payment_*`, `stripe_*`, `auto_activate_on_payment`, `activation_pending`, audit accettazione). `leads` ha già **P.IVA/CF/PEC/sede/ATECO/forma giuridica**.
- **Pagamenti**: Stripe interamente cablato (website `/api/checkout` + `/api/webhooks/stripe` + portal; edge function desktop). **GoCardless: niente, da zero.**

➡️ **Conclusione:** non costruiamo un nuovo flusso. **Estendiamo** quello esistente con (a) GoCardless come 2° metodo, (b) la **pagina di Stato Pagamento** dedicata (la pagina chiave della spec, oggi è un modal+bell), (c) qualche colonna mancante.

---

## 1. Mappatura stati → tabelle reali (esiste / da aggiungere)

| Catena (spec) | Tabella reale | Stato |
|---|---|---|
| **Preventivo** (bozza→inviato→accettato/rifiutato/scaduto) | `lead_quotes.status` (+ sent_at/viewed_at/accepted_at/rejected_at/expiry_date) | ✅ **esiste** (95%) |
| **Pagamento — primo** (in_attesa→pagato/fallito) | `lead_quotes` (`paid_at`, `external_payment_*`, `stripe_payment_intent_id`) | ✅ esiste |
| **Pagamento — rinnovi** | *(nessuna tabella unica)* | 🟡 **da aggiungere** `subscription_payments` (fase 2) |
| **Abbonamento** (in_attesa_pagamento→attivo/sospeso/disdetto) | `org_subscriptions.status` | 🟡 esiste ma **manca enum CHECK** + colonne sospensione/disdetta |
| **Org** (trattativa→attivazione→cliente_attivo) | disperso tra `leads.status`, `orgs.is_demo`, `org_subscriptions.status` | 🟡 manca un `orgs.lifecycle_status` unico (opzionale) |
| **Dati aziendali** (P.IVA/CF/PEC/ATECO/sede/forma giur.) | `leads.*` (già presenti) → copiati su `orgs` all'attivazione | ✅ esiste |

---

## 2. GoCardless — dove e come (specchia Stripe)

**Dove vive il server:** sul **website (Next.js API)**, esattamente come Stripe. L'admin panel chiama le API website (pattern `/api/staff/admin/...`). Non serve una nuova edge function.

**Contratto GoCardless (2° metodo accanto a Stripe):**
1. **Avvio mandato SEPA** — `POST /api/gocardless/redirect-flow` → crea redirect flow GoCardless → l'utente firma il mandato sulla pagina hosted GoCardless → callback `?redirect_flow_id=...` → si completa il flow e si salva `mandate_id` + `customer_id`.
2. **Primo addebito** — crea un `payment` GoCardless (charge_date = oggi+3gg per SEPA) → al `payments.paid` (webhook) → `pagamento = pagato`.
3. **Webhook** — `POST /api/webhooks/gocardless` (nuovo, con `GOCARDLESS_WEBHOOK_SECRET`): eventi `payments.paid`/`payments.failed`, `mandates.active/failed/cancelled`, `subscriptions.*` → aggiorna `org_subscriptions` (status, period_end) e/o `lead_quotes.paid_at`.
4. **Ricorrenza — A SCELTA dell'operatore** (deciso): in fase di attivazione si sceglie tra:
   - **Rinnovo automatico** → si crea una `subscription` GoCardless (gli addebiti ai rinnovi partono da soli);
   - **Solo primo addebito** → un singolo `payment`; i rinnovi si gestiscono a mano/con sollecito.
   La scelta si salva su `org_subscriptions.auto_renew` (vale anche per Stripe).

**Segreti (SOLO env, mai in codice/chat):** `GOCARDLESS_ACCESS_TOKEN` + `GOCARDLESS_WEBHOOK_SECRET` su **Vercel env del website**, impostati dall'utente.
**Sviluppo/test = SANDBOX** (token sandbox separato). Il token **live** solo in produzione. ⚠️ Un token live incollato in chat va **revocato e rigenerato**.

---

## 3. Modifiche schema proposte (da applicare a fasi, quando si parte)

```sql
-- Fase 1 — GoCardless su org_subscriptions (metodo + riferimenti)
ALTER TABLE public.org_subscriptions
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe'
    CHECK (payment_method IN ('stripe','gocardless','manual')),
  ADD COLUMN IF NOT EXISTS gocardless_customer_id     text,
  ADD COLUMN IF NOT EXISTS gocardless_mandate_id       text,
  ADD COLUMN IF NOT EXISTS gocardless_subscription_id  text,
  -- ricorrenza a scelta dell'operatore (true = rinnovo automatico, false = solo primo addebito)
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true;

-- Fase 1 — enum esplicito + tracking sospensione/disdetta su org_subscriptions
--   (oggi status è text libero; rende lo stato affidabile per il gating)
ALTER TABLE public.org_subscriptions
  ADD COLUMN IF NOT EXISTS suspended_at         timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason    text,
  ADD COLUMN IF NOT EXISTS cancelled_at         timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason  text,
  ADD COLUMN IF NOT EXISTS last_payment_date    date;
-- + (con cautela, dopo bonifica dati) CHECK su status:
--   status IN ('trial','pending_payment','active','suspended','cancelled','expired')

-- Fase 1 — mandato GoCardless tracciato anche sul preventivo (per la pagina stato)
ALTER TABLE public.lead_quotes
  ADD COLUMN IF NOT EXISTS gocardless_mandate_id text,
  ADD COLUMN IF NOT EXISTS gocardless_payment_id text;

-- Fase 2 (opzionale) — tracciamento pagamenti ricorrenti (rinnovi)
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','paid','failed','expired','refunded','cancelled')),
  amount_due numeric(10,2) NOT NULL,
  amount_paid numeric(10,2),
  due_date date NOT NULL,
  paid_at timestamptz,
  failed_at timestamptz,
  method text,                 -- stripe|gocardless|bank_transfer|cash
  provider_payment_id text,    -- stripe_payment_intent / gocardless_payment
  reference text, recorded_by uuid, recorded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fase 3 (opzionale, refactor) — stato org unificato
ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS lifecycle_status text DEFAULT 'lead'
    CHECK (lifecycle_status IN ('lead','trial','pending_activation','active','suspended','churned')),
  ADD COLUMN IF NOT EXISTS activation_pending boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz, ADD COLUMN IF NOT EXISTS activated_by uuid;
```

> ⚠️ Lo **stato pagamento vive in un solo posto** (sul preventivo per il primo, su `subscription_payments` per i rinnovi); le pagine lo leggono, non lo duplicano (come da spec §7).

---

## 4. UI admin panel — cosa estendere / creare

| File | Azione | Cosa |
|---|---|---|
| `src/components/lead/LeadActivationModal.tsx` | **estendere** Step 1 | aggiungere metodo **"GoCardless (addebito SEPA)"** accanto a esterno/Stripe |
| `src/components/lead/GoCardlessPaymentWidget.tsx` | **creare** | form (email/nome/IBAN) → avvia redirect flow → polling stato mandato + **toggle "Rinnovo automatico"** (ricorrenza a scelta) |
| `src/pages/QuotePaymentStatusPage.tsx` (`/leads/:id/quotes/:qid/pagamento`) | **creare** | **la pagina di Stato Pagamento della spec** (per bonifico + GoCardless): importo, IBAN+causale, stato (in_attesa/pagato/fallito/scaduto), pulsante "Segna bonifico ricevuto" |
| `src/lib/api.ts` | **estendere** | tipi `LeadQuote`/`ClientDetail` + funzioni `createGoCardlessMandate`, `fetchMandateStatus`, `chargeGoCardless`, `cancelMandate` |
| `src/pages/ClientDetailPage.tsx` (tab Abbonamento) | **estendere** | mostrare mandato GoCardless attivo + metodo pagamento |
| `PendingActivationsBell.tsx` | **estendere** | badge stato pagamento (bonifico in attesa / mandato GoCardless pending) |
| *(opzionale)* website `/pay/:token` | **creare** | pagina pubblica sola lettura per il cliente ("in attesa del tuo bonifico / pagamento ricevuto") |

---

## 5. Consigli — cosa aggiungere / rimuovere / NON fare

**Aggiungere**
- GoCardless (manca del tutto) — mirror di Stripe sul website.
- **Pagina di Stato Pagamento dedicata** (oggi è solo modal+bell): è la pagina che la spec mette al centro per il bonifico. Vale la pena.
- Enum + colonne sospensione/disdetta su `org_subscriptions` (rende lo stato affidabile).

**NON fare (per non rompere / non duplicare)**
- ❌ Non ricostruire il flusso preventivo: `lead_quotes` + LeadActivationModal esistono e funzionano.
- ❌ Non creare tabelle "a parole" dalla spec (preventivi/abbonamenti/pagamenti inventati): usare `lead_quotes`/`org_subscriptions`/`orgs` reali.
- ❌ Non duplicare lo stato pagamento in più posti.

**Da decidere (rimandabile)**
- `subscription_payments` (rinnovi) e `orgs.lifecycle_status` (stato org unico): utili ma sono **fase 2/3**. Per il primo rilascio (primo pagamento + attivazione) **non servono**.
- Pagina pubblica `/pay/:token`: nice-to-have, non bloccante.

---

## 6. Cosa mi serve da te (prima di scrivere codice)
1. ⚠️ **GoCardless token**: ricevuto un token **live** (di produzione) → va **revocato e rigenerato** (è finito in chat). Per lo sviluppo serve un token **SANDBOX** + il **webhook secret**. Entrambi li imposti tu nelle **env Vercel** del website (io non li scrivo nel repo). Confermi che partiamo in sandbox?
2. ✅ **Ricorrenza**: DECISO → **a scelta dell'operatore** in fase di attivazione (rinnovo automatico vs solo primo addebito), salvato su `org_subscriptions.auto_renew`.
3. **UX**: ok a **estendere il modal esistente + aggiungere la pagina di Stato Pagamento** (consigliato), oppure pagine dedicate complete per ogni step come da spec?
4. **Pagina pubblica `/pay/:token`**: nel primo giro o dopo?

---

## 7. Ordine consigliato (fasi)
- **F0 — Schema Fase 1** (colonne GoCardless + enum/sospensione su org_subscriptions + mandato su lead_quotes).
- **F1 — Server GoCardless** sul website (redirect-flow + complete + webhook + primo addebito), in sandbox.
- **F2 — UI admin**: GoCardless nel modal + `GoCardlessPaymentWidget` + funzioni api.ts.
- **F3 — Pagina Stato Pagamento** (bonifico + GoCardless), con "Segna bonifico ricevuto".
- **F4 — Ricorrenza** (subscription GoCardless) + (opz.) `subscription_payments`.
- **F5 — (opz.)** `/pay/:token` pubblica + `orgs.lifecycle_status`.

Ogni fase: spenta di default → sandbox/staging → prod.
