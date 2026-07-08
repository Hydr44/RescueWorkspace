# CRM Commerciale a Provvigione — struttura (no codice)

> Stato: **PROPOSTA / struttura da validare**. Nessun codice scritto. Decisioni prese con l'utente il 2026-07-08.
> Obiettivo: assumere un **commerciale esterno a P.IVA** che venda abbonamenti RescueManager, dandogli un CRM per gestire i **suoi** lead (anagrafica, note, appuntamenti, preventivi) e tracciando le **provvigioni**.
> Principio guida: **riuso prima, costruzione dopo.** Il CRM esiste già ~80% (tabelle `leads`/`lead_*`, UI `LeadsPage`/`LeadDetailPage`, ruolo `sales`, campi provvigione a schema). I buchi reali sono tre: **dati sporchi** (dedup/owner), **scoping di sicurezza** (un esterno oggi vedrebbe tutto), **meccanica provvigioni** (vuota).

## Decisioni prese (bivi già chiusi)
1. **Chi**: commerciale **esterno a P.IVA / agente** → massimo isolamento dati. Non deve vedere la base clienti/lead altrui.
2. **Provvigione**: **importo fisso per cliente attivato** (niente %, niente ricorrenza, niente calcolo sul canone). Il modello più semplice.
3. **Visibilità**: **solo i lead assegnati a lui**. Regola di scoping netta: `assigned_staff_id = lui`.
4. **Strumento**: **admin panel** (Electron). Nessuna app mobile da costruire — tutto il CRM vive già lì.
5. **Quando matura la provvigione**: al **primo incasso reale** (pagamento confermato), non alla semplice attivazione → non si paga per attivazioni a vuoto. Vedi §8.
6. **Clawback**: se il cliente **disdice entro 14 giorni** dall'accrual, la provvigione si **storna** (`void`). Vedi §8.
7. **Ruolo**: si **riusa la chiave `sales`** (nessuna modifica al CHECK del DB) cambiando solo l'**etichetta a "Commerciale"**, e togliendo i permessi pericolosi per un esterno. Vedi §7. (Stesso pattern "rename solo label" dei moduli.)
8. **Canale appuntamenti**: **solo email** + pagina pubblica + `.ics` (già pronto). Niente WhatsApp al lancio. Vedi §9.
9. **Scala**: **massimo 2 commerciali** (utente incluso) → scoping piatto per `assigned_staff_id`, **nessuna tabella `staff_team`**.
10. **Duplicati**: i **2 esistenti si lasciano** (niente script di merge). Si **blocca solo la creazione di nuovi** duplicati con una **guardia applicativa** (no vincolo UNIQUE hard sul DB, che fallirebbe con i 2 legacy presenti). Vedi §3.2.

---

## 1. Stato reale (fonte di verità: codice + migration)

