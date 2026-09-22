# Semplificazione processi ambientali — Profilo ambientale, onboarding RENTRI, guardrail e consulente AI

> **Stato:** bozza di progettazione (v1) — *struttura prima del codice*. Nessuna implementazione finché non è condivisa e corretta.
> **Data:** 2026-07-15
> **Scope:** RENTRI (rifiuti), RVFU (demolizioni), profilo ambientale dell'org, motore movimento unico, assistente AI "consulente ambientale".
> **Fuori scope diretto (ma toccati dai guardrail):** SDI/fatturazione, piazzale custodia, ricambi. Vedi `docs/specs/consigli-campi-processi.md` per i moduli operativi.
>
> **Metodo:** i contenuti qui sono incrociati con (a) il codice reale dell'app desktop/website/VPS, (b) gli schemi/manuali ufficiali RVFU 1.26 (`desktop-app/RVFU-docs/RVFU_1.26_RIFERIMENTO.md`) e RENTRI v1.0 (`desktop-app/RENTRI-docs/API anagrafiche/`, `desktop-app/Rentri v1.0-check/`). Dove un'affermazione dipende dalla normativa, la fonte è citata.

---

## 0. La filosofia: indirizzare, non decidere

Il software **non si prende la responsabilità legale** delle scelte (quella resta del gestore), ma deve **rendere impossibili le scelte sbagliate e facili quelle giuste**. Tre livelli, sempre in quest'ordine di forza:

| Livello | Quando | Comportamento UI |
|---|---|---|
| **① Default proposto** | Nel 90% dei casi c'è una scelta ovvia | Il sistema pre-seleziona; l'operatore conferma con un tap. Non deve *sapere* la risposta, deve *riconoscerla*. |
| **② Avviso (warning)** | Scelta insolita ma lecita | Banner giallo con **spiegazione del perché** è insolita; si può procedere. |
| **③ Blocco** | Scelta **tecnicamente invalida** che l'ente rifiuterebbe comunque | Opzione **non selezionabile**, con messaggio che spiega cosa manca (es. "questo EER non esiste a catalogo"). |

Il guardrail non è una regola da ricordare: è **costruito dentro il flusso**. L'operatore riconosce la scelta giusta perché è già proposta.

> **Regola di demarcazione ②/③ (decisa 2026-07-15).** Il **blocco ③** è riservato a ciò che RENTRI/ACI rifiuterebbe comunque (EER inesistente, formato non valido, iscrizione mancante): bloccarlo non è paternalismo, evita una trasmissione fallita. Tutto ciò che è una **scelta di merito del gestore** — sforare un limite di giacenza, usare un CER autorizzato ma insolito — resta **avviso forte ②, mai blocco**. La responsabilità legale è del gestore; noi la rendiamo consapevole, non la sostituiamo.

**Principio del movimento unico:** ogni cosa che entra o esce dal piazzale è *un movimento*, tracciato allo stesso modo. È il **motore di regole** a decidere dietro le quinte cosa spingere verso RENTRI, cosa verso l'RVFU/ACI, cosa genera solo DDT/fattura. Stessa schermata per l'operatore, uscite diverse. Separare "rifiuti RENTRI" e "resto" in due mondi diversi ricrea il doppio inserimento che vogliamo eliminare.

---

## 1. Fotografia dello stato attuale (per non reinventare)

Cosa **c'è già** e non va ricostruito, e dove sono i **buchi** che questa spec colma.

### 1.1 Già presente e solido (riusare)
- **Catalogo CER/EER**: tabella `rentri_codifiche_cache` (`tabella='CodiciEER'`, con `pericoloso`, `hp_codes`, `stato_fisico`, ricerca full-text `search_codici_eer`), popolata dall'API RENTRI `codifiche/v1.0`. Componente `RentriCodiceEERLookup.jsx`. → *È il catalogo, non serve un seed statico.*
- **Setup RENTRI (wizard 5 step)**: `RifiutiSetupWizard.jsx` — prerequisiti → certificato `.p12` → num. iscrizione sito → firma mobile OTP → FIR di prova. Certificati in `rentri_org_certificates` (encryption chiave privata in migrazione, `20260527_...`).
- **Limiti rifiuti**: tabella `rentri_limiti_rifiuti` (per anno/EER, `quantita_attuale`, soglia alert) + UI `RifiutiLimitiSettings.jsx` + preview a barre + alert dashboard.
- **RVFU wizard nuovo (4 step)**: `nuova-pratica/` (Cerca → Pra → Documenti → Conferma) con precompilazione da ACI. **State machine pulita** `vfu-state-machine.ts` che già gestisce PRA vs non-PRA. → *Non toccare la state machine.*
- **Lettura siti/autorizzazioni da RENTRI**: già esiste codice che chiama `/anagrafiche/v1.0/operatore/{num_iscr}/siti` (`website/src/lib/rentri/get-siti-operatore.ts`) e `/siti/autorizzazioni` (`RifiutiRegistroForm.jsx:191`) — **ma solo per precompilare un form, senza persistere**.
- **Assistente RescueAI**: chat con tool-calling + streaming (`vps-ai-server/`, Sonnet+Haiku), 10 tool read-only + 6 azioni "proponi→conferma". Classificazione CER già scritta ma isolata in `src/lib/vfu-ai.js`.

