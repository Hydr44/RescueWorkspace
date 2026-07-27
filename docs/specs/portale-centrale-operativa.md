# Portale Centrale Operativa — Soccorso Stradale (struttura, no codice)

> Stato: **PROPOSTA / struttura da validare**. Nessun codice scritto. Concetto definito con l'utente il 2026-07-27.
> Obiettivo: dare alle **centrali operative** (assicurazioni, consorzi, piccole centrali) un **portale gratuito** dove inserire richieste di soccorso. Ogni richiesta diventa un **dossier completo** che arriva all'**operatore soccorritore** — cliente RescueManager desktop (pagante) — che così ha **tutto in un'unica app**.
> Principio guida: **riuso prima, costruzione dopo.** Gran parte dell'ossatura esiste già (assist/`assistance_requests`, committente=`clients`+`client_transport_terms.convenzione`, transports+wizard+push autisti+mappa live+foto/firma mobile, RENTRI/custodia/demolizione). I buchi veri sono **quattro** (vedi §6).
> Delivery: **branch separato, staging/beta, non pubblicare.** Prod live con utenti attivi → mai toccato ([[feedback_prod_live_no_touch]]).

---

## Il modello in una riga

**La centrale non paga: le regaliamo il portale.** Il valore non è la centrale — è che ogni richiesta **nasce già strutturata dentro il nostro ecosistema** e atterra nell'app che l'operatore usa già ogni giorno. La centrale gratis è il **rubinetto della domanda**; gli operatori pagano per stare dove scorre quella domanda.

## Le due promesse (posizionamento)

- **Lato centrale** (assicurazione / consorzio / piccola centrale): *"un posto dove butti la richiesta e la segui in tempo reale — gratis, senza telefonate."*
- **Lato soccorritore** (cliente pagante): *"smetti di rincorrere email, telefono, WhatsApp e portali diversi. Richiesta → trasporto → rifiuti → fattura in un'app sola."*

Il gancio commerciale è **eliminare la frammentazione** per il piccolo soccorritore. Il portale gratis della centrale è il canale di acquisizione che alimenta quel gancio.

## Il volano

Più centrali gratis → più richieste → gli operatori **devono** stare su RescueManager per riceverle → più operatori paganti → più copertura territoriale → il portale è più utile alle centrali → più centrali. Lock-in doppio: la centrale si abitua al dossier condiviso, l'operatore ha storico pratiche + rifiuti già collegati. **Zero doppio inserimento** tra i due lati: è quello il regalo vero.

---

## 1. Attori

| Attore | Paga? | Dove lavora | Ruolo |
|---|---|---|---|
| **Centrale operativa** | No (gratis) | Portale nuovo | Apre la richiesta, costruisce il dossier, smista all'operatore |
| **Operatore soccorritore** | Sì (già oggi) | RescueManager desktop + autista su mobile | Esegue trasporto + eventuale pratica rifiuti |
| **Assicurato / cliente finale** | No | Link pubblico (token) | Riceve aggiornamenti, firma, foto |
| **Committente** (assicurazione/consorzio dietro la centrale) | — | Definisce convenzione | Tariffa, massimali, autorizzazione spesa |

### 1.1 Chi è concretamente la "centrale" (deciso con l'utente)
1. **Assicurazioni / consorzi** — ricevono la chiamata dell'assicurato e devono mandare un carro attrezzi convenzionato. Alto volume, tanti operatori diversi, burocrazia (massimale/franchigia/autorizzazione, reporting).
2. **Piccole centrali** — smistano a pochi operatori fidati. Meno burocrazia, priorità = velocità.
3. (correlato) **Centrale interna di un grande soccorritore** che gira il lavoro in eccesso a colleghi/sub-operatori quando è saturo.

I due profili hanno **esigenze diverse** ma lo stesso scheletro: *crea richiesta → assegna operatore → segui stato → ricevi esito/documenti*. V1 serve entrambi con **inserimento manuale nel portale**; l'integrazione via API per i grandi committenti è F4+ (vedi §7).

---

## 2. Il cuore V1 — il **dossier completo**

Un unico fascicolo per richiesta, **condiviso** tra centrale e operatore (permessi asimmetrici), che accumula tutto:

