# Rapporto Test Completo RVFU — 16 Aprile 2026 (v3 — con Analisi Flusso Completo)

**Da:** RescueManager (AUTODEM.RESCUEMANAGER)
**Per:** ACI Informatica / DXC Technology (Massimiliano Alocci)
**Data:** 16 Aprile 2026, ore 10:30 CEST
**Ambiente:** Formazione (VPN attiva, hosts: 10.220.222.45 ssoformazione.ilportaledeltrasporto.it)
**Documento di riferimento:** "Casi di test e dettaglio parametri WS ACI (CR)"

---

## 1. Configurazione

| Parametro | Valore |
|-----------|--------|
| client_id | AUTODEM.RESCUEMANAGER |
| client_secret | e3abea315f8d7acffca73941c6a0de2197068d15 |
| username test | DETO003001 |
| password test | TEST.030 |
| hosts | 10.220.222.45 ssoformazione.ilportaledeltrasporto.it |
| VPN | anyvpn.ilportaledellautomobilista.it/rep-applicativi |

---

## 2. Autenticazione OAuth2 — ✅ FUNZIONANTE

| Step | Endpoint | Risultato |
|------|----------|-----------|
| 1. Authenticate | POST /sso/json/.../authenticate | ✅ tokenId (114 chars) |
| 2. Authorize | POST /sso/oauth2/.../authorize | ✅ code (55 chars) — Cookie: pdtsso-form |
| 3. Access Token | POST /sso/oauth2/.../access_token | ✅ id_token (1410 chars) |

---

## 3. Endpoint GET — Mappa Completa

### 3.1 ✅ Endpoint Funzionanti (16 su 19 testati)

| # | Endpoint | Esito | Note |
|---|----------|-------|------|
| 1 | GET /cr/causali | ✅ OK (E000) | 4 causali: D, P, V, R |
| 2 | GET /cr/veicolo?causale=V&targa=... | ✅ OK (E000) | 4/4 targhe test funzionano |
| 3 | GET /cr/consulta/VFU | ✅ OK (E000) | Lista pratiche con paginazione |
| 4 | GET /cr/consultaPresaInCarico/VFU | ✅ OK (E000) | ✨ **Path corretto scoperto** |
| 5 | GET /cr/consultaRottamazione/VFU | ✅ OK (E000) | ✨ **Path corretto scoperto** |
| 6 | GET /cr/consultaRadiati/VFU | ✅ OK (E000) | ✨ **Path corretto scoperto** |
| 7 | GET /cr/consultaRichiestaIntegrazione/VFU | ✅ OK (E000) | ✨ **Path corretto scoperto** |
| 8 | GET /cr/consulta/delega | ✅ OK (E000) | Lista deleghe |
| 9 | GET /cr/VFU/{idVFU} | ✅ OK (E000) | Dettaglio singolo VFU |
| 10 | GET /cr/fascicolo/{idFascicolo} | ✅ OK (E000) | Dettaglio fascicolo |
| 11 | GET /cr/consulta/documentoVFU/{idVFU} | ✅ OK (E000) | Lista documenti fascicolo |
| 12 | GET /cr/export/VFU | ✅ OK (E000) | Export XLSX |
| 13 | GET /cr/stampa/VFU | ✅ OK (E000) | Stampa PDF |
| 14 | GET /cr/stampa/delega | ✅ OK (E000) | Stampa PDF deleghe |
| 15 | GET /cr/agenziaSTA/{codice} | ✅ OK (E005) | Funziona, AG2096 non trovata in formazione |
| 16 | GET /cr/storico/VFU | ⚠️ KO (P001) | Errore paginazione |

**CORREZIONE IMPORTANTE:** I 404 del rapporto precedente su consultaPresaInCarico, consultaRottamazione, ecc. erano dovuti a **path errati nella nostra documentazione**:
- ❌ `/cr/consulta/PresaInCarico` → ✅ `/cr/consultaPresaInCarico/VFU`
- ❌ `/cr/consulta/Rottamazione` → ✅ `/cr/consultaRottamazione/VFU`
- ❌ `/cr/consulta/Radiati` → ✅ `/cr/consultaRadiati/VFU`
- ❌ `/cr/consulta/RichiestaIntegrazione` → ✅ `/cr/consultaRichiestaIntegrazione/VFU`

### 3.2 ❌ Endpoint Non Trovati (3)