### 1.1 Cosa esiste già (riusabile)
- **`leads`** (website/supabase, migrazioni `20260512_lead_system_overhaul.sql`, `20260317_leads_company_info.sql`, `20260619_leads_status_model_c.sql`): ricca. Ha `assigned_to`, `status`, `priority`, `source`+UTM, `notes`, `lead_score`, `lead_temperature`, `next_followup_at`/`next_followup_action`, `expected_deal_value`, `probability_to_close`, `lost_reason` (enum a DB), anagrafica (`vat_number`, `codice_fiscale`, `pec`, indirizzo, `forma_giuridica`, `codice_ateco`), `custom_fields` jsonb.
- **`lead_activities`** (timeline/audit), **`lead_tasks`** (`due_at`/`priority`/`status`/`assigned_to`), **`lead_appointments`** (slot proposti, tipi, modalità, `public_uuid`, `outcome`), **`lead_quotes`** (preventivi multi-versione + campi Stripe/GoCardless), **`lead_demos`**, **`email_templates`**/**`email_campaigns`**, **`lead_documents`**.
- **UI admin panel**: [`LeadsPage.tsx`](../../admin-panel/src/pages/LeadsPage.tsx) (lista filtrabile + bulk), [`LeadDetailPage.tsx`](../../admin-panel/src/pages/LeadDetailPage.tsx) (tab Info/Preventivi/Demo/Appuntamenti/Task/Messaggi/Cronologia), `LeadActivityTimeline`, `LeadTasksPanel`, `LeadAppointmentModal`/`List`, `LeadEmailModal`, `FirstContactWidget`, `RevisionePage`, `NewLeadQuotePage`, `LeadQuoteDetailPage`, `StatoPagamentoPage`, `ActivationPage`.
- **Funnel** in [`leadStatus.ts`](../../admin-panel/src/lib/leadStatus.ts): `new → contacted → demo_active → quote_sent → trattativa → in_verifica → attivato (+ lost)`. `leads.status` è **testo libero** (nessun CHECK) → cambi funnel = solo codice.
- **Appuntamenti al cliente**: pagina pubblica `website/src/app/appointment/[uuid]/page.tsx` (conferma/reschedule/cancel + `.ics`), email via Resend (`moduli/lead-api/lib/email.js`), integrazione Calendly (webhook). WhatsApp esiste ma solo template trasporti/OTP.
- **Ruoli**: tabella `staff` con CHECK `role IN ('super_admin','admin','marketing','sales','support','staff')` — **`sales` esiste già** (`20260212_admin_panel_foundation.sql`). Matrice permessi in [`staff-permissions.ts`](../../website/src/lib/staff-permissions.ts). Il ruolo `sales` ha già: `leads.view/create/edit/assign`, `organizations.view/edit`, `analytics.view/export`, `billing.view`.
- **Provvigione a schema (mai usata)**: `lead_quotes.commission_rate NUMERIC(5,2)` + `lead_quotes.commission_recipient UUID → auth.users(id)` (`20260512` righe 160-161).

### 1.2 Come funziona l'auth staff (decisivo per lo scoping)
- Lo **staff ha auth SEPARATA da Supabase Auth**: tabella `staff` propria, login custom, **JWT HS256** firmato con `STAFF_JWT_SECRET` ([`staff-auth.ts`](../../website/src/lib/staff-auth.ts)). Payload: `{ sub: staff.id, email, role, full_name }`.
- Le route staff usano il client **`supabaseAdmin` (service role)** → **la RLS Postgres è bypassata**. E `auth.uid()` è **NULL** per le richieste staff (non passano da Supabase Auth).
- `getStaffFromRequest(req)` legge l'header `Authorization: Bearer <jwt>`, verifica e ritorna `{ sub, role, ... }`. **Esiste già** ed è il gancio giusto per lo scoping applicativo.

---

## 2. Conflitti / gotcha rilevati (per non rompere niente e non lasciare buchi)

| # | Fatto reale | Impatto sul design |
|---|---|---|
| G1 | Staff auth **separata** da Supabase Auth; `auth.uid()` nullo per lo staff | La RLS classica basata su `auth.uid()` **non scatta** per lo staff. |
| G2 | Le route staff usano **service role** (`supabaseAdmin`) → RLS **bypassata** | Lo scoping vero è **applicativo** nella route (filtro per `assigned_staff_id`), non RLS. RLS resta solo hardening opzionale (§6.4). |
| G3 | `leads.assigned_to`, `lead_quotes.commission_recipient`, `lead_tasks.assigned_to`, `lead_demos.pilot_assigned_to` sono FK → **`auth.users`**, NON `staff.id` | Il commerciale è `staff`, non `auth.users`. Serve nuovo **`leads.assigned_staff_id → staff(id)`** come fonte di verità dell'owner CRM. |
| G4 | `leads.email` **nullable e non UNIQUE**; 2 duplicati legacy da lasciare | **No** indice UNIQUE hard (fallirebbe coi 2 legacy). Anti-dup solo per i **nuovi**, via guardia applicativa sui percorsi di creazione (§3.2). |
| G5 | `leads.status` testo libero (no CHECK) | Funnel ed esposizione `lost_reason` = solo codice, nessuna migration necessaria per questo. |
| G6 | `/api/staff/auth/seed` **vivo in prod**, `secret == STAFF_JWT_SECRET` | Backdoor: se il segreto trapela → creazione super_admin. **Rimuovere/lockare prima** di dare accesso a un esterno. |
| G7 | `GET /api/staff/leads` fa `select('*')` **senza `getStaffFromRequest`** e con firma `GET()` (nessun `req`) | Ritorna TUTTI i lead a chiunque passi il gate. Va riscritta con identità + scoping. |
| G8 | **~50 route** `admin/leads/*` e `admin/clients/*` **non chiamano `getStaffFromRequest`** (vedi §6.3) | Non è il fix di una route: serve un **helper condiviso** applicato sistematicamente + audit di tutte. |
| G9 | Doppia superficie API: `/api/staff/leads/*` (legacy: `route.ts`/`update`/`delete`) **e** `/api/staff/admin/leads/*` (usata dall'admin panel) | Verificare quale è viva; la legacy va scopata o **rimossa** per non lasciare una porta di servizio non protetta. |
| G10 | Device token in **localStorage** su Electron (vs cookie httpOnly su web) | Incoerenza cross-platform, minore. Nota se il commerciale usa il desktop. |

---

## 3. Modello dati target (idempotente, `IF NOT EXISTS`)

> Convenzione repo: migrazioni idempotenti (prod↔staging divergono). Nomi tabella/colonna reali.

### 3.1 `leads` — owner canonico verso `staff`
```
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_staff ON leads(assigned_staff_id);
```
- `assigned_staff_id` = **fonte di verità** dell'owner CRM (il commerciale). `assigned_to` (auth.users) resta per retro-compatibilità ma non governa lo scoping.
- Backfill: dove possibile, mappare `assigned_to`→`assigned_staff_id` via join email staff↔auth.users; altrimenti NULL (da assegnare a mano in Fase 0).

### 3.2 Anti-duplicati (solo nuovi; i 2 esistenti si lasciano)
Deciso: **niente merge** dei 2 duplicati attuali. Si previene solo la nascita di **nuovi** duplicati.

**Meccanismo = guardia applicativa** sui punti di creazione lead (NON un indice UNIQUE hard sul DB, che fallirebbe finché esistono i 2 legacy):
- Prima di `INSERT` di un lead, cercare un lead esistente con **stessa email normalizzata** (`lower(trim(email))`): se c'è → **blocco** con messaggio "esiste già un lead con questa email" + link per aprirlo.
- Match su `phone`/`vat_number`: **soft** (warning "possibile duplicato", non blocco), perché email può mancare.
- Helper condiviso `website/src/lib/lead-dedup.ts` (`findDuplicateLead`), applicato ai **3** percorsi reali di creazione lead:
  1. `POST /api/staff/admin/leads` (creazione manuale admin) → **blocco 409** su email; `duplicate_warning` su P.IVA/telefono.
  2. `POST /api/leads` (admin legacy Supabase-Auth) → **blocco 409** su email.
  3. `POST /api/contact` (form contatti pubblico) → **niente 409**: riusa il lead esistente e allega il nuovo messaggio come `lead_activities` (`activity_type='contact'`, `deduped:true`) + bump `last_activity_at`. Nessun doppione, nessun dato perso.

> Robustezza: la guardia copre i percorsi reali di inserimento. L'indice UNIQUE hard (`uq_leads_email_ci ON leads(lower(email)) WHERE email IS NOT NULL`) resta un'opzione **futura**, attivabile solo **se/quando** i 2 duplicati legacy verranno riconciliati.
> Nota telefono: il match soft è su email/P.IVA (affidabili) + telefono esatto; un match telefono tollerante alla formattazione richiederebbe una colonna telefono normalizzata (rinviato).

### 3.3 `staff` — provvigione fissa + payout
```
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2),   -- € fissi per cliente attivato
  ADD COLUMN IF NOT EXISTS payout_iban text,
  ADD COLUMN IF NOT EXISTS is_external boolean NOT NULL DEFAULT false;  -- agente esterno a P.IVA
```

### 3.4 `commission_ledger` (nuova — contabilità provvigioni)
```
CREATE TABLE IF NOT EXISTS commission_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      uuid NOT NULL REFERENCES staff(id),            -- chi guadagna (snapshot owner all'accrual)
  org_id        uuid REFERENCES orgs(id),                      -- cliente attivato
  lead_id       uuid REFERENCES leads(id),
  quote_id      uuid REFERENCES lead_quotes(id),
  amount        numeric(10,2) NOT NULL,                        -- snapshot di staff.commission_amount
  status        text NOT NULL DEFAULT 'accrued'
                CHECK (status IN ('accrued','pending','paid','void')),
  trigger_event text CHECK (trigger_event IN ('activation','first_payment')),
  accrued_at    timestamptz NOT NULL DEFAULT now(),
  paid_at       timestamptz,
  payout_batch_id uuid,
  notes         text
);
-- Idempotenza: una sola provvigione per attivazione dello stesso cliente.
CREATE UNIQUE INDEX IF NOT EXISTS uq_commission_per_org ON commission_ledger(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commission_staff_status ON commission_ledger(staff_id, status);
```
- **Non** riusiamo `lead_quotes.commission_rate`/`commission_recipient`: sono per un modello **a percentuale** e puntano a `auth.users`. Il modello scelto è **fisso su `staff`** → nuovo ledger.

### 3.5 `lead_quotes` — attribuzione (opzionale ma consigliata)
```
ALTER TABLE lead_quotes
  ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES staff(id) ON DELETE SET NULL;  -- chi ha chiuso il deal
```
- Per un modello fisso non serve `actual_deal_value`; `closed_by` disambigua l'attribuzione se owner ≠ chiuditore.

### 3.6 `lead_activities` — nuovi tipi
- Aggiungere i valori `commission_accrued`, `commission_paid` (e `commission_void`) tra gli `activity_type` per audit. `activity_type` è testo → solo codice.

---

## 4. Confronto: cosa manca, in sintesi

| Ambito | Esiste | Manca |
|---|---|---|
| Anagrafica/pipeline | tabella `leads` ricca, funnel | guardia anti-dup (solo nuovi), `assigned_staff_id`, UI assegnazione owner, `lost_reason` in UI |
| CRM per-lead | attività, task, appuntamenti, timeline UI | reminder proattivi, agenda "oggi", 2 funzioni email appuntamento non esportate |
| Ruolo commerciale | ruolo `sales`, JWT, middleware gate | permessi scoped `*_own`, **scoping applicativo nelle route**, vista "i miei lead" |
| Provvigioni | `commission_rate`/`recipient` (%, inutili qui) | `staff.commission_amount`, `commission_ledger`, trigger accrual, report + payout |
| Sicurezza | gate JWT su `/api/staff/*` | scoping per-owner in ~50 route, rimozione `/seed` |

---

## 5. (rif.) Route da mettere in sicurezza

Superficie reale (da `find website/src/app/api/staff`): la **maggioranza NON chiama `getStaffFromRequest`** — si affida solo al gate del middleware, senza scoping per owner. Esempi non protetti in-code da scopare:
`admin/leads/route.ts`, `admin/leads/[id]/route.ts` *(già legge staff, ma verificare scoping)*, `admin/leads/[id]/quotes/route.ts`, `admin/leads/[id]/quotes/[qid]/route.ts`, `admin/leads/[id]/tasks/route.ts`, `admin/leads/[id]/appointments/route.ts`, `admin/leads/[id]/activities/route.ts`, `admin/leads/[id]/messages/route.ts`, `admin/leads/[id]/email/*`, `admin/leads/[id]/convert/route.ts`, `admin/leads/tasks/*`, `admin/clients/[id]/route.ts`, `admin/clients/[id]/update/route.ts`, `admin/clients/[id]/[action]/route.ts`, e la legacy `leads/route.ts`/`update`/`delete` (G9).

→ Approccio: **non** patchare 50 file a mano in modo incoerente, ma introdurre un helper condiviso (§6.2) e applicarlo con una checklist route-per-route.

---

## 6. Sicurezza & scoping (il cuore del progetto)

### 6.1 Regola di visibilità
Un `staff` con ruolo **commerciale** vede/modifica **solo** le righe dove `assigned_staff_id = staff.sub`. Ruoli `super_admin`/`admin`/`marketing` vedono tutto. Vale per `leads` e a cascata per i figli (`lead_activities`, `lead_tasks`, `lead_appointments`, `lead_quotes`, `lead_demos`, `lead_documents`, `messages`) e per i **clienti** (`orgs` con `converted_from_lead_id` verso un lead del commerciale).

### 6.2 Meccanismo: scoping applicativo (fonte di verità)
Poiché il service role bypassa la RLS (G2), lo scoping vive nella route:
```
// pseudo
const staff = await getStaffFromRequest(req);      // { sub, role }
if (!staff) return 401;
let q = supabaseAdmin.from('leads').select(...);
q = scopeByOwner(q, staff);                          // helper condiviso
// scopeByOwner: se role ∈ ruoli-ristretti → q.eq('assigned_staff_id', staff.sub); altrimenti invariata
```
- **Helper unico** `scopeByOwner(query, staff, ownerCol='assigned_staff_id')` + `assertOwnership(row, staff)` per le route di dettaglio/scrittura (dopo la fetch, 403 se `assigned_staff_id !== staff.sub`).
- Le route figlie (per `lead_id`) devono prima verificare che **quel lead** appartenga al commerciale, poi procedere.

### 6.3 Fix mirati minimi
- Riscrivere `GET /api/staff/leads` (G7): firma `GET(req)`, `getStaffFromRequest`, `scopeByOwner`, e togliere `select('*')` (selezionare colonne esplicite).
- Applicare `getStaffFromRequest` + scoping a tutte le route §5.
- **Rimuovere/lockare `/api/staff/auth/seed`** (G6) dietro env `ALLOW_STAFF_SEED` default off — prerequisito per far entrare l'esterno.
- Decidere su G9 (legacy `/api/staff/leads/*`): scopare o rimuovere.

### 6.4 RLS come hardening (opzionale, fase successiva)
La RLS ha senso **solo se** si smette di usare il service role per queste letture (es. RPC che riceve `p_staff_id` e filtra, o ruolo DB ristretto). È un cambio architetturale più ampio: **non richiesto per il lancio**, documentato come difesa-in-profondità futura. Onestà: oggi la RLS da sola non proteggerebbe nulla per lo staff.

### 6.5 Audit letture (GDPR, per esterno che tocca dati clienti)
`staff_audit_log` traccia solo scritture. Valutare log delle **letture** dei dati cliente da parte del commerciale esterno.

---

## 7. Ruolo "Commerciale" (permessi) — DECISO

Si **riusa la chiave ruolo `sales`** (nessuna modifica al CHECK `staff.role`, nessuna migration di ruolo), cambiando in [`staff-permissions.ts`](../../website/src/lib/staff-permissions.ts) **solo l'etichetta** e la matrice permessi:
- `name`: `'Vendite'` → **`'Commerciale'`**; `description`: → `'Gestione dei propri lead e vendite'`.
- **Scoping applicativo** (§6.2) come comportamento del ruolo: vede/modifica solo i lead con `assigned_staff_id = lui`.
- **Rimuovere** dai permessi di `sales`: **`billing.view`**, `organizations.edit`, `users.edit` (pericolosi per un esterno).
- **Restano**: `leads.view/create/edit/assign` (scopati ai propri), `organizations.view` (scopato ai propri clienti), `analytics.view/export` (proprie metriche).
- **Vietati**: `staff.*`, `system.*`, `*.delete` (incl. `leads.delete`), `billing.*`.

> Nota: la chiave resta `sales` ovunque (JWT, DB, route). Cambia solo ciò che l'utente vede a schermo → coerente col pattern rename-solo-label già usato per i moduli. Se in futuro servisse davvero distinguere `commerciale` da `sales` interno, si valuterà una chiave nuova (D5).

---

## 8. Provvigioni (modello fisso)

- **Importo**: `staff.commission_amount` (default per quell'agente); l'importo effettivo è **snapshotato** nel ledger all'accrual (se cambi il default in futuro non riscrive lo storico).
- **Attribuzione**: `staff_id` del ledger = `leads.assigned_staff_id` del cliente al momento dell'accrual (o `lead_quotes.closed_by` se presente e diverso — vedi D2).
- **Trigger di maturazione** = **primo incasso reale** (DECISO): il gancio va dove il pagamento viene confermato:
  - Stripe/GoCardless: quando il preventivo passa a `status='paid'`.
  - Bonifico manuale: al click "Segna bonifico ricevuto" in [`StatoPagamentoPage.tsx`](../../admin-panel/src/pages/StatoPagamentoPage.tsx) / route `record-payment`.
  - In tutti i casi → crea **una** riga `commission_ledger` `accrued` (idempotente via `uq_commission_per_org`), `trigger_event='first_payment'`, + attività `commission_accrued`.
- **Payout**: pagina report per commerciale/mese/stato (`accrued`→`pending`→`paid`), batch di pagamento, `staff.payout_iban`. "Questo mese: N clienti attivati × €X = €Y da pagare".
- **Clawback = 14 giorni (DECISO)**: se il cliente disdice (`org_subscriptions.status='canceled'`) **entro 14 giorni** da `accrued_at`, la riga passa a `void` + attività `commission_void` → non entra nel payout. Oltre i 14 giorni la provvigione è consolidata.
  - Implementazione: check al cambio stato subscription + cron di sicurezza giornaliero che chiude la finestra (marca `void` le righe `accrued` con subscription cancellata entro 14gg; oltre, promuove a `pending`/pagabile).

---

## 9. CRM per-lead & appuntamenti (quasi tutto riuso)

- **Note/attività/appuntamenti/task**: già presenti (§1.1). Nessuna nuova tabella.
- **Reminder proattivi** (manca): cron in `moduli/lead-api/routes/cron.js` su `leads.next_followup_at` e `lead_tasks.due_at` scaduti → notifica all'owner; **agenda "Oggi"** riusando `fetchAllOpenTasks()` + pattern coda-per-stato di `RevisionePage.tsx`.
- **Invio appuntamento al cliente**: canale **pronto** = email Resend + pagina pubblica `appointment/[uuid]` + `.ics`. Bug da chiudere: `buildBookingLinkEmail()` e `buildAppointmentConfirmationEmail()` sono **referenziate ma non esportate** in `moduli/lead-api/lib/email.js`.
- **WhatsApp appuntamenti**: **fuori scope** (deciso: solo email). Il codice WhatsApp resta per i trasporti; nessun template appuntamento da chiedere a Meta.

---

## 10. Mappa riuso UI (admin panel)

| Nuova esigenza | Riuso da |
|---|---|
| Vista "I miei lead" | `LeadsPage.tsx` + filtro `assigned_staff_id = me` |
| Assegnazione owner (singola + bulk) | pattern bulk-selection già in `LeadsPage.tsx`; selettore staff |
| Agenda "Oggi" / follow-up scaduti | `fetchAllOpenTasks()` + coda di `RevisionePage.tsx` |
| Motivo di perdita | enum `lost_reason` (già a DB) esposto nell'azione "Perso" |
| Campi/stato provvigione | nuova sezione in `LeadQuoteDetailPage.tsx` + pagina report |

---

## 11. Piano a fasi

| Fase | Contenuto | File/tabelle | Effort | Dipende da |
|---|---|---|---|---|
| **0 — Ordine nei lead** | `leads.assigned_staff_id` + backfill; assegnazione owner in UI (singola+bulk); guardia anti-dup sui percorsi di creazione (§3.2); `lost_reason` in UI. *(No merge dei 2 duplicati legacy.)* | migration `leads`, `moduli/lead-api`, `POST admin/leads`, `LeadsPage.tsx` | **S–M** | — |
| **1 — Sicurezza + ruolo (🔴 cancello)** | helper `scopeByOwner`/`assertOwnership`; fix `GET /api/staff/leads` + tutte le route §5; ruolo commerciale (§7); rimozione `/seed`; vista "I miei lead" | `staff-permissions.ts`, ~50 route, `LeadsPage.tsx` | **M–L** | Fase 0 (`assigned_staff_id`) |
| **2 — Agenda & appuntamenti** | cron reminder + agenda "Oggi"; export 2 funzioni email; (opz.) template WhatsApp | `routes/cron.js`, `email.js`, componenti appuntamenti | **S–M** | Fase 1 (rispetta scoping) |
| **3 — Provvigioni** | `staff.commission_amount`/`payout_iban`; `commission_ledger`; hook accrual su pagamento; report + payout | migration, `StatoPagamentoPage`/`record-payment`, nuova pagina report | **M** | Fasi 0–1 |

> **Regola d'oro**: Fase 0 + Fase 1 **in produzione PRIMA** di dare le credenziali all'esterno. Le Fasi 2–3 possono seguire mentre lui già lavora.

---

## 12. Checklist sicurezza pre-onboarding esterno
- [ ] `assigned_staff_id` popolato su tutti i lead da affidargli.
- [ ] `scopeByOwner` applicato e testato su **tutte** le route §5 (incluse le figlie per `lead_id`).
- [ ] `GET /api/staff/leads` non ritorna più `select('*')` globale.
- [ ] `/api/staff/auth/seed` rimosso o gated (`ALLOW_STAFF_SEED=off`).
- [ ] Legacy `/api/staff/leads/*` scopata o rimossa (G9).
- [ ] Ruolo commerciale senza `billing.*`/`staff.*`/`system.*`/`*.delete`.
- [ ] Test negativo: login come commerciale ⇒ 0 lead altrui via API diretta.
- [ ] (Opz.) Log letture dati cliente per l'esterno.

---

## 13. Decisioni

### Chiuse (2026-07-08) — tutte
- **D1 — Quando matura la provvigione** → **primo incasso reale** (`status='paid'` / bonifico registrato). Vedi §8.
- **D2 — Attribuzione** → **owner** (`assigned_staff_id`). Con max 2 commerciali owner e chiuditore coincidono; `closed_by` resta a schema come opzionale ma non guida il payout.
- **D3 — Clawback** → **storno entro 14 giorni** dall'accrual se il cliente disdice; oltre, consolidata. Vedi §8.
- **D4 — Ruolo** → **riuso chiave `sales`**, etichetta "Commerciale", permessi ridotti. Vedi §7.
- **D5 — Scala** → **max 2 commerciali** (utente incluso), scoping piatto, **nessuna** `staff_team`.
- **D6 — Canale appuntamenti** → **solo email** + `.ics` (già pronto). WhatsApp fuori scope.

**Nessuna decisione aperta.** La struttura è validata e pronta per l'implementazione (Fase 0).

---

## 14. Blocco campi post-acquisto (immutabilità) — DECISO

**Requisito**: quando un lead diventa **cliente pagante** (attivato), i dati che non possono più cambiare devono essere **bloccati**. Con un agente esterno a provvigione è anche una misura **anti-frode e di integrità fatturazione**: impedisce di riassegnare l'attribuzione del deal o alterare l'identità fiscale **dopo** l'incasso.

### 14.1 Campi bloccati (una volta `status='attivato'`)
- **Identità fiscale**: `vat_number`, `codice_fiscale`, `company` (ragione sociale), `pec`, `forma_giuridica`, `codice_ateco`.
- **Attribuzione/commissione**: `assigned_staff_id` (owner) — congelato così la provvigione non si sposta dopo l'attivazione.
- **Restano modificabili**: `name` (referente), `phone`, `email`, `notes`, `tags`, follow-up, ecc.

### 14.2 Quando scatta
Al raggiungimento di `status='attivato'` (o alias storico `converted`). La **transizione stessa** verso `attivato` è permessa (non è un'auto-modifica bloccata); sono bloccate solo le modifiche **successive**. L'owner deve quindi essere corretto **prima/durante** `in_verifica` (dove l'admin verifica i dati), poi si congela.

### 14.3 Enforcement a 3 livelli
1. **DB trigger (primario, a prova di bomba)** — `trg_lead_field_lock` / `enforce_lead_field_lock()` in `20260708_leads_field_lock.sql`. `BEFORE UPDATE ON leads`: se il lead è attivato e uno dei campi bloccati cambia → `RAISE EXCEPTION`. Vale per **qualunque** route/client (il service-role bypassa la RLS, ma NON i trigger). È la garanzia reale contro un agente che chiama l'API a mano.
2. **UI (admin panel)** — quei campi resi **read-only con lucchetto** + tooltip "Bloccato dopo l'attivazione" quando `lead.status='attivato'`. Serve solo per UX; la sicurezza sta nel trigger.
3. **Override super_admin (eccezione)** — una route dedicata, gated a `super_admin` e **audit-loggata**, esegue `SET LOCAL app.allow_locked_lead_edit='on'` nella stessa transazione dell'update per correggere un errore genuino post-attivazione.

### 14.4 Note / confini
- **Preventivo pagato**: già immutabile via stato quote (`paid`/`activated`) — fuori da questo trigger.
- **Dati fiscali dell'`orgs`** (cliente creato): l'immutabilità lato org è dominio **admin** e l'agente esterno non ha accesso alle org (Fase 1 scoping), quindi rischio basso → eventuale trigger analogo su `orgs` è **rinviabile**.
- Il commission_ledger (§3.4) **snapshotta** comunque `staff_id`/`amount` all'accrual, quindi lo storico provvigioni è già immune a modifiche successive; il lock dell'owner è protezione aggiuntiva/di chiarezza.