### 1.2 Buchi da colmare (il cuore di questa spec)
1. **Nessuna entità "profilo ambientale"** per org: CER autorizzati, limiti di stoccaggio, operazioni R/D autorizzate, sedi/unità locali non sono modellati come dato strutturato. Oggi vivono come **testo libero** su `rentri_registri.autorizzazione`, `attivita_rec_smalt[]`, e opzioni **hardcoded** R13/D15 nei form.
2. **Unità locali non gestite in-app**: si incolla a mano il `num_iscr_sito`. I siti letti da RENTRI non vengono salvati.
3. **Limiti a enforcement soft**: solo alert/preview, **nessun blocco**; e calcolati solo sui movimenti già `trasmesso` (cumulato annuo, non giacenza netta carico–scarico).
4. **4 silos di movimento scollegati**: `rentri_movimenti` (Postgres), `yard_items` (**solo SQLite locale!**), `part_batches`, `accounting_entries`. Nessun concetto unico di movimento.
5. **RVFU**: un **form legacy da 2438 righe** (`DemolizioneRVFUForm.jsx`) ancora attivo in parallelo al wizard nuovo; catena RENTRI/ricambi/SDI **semi-automatica con molti "Riprova" manuali** (l'operatore si perde tra auto / riprova / step espliciti); picker **tipo documento (16 codici)** e **tipo veicolo (15 codici)** senza guardrail.
6. **AI**: nessun RAG normativo, nessun tool di verifica CER nella chat, tono rule-driven (non "consulente umano"), scollegato dal profilo/stato adempimenti.

> **Nota di verifica (auth RENTRI):** i manuali v1.0 indicano auth via **certificato di dominio RENTRI → JWT** (Bearer per GET; `Digest` + `Agid-JWT-Signature` per POST), *non* mTLS di trasporto. Il gateway VPS attuale già trasmette FIR in produzione, quindi l'auth funziona: prima di implementare le chiamate anagrafiche, **riusare lo stesso meccanismo di firma già in `vps-rentri-server`** (non introdurne uno nuovo). Da riconciliare con la nota di memoria "gateway mTLS".

---

## 2. Pilastro 1 — Il Profilo Ambientale (la chiave di volta)

Un **profilo per org** che contiene, nero su bianco, il **perimetro legale** del cliente. È la sorgente di tutti i guardrail: se un CER non è nel profilo, non è selezionabile; se un limite è nel profilo, la giacenza ci scala contro.

### 2.1 Da dove arriva ogni dato (ibrido API + OCR)

La scoperta centrale: **la maggior parte del profilo si tira giù da RENTRI via API anagrafiche, senza OCR.** L'OCR/input manuale serve **solo per i due dati che le API non espongono**.

| Dato del profilo | Fonte | Endpoint / metodo | Autorevole? |
|---|---|---|---|
| Anagrafica azienda (CF, P.IVA, ragione soc., REA, PEC, sede legale, legale rappr., **num. iscrizione RENTRI**) | **API RENTRI** | `GET /operatore` | ✅ RENTRI |
| Iscrizione RENTRI attiva sì/no | **API RENTRI** | `GET /operatore/{id}/controllo-iscrizione` | ✅ RENTRI |
| Iscrizione **Albo Gestori** (sezione, numero, categorie/classi) | **API RENTRI** | `GET /operatore/{num_iscr}/autorizzazione-albo` | ✅ RENTRI |
| **Unità locali / siti** (num_iscr_sito, nome, indirizzo, macro-attività: CentroRaccolta/Recupero/Smaltimento/Trasporto…, is_sede_legale) | **API RENTRI** | `GET /operatore/{num_iscr}/siti` | ✅ RENTRI |
| Per ogni sito: **tipo autorizzazione** (art.208, AIA, proc. semplificata…), **n° provvedimento**, **date rilascio/scadenza**, **operazioni R/D autorizzate** (R1–R13/D1–D15) | **API RENTRI** | `GET /operatore/{num_iscr}/siti/{num_iscr_sito}/autorizzazioni` | ✅ RENTRI |
| Registri C/S per sito | **API RENTRI** | `GET /operatore/{num_iscr}/siti/{num_iscr_sito}/registri` | ✅ RENTRI |
| **Elenco CER/EER autorizzati per sito** | **OCR autorizzazione + validazione umana** | l'endpoint autorizzazioni **NON** contiene i CER | ⚠️ da documento |
| **Limiti quantitativi** (t/anno, capacità istantanea, **giacenza max**) | **OCR autorizzazione + validazione umana** | assenti dalle API | ⚠️ da documento |
| Prescrizioni specifiche / tipi di stoccaggio | OCR + note manuali | assenti dalle API | ⚠️ da documento |

> Conseguenza pratica: **l'OCR non deve "leggere tutto il PDF"**, deve estrarre due sole cose (elenco CER + limiti). È un compito molto più affidabile e verificabile. Tutto il resto è già strutturato e autorevole da RENTRI.

### 2.2 Modello dati (nuove tabelle, Postgres/Supabase)

Tutto org-scoped con RLS. Nomi provvisori.

```
environmental_profile              -- 1 per org (header)
  org_id (PK, FK orgs)
  num_iscr_rentri                  -- da /operatore
  albo_sezione, albo_numero, albo_categorie jsonb
  anagrafica jsonb                 -- snapshot /operatore (CF, piva, sede legale, LR...)
  last_synced_at                   -- ultima sincronizzazione con RENTRI
  source                           -- 'rentri_api' | 'manual'
  status                           -- 'bozza' | 'confermato'  (validazione umana)

environmental_site                 -- N per profilo (unità locali)
  id (PK)
  org_id, num_iscr_sito
  nome, indirizzo, comune_id, provincia_id, is_sede_legale
  attivita text[]                  -- macro-attività RENTRI
  registro_identificativo          -- Identificativo registro vidimato (da onboarding, §3)
  synced_from_rentri bool

environmental_authorization        -- N per sito (una per provvedimento)
  id (PK), site_id (FK)
  tipo_autorizzazione              -- enum RENTRI: RecSmalArt208, AIA, RecProcSemplificata...
  autorizzazione_rif               -- n°/riferimento provvedimento
  data_rilascio, data_scadenza
  operazioni_rd text[]             -- R1..R13 / D1..D15  (da API)
  cer_autorizzati text[]           -- ⚠️ da OCR/manuale, validati vs catalogo EER
  limiti jsonb                     -- [{codice_eer|null, tipo:'annuo'|'istantaneo', valore, unita}]  ⚠️ da OCR/manuale
  documento_url                    -- PDF autorizzazione su R2
  extraction_status                -- 'ocr_grezzo' | 'validato_umano'
```

> **Coesistenza con l'esistente:** `rentri_org_certificates` resta l'ancora del certificato/`num_iscr_sito`; `rentri_limiti_rifiuti` resta il *cumulato annuo trasmesso* ma i **valori-limite** diventano derivati da `environmental_authorization.limiti` (single source). `rentri_registri.autorizzazione` (testo libero) viene **sostituito** dal FK a `environmental_authorization`.

### 2.3 Come il profilo diventa guardrail

Una volta confermato il profilo, ovunque nell'app:
- **Selettore CER** → il sito attivo **propone** i soli `cer_autorizzati` (livello ①). Un CER autorizzato ma insolito per l'attività → avviso ②. Un EER inesistente a catalogo → blocco ③ (lo rifiuterebbe RENTRI).
- **Selettore operazione R/D** → propone le sole `operazioni_rd` autorizzate per quel sito (① — al posto degli `<option>` hardcoded).
- **Giacenza** → ogni movimento scala il limite `istantaneo`/`annuo`; al superamento **avviso forte ② "vivamente sconsigliato"**, con spiegazione — **mai blocco** (Decisione B). *(vedi §4)*
- **Scadenze autorizzazione** → badge + evento calendario X giorni prima di `data_scadenza` (aggancio all'hub scadenze di `consigli-campi-processi.md §6`).
- **Sito/registro** → i form pescano `num_iscr_sito` e `registro_identificativo` dal profilo, niente più incolla manuale.

---

## 3. Pilastro 2 — Onboarding RENTRI chiavi in mano

Oggi il wizard esiste (5 step) ma lascia all'utente il lavoro difficile (creare unità locali sul portale, incollare numeri). L'obiettivo: **il cliente entra nel portale RENTRI una volta sola, poi mai più — tutto passa dal gestionale.** È probabilmente l'argomento di vendita più forte da qui a settembre 2026.

> **Documento collegato:** *quali* documenti chiedere al cliente e *cosa estrarne* (schema, esempio reale SCOZZARINI, regole di validazione, costi OCR) è in **[onboarding-profilo-ambientale-documenti.md](onboarding-profilo-ambientale-documenti.md)**. Sintesi: bastano **due documenti** (estratto Albo iscrizione + autorizzazione impianto); il lato trasporto si può ricavare anche dalla **ricerca pubblica Albo per CF** (zero documenti).

### 3.1 Nuovo flusso onboarding (estende `RifiutiSetupWizard.jsx`)

| Step | Cosa fa il sistema | Cosa fa l'utente | Livello guardrail |
|---|---|---|---|
| **1. Certificato** | Carica `.p12` → estrae cert+chiave lato VPS (già implementato) → genera JWT di dominio | Trascina il file + password | — |
| **2. Verifica iscrizione** | `controllo-iscrizione` + `controllo-autorizzazione-albo` → conferma che l'operatore è accreditato | Nulla (solo lettura esito) | ③ blocca l'avanzamento se non iscritto, con istruzioni |
| **3. Sincronizza profilo** | `GET /operatore` + `/autorizzazione-albo` + `/siti` + `/siti/{id}/autorizzazioni` → **auto-popola** `environmental_profile` + siti + autorizzazioni (tipo, riferimento, scadenze, R/D) | Rivede e conferma i dati tirati giù | ① tutto pre-compilato |
| **4. Completa autorizzazione (OCR)** | Per ogni autorizzazione: carica il PDF → **OCR estrae CER autorizzati + limiti** → li propone | **Valida** l'estrazione (obbligatorio: `extraction_status → validato_umano`) | ② l'AI evidenzia dubbi ("questo CER non è in catalogo EER, verifica") |
| **5. Vidima registri** | Per ogni sito operativo: `POST /operatore/registri {num_iscr_sito, attivita[], attivita_rec_smalt[]}` → ottiene `Identificativo` registro vidimato (e-seal XAdES) → lo salva su `environmental_site.registro_identificativo` | Conferma quali siti attivare | ① propone i siti da RENTRI |
| **6. Firma mobile** | Collega dispositivo per firma OTP (già implementato, `FirmaMobileManager`) | Inquadra QR / OTP | — |
| **7. FIR di prova** | Trasmette un FIR bozza di test (già implementato) | Conferma | — |

> **Precarica cataloghi** all'onboarding (una tantum + refresh periodico): `GET /codifiche/v1.0/{codici-eer, attivita-rs, causali-operazione, stati-fisici, caratteristiche-pericolo, unita-misura}` → alimenta `rentri_codifiche_cache`. Così i selettori sono sempre a catalogo, mai testo libero.

### 3.2 Ruolo "delegato" (studio/consulente)
Le API espongono le stesse rotte con prefisso `/soggetto-delegato/...`. Un'agenzia può gestire più clienti in delega. **Non è nel wizard oggi.** Da valutare come fase successiva (utile se RescueManager stessa fa da delegato per i clienti — leva di servizio forte, vedi §7 decisioni).

### 3.3 Import dello storico RENTRI esistente (migrazione cliente)
Verificato sui manuali v1.0 (`dati-registri.md`): l'API espone **la lettura** dello storico, non solo la scrittura.
- **`Elenco registrazioni`** (con filtro `alla_data`) → scarica tutte le registrazioni carico/scarico già trasmesse a un registro fino a una data. + **`Dettaglio registrazione`**, **`Conteggio`**, **`Elenco transazioni`** (anche `/soggetto-delegato/...`).
- Lato formulari: **`Elenco FIR vidimati`** + `verifica numero FIR`.
- RENTRI conserva il registro come **catena di impronte firmata** (esportazioni concatenate, `catena_impronte_esportazioni.md`) → storico integro e ri-scaricabile. L'app ha già i mattoni di lettura (`fetchRegistri`/`fetchMovimenti`/`fetchFIRVidimati` in `rentri-api.js`): manca cablare il **backfill una-tantum**.

**① Dati GIÀ su RENTRI** (registro digitale attivo, trasmessi via portale o altro gestionale) → **ri-import con un click** all'onboarding: si popolano `rentri_movimenti`/`rentri_formulari`.
- ⚠️ **Guardrail critico**: importati come `sync_status='trasmesso'`, **read-only, mai ri-trasmessi** (rispetta l'immutabilità post-RENTRI già presente). Dedup per numero registrazione.
- **Costo ~zero**: chiamate API, niente AI.

**② Dati NON su RENTRI** (registri C/S cartacei pre-RENTRI, Excel di gestionale legacy, MUD passati) → nessuna banca dati da interrogare: si usa l'**import Excel/CSV** già esistente [[project_excel_import_feature]] o OCR per i cartacei. Restano **archivio interno consultabile**; il registro digitale parte dalla data di attivazione, il pregresso non si ri-vidima.

**Leva commerciale**: "vieni da un altro gestionale o dal portale → ti ri-portiamo dentro tutto lo storico RENTRI con un click" — rafforza l'onboarding chiavi-in-mano.

### 3.4 Monitoraggio aggiornamenti API RENTRI (demo + prod)
RENTRI evolve l'API (versioni, nuovi campi, nuove validazioni): serve accorgersene **prima** che rompa la produzione. Check periodico su **entrambi** gli ambienti:
- **Ping stato**: demo (`demoapi.rentri.gov.it`) + prod (`api.rentri.gov.it`) → up/down.
- **Versione API/schemi**: XSD versionati (`rentri-*-1.0.xsd`) e pagina "API in produzione" → alert quando cambia.
- **Diff demo ↔ prod**: la demo anticipa spesso le novità → **allarme preventivo** su ciò che arriverà in prod, così adeguiamo builder/validatori prima del rilascio (mitiga anche la divergenza prod/staging notata in [[reference_rentri_vps_architecture]]).
- **Alert**: email + widget admin panel. **Riusa l'infrastruttura del [[project_regulatory_monitor]]** già deployata su VPS (pm2, schedule 08:00 + vista admin), aggiungendo la sonda RENTRI demo/prod. Costo ~zero.

---

## 4. Pilastro 3 — Movimento unico → uscite diverse

Oggi 4 silos separati. L'operatore deve *sapere* dove registrare cosa. Obiettivo: **una sola azione "registra movimento"**, il motore decide le uscite.

### 4.1 Il motore di regole (routing)

L'operatore registra *cosa entra/esce* (veicolo, rifiuto, ricambio, materiale) con la stessa UI. Il motore instrada:

| Natura del movimento | Uscite generate (dietro le quinte) |
|---|---|
| Rifiuto (EER) in carico/scarico | Registro cronologico RENTRI (movimento C/S) + scala giacenza |
| Rifiuto trasportato a terzi | + FIR/xFIR digitale (vidimazione blocco) |
| Ricambio venduto per riuso (**non** rifiuto) | Solo DDT + fattura SDI (nessun RENTRI) |
| Carcassa VFU al frantumatore | Movimento scarico RENTRI + FIR + collegamento pratica RVFU |
| Veicolo in custodia (sequestro) | Scheda piazzale + eventuale giacenza fatturabile (no RENTRI) |

> Questo **non è lavoro in più**: internamente si traccia tutto uguale; cambia solo l'uscita. È il contrario del doppio inserimento.

### 4.2 Guardrail sul movimento (soft → hard)

Comportamento (allineato alla Decisione B — avvisare, non bloccare):
- **CER**: il form **propone** solo i `cer_autorizzati` del sito (①). Fine del testo libero e dei CER hardcoded (`'14 06 01*'` ecc.). Un CER autorizzato ma insolito → avviso ②; un EER inesistente → blocco ③ (RENTRI lo rifiuterebbe).
- **Operazione R/D**: propone solo quelle autorizzate (①).
- **Giacenza istantanea**: se il carico sfora `limiti.istantaneo` → **avviso forte ② "operazione vivamente sconsigliata: superi la giacenza autorizzata di X"**, con possibilità di procedere. *Richiede calcolo della giacenza netta in tempo reale* (carichi − scarichi), non solo il cumulato annuo dei trasmessi che c'è oggi.
- **Limite annuo**: avviso ② in avvicinamento e al superamento. Nessun blocco.

> **Nota compatibilità:** la giacenza netta va introdotta **spenta di default** (feature flag) e accesa per org con profilo `confermato`, così chi non ha ancora il profilo completo non vede avvisi infondati. Non c'è più un "cambio di contratto" bloccante — solo avvisi in più.

### 4.3 Report / audit rifiuti configurabile (l'uscita di lettura)

Se ogni cosa è un movimento tracciato, il cliente può generare un **report configurabile** scegliendo cosa includere e il periodo. **Non serve AI**: è aggregazione DB + PDF, sull'infrastruttura già esistente per registri/FIR/MUD → **costo ~zero**.
- **Metriche selezionabili**: n° veicoli demoliti, carcasse al frantumatore, ricambi smontati/venduti, **olio esausto smaltito (kg)**, per CER, per periodo, per sito/unità locale.
- **Formati**: PDF (logo + branding) o Excel/CSV.
- **Usi**: audit interno, richieste enti/controlli, base per il MUD, rendicontazione al committente.
- Si appoggia a `RifiutiDashboard`/MUD esistenti, estesi con la selezione delle voci e l'export. Un riassunto narrativo AI è **opzionale** (una chiamata economica), non il cuore.

---

## 5. Pilastro 4 — RVFU semplificato

Il wizard nuovo (4 step) è già una semplificazione. Il lavoro qui è **togliere complessità e mettere guardrail**, non rifare.

### 5.1 Interventi
1. **Ritirare il form legacy** `DemolizioneRVFUForm.jsx` (2438 righe) — deprecare le rotte `/demolizioni-rvfu/new` e `/:id` verso il wizard nuovo + dettaglio. È la singola fonte di complessità storica più grande.
2. **Guardrail sui picker** (dagli schemi 1.26, `RVFU_1.26_RIFERIMENTO.md §3`):
   - **PRA vs non-PRA**: mai chiesto — derivato da `obbligoIscrizionePRA` che torna da `GET /cr/veicolo`. Instrada in automatico.
   - **Tipo veicolo**: default `A`=Autoveicolo. ⚠️ label corrette a catalogo (`M`=Motoveicolo **PRA**, `F`=Filobus, `C`=Ciclomotore non-PRA). 15 codici ufficiali (non 17).
   - **Causale**: all'operatore **solo `D`/`P`** (le altre le mette il sistema).
   - **Tipo documento**: gran parte generati dal sistema (`C`/`R`/`E`). Trappole da evitare con label esplicite: "denuncia smarrimento targhe" = **`S`** (non `D`); "procura/delega" = **`T`** (non `L`). 16 codici ufficiali (non 18).
   - **Distinta**: default `DOCUMENTO`; enum a 4 valori (ASSENTE/DENUNCIA/DOCUMENTO/VERBALE).
   - **Forzatura**: default `N`; `S` solo mostrando esplicitamente il vincolo ACI.
3. **Scadenze normative come promemoria** (aggancio hub scadenze):
   - Annullo VFU: **solo entro la giornata** di emissione CDR → badge "annullo disponibile solo oggi".
   - "Radia veicolo" non-PRA: **entro il giorno successivo** al DA RADIARE → badge "scade oggi".
   - Distruzione documenti: **non prima del 120° giorno** dal CDR → campo `dataDistruzioneDocumenti` bloccato prima di CDR+120gg.
   - Conservazione documentazione: **10 anni** dalla radiazione.
4. **Timeline di lavorazione unificata** (`VFUProcessingTimeline.jsx`): oggi mix di auto-trigger + "Riprova" manuali confonde, e l'operatore segue in parallelo due binari — legale RVFU/ACI (radiazione, `vfu-state-machine.ts`) e rifiuti RENTRI (bonifica/movimenti/FIR). **Fonderli in una timeline sola**: passi accettazione → bonifica (= esplosione, §Esplosione VFU) → smontaggio ricambi → radiazione → carcassa 16 01 06 → conferimento frantumatore → fattura, ognuno etichettato con l'adempimento (RVFU/RENTRI/SDI). Per ogni passo: *stato inequivocabile* (fatto ✓ / in corso ● / da fare ○ / errore), *cosa ha generato* (CDR, carico, esplosione CER, FIR, scarico), *un solo* pulsante, ed **errori spiegati** ("non trasmesso perché… · vedi perché · riprova"), non un "Riprova" nudo. Riusa la state machine (pulita, non toccarla) — la timeline la *mostra*, non la sostituisce.
   - **Esplosione VFU (dominio, fissato)**: il veicolo entra come **16 01 04\*** (pericoloso); la **bonifica** (non lo smontaggio ricambi) lo declassifica → **16 01 06** (codice diverso; non esiste "16 01 04 non pericoloso"). Set bonifica = `BONIFICA_PARTI` (12 componenti). All'inserimento: **anteprima preventiva** "in cosa verrà diviso". Registro: carico 16 01 04* → carichi produzione (NP) dei fluidi → scarico 16 01 06 + FIR (R4). *(Da verificare con precisione sui manuali registri: meccanica esatta della trasformazione a registro — scarico-per-trattamento vs carico-produzione con RiferimentoOperazione — prima di implementare.)*

### 5.2 Nota su auth produzione
L'attrito storico #1 è l'**auth OIDC/CDSSO in produzione** (401/403, in attesa di ACI). È un problema infrastrutturale **indipendente** da questa semplificazione UX: va tracciato a parte, non blocca il redesign del flusso (che si testa in Formazione).

### 5.3 Meccanica registro RENTRI della bonifica VFU — VERIFICATA (manuali v1.0 + fonti ufficiali online, 2026-07)
Prerequisito bloccante prima di implementare, ora fissato. Confermato incrociando: XSD/guida tecnica del repo, **manuale MASE tenuta registro**, **manuale RENTRI impianti di recupero** (ekoservice), **presentazione ADA — Ass. Naz. Demolitori Autoveicoli** (VFU-specifica). Include i **bug del codice attuale** emersi.

**Causali operazione — enum ufficiale v1.0** (`rentri-enum-1.0.xsd`, 9 valori; **NON esistono** `PR/RS/AS/RM` né il semplice `T` — la lista in `PIANO_RENTRI_AUT_ROT_FRA.md` era errata):
| Carico | Scarico | Combinata |
|---|---|---|
| `DT` prodotto/detenuto nell'unità locale · **`NP` nuovo produttore = rifiuto prodotto da trattamento** · `T*` ricevuto da terzi (con FIR) · `RE` prodotto **fuori** dall'unità locale | `I` **scarico interno** (lavorazione, no FIR) · **`aT` scarico a terzi** (conferimento con FIR, `Esito` richiesto) · `M` scarico per produzione di **Materiali** (EoW) · `TR` **intermediazione** | `T*aT` ricezione + accettazione |
> Correzioni alla prima lettura: `RE` = prodotto *fuori* dall'UL (non "rientro/reso"); `TR` = *intermediazione* (non "avvio al trasporto"); `aT` = *scarico a terzi/conferimento* (è questa, non `TR`, la causale del conferimento con FIR).

**Sequenza esatta per bonificare un VFU** (trattamento interno = movimenti separati; niente FIR finché resta in impianto). Confermata testualmente dal manuale impianti di recupero: *"lavorazione del rifiuto → SCARICO INTERNO → I"* + *"CARICO i rifiuti che provengono dalla lavorazione → l'impresa è il NUOVO PRODUTTORE → NP"*:
1. **Carico** `16 01 04*` all'accettazione (`veicolo_fuori_uso=true`). Causale: da confermare (vedi punti aperti).
2. **Scarico** del `16 01 04*` consumato dalla bonifica → causale **`I`** (scarico interno), `RiferimentoOperazione` → punta al carico del passo 1. ✅ confermato.
3. **Carichi** di ogni prodotto (fluidi 13 02 05\* ecc. + carcassa `16 01 06`) → causale **`NP`**, ciascuno con `RiferimentoOperazione` → punta allo **scarico** del passo 2. ✅ confermato.
4. **Conferimento al frantumatore** → **scarico `aT`** (scarico a terzi, con FIR + blocco `Esito`). ✅ confermato (non `TR`, non `T`).
- Collegamento = `RiferimentoOperazione` (array `{Anno, Progressivo, [IdentificativoRentri]}`, previsto dall'XSD). **Nessun obbligo di bilancio di massa** nei manuali; nelle UI dei gestionali semplici il legame input↔output è spesso *implicito* (per EER + cronologia), ma l'XSD lo supporta esplicito → **noi lo popoliamo** per tracciabilità piena.

**Bug del codice attuale da correggere** (farebbero rifiutare i movimenti — indipendenti dal redesign):
1. `vfu-draft-creator.js:1223` — scarico del 16 01 04\* con causale **`NP`** (che è causale di *carico*) → deve essere **`I`**. Il codice stesso ammette "da rivedere con esperto normativo".
2. `vfu-movimento-scarico.js:24-28` — causale **`'T'`** (default + `CAUSALI_VALIDE`) **non esiste** nell'enum → per conferimento con FIR usare **`TR`**.
3. `vfu-draft-creator.js:1292` — `provenienza_codice: 'I'` invalido (enum ammette solo `U`/`S`) → **`S`** (speciale).
4. `RiferimentoOperazione` sui carichi NP che punta a un altro **carico** (160106) invece che allo **scarico** del 160104 → verso sbagliato (passo 3 sopra).
5. Formato `riferimento_operazione` non XSD-conforme: salva UUID Supabase locale + chiave custom `ruolo`, non `{Anno, Progressivo}`/`IdentificativoRentri`. La risoluzione UUID→anno/progressivo deve avvenire server-side — **da verificare** in `vps-rentri-server`.
6. Glossa causali interna contraddittoria (`RifiutiMovimentoForm.jsx:248-249` classifica `aT/I/M` come *carico*; l'enum dice *scarico*).

**`destinato_attivita` — da NON hardcodare a `R4`** (`vfu-movimento-carico.js:150` ecc.): ✅ confermato ADA — R4 = recupero metalli è operazione del *frantumatore* a valle; l'autodemolitore fa messa in sicurezza/smontaggio → tipicamente **R12/R13**; e varia per EER (es. olio 13 02 05\* → **R9**). **Deve venire dal profilo ambientale** (operazioni autorizzate del sito), non da una costante.

**Stato dei punti aperti dopo la verifica online:**
- ✅ **Glossa causali** — chiusa (concordi: MASE, ekoservice, ADA, xennial). Vedi tabella sopra.
- ✅ **Trasformazione con cambio EER** (16 01 04\*→16 01 06 + derivati) — chiusa: scarico `I` dell'input + carichi `NP` degli output, testuale dal manuale impianti di recupero.
- ✅ **Nessun obbligo di bilancio di massa** — confermato.
- ⚠️ **Resta aperto**: la **causale della presa in carico del VFU** al passo 1 (probabile `T*` se con FIR/trasporto; ma il VFU segue spesso il regime CDR/scheda senza FIR ordinario → potrebbe essere `DT` o regime speciale). Da nailare sulla **codifica ufficiale** `GET /codifiche/v1.0/causali-operazione` + regime VFU.
- ⚠️ **Cautela fonti**: la glossa viene da manuale MASE + associazioni/gestionali (autorevoli e concordi), **non** dal testo primario dell'enum (che è solo valori). Prima di scrivere il codice a registro, un **cross-check finale** sulla codifica ufficiale online chiude il residuo.

---

## 6. Pilastro 5 — Il consulente ambientale AI

Estendere RescueAI (`vps-ai-server/`) da "esecutore di azioni" a **consulente ambientale che parla come un umano** e conosce la normativa. *"più il resto"*: resta anche l'assistente operativo generale (già presente), il consulente ambientale è una **competenza in più**, non un secondo assistente.

### 6.1 Le tre cose che mancano

**a) Tono umano.** Riscrivere `buildSystemPrompt` (`vps-ai-server/server.js:63`) da rule-heavy ("SEMPRE", "USA…SUBITO", passi numerati) a una **persona**: un consulente ambientale esperto che parla come un collega al telefono — frasi naturali, niente elenchi puntati a raffica se non servono, ammette l'incertezza. Regole di condotta chiave:
   - Quando **non è sicuro** della normativa → lo dice e **cita la fonte** o suggerisce la verifica, mai inventare un CER o una scadenza.
   - Spiega il *perché*, non solo il *cosa* ("questo olio va nel registro perché è un rifiuto pericoloso HP…, e come CR sei tenuto a…").
   - Non dà mai per scontato: se manca un dato del profilo, lo chiede.

**b) Grounding sul profilo + dati reali (no allucinazioni).** Nuovi **tool** che danno risposte *deterministiche e citabili*, agganciati al profilo ambientale e ai cataloghi:
   - `lookup_cer(descrizione)` → cerca in `rentri_codifiche_cache` (riusa `search_codici_eer`) e ritorna codice + pericoloso + HP + stato fisico.
   - `check_cer_autorizzato(codice)` → verifica contro `environmental_authorization.cer_autorizzati` del sito attivo ("sì, sei autorizzato al 16 01 07*"; oppure "no, non è nella tua autorizzazione").
   - `check_giacenza(codice_eer)` → quanto spazio resta sul limite istantaneo/annuo.
   - `spiega_adempimento(scenario)` → data una situazione ("ho ritirato un'auto incidentata"), spiega i passi RENTRI/RVFU dovuti e le scadenze, leggendo lo stato reale della pratica.
   - `classifica_rifiuto(...)` → promuovere la logica già scritta in `src/lib/vfu-ai.js` a tool della chat (oggi è one-shot isolata).

**c) RAG normativo (fatto subito — Decisione C).** Una knowledge base indicizzata (D.Lgs 152/2006, 209/2003, DM RENTRI, guide tecniche registri/FIR, tabelle causali) così l'AI risponde **con grounding citabile** invece che "a memoria del modello". Nota tecnica: **Anthropic non ha un'API di embedding** → si usa un provider esterno (Voyage AI, raccomandato da Anthropic). **La base normativa è la stessa per tutti i clienti**, quindi l'indice si costruisce **una volta sola** (costo di indicizzazione trascurabile, condiviso). I tool deterministici di (b) restano la prima linea (risposte esatte, non probabilistiche); il RAG copre le domande aperte. Vedi §9 per costo e limiti.

### 6.2 Esempio di comportamento target
> **Operatore:** "questo olio esausto lo devo mettere nel registro?"
> **RescueAI (oggi):** risponderebbe a memoria del modello, senza verificare nulla.
> **RescueAI (target):** *"Sì. L'olio esausto è un rifiuto pericoloso — codice **13 02 08\*** — quindi come centro di raccolta lo registri in carico sul registro cronologico. Ho controllato: è tra i CER della tua autorizzazione del sito di [Comune], e hai ancora margine sulla giacenza. Se poi lo mandi a un impianto di recupero serve anche il formulario. Vuoi che ti apra il movimento di carico già compilato?"* → propone `propose_movimento_carico` (nuova azione).

### 6.3 Nuove azioni "proponi→conferma"
Estendere `actions.js` con azioni ambientali (stesso pattern capability-gated dei 6 esistenti): `propose_movimento_carico`, `propose_movimento_scarico`, `propose_fir`, `propose_registro`. Ognuna **pre-compilata dal profilo** e confermata dall'operatore (mai auto-eseguita).

---

## 7. Fasi di implementazione (ordine e dipendenze)

Ogni fase nasce **spenta** (feature flag), testata su staging, accesa in prod — come da principio del progetto. La Fase 0/1 va completata **prima** di far entrare l'agente commerciale esterno (vedi `project_crm_commerciale_provvigione`).

| Fase | Contenuto | Dipende da | Rischio |
|---|---|---|---|
| **0. Profilo ambientale (dati)** | Tabelle `environmental_*` + sync da API anagrafiche RENTRI + precarica cataloghi `codifiche/v1.0`. Nessun guardrail ancora, solo popolamento + validazione umana. | Auth RENTRI esistente (VPS) | Basso — è additivo |
| **1. Onboarding chiavi in mano** | Estende `RifiutiSetupWizard` con step verifica/sync/OCR/vidima registri. OCR limitato a CER+limiti. | Fase 0 | Medio — OCR va validato sempre a mano |
| **2. Guardrail selettori** | CER e R/D filtrati dal profilo ovunque (blocco ③). Sostituisce testo libero e `<option>` hardcoded. | Fase 0 | Medio — cambia UX esistente, flag per org con profilo confermato |
| **3. Giacenza netta + avvisi** | Calcolo carico−scarico in tempo reale; solo avvisi ② (Decisione B), nessun blocco. | Fase 2 | Medio — spento di default, additivo |
| **4. Consulente AI + RAG** | Tono umano + tool deterministici (lookup/check/spiega) + **RAG normativo citabile** (Voyage, indice condiviso) + azioni ambientali + cap d'uso (§10). | Fase 0 (per i tool di check) | Basso — additivo, capability-gated |
| **5. RVFU cleanup** | Ritiro form legacy, guardrail picker, scadenze, catena lavorazione chiara. | — (indipendente) | Medio — rimozione codice, test flusso Formazione |
| **6. Movimento unico** | Motore di routing + unificazione UI dei 4 silos. | Fasi 2–3 | **Alto** — architetturale, ultimo |
| **7. Soggetto delegato** | Ruolo soggetto-delegato per RescueManager-as-delegato (config RENTRI dei clienti in delega). | Fase 4 | Medio — valore alto, decisione di prodotto (Dec. A) |

---

## 8. Rischi e decisioni aperte

1. **OCR mai autoritativo.** L'estrazione CER/limiti dal PDF autorizzazione è *sempre* soggetta a validazione umana obbligatoria (`extraction_status`). Un CER estratto male = guardrail sbagliato. → validazione bloccante nel wizard.
2. **Limiti = avviso, non blocco** *(Decisione B, risolta)*: al superamento si avvisa in modo forte ("vivamente sconsigliato") ma si può procedere. Blocco solo per l'invalido tecnico. La giacenza netta resta spenta di default per org senza profilo confermato.
3. **Auth RENTRI (JWT vs mTLS)**: riconciliare i manuali v1.0 (JWT + Agid-JWT-Signature) con l'implementazione VPS attuale prima di aggiungere chiamate anagrafiche. Non reinventare l'auth.
4. **Encryption chiave privata certificati**: la migrazione `20260527` è pronta ma il backfill/azzeramento del plaintext non risulta completato — da chiudere prima di scalare l'onboarding.
5. **RescueManager come soggetto delegato** *(Decisione A, aperta)*: enorme leva di servizio ("configuriamo noi il tuo RENTRI e non ci entri più"), ma implica responsabilità operativa. Decisione di prodotto → Fase 7.
6. **Movimento unico (Fase 6)** tocca `yard_items` che oggi vive **solo in SQLite locale**: va prima portato su Postgres/Supabase per unificarlo con gli altri movimenti.
7. **Ordine fasi** *(Decisione D, risolta)*: Fasi 0/1 (profilo + onboarding chiavi-in-mano) chiuse **prima** dell'ingresso dell'agente commerciale esterno [[project_crm_commerciale_provvigione]] — è ciò che l'agente vende ("ti configuriamo noi il RENTRI").

---

## 9. Costo AI, limiti d'uso e multi-sede

### 9.1 Multi-sede / cambio unità locale (Decisione risolta)
- **Il cambio di sito è gratis e istantaneo**: RENTRI modella nativamente più `siti` per operatore; `environmental_site` li tiene tutti. In alto in UI un selettore "Stai operando su: [sede]" cambia il contesto (registro, CER autorizzati, limiti). Nessun costo per lo switch.
- **La leva di licenza è il numero di unità locali attive**, non lo switch: **base = 1 sede inclusa; sedi operative aggiuntive = add-on** (ogni sito = un registro da vidimare + un'autorizzazione + una lista CER = più valore). Far pagare "per switch" sarebbe UX assurda.

### 9.2 Costo del consulente AI (prezzi reali Anthropic, 2026)
Modelli: **Sonnet** $3/$15 per 1M token (in/out) per il ragionamento, **Haiku** $1/$5 per i lookup. **Prompt caching** → lettura cache ~0,1× (il prompt-base normativo cachato costa quasi nulla a ogni query). **Embedding**: Anthropic non ne ha → **Voyage AI** (~$0,02–0,12/1M), ma l'indice normativo è **condiviso tra tutti i clienti** e le query sono ~50 token → costo trascurabile.

- **Costo per domanda**: leggera (Haiku) ~€0,006; **pesante/complessa (Sonnet) ~€0,04 nel caso peggiore *con i tetti per-richiesta di §9.3*** (senza tetti sarebbe illimitata). Media mix ~€0,02.
- **Il costo scala con la complessità, non col numero di domande** → il limite va ancorato al **costo/token reale, non al conteggio messaggi** (una domanda complessa spende molto più di una semplice).

### 9.3 Limiti d'uso — su TRE livelli (necessari)

Il tetto vero è il budget in €, ma da solo non basta: senza un tetto per-richiesta una singola domanda complessa può costare molto. Tre livelli combinati:

**① Tetto per singola domanda** (così nessuna domanda "esplode"):
- `max_tokens` output limitato (~800–1000 token) — la risposta non si dilunga all'infinito.
- Contesto RAG limitato (top 5–6 chunk, ~6k token) — non passiamo mezza knowledge base per query.
- Storico troncato agli ultimi N turni.
- → caso peggiore di una domanda complessa **bounded a ~€0,04**, mai €0,50/€1.

**② Instradamento modello** (tiene bassa la media):
- **Haiku di default** (lookup/semplici, ~€0,006); **Sonnet solo** per ragionamento normativo; **mai Opus** nel consulente.

**③ Budget mensile in € per org** (il tetto aggregato, non un conteggio messaggi):
- Traccia la spesa reale coi campi `usage` (input/output/cache read/creation) × tariffe modello, che `vps-ai-server` già riceve a ogni chiamata.
- Esaurito il budget → **degrado a Haiku-only** per il resto del mese (ancora utile), oppure messaggio gentile "consulenze del mese esaurite, passa a Completo". **Mai errore secco.**
- **Rate-limit** già esistente (100/ora per org) — si mantiene come backstop anti-abuso.

**Regola commerciale — dimensionare sul caso peggiore, non sulla media.** Con la domanda pesante bounded a ~€0,04, si pubblicizza un numero conservativo calcolato su quel costo:

| Piano | Budget/mese | Domande *garantite* (tutte pesanti) | Realistico (mix) | €/anno |
|---|---|---|---|---|
| Autodemolitore €1.380 | €8 | ~200 | 350–500 | ~€96 (7%) |
| Completo €1.790 | €15 | ~375 | 650–900 | ~€180 (10%) |

Se il cliente fa domande leggere ne ottiene molte di più (bonus per lui); se le fa tutte complesse, **il tetto per-richiesta ① garantisce che non si sfori mai il budget**. Contatore uso per org esposto in Impostazioni + admin per tarare i budget sui dati reali.

### 9.4 Upgrade e top-up del budget (manuale, per scelta)
- **Non si costruisce billing automatico dei crediti AI**: con i tetti quasi tutti restano dentro, il top-up è raro → automatizzarlo (Stripe metered, usage records, proration) sarebbe over-engineering.
- **Il vero upsell è il piano**: chi vuole più AI **passa a Completo** — cambio di abbonamento, già gestito da Stripe. Non "compra crediti".
- **Bump manuale in admin = l'eccezione** per il raro cliente pesante sul base: il cliente paga (fattura dal modulo admin esistente [[project_admin_fatturazione]]), l'admin alza il campo **`ai_budget_eur`** dell'org. Zero codice di pagamento nuovo (riusa admin + `audit_trail`).
- **Una-tantum vs permanente**: distinguere **baseline mensile** (permanente) dal **bonus del ciclo corrente** (scade a fine mese), così un top-up occasionale non diventa per sbaglio il nuovo baseline. Per la v1 basta un campo + nota nell'audit; se vuoi zero pensieri, due campi separati e il bonus scade da solo.

### 9.5 Controllo utilizzi per cliente (admin panel)
Per tarare i budget, fare i top-up (§9.4) e intercettare abusi, l'admin panel mostra il **consumo per org**. Si appoggia ai dati `usage` che `vps-ai-server` già riceve a ogni chiamata (da loggare in aggregato mensile).
- **Per org**: messaggi/token AI del mese **vs budget €**, ripartizione Haiku/Sonnet, trend; **analisi documenti** usate vs cap annuo (§7 spec documenti); (opz.) chiamate RENTRI/API.
- **Azioni admin**: alza `ai_budget_eur` (top-up), reset, nota (`audit_trail`).
- **Alert**: elenco org che si avvicinano/superano il budget → **all'admin**, non al cliente (il cliente vede solo il suo credito residuo, §9.3).
- **Riusa la pagina [[project_client_usage_page]]** già esistente (`/clients/:id/usage`), estesa con le metriche di consumo AI/servizi. Costo ~zero.

## 10. Fonti

- Codice: `desktop-app/greeting-friend-api-main/` (app), `vps-ai-server/`, `vps-rentri-server/`, `vps-staging-services/rentri-api/`, `website/src/lib/rentri/`, `supabase/STAGING_SCHEMA_LIVE.md`, migrazioni `supabase/migrations/`.
- RVFU 1.26: `desktop-app/RVFU-docs/RVFU_1.26_RIFERIMENTO.md` (consolidato), `Specifiche gestione demolitori/SpecificheWS-GestioneDemolitori1.25.md` (enum ufficiali), `Registro Veicoli Fuori Uso/Registro_VFU_Manuale.md`, `RVFU json/{17,20,08}_*.md`.
- RENTRI v1.0: `desktop-app/RENTRI-docs/API anagrafiche/*.md` (endpoint anagrafiche), `desktop-app/Rentri v1.0-check/` (introduzione, registri-movimenti, dati-registri, formulari-digitali, ca-rentri, XSD `rentri-{movimenti,registri,enum}-1.0.xsd`).
- Contesto prodotto: `RESCUEMANAGER_PROGETTO.md`, `docs/specs/consigli-campi-processi.md`.