| Sezione | Contenuto |
|---|---|
| **Pratica** | n° sinistro/pratica, data-ora, canale, convenzione applicata |
| **Chi** | committente + assicurato (nome, contatti, **consenso GDPR**) |
| **Veicolo** | targa, marca/modello, tipo, marciante/non marciante, incidentato |
| **Dove** | GPS, km/direzione (autostrada), punto prelievo → destinazione |
| **Cosa** | tipo intervento (traino, recupero, dépannage, apertura porte, rimozione…) |
| **Autorizzazioni** | copertura, franchigia, **tetto di spesa autorizzato** dalla centrale |
| **Assegnazione** | operatore, mezzo, autista, ETA |
| **Stato live** | ricevuta → accettata → in viaggio → sul posto → in carico → consegnata → chiusa |
| **Evidenze** | foto veicolo/luogo, firma cliente, documenti |
| **Esito** | officina / custodia piazzale / demolitore → **se rifiuto, aggancio pratica RENTRI/FIR** |
| **Economics** | tariffa da convenzione, fatturazione |
| **Timeline/audit** | chi-cosa-quando |

Il dossier è la **fonte di verità unica**: la centrale lo apre e lo consulta; l'operatore lo esegue e lo arricchisce; l'assicurato ne vede una fetta pubblica via token.

---

## 3. Flusso end-to-end

```
Centrale apre richiesta (gratis)  ──▶  nasce il DOSSIER
        │
        ▼  assegnazione operatore (zona / convenzione / disponibilità)
Operatore la riceve in RescueManager desktop  ──▶  push all'autista (mobile)
        │
        ▼  autista: naviga → foto → firma → cambio stato   (rifluisce nel dossier, live)
        │
        ▼  esito: officina │ custodia │ demolizione ──▶ se rifiuto → RENTRI/FIR
        │
        ▼  chiusura + tariffa convenzione + fatturazione
```

La richiesta **precede** il trasporto e può generarne **1+** (es. primo traino sul posto + successivo trasferimento da custodia a demolitore). Relazione `1 richiesta → N trasporti`.

---

## 4. Cosa esiste già (agganci — **da verificare in F0**)

> ⚠️ Elenco derivato dalla memoria di progetto, **non ancora ri-verificato sul codice**. La Fase 0 apre con un pass di grounding (nomi tabella/colonna reali) prima di scrivere qualsiasi migration.

- **`assistance_requests` + UI token** ([[reference_assist_architecture]]) → base del **portale pubblico** e del pattern "link con token" per l'assicurato. Da valutare: **estendere** questa tabella o crearne una dedicata `soccorso_requests` (§8, decisione aperta).
- **committente = `clients` + `client_transport_terms.convenzione`** ([[project_committente_listino]]) → chi commissiona e a **quale tariffa** (forma ANCSA). Prezzo già auto nel form trasporto.
- **transports + wizard 5 passi + push autisti + mappa live + foto/firma mobile** ([[project_mobile_transport_wizard]], [[project_mobile_driver_push]], [[project_mobile_foto_firma]], [[project_mobile_nav_turnbyturn]]) → **l'esecuzione è già completa**. Il dossier ci si aggancia, non lo riscrive.
- **RENTRI / custodia veicoli / demolizione** → **coda rifiuti** del dossier.
- **`TransportAuditHistory`** → timeline del dossier.
- **messaging-server WhatsApp** (`notifyTransportClient`, template `aggiornamento_trasporto` APPROVED, [[reference_messaging_server_whatsapp]]) → aggiornamenti automatici all'assicurato/centrale.
- **Sistema consenso legale + GDPR export** ([[project_legal_consent]]) → consenso dell'assicurato.
- **Topologia Supabase** ([[reference_prod_supabase_split]]) → prod unico + staging; migrazioni idempotenti perché prod↔staging divergono.

**Morale:** il lato *esecuzione* (operatore) è ~pronto. Il lavoro nuovo è quasi tutto sul lato *ingresso* (centrale) e sulla *cucitura* dossier ⇄ trasporto.

---

## 5. Modello dati target (bozza — validare in F0)

> Convenzione repo: migrazioni **idempotenti** (`IF NOT EXISTS`), nomi reali, prima staging.

### 5.1 `operations_centers` — l'attore "centrale" (non è un'org pagante)
```
id uuid pk
tipo text        -- 'assicurazione' | 'consorzio' | 'centrale_piccola' | 'interna'
nome text
contatti jsonb   -- referente, email, telefono
is_free bool default true
created_at / created_by
```
Login **leggero e separato** dall'org: riuso del pattern staff-auth (email+OTP) **oppure** magic-token stile assist. Da decidere in §8.