| # | Endpoint | Note |
|---|----------|------|
| 17 | /cr/impresa/centroRaccolta | 404 — Non disponibile su gateway |
| 18 | /cr/impresa/concessionario | 404 — Non disponibile su gateway |
| 19 | /cr/causalePerCodice/{codice} | 404 — Non disponibile su gateway |

---

## 4. Ricerca Veicolo

### 4.1 Targhe test VA* — Solo causale V funziona

| Targa | causale=V | causale=D | obbligoPRA | radiabile |
|-------|-----------|-----------|------------|-----------|
| VA189AJ | ✅ OK | ❌ 1026 | N | SI |
| VA227AJ | ✅ OK | ❌ 1026 | N | SI |
| VA229AJ | ✅ OK | ❌ 1026 | N | SI |
| VA231AJ | ✅ OK | ❌ 1026 | N | SI |

### 4.2 Targa test doc ACI (AG004557)

| Targa | causale=D | tipoVeicolo | obbligoPRA |
|-------|-----------|-------------|------------|
| AG004557 | ✅ (registrazione riuscita) | T | N |

---

## 5. ✅ Processo Demolizione — Test con dati dal doc ACI

### 5.1 Registrazione VFU — ✅ FUNZIONA

**POST /cr/VFU** con payload dal documento "Casi di test WS ACI (CR)":

```json
{
  "dataRitiro": "2005-08-28T00:00:00Z",
  "fabbrica": "METALMEC ME 35C ",
  "flagConsegnaForzeOrdine": "N",
  "flagIntestatarioForzato": "S",
  "flagTipoRegime": "1",
  "forzaRegistrazione": "N",
  "intestatario": {
    "capResidenza": "00100",
    "codiceComuneResidenza": "091",
    "codiceFiscale": "MROBNI82B11H501L",
    "codiceProvinciaResidenza": "058",
    "cognome": "Bianchi",
    "dataNascita": "1982-02-11T00:00:00Z",
    "indirizzoResidenza": "Via Flaminia, 4",
    "nome": "Mario"
  },
  "obbligoIscrizionePRA": "N",
  "targa": "AG004557", "telaio": "0037",
  "tipoVeicolo": "T", "causale": "D"
}
```

**Risultato:** ✅ `idVFU: 116001` — Stato auto-avanzato a `PRESO_IN_CARICO`

**Campi chiave nella risposta:**
- `dataConferimento: "2026-04-16T10:14:03"` (auto-impostato)
- `dataPresaInCarico: null` (non impostato dal backend)
- `statoFascicoloEnum: "INSERITO"` (fascicolo creato vuoto)

### 5.2 Annullamento VFU — ✅ FUNZIONA

**PUT /cr/annulla/VFU/116001** con `{"motivoEliminazione": "test"}`

**Risultato:** ✅ Stato → `ANNULLATO`

### 5.3 Aggiornamento VFU (note) — ✅ FUNZIONA

**PUT /cr/VFU/116002** con `{"noteAggiuntive": "test aggiornamento"}`

**Risultato:** ✅ Note aggiornate

### 5.4 Registrazione targhe VA* — ❌ NON FUNZIONA

| Targa | Causale | Errore |
|-------|---------|--------|
| VA189AJ | V | ❌ F001 "FORMATO ERRATO: targaValidByCausale" |
| VA189AJ | D | ❌ 1026 "SI È VERIFICATO UN ERRORE..." |

---

## 6. 🔴 Blocco: Operazioni Post-Registrazione

Dopo la registrazione, il VFU è in stato `PRESO_IN_CARICO` ma le operazioni successive sono bloccate:

| Operazione | Endpoint | Errore | Note |
|-----------|----------|--------|------|
| Aggiorna date | PUT /cr/VFU/{id} | F001 "DATA PRESA IN CARICO NON ANCORA DISPONIBILE" | `dataPresaInCarico` è null |
| Prendi in carico | PUT /cr/prendiInCarico/VFU/{id} | 1001 "ERRORE CAMBIAMENTO STATO VFU" | Già in PRESO_IN_CARICO |
| Demolisci | PUT /cr/demolisci/VFU/{id} | 1001 "ERRORE CAMBIAMENTO STATO VFU" | Transizione non permessa |
| Chiudi fascicolo | PUT /cr/chiudi/fascicolo/{id} | 1010 "DOCUMENTI MINIMI NON PRESENTI" | Servono CDR + Ricevuta |
| Genera CDR | POST /cr/genera/certificatoRottamazione/{id} | 1026 "SI È VERIFICATO UN ERRORE" | Backend crash |
| Genera Ricevuta | POST /cr/genera/ricevutaPresaInCarico/{id} | 1026 "SI È VERIFICATO UN ERRORE" | Backend crash |

