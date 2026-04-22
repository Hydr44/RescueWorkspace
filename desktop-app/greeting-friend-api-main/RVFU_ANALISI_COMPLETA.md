# RVFU — Analisi Completa e Piano di Correzione

> Generato il 21 Apr 2026. Basato su docs ACI (`docs/rentri/docu nuovi/`), codice sorgente, e test API reali.

---

## 1. Flusso Completo VFU secondo Documentazione ACI

```
INSERITO → PRESO_IN_CARICO → (Fascicolo) → DA_RADIARE → INVIATO_A_STA → RADIATO → DEMOLITO
                                                │                              │
                                        RICHIESTA_INTEGRAZIONE          (se rifiutata)
                                                │                    ASSEGNATO_A_STA
                                        (riapri fascicolo)
                                        (rispondi integrazione)
```

### Fasi Principali (da docs ACI):

| # | Fase | Doc ACI | Stato VFU risultante |
|---|------|---------|---------------------|
| 1 | **Verifica veicolo** (ricerca targa/telaio) | UC3002 | — |
| 2 | **Registrazione VFU** (presa in carico) | UC3003/UC3012 | INSERITO → PRESO_IN_CARICO |
| 3 | **Genera Certificato Rottamazione** | UC3005/UC3013 | — (doc nel fascicolo) |
| 4 | **Genera Ricevuta Presa in Carico** | UC3006 | — (doc nel fascicolo, veicoli non PRA) |
| 5 | **Gestione Fascicolo** (aggiungi/allega/elimina/modifica docs) | UC4005-UC4011 | — |
| 6 | **Valida VFU** (verifica) | UC4004 | VALIDATO |
| 7 | **Chiudi Fascicolo** | UC4012 | DA_RADIARE |
| 8 | **Ricerca STA** | UC4014 | — |
| 9 | **Inoltro a STA** | UC4015 | INVIATO_A_STA |
| 10 | **Gestione Richieste Integrazione** | UC_LVI/UC_DVI/UC_RFI/UC_AVI | RICHIESTA_INTEGRAZIONE → riapertura |
| 11 | **Gestione Istanza DU + Radiazione** | UC_ISTANZA/UC6/UC7 | — (gestito da STA/PdS) |
| 12 | **Conferma Radiazione** (WS5006 callback) | UC_WS5006 | RADIATO |
| 13 | **Distruggi Targhe e Documenti** | UC4022/UC9/UC10 | DEMOLITO |
| 14 | **Caricamento Ricevuta Radiazione** nel fascicolo | UC_CAR/UC8 | — (doc nel fascicolo) |

---

## 2. Stato Attuale Implementazione

### 2.1 Pagina Lista (`DemolizioniRVFU.jsx`) ✅ OK
- Tab per stati (Tutti, Presi in Carico, Rottamazione, Radiati, Integrazione)
- Ricerca per targa/telaio
- Paginazione
- Login/logout RVFU
- Click → dettaglio

### 2.2 Pagina Dettaglio (`DemolizioneRVFUDettaglioNew.jsx`) ⚠️ PARZIALE
- **Tab Panoramica** — dati veicolo, intestatario, date, note ✅
- **Tab Fascicolo** — lista documenti, upload, chiudi/riapri fascicolo ✅
- **Tab Azioni** — azioni in base allo stato ⚠️ (vedi problemi sotto)
- **Tab Storico** — timeline eventi dalle date del VFU ✅

### 2.3 Pagina Form (`DemolizioneRVFUForm.jsx`) ⚠️ PARZIALE
- Ricerca veicolo per targa
- Form compilazione dati veicolo + intestatario
- Invio POST /cr/VFU

### 2.4 Client API (`rvfu-client.ts`) ✅ COMPLETO
- Tutti gli endpoint CR implementati (registra, aggiorna, annulla, chiudi, riapri, inoltra STA, ecc.)
- Endpoint PagoPA implementati
- Export/Stampa PDF/XLSX

### 2.5 State Machine (`vfu-state-machine.ts`) ⚠️ PROBLEMI

### 2.6 Workflow Stepper (`VFUWorkflowStepper.jsx`) ❌ SBAGLIATO

---

