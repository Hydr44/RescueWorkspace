# Dettaglio Chiamate Registrazione VFU — Risposta per Massimiliano Alocci

**Da:** RescueManager — Rescue Manager S.R.L.
**Per:** Massimiliano Alocci — DXC Technology
**Data:** 16 Aprile 2026
**Oggetto:** Dettaglio chiamate registrazione veicolo — problema `dataPresaInCarico` NULL
**Client:** AUTODEM.RESCUEMANAGER
**Utenza:** DETO003001

---

Gentile Massimiliano,

di seguito il dettaglio completo delle chiamate che eseguiamo per registrare il veicolo, con request e response esatte.

---

## Step 1 — Ricerca Veicolo

```http
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=D&targa=AG004557&tipoVeicolo=T
Authorization: Bearer {id_token}
```

**Response 200:**
```json
{
  "result": {
    "tipoVeicolo": "T",
    "targa": "AG004557",
    "telaio": "0037",
    "fabbrica": "METALMEC ME 35C ",
    "obbligoIscrizionePRA": "N",
    "radiabile": "SI"
  },
  "esito": {
    "responseStatus": "OK",
    "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
    "code": "E000"
  }
}
```

---

## Step 2 — Registrazione VFU

Il payload che inviamo è **identico** a quello presente nella vostra documentazione "Casi di test e dettaglio parametri WS ACI (CR)":

```http
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/VFU
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "dataRitiro": "2005-08-28T00:00:00Z",
  "destinazioneVeicolo": null,
  "detentore": null,
  "documentoDelega": null,
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
  "noteAggiuntive": "note registrazione",
  "obbligoIscrizionePRA": "N",
  "ostativiEForzature": null,
  "targa": "AG004557",
  "telaio": "0037",
  "tipoUtilizzoVeicolo": null,
  "tipoVeicolo": "T",
  "causale": "D"
}
```

**Response 200 (nostra — utenza DETO003001):**
```json
{
  "result": {
    "idVFU": 116002,
    "tipoVeicolo": "T",
    "targa": "AG004557",
    "telaio": "0037",
    "destinazioneVeicolo": null,
    "tipoUtilizzoVeicolo": null,
    "fabbrica": "METALMEC ME 35C",
    "obbligoIscrizionePRA": "N",
    "dataRitiro": "2005-08-28T00:00:00",
    "dataRegistrazione": "2026-04-16T10:14:42",
    "codiceFiscaleRitiro": "02166430856",
    "matricolaRegistrazione": "DETO003001",
    "dataConferimento": "2026-04-16T10:14:42",
    "codiceFiscaleConferimento": "02166430856",
    "matricolaConferimento": "DETO003001",
    "dataPresaInCarico": null,                          ← ⚠️ NULL
    "flagArchivioProvenienza": null,
    "flagConsegnaForzeOrdine": "N",
    "codiceFiscaleTrasferimento": null,
    "dataDemolizione": null,
    "dataDistruzioneTarga": null,
    "numeroTargheDistrutte": null,
    "dataDistruzioneDocumenti": null,
    "flagTipoRegime": "1",
    "codiceAgenziaSTA": null,
    "dataCancellazioneArchivi": null,
    "dataUltimoAggiornamento": "2026-04-16T10:14:42",
    "noteAggiuntive": "note registrazione",
    "matricolaAggiornamento": null,
    "motivoEliminazione": null,
    "motivoTrasferimento": null,
    "dataNotificaInoltroSTA": null,
    "statoVFU": "PRESO IN CARICO",
    "dataStatoVFU": "2026-04-16T10:14:42",
    "intestatario": {
      "idSoggetto": 115002,
      "idVFU": 116002,
      "tipoSoggetto": "Intestatario inserito manualmente",
      "nome": "MARIO",
      "cognome": "BIANCHI",
      "codiceFiscale": "MROBNI82B11H501L",
      "dataNascita": "1982-02-11T00:00:00",
      "provinciaResidenza": { "codice": "058", "denominazione": "ROMA", "sigla": "RM" },
      "comuneResidenza": { "codice": "091", "denominazione": "ROMA" },
      "indirizzoResidenza": "VIA FLAMINIA, 4",
      "capResidenza": "00100"
    },
    "detentore": null,
    "idCertificato": null,
    "idRicevuta": null,
    "codiceCertificato": null,
    "codiceRicevuta": null,
    "dataEmissioneCertificato": null,
    "dataEmissioneRicevuta": null,
    "dataChiusuraFascicolo": null,
    "idFascicolo": 116002,
    "statoFascicolo": "INSERITO"
  },
  "esito": {
    "responseStatus": "OK",
    "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
    "code": "E000"
  }
}
```