**Situazione:** Il VFU è in uno stato dove non è possibile avanzare nel flusso. `dataPresaInCarico` non viene popolata dal backend dopo la registrazione CR (campo null), il che impedisce l'aggiornamento delle date (dataBonifica). La generazione CDR e ricevuta fallisce con errore generico 1026.

---

## 7. Domande per ACI

### 🔴 Blocco Critico

1. **Flusso post-registrazione CR:** Dopo POST /cr/VFU che auto-avanza a PRESO_IN_CARICO, quale sequenza di operazioni serve per arrivare alla demolizione? La `dataPresaInCarico` resta null e non consente operazioni successive.

2. **Genera CDR/Ricevuta — errore 1026:** POST /cr/genera/certificatoRottamazione/{id} e ricevutaPresaInCarico/{id} restituiscono sempre 1026. Questi endpoint sono attivi in ambiente formazione?

### 🟡 Chiarimenti

3. **Targhe VA* non registrabili:** Le targhe test VA189AJ–VA231AJ NON possono essere registrate come VFU (errore "targaValidByCausale" con V, errore 1026 con D). Sono targhe pensate solo per la ricerca veicolo?

4. **Errore 1026:** Il messaggio generico "SI È VERIFICATO UN ERRORE" non consente diagnostica. È possibile avere log lato server per i nostri test?

5. **Endpoint 404:** `/cr/impresa/centroRaccolta`, `/cr/impresa/concessionario`, `/cr/causalePerCodice/{codice}` — Sono disponibili su gateway `/rvfu/sh`?

---

## 8. Riepilogo Finale

| Area | Stato | Dettaglio |
|------|-------|-----------|
| Autenticazione OAuth2 | ✅ 100% | pdtsso-form + Bearer id_token |
| Endpoint GET consultazione | ✅ 16/19 | 3 endpoint 404 |
| Ricerca veicolo (causale V) | ✅ 4/4 targhe | Targhe VA* funzionano solo con V |
| Registrazione VFU | ✅ | Con dati doc ACI (AG004557) |
| Annullamento VFU | ✅ | Funziona correttamente |
| Aggiornamento VFU (note) | ✅ | Solo campi non-date |
| **Aggiornamento date** | **❌** | **dataPresaInCarico null blocca tutto** |
| **Genera CDR/Ricevuta** | **❌** | **1026 errore backend** |
| **Demolizione** | **❌** | **Bloccata: stato non avanzabile** |
| **Chiudi fascicolo** | **❌** | **Documenti minimi mancanti** |

**Il nostro client funziona correttamente.** Il flusso di autenticazione, la ricerca veicolo, la registrazione e l'annullamento VFU sono tutti operativi. Il blocco è sulle operazioni post-registrazione (generazione documenti, aggiornamento date, cambio stato) che richiedono chiarimenti da ACI sul flusso corretto o correzioni lato server.

---

## 9. 🆕 Analisi Flusso Completo (da documentazione ACI "chiamate_risposte_vfu.md")

### 9.1 Flusso Happy Path — VFU Non-PRA (Regime 1)

Dalla documentazione ACI con esempi reali, il flusso completo per un veicolo non-PRA (es. tipoVeicolo T, flagTipoRegime 1) è:

| Step | Endpoint | Body | Stato risultante |
|------|----------|------|------------------|
| 1 | `POST /cr/VFU` | Dati registrazione | PRESO IN CARICO |
| 2 | `POST /cr/genera/ricevutaPresaInCarico/{idVFU}` | `{}` (vuoto) | — (genera doc) |
| 3 | `POST /cr/genera/certificatoRottamazione/{idVFU}` | Dati veicolo da `/cr/veicolo` | — (genera doc) |
| 4 | `POST /cr/allega/documentoVFU/{idVFU}` | file base64 + tipoDocumento | — (allega doc) |
| 5 | `PUT /cr/chiudi/fascicolo/{idVFU}` | `{}` (vuoto) | Fascicolo "Chiuso" |
| 6 | `PUT /cr/verifica/VFU/{idVFU}/{causale}` | `{}` (vuoto) | VALIDATO |
| 7 | `PUT /cr/demolisci/VFU/{idVFU}` | dataDistruzioneTarga, numeroTargheDistrutte, dataDistruzioneDocumenti | **DEMOLITO** |