## 3. PROBLEMI IDENTIFICATI

### 3.1 ❌ Workflow Stepper — Ordine e stati sbagliati

**Attuale (`getWorkflowSteps`):**
```
INSERITO → PRESO_IN_CARICO → VALIDATO → DEMOLITO → INVIATO_STA → RADIATO
```

**Corretto (da documentazione ACI):**
```
INSERITO → PRESO_IN_CARICO → DA_RADIARE → INVIATO_A_STA → RADIATO → DEMOLITO
```

**Problemi:**
- Manca `DA_RADIARE` (stato critico: fascicolo chiuso, pronto per radiazione)
- `VALIDATO` non è uno step principale del workflow ma un sotto-stato
- `DEMOLITO` viene prima di `RADIATO` ma dovrebbe venire dopo
- L'ordine non segue il flusso reale ACI

### 3.2 ❌ Stato `DA_RADIARE` — Manca completamente dalla UI

Lo stato `DA_RADIARE` è definito nella state machine ma:
- **Non appare nel workflow stepper**
- **Nella lista `DemolizioniRVFU.jsx`** non c'è un tab dedicato "Da Radiare"
- È lo stato prodotto da `chiudiFascicolo` (UC4012) — fondamentale nel flusso

### 3.3 ❌ Azione `inoltraSTA` — Campo codice STA non ricerca agenzie

**Attuale:** Un semplice `<input type="text">` per il codice STA.

**Necessario:** 
- Ricerca agenzia STA tramite `rvfuClient.ricercaAgenziaSTA()` 
- L'endpoint `GET /cr/agenziaSTA/{codiceAgenzia}` richiede un path param
- Serve un componente di ricerca/selezione STA con denominazione e provincia
- Manca completamente UC4014 (Ricerca Studio di Consulenza)

### 3.4 ❌ Azione `allegaDocumento` — Non wired nel handleAzioneClick

L'azione `allegaDocumento` è definita nella state machine per INSERITO e PRESO_IN_CARICO ma:
- `handleAzioneClick` non ha un case per `allegaDocumento`
- Dovrebbe aprire il tab Fascicolo o un upload modal diretto

### 3.5 ❌ Classi Tailwind dinamiche nel Stepper e Storico

`VFUWorkflowStepper.jsx` e `VFUStoricoTab.jsx` usano classi dinamiche come:
```jsx
`bg-${color}-600`  // ← PURGED da Tailwind!
`text-${color}-400`
`ring-${color}-500`
```
Queste non funzionano in produzione. Servono classi statiche.

### 3.6 ⚠️ Badge stato nell'header — stesso problema Tailwind

```jsx
<span className={`... bg-${badgeColor}-600/20 text-${badgeColor}-400 ...`}>
```
Anche questo usa classi dinamiche → non funziona in produzione.

### 3.7 ⚠️ Fascicolo — Manca gestione tipi documento ACI

I tipi documento nel `VFUFascicoloTab.jsx` sono generici. Secondo docs ACI (UC_INS_DOC), i tipi specifici del fascicolo demolitore sono:
- Carta di Circolazione
- Certificato di Proprietà
- DU (Documento Unico)
- Copia denuncia smarrimento documenti
- Certificato Rottamazione
- Firma digitale FDR

**Attuale:** DU, CDC, CDP, Foglio C, Doc Identità, Delega, Altro

### 3.8 ⚠️ Manca: Inoltro lista VFU a STA (UC4017)

Il docs ACI menziona `inoltra Lista VFU da Radiare a STA` — possibilità di inviare più VFU contemporaneamente alla STA, non solo uno alla volta. L'API `inoltraSTA` accetta già un array `idVFUList`, ma la UI permette solo invio singolo.

### 3.9 ⚠️ Manca: Stampa lista veicoli da radiare (UC4016)

L'endpoint esiste (`stampaVFU`, `stampaRadiati`, ecc.) ma non c'è un bottone di stampa/export nella lista.

### 3.10 ⚠️ Manca: Export XLSX dalla lista

Gli endpoint `exportVFU`, `exportPresaInCarico`, `exportRadiati`, `exportRottamazione` esistono nel client ma non sono esposti nella UI.