---

## Confronto con la risposta nella vostra documentazione (utenza DETO000101)

La **stessa identica chiamata** (stessa targa AG004557, stesso payload), eseguita nella vostra documentazione con utenza **DETO000101**, restituisce:

```json
{
  "result": {
    "idVFU": 39002,
    "targa": "AG004557",
    "telaio": "0037",
    "matricolaRegistrazione": "DETO000101",
    "dataConferimento": "2024-01-31T11:03:26",
    "dataPresaInCarico": "2024-01-31T11:03:26",        ← ✅ VALORIZZATA
    "statoVFU": "PRESO IN CARICO",
    "idFascicolo": null,
    "statoFascicolo": null
  }
}
```

## Tabella comparativa campo per campo

| Campo | DETO000101 (doc ACI, VFU #39002) | DETO003001 (nostro, VFU #116002) |
|-------|----------------------------------|----------------------------------|
| targa | AG004557 | AG004557 |
| telaio | 0037 | 0037 |
| tipoVeicolo | T | T |
| causale | D | D |
| fabbrica | METALMEC ME 35C | METALMEC ME 35C |
| flagTipoRegime | 1 | 1 |
| flagIntestatarioForzato | S | S |
| obbligoIscrizionePRA | N | N |
| intestatario.codiceFiscale | MROBNI82B11H501L | MROBNI82B11H501L |
| statoVFU | PRESO IN CARICO | PRESO IN CARICO |
| dataConferimento | 2024-01-31T11:03:26 ✅ | 2026-04-16T10:14:42 ✅ |
| **dataPresaInCarico** | **2024-01-31T11:03:26** ✅ | **null** ❌ |

**Il payload è identico. La differenza è solo l'utenza.**

---

## Conseguenza: le operazioni successive falliscono

Poiché `dataPresaInCarico` è `null`, tutte le operazioni successive restituiscono errore:

### POST /cr/genera/ricevutaPresaInCarico/116002

```http
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/ricevutaPresaInCarico/116002
Authorization: Bearer {id_token}
Content-Type: application/json

Body: {}
```

```json
{
  "esito": {
    "responseStatus": "KO",
    "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
    "code": "1026"
  }
}
```

### POST /cr/genera/certificatoRottamazione/116002

```http
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/certificatoRottamazione/116002
Authorization: Bearer {id_token}
Content-Type: application/json

Body: {}
```

```json
{
  "esito": {
    "responseStatus": "KO",
    "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
    "code": "1026"
  }
}
```

### PUT /cr/chiudi/fascicolo/116002

```http
PUT https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/chiudi/fascicolo/116002
Authorization: Bearer {id_token}
Content-Type: application/json

Body: {}
```

```json
{
  "esito": {
    "responseStatus": "KO",
    "message": "DOCUMENTI MINIMI NON PRESENTI\nLista documenti minimi:\nCertificato di rottamazione\nRicevuta presa in carico",
    "code": "1010"
  }
}
```

---

## VFU registrati (tutti con dataPresaInCarico NULL)

| idVFU | Targa | Stato | dataPresaInCarico |
|-------|-------|-------|-------------------|
| 116001 | AG004557 | ANNULLATO | null |
| 116002 | AG004557 | VALIDATO | null |
| 116003 | AG004558 | PRESO IN CARICO | null |
| 116004 | AG004558 | PRESO IN CARICO | null |
| 116005 | AG004559 | PRESO IN CARICO | null |
| 116006 | AG004559 | VALIDATO | null |

---

---

## Test Aggiuntivi — Targhe VA* (ore 18:11–18:18 CEST, 16/04/2026)

Abbiamo replicato il test anche sulle 4 targhe VA* che ci avete fornito. Il login è stato eseguito **identicamente all'app** seguendo il flusso OIDC del nostro codice (`rvfu-auth.ts`):

### Login eseguito (identico all'app)

```
Step 1: POST /sso/json/realms/root/realms/pdtusers/authenticate
  Headers: X-OpenAM-Username: DETO003001, X-OpenAM-Password: TEST.030
           Accept-API-Version: resource=2.0, protocol=1.0
  → 200 OK, tokenId ricevuto, cookie pdtsso-form impostato

Step 2: POST /sso/oauth2/realms/root/realms/pdtusers/authorize
  Headers: Cookie: pdtsso-form={tokenId}
  Body: scope=openid+profile&response_type=code&client_id=AUTODEM.RESCUEMANAGER
        &csrf={tokenId}&redirect_uri=https://localhost/&state=rvfu_auth
        &nonce=n1713285109000&decision=allow
  → 302, Location: https://localhost/?code={code}

Step 3: POST /sso/oauth2/realms/root/realms/pdtusers/access_token
  Body: grant_type=authorization_code&code={code}&redirect_uri=https://localhost/
        &client_id=AUTODEM.RESCUEMANAGER&client_secret=e3abea315f8d7acffca73941c6a0de2197068d15
  → 200 OK, id_token (1426 chars), access_token (55 chars)
```

### Ricerca veicolo — tutte le targhe VA* funzionano

| Targa | causale=D | causale=V | causale=P | tipoVeicolo | regime | PRA |
|-------|-----------|-----------|-----------|-------------|--------|-----|
| VA189AJ | ✅ E000 | ✅ E000 | ✅ E000 | A | 2 | S |
| VA227AJ | ✅ E000 | ✅ E000 | — | A | 2 | S |
| VA229AJ | ✅ E000 | ✅ E000 | — | A | 2 | S |
| VA231AJ | ✅ E000 | ✅ E000 | — | A | 2 | S |

### Registrazione — tutte funzionano (con forzaRegistrazione="S")

Le targhe VA* richiedono `forzaRegistrazione: "S"` per la registrazione (con `"N"` → errore 1026).

**Esempio request per VA189AJ:**

```http
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/VFU
Authorization: Bearer {id_token}
Content-Type: application/json
```

```json
{
  "dataRitiro": "2026-04-16T00:00:00Z",
  "destinazioneVeicolo": "A",
  "fabbrica": "FIAT FIAT 500L",
  "flagConsegnaForzeOrdine": "N",
  "flagIntestatarioForzato": "S",
  "flagTipoRegime": "2",
  "forzaRegistrazione": "S",
  "intestatario": {
    "capResidenza": "00100",
    "codiceComuneResidenza": "091",
    "codiceFiscale": "NTSPRM71L20H501B",
    "codiceProvinciaResidenza": "058",
    "cognome": "NESTI",
    "dataNascita": "1971-07-20T00:00:00Z",
    "indirizzoResidenza": "Via Test 1",
    "nome": "PRIMO"
  },
  "obbligoIscrizionePRA": "S",
  "targa": "VA189AJ",
  "telaio": "ZFA19900005068338",
  "tipoUtilizzoVeicolo": "0",
  "tipoVeicolo": "A",
  "causale": "D"
}
```

**Risultati registrazione:**

| Targa | idVFU | Stato | dataPresaInCarico |
|-------|-------|-------|-------------------|
| VA189AJ | 116007 | PRESO IN CARICO | **null** ❌ |
| VA227AJ | 116008 | PRESO IN CARICO | **null** ❌ |
| VA229AJ | 116009 | PRESO IN CARICO | **null** ❌ |
| VA231AJ | 116010 | PRESO IN CARICO | **null** ❌ |

**`dataPresaInCarico` è NULL su tutte e 4 le targhe VA*, esattamente come per le targhe AG*.**

### Dettaglio risposta registrazione VA189AJ (#116007)

```json
{
  "idVFU": 116007,
  "targa": "VA189AJ",
  "telaio": "ZFA19900005068338",
  "tipoVeicolo": "A",
  "statoVFU": "PRESO IN CARICO",
  "dataConferimento": "2026-04-16T18:15:32",
  "dataPresaInCarico": null,                    ← ⚠️ NULL
  "dataBonifica": null,
  "dataDemolizione": null,
  "flagTipoRegime": "2",
  "obbligoIscrizionePRA": "S",
  "idFascicolo": 116007,
  "statoFascicolo": "Inserito",
  "matricolaRegistrazione": "DETO003001"
}
```

### Operazioni post-registrazione — tutte bloccate

Testato su VFU #116007 (VA189AJ), #116008, #116009, #116010:

| Operazione | Endpoint | 116007 | 116008 | 116009 | 116010 |
|-----------|----------|--------|--------|--------|--------|
| Genera ricevuta | POST /cr/genera/ricevutaPresaInCarico/{id} | **A001** | **A001** | **A001** | **A001** |
| Genera CDR | POST /cr/genera/certificatoRottamazione/{id} | **1026** | **1026** | **1026** | **1026** |
| Verifica VFU | PUT /cr/verifica/VFU/{id}/D | ✅ **E000** | — | — | — |
| Consulta documenti | GET /cr/consulta/documentoVFU/{id} | ✅ E000 (0 doc) | — | — | — |
| Chiudi fascicolo | PUT /cr/chiudi/fascicolo/{id} | **1010** | — | — | — |
| Demolisci | PUT /cr/demolisci/VFU/{id} | **1001** | — | — | — |

**Nota:** Per le targhe VA* (regime 2, PRA), `genera ricevutaPresaInCarico` restituisce **A001 OPERAZIONE NON CONSENTITA** anziché il 1026 delle targhe AG* (regime 1, non-PRA). L'errore è diverso ma il risultato è lo stesso: impossibile generare i documenti.

---

## Riepilogo Completo — Tutti i VFU registrati

| idVFU | Targa | Tipo | Regime | PRA | Stato | dataPresaInCarico | Genera Ricevuta | Genera CDR |
|-------|-------|------|--------|-----|-------|-------------------|-----------------|------------|
| 116001 | AG004557 | T | 1 | N | ANNULLATO | null | — | — |
| 116002 | AG004557 | T | 1 | N | VALIDATO | **null** | ❌ 1026 | ❌ 1026 |
| 116003 | AG004558 | T | 1 | N | PRESO IN CARICO | **null** | ❌ 1026 | ❌ 1026 |
| 116004 | AG004558 | T | 1 | N | PRESO IN CARICO | **null** | ❌ 1026 | ❌ 1026 |
| 116005 | AG004559 | T | 1 | N | PRESO IN CARICO | **null** | ❌ 1026 | ❌ 1026 |
| 116006 | AG004559 | T | 1 | N | VALIDATO | **null** | ❌ 1026 | ❌ 1026 |
| 116007 | VA189AJ | A | 2 | S | VALIDATO | **null** | ❌ A001 | ❌ 1026 |
| 116008 | VA227AJ | A | 2 | S | PRESO IN CARICO | **null** | ❌ A001 | ❌ 1026 |
| 116009 | VA229AJ | A | 2 | S | PRESO IN CARICO | **null** | ❌ A001 | ❌ 1026 |
| 116010 | VA231AJ | A | 2 | S | PRESO IN CARICO | **null** | ❌ A001 | ❌ 1026 |

**10 VFU registrati con 2 serie di targhe diverse (AG* e VA*), 2 tipi veicolo diversi (T e A), 2 regimi diversi (1 e 2). Tutti hanno `dataPresaInCarico: null`. Nessuno può generare documenti.**

---

## Domanda

Il payload di registrazione che inviamo è corretto? Oppure manca qualche campo o configurazione sull'utenza DETO003001 che impedisce la valorizzazione di `dataPresaInCarico`?

Come visibile dalla tabella sopra, il problema si presenta su **tutti i tipi di veicolo e tutti i regimi**. Il flusso di login è identico a quello dell'app ed è confermato funzionante (autenticazione OK, API consultazione OK, registrazione OK).

Restiamo a disposizione per qualsiasi chiarimento.

Cordiali saluti,
Rescue Manager S.R.L.