### 5.2 `soccorso_requests` — la radice del dossier
```
id uuid pk
numero_pratica text
centrale_id  -> operations_centers(id)
committente_client_id -> clients(id)      -- convenzione/tariffa
assicurato jsonb        -- nome, contatti, consenso_id
veicolo jsonb           -- targa, modello, tipo, marciante, incidentato
geo jsonb               -- lat/lng, km, direzione, origine, destinazione
tipo_intervento text
autorizzazione jsonb    -- massimale, franchigia, tetto_spesa, autorizzato bool
stato text              -- ricevuta|accettata|in_viaggio|sul_posto|in_carico|consegnata|chiusa|annullata
assigned_org_id -> orgs(id)   -- l'operatore soccorritore
public_token text       -- fetta pubblica per l'assicurato
created_at / created_by
```

### 5.3 Legame richiesta → trasporti
```
ALTER TABLE transports
  ADD COLUMN IF NOT EXISTS soccorso_request_id uuid REFERENCES soccorso_requests(id);
CREATE INDEX IF NOT EXISTS idx_transports_soccorso_request ON transports(soccorso_request_id);
```
Un trasporto "nasce da" una richiesta; una richiesta può averne più d'uno.

### 5.4 Timeline
Riuso dell'audit trasporti se generalizzabile, altrimenti `soccorso_request_events(request_id, actor, action, payload, at)`.

---

## 6. I 4 buchi veri (il lavoro nuovo)

1. **Attore "centrale operativa" con login ma non org pagante** → nuovo tenant/ruolo *free* (`operations_centers` + auth leggera). Oggi non esiste un'identità del genere.
2. **Dispatch cross-org**: oggi il committente è mappato, ma manca lo **smistamento** di una richiesta da centrale → **org operatore** (aziende diverse). L'operatore deve riceverla **nativamente nel desktop** (non in una casella a parte) — è quello il "tutto in un'unica app".
3. **Entità "richiesta di soccorso" distinta dal trasporto**: precede il trasporto e ne genera 1+.
4. **Vista dossier condivisa** con **permessi asimmetrici**: la centrale vede solo le proprie pratiche; l'operatore solo quelle assegnate alla sua org; l'assicurato solo la fetta pubblica.

---

## 7. Fasi (struttura prima del codice)

- **F0 — Grounding + modello dati.** Ri-verifica agganci reali su codice/DB, decide estensione vs nuova tabella (§8), scrive schema `operations_centers` + `soccorso_requests` + `transports.soccorso_request_id`. Solo migration su **staging**.
- **F1 — Dossier completo (il cuore V1).** La centrale apre la richiesta; l'operatore la vede nel desktop; timeline unificata. **Read-first**, un solo flusso felice end-to-end.
- **F2 — Dispatch + stato live bidirezionale** cross-org (assegnazione, accettazione, stati che rifluiscono alla centrale).
- **F3 — Coda rifiuti (aggancio RENTRI) + economics** (tariffa convenzione, fatturazione).
- **F4 — Portale self-service** per la centrale (inviti, multi-utente) + **API di ingresso** per i grandi committenti (assicurazioni con sistema proprio).

---

## 8. Decisioni ancora aperte

| # | Decisione | Opzioni |
|---|---|---|
| D1 | **Estendere `assistance_requests`** o **nuova `soccorso_requests`**? | Nuova tabella = modello più pulito ma riusa infra token/pagina pubblica di assist. Da valutare in F0 sul codice reale. |
| D2 | **Auth della centrale** | Riuso staff-auth (email+OTP) vs magic-token stile assist. Le assicurazioni vorranno utenti multipli → propende per OTP+inviti. |
| D3 | **Assegnazione operatore**: la sceglie la centrale o il sistema? | V1 = la centrale sceglie da una lista di operatori (semplice). Auto-routing per zona/disponibilità = F2+. |
| D4 | **Un operatore riceve da più centrali diverse?** | Sì (serve il concetto di network). Impatta scoping visibilità. |
| D5 | **Gratis fino a quando?** | Gating anti-abuso: gratis finché la centrale dispaccia a operatori RescueManager (evitare che diventi un CRM gratis per grandi committenti senza ritorno). |

---

## 9. Prossimo passo

Aprire **F0**: pass di grounding sul codice reale (`assistance_requests`, `client_transport_terms`, `transports`, auth centrale) per trasformare gli agganci "da verificare" in nomi certi, poi decidere D1/D2. Tutto su questo branch, staging, non pubblicato.