### 3.11 ⚠️ Manca: Gestione Richieste Integrazione (dettaglio)

Quando STA richiede integrazione:
1. VFU appare nel tab "Richieste Integrazione" ✅ (consultaRichiestaIntegrazione)
2. L'utente deve **riaprire il fascicolo** (UC_RFI)
3. **Aggiornare i documenti** richiesti
4. **Rispondere all'integrazione** tramite `integraVFU`

L'azione `integra` è nel tab Azioni ma solo per stato generico. Manca una vista dedicata che mostri *cosa* la STA ha richiesto.

### 3.12 ⚠️ Manca: Sezione Deleghe

La gestione deleghe è un modulo completo (UC2001-UC2015):
- Ricerca concessionari per nuova delega
- Lista deleghe attive
- Dettaglio/modifica/revoca/annulla delega
- Stampa e scarica lista deleghe

Il client ha tutte le API (`consultaDeleghe`, `inserisciDelega`, `dettaglioDelega`, `aggiornaDelega`, `eliminaDelega`, `revocaDelega`, `stampaDeleghe`) ma **non esiste una pagina Deleghe nella UI**.

### 3.13 ⚠️ PagoPA — Client implementato, nessuna UI

Il `rvfu-client.ts` ha l'intera suite PagoPA:
- Gestione tariffario (catalogo, corrispondenze)
- Cassetto pagamenti (inserimento, ricerca, cancellazione)
- Stampa avviso/ricevuta pagamento
- Verifica pagamenti / saldo
- Voucher (adesione, riscatto, verifica, finalizzazione)
- Disaggregazione IUV

**Nessuna pagina UI per PagoPA.** Da verificare se serve per il flusso demolizioni (la radiazione PRA richiede pagamento bolli/diritti).

### 3.14 ⚠️ Form Registrazione — Manca validazione campi obbligatori ACI

Dai test reali, i campi obbligatori per POST /cr/VFU sono:
- `dataRitiro` ✅
- `flagIntestatarioForzato: "S"` ⚠️ (hardcoded?)
- `flagTipoRegime: "1"` ⚠️ (hardcoded?)
- `intestatario.codiceComuneResidenza` (codice ISTAT) ⚠️
- `intestatario.codiceProvinciaResidenza` (codice ISTAT) ⚠️

### 3.15 ⚠️ Dettaglio — Manca tab/sezione "Detentore"

L'API VFU può restituire dati sul detentore (`vfuData.detentore`) quando è diverso dall'intestatario. Non c'è nessuna sezione che lo mostra.

### 3.16 ⚠️ Dettaglio — Manca info Centro di Raccolta e Concessionario

Il VFU può contenere dati del CR e del CN (chi ha conferito). Non sono visualizzati.

---

## 4. PIANO DI CORREZIONE — Priorità

### P0 — Critici (bloccanti per il workflow)

| # | Task | File | Stima |
|---|------|------|-------|
| 1 | **Fix workflow stepper**: ordine corretto INSERITO → PRESO_IN_CARICO → DA_RADIARE → INVIATO_A_STA → RADIATO → DEMOLITO | `vfu-state-machine.ts`, `VFUWorkflowStepper.jsx` | 30min |
| 2 | **Fix classi Tailwind dinamiche** nel stepper, storico, e badge header | `VFUWorkflowStepper.jsx`, `VFUStoricoTab.jsx`, `DemolizioneRVFUDettaglioNew.jsx` | 45min |
| 3 | **Aggiungere tab "Da Radiare"** nella lista principale | `DemolizioniRVFU.jsx` | 15min |
| 4 | **Fix azione `allegaDocumento`** — redirect a tab fascicolo o apri upload | `DemolizioneRVFUDettaglioNew.jsx` | 15min |
| 5 | **Ricerca STA** per azione `inoltraSTA` — componente con autocomplete | `VFUAzioniTab.jsx`, nuovo componente `STASearchField.jsx` | 1.5h |

### P1 — Importanti (completamento funzionale)