**Per veicoli PRA (Regime 2), dopo il step 7:**

| Step | Endpoint | Body | Stato risultante |
|------|----------|------|------------------|
| 8 | `PUT /cr/inoltraSTA/VFU/{codiceSTA}` | `[idVFU]` (array) | INVIATO A STA |
| 9 | `PUT /cr/confermaRadiazioneVFU/VFU/{idVFU}` | `{}` (vuoto) | **RADIATO** |

### 9.2 Flusso con Concessionario (delega)

Quando un concessionario registra il VFU (tramite delega), serve uno step aggiuntivo:

| Step | Endpoint | Stato risultante |
|------|----------|------------------|
| 1 | `POST /cr/VFU` (da concessionario) | CONFERITO da {CF_concessionario} |
| 1b | `PUT /cr/prendiInCarico/VFU/{idVFU}` (da CR) | PRESO IN CARICO |
| 2+ | Come sopra... | ... |

### 9.3 🔴 Scoperta Critica: `dataPresaInCarico` — Confronto tra utenze

Confrontando i dati nella documentazione ACI con i nostri test:

| VFU | Targa | Utenza | dataPresaInCarico | Funziona? |
|-----|-------|--------|-------------------|-----------|
| 39002 (doc ACI) | AG004557 | **DETO000101** | `"2024-01-31T11:03:26"` | ✅ Popolata |
| 37001 (doc ACI) | AG004564 | **DETO000101** | `"2024-01-29T10:54:31"` | ✅ Popolata → DEMOLITO |
| 116002 (nostro) | AG004557 | **DETO003001** | `null` | ❌ NULL |

**Stessa targa (AG004557), stesso endpoint, stesso tipo di registrazione diretta CR → ma `dataPresaInCarico` è NULL solo per il nostro account DETO003001.**

Questo suggerisce fortemente un **problema di configurazione dell'utenza DETO003001** lato ACI, non un problema di payload o flusso.

### 9.4 Endpoint Scoperti dalla Documentazione (non ancora testati)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/cr/verifica/VFU/{idVFU}/{causale}` | PUT | Verifica VFU → stato VALIDATO |
| `/cr/inoltraSTA/VFU/{codiceSTA}` | PUT | Inoltro a STA (body: array di idVFU) |
| `/cr/confermaRadiazioneVFU/VFU/{idVFU}` | PUT | Conferma radiazione → RADIATO |
| `/cr/trasferisci/VFU/{idVFU}` | PUT | Trasferimento a altro CR |
| `/cr/riassegnazioneVFUaSTA/VFU/{idVFU}` | PUT | Riassegnazione a STA |
| `/cr/inviaAlTablet/{idFascicolo}` | PUT | Invio documenti al tablet per firma |
| `/cr/riapri/fascicolo/{idVFU}` | PUT | Riapertura fascicolo chiuso |
| `/cr/cartellaFirma/{idCartella}` | DELETE | Annulla cartella firma bloccata |
| `/cr/delega` | POST | Crea delega |
| `/cr/delega/{idDelega}` | DELETE | Annulla delega |
| `/cr/revoca/delega/{idDelega}` | PUT | Revoca delega |
| `/cr/consulta/centroRaccolta` | GET | Lista CR (path vecchio, su gateway potrebbe essere diverso) |
| `/cr/consulta/concessionario` | GET | Dettaglio concessionario delegato |

### 9.5 Dettaglio Payload `certificatoRottamazione` (da doc ACI)

Il body di `POST /cr/genera/certificatoRottamazione/{idVFU}` richiede i dati completi del veicolo ottenuti dalla chiamata `/cr/veicolo`:

```json
{
  "causale": null,
  "cic": null,
  "dataImmatricolazione": "1997-03-26T00:00:00",
  "dataRegistrazione": "2024-02-06T16:36:37",
  "destinazioneVeicolo": null,
  "enteConferimento": "ENTERPRISE SERVICES ITALIA S.R.L.",
  "enteRitiro": "ENTERPRISE SERVICES ITALIA S.R.L.",
  "modello": "VENEZIA VE 50 P",
  "obbligoIscrizionePRA": "N",
  "ostativiEForzature": null,
  "radiabile": "SI",
  "regimeVeicolo": "1",
  "soggettoVeicolo": { "...dati intestatario completi..." },
  "statoVFU": "PRESO IN CARICO",
  "targa": "AG004563",
  "telaio": "0049",
  "tipoUtilizzoVeicolo": null,
  "tipoVeicolo": "T",
  "vincoloOstativo": "NO"
}
```