| # | Task | File | Stima |
|---|------|------|-------|
| 6 | **Sezione Detentore** nel dettaglio quando presente | `DemolizioneRVFUDettaglioNew.jsx` | 30min |
| 7 | **Sezione CR/Concessionario** nel dettaglio | `DemolizioneRVFUDettaglioNew.jsx` | 30min |
| 8 | **Export XLSX e Stampa PDF** dalla pagina lista | `DemolizioniRVFU.jsx` | 1h |
| 9 | **Inoltro batch VFU a STA** (selezione multipla dalla lista) | `DemolizioniRVFU.jsx` | 1.5h |
| 10 | **Gestione integrazione STA** — vista dettaglio richiesta | `DemolizioneRVFUDettaglioNew.jsx`, `VFUAzioniTab.jsx` | 1h |
| 11 | **Tipi documento fascicolo** allineati a ACI | `VFUFascicoloTab.jsx` | 15min |
| 12 | **Validazione form registrazione** campi obbligatori ACI | `DemolizioneRVFUForm.jsx` | 1h |

### P2 — Moduli aggiuntivi

| # | Task | File | Stima |
|---|------|------|-------|
| 13 | **Pagina Deleghe RVFU** (CRUD completo) | Nuova pagina `DelegheRVFU.jsx` | 3h |
| 14 | **PagoPA — Valutazione necessità** per radiazione PRA | Analisi | 1h |
| 15 | **PagoPA — UI Cassetto Pagamenti** (se necessario) | Nuova pagina | 4h |

### P3 — Nice to have

| # | Task | File | Stima |
|---|------|------|-------|
| 16 | **Stampa lista VFU da radiare** per consegna a STA | `DemolizioniRVFU.jsx` | 30min |
| 17 | **Storico da API** (`storicoVFU` endpoint) anziché ricostruito dalle date | `VFUStoricoTab.jsx` | 1h |
| 18 | **Pulizia file obsoleti** (`DemolizioneRVFUDettaglio.jsx` vecchio, `rvfu-mock.js`, ecc.) | Vari | 30min |

---

## 5. Riepilogo Endpoint API vs Copertura UI

| Endpoint | Client TS | UI | Note |
|----------|-----------|-----|------|
| `POST /cr/VFU` (registra) | ✅ | ✅ Form | |
| `GET /cr/consulta/VFU` | ✅ | ✅ Lista | |
| `GET /cr/VFU/{id}` (dettaglio) | ✅ | ✅ Dettaglio | |
| `PUT /cr/VFU/{id}` (aggiorna) | ✅ | ✅ Azioni | |
| `PUT /cr/annulla/VFU/{id}` | ✅ | ✅ Azioni | |
| `PUT /cr/chiudi/fascicolo/{id}` | ✅ | ✅ Fascicolo + Azioni | |
| `PUT /cr/riapri/fascicolo/{id}` | ✅ | ✅ Fascicolo + Azioni | |
| `PUT /cr/verifica/VFU/{id}/{c}` | ✅ | ✅ Azioni | |
| `PUT /cr/demolisci/VFU/{id}` | ✅ | ✅ Azioni | |
| `PUT /cr/inoltraSTA/VFU/{cod}` | ✅ | ⚠️ Solo singolo, no ricerca STA | |
| `PUT /cr/annullaInoltroSTA/VFU/{id}` | ✅ | ✅ Azioni | |
| `PUT /cr/confermaRadiazioneVFU/VFU/{id}` | ✅ | ✅ Azioni | |
| `PUT /cr/cedi/VFU/{id}` | ✅ | ✅ Azioni | |
| `PUT /cr/trasferisci/VFU/{id}` | ✅ | ✅ Azioni | |
| `PUT /cr/integra/VFU/{id}` | ✅ | ✅ Azioni (basic) | |
| `PUT /cr/prendiInCarico/VFU/{id}` | ✅ | ✅ Azioni | |
| `POST /cr/genera/certificatoRottamazione/{id}` | ✅ | ✅ Azioni | |
| `POST /cr/genera/ricevutaPresaInCarico/{id}` | ✅ | ✅ Azioni | |
| `POST /cr/genera/postillaCdr/{id}` | ✅ | ❌ | Manca nella UI |
| `POST /cr/allega/documentoVFU/{id}` | ✅ | ✅ Fascicolo (upload) | |
| `GET /cr/consulta/documentoVFU/{id}` | ✅ | ✅ Fascicolo (lista) | |
| `GET /cr/documentoVFU` (download) | ✅ | ✅ Fascicolo | |
| `POST /cr/documentoVFU` (elimina) | ✅ | ❌ | Manca bottone elimina doc |
| `PUT /cr/documentoVFU` (sostituisci) | ✅ | ❌ | Manca bottone sostituisci doc |
| `GET /cr/fascicolo/{id}` | ✅ | ❌ | Non usato esplicitamente |
| `PUT /cr/inviaAlTablet/{id}` | ✅ | ❌ | Non necessario? |
| `DELETE /cr/cartellaFirma/{id}` | ✅ | ❌ | Non necessario? |
| `GET /cr/agenziaSTA/{codice}` | ✅ | ❌ | Serve per ricerca STA |
| `POST /cr/filtroDatiDU/VFU/{id}/{f}` | ✅ | ❌ | Filtro dati DU |
| `GET /cr/consultaPresaInCarico/VFU` | ✅ | ✅ Tab lista | |
| `GET /cr/consultaRottamazione/VFU` | ✅ | ✅ Tab lista | |
| `GET /cr/consultaRadiati/VFU` | ✅ | ✅ Tab lista | |
| `GET /cr/consultaRichiestaIntegrazione/VFU` | ✅ | ✅ Tab lista | |
| `GET /cr/storico/VFU` | ✅ | ❌ | Usa date locali |
| `GET /cr/export/VFU` | ✅ | ❌ | |
| `GET /cr/exportPresaInCarico/VFU` | ✅ | ❌ | |
| `GET /cr/exportRadiati/VFU` | ✅ | ❌ | |
| `GET /cr/exportRottamazione/VFU` | ✅ | ❌ | |
| `GET /cr/stampa/VFU` | ✅ | ❌ | |
| `GET /cr/stampaPresaInCarico/VFU` | ✅ | ❌ | |
| `GET /cr/stampaRadiati/VFU` | ✅ | ❌ | |
| `GET /cr/stampaRottamazione/VFU` | ✅ | ❌ | |
| **Deleghe** | ✅ (6 endpoints) | ❌ | Nessuna UI |
| **Utility** (province, comuni, ecc.) | ✅ | ⚠️ Solo in form | |
| **PagoPA** (15 endpoints) | ✅ | ❌ | Nessuna UI |
| `GET /cr/veicolo` (ricerca) | ✅ | ✅ In form | |
| `GET /cr/causali` | ✅ | ✅ In form | |

---

## 6. File Obsoleti da Pulire

| File | Motivo |
|------|--------|
| `src/pages/DemolizioneRVFUDettaglio.jsx` | Vecchia versione, sostituita da `DettaglioNew` |
| `src/lib/rvfu-mock.js` | Mock data, non serve più |
| `src/components/rvfu/RVFUDashboard.jsx` | Verifica se ancora usato |
| `src/components/rvfu/RVFUComponents.jsx` | Verifica se ancora usato |
| `src/components/rvfu/RVFUDetail.jsx` | Vecchio componente dettaglio |
| `src/components/rvfu/RVFUForm.jsx` | Verifica se duplicato di DemolizioneRVFUForm |
| `src/components/rvfu/RVFUNotificationCenter.jsx` | Verifica se usato |
| `src/components/rvfu/RVFUExportImport.jsx` | Verifica se usato |
| `src/components/rvfu/RVFUErrorManager.jsx` | Verifica se usato |

---

## 7. Conclusione

**Copertura attuale: ~60%** del flusso ACI completo.

**Cosa funziona bene:**
- Login/Auth RVFU
- Lista con ricerca e paginazione
- Dettaglio con dati veicolo/intestatario
- Fascicolo (upload, lista documenti, chiudi/riapri)
- La maggior parte delle azioni singole

**Cosa manca o è rotto:**
- Workflow stepper (ordine sbagliato, manca DA_RADIARE)
- Classi Tailwind dinamiche (non funzionano in production)
- Ricerca STA per inoltro
- Deleghe (intero modulo)
- Export/Stampa
- Gestione integrazione dettagliata
- PagoPA (da valutare se necessario)
- Pulizia file obsoleti