### 9.6 Tipi Documento per Fascicolo

| Codice | Tipo Documento |
|--------|---------------|
| I | Documento di identità intestatario |
| D | Denuncia |
| P | Certificato di proprietà |
| Z | Carta di Circolazione |
| F | Foglio complementare |
| V | Verbale di consegna |
| U | Documento Unico |
| M | Documento di identità detentore |
| L | Altro |

---

## 10. Domande Aggiornate per ACI

### 🔴 Blocco Critico

1. **`dataPresaInCarico` NULL per DETO003001:** La stessa targa AG004557 registrata con DETO000101 (doc ACI) ha `dataPresaInCarico` popolata, mentre con DETO003001 (nostro account) risulta NULL. C'è un problema di configurazione sulla nostra utenza? Il profilo DETO003001 è correttamente configurato come Centro di Raccolta?

2. **Genera CDR/Ricevuta — errore 1026:** POST `/cr/genera/certificatoRottamazione/{id}` e `/cr/genera/ricevutaPresaInCarico/{id}` restituiscono sempre 1026. Questo potrebbe essere conseguenza della `dataPresaInCarico` NULL? Oppure è un problema indipendente?

3. **Step `verifica/VFU` mancante:** Nel nostro flusso non abbiamo mai chiamato `PUT /cr/verifica/VFU/{idVFU}/{causale}`. È necessario prima della demolizione? Dalla documentazione sembra che porti lo stato a VALIDATO.

### 🟡 Chiarimenti

4. **Sequenza obbligatoria documenti minimi:** Per chiudere il fascicolo servono: Ricevuta Presa in Carico + Certificato di Rottamazione? Oppure servono anche documenti allegati (identità, CdP, ecc.)?

5. **Targhe VA* non registrabili:** Le targhe test VA189AJ–VA231AJ NON possono essere registrate come VFU. Sono pensate solo per la ricerca veicolo? Per i test completi del flusso demolizione quale serie di targhe dobbiamo usare?

6. **Endpoint 404:** `/cr/impresa/centroRaccolta`, `/cr/impresa/concessionario`, `/cr/causalePerCodice/{codice}` — Sono disponibili su gateway `/rvfu/sh`? Nel doc ACI usano il vecchio path `/demolitori-aci-ws/rest/`.

---

## 11. Riepilogo Finale Aggiornato

| Area | Stato | Dettaglio |
|------|-------|-----------|
| Autenticazione OAuth2 | ✅ 100% | pdtsso-form + Bearer id_token |
| Endpoint GET consultazione | ✅ 16/19 | 3 endpoint 404 |
| Ricerca veicolo (causale V) | ✅ 4/4 targhe | Targhe VA* funzionano solo con V |
| Registrazione VFU | ✅ | Con dati doc ACI (AG004557) |
| Annullamento VFU | ✅ | Funziona correttamente |
| Aggiornamento VFU (note) | ✅ | Solo campi non-date |
| **dataPresaInCarico** | **❌ NULL** | **Popolata per DETO000101 (doc ACI), NULL per DETO003001 (noi)** |
| **Genera CDR/Ricevuta** | **❌ 1026** | **Errore backend — possibile conseguenza dataPresaInCarico NULL** |
| **Demolizione** | **❌ Bloccata** | **Mancano step intermedi (genera docs → chiudi fascicolo → verifica)** |
| **Chiudi fascicolo** | **❌ 1010** | **Documenti minimi mancanti (CDR + Ricevuta non generabili)** |
| Analisi flusso completo | ✅ | 7 step per non-PRA, 9 step per PRA — sequenza estratta da doc ACI |

### Ipotesi principale: la causa root è la configurazione dell'utenza DETO003001

Il nostro account non popola correttamente `dataPresaInCarico` alla registrazione, il che a cascata blocca la generazione dei documenti (1026) e tutti gli step successivi. Chiediamo ad ACI di verificare la configurazione del profilo DETO003001 confrontandola con DETO000101.

---

*Report generato — RescueManager Test Suite*
*Ambiente: formazione | VPN: attiva | Data: 16/04/2026*
*Versione: v3 — include analisi flusso completo da documentazione ACI*
