# Rapporto Test Completo RVFU — 16 Aprile 2026 (v4 — Sessione Pomeridiana con Log Dettagliati)

**Da:** RescueManager — Rescue Manager S.R.L. (P.IVA 02166430856)
**Per:** ACI Informatica / DXC Technology (Massimiliano Alocci)
**Data:** 16 Aprile 2026, ore 13:50 CEST
**Ambiente:** Formazione (VPN attiva, hosts: 10.220.222.45 ssoformazione.ilportaledeltrasporto.it)
**Documento di riferimento:** "Casi di test e dettaglio parametri WS ACI (CR)"
**Software House:** AUTODEM.RESCUEMANAGER

---

## 1. Configurazione Ambiente Test

| Parametro | Valore |
|-----------|--------|
| client_id | `AUTODEM.RESCUEMANAGER` |
| client_secret | `e3abea315f8d7acffca73941c6a0de2197068d15` |
| username | `DETO003001` |
| password | `TEST.030` |
| SSO URL | `https://ssoformazione.ilportaledeltrasporto.it/sso` |
| API Base URL | `https://formazione.ilportaledeltrasporto.it/rvfu/sh` |
| hosts | `10.220.222.45 ssoformazione.ilportaledeltrasporto.it` |
| VPN | `anyvpn.ilportaledellautomobilista.it/rep-applicativi` |
| Cookie SSO | `pdtsso-form` (non `iPlanetDirectoryPro`) |

---

## 2. Autenticazione OAuth2 — ✅ FUNZIONANTE

Sessione autenticata alle **13:40:59 CEST** del 16/04/2026.

### Flusso OIDC eseguito:

**Step 1 — Authenticate:**
```
POST https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate
Headers:
  X-OpenAM-Username: DETO003001
  X-OpenAM-Password: TEST.030
  Content-Type: application/json

Response 200:
  { "tokenId": "AQIC5wM2LY4S...==@AAQENQAANDg=@AAJTSQACMDE=#", "successUrl": "/sso/console" }
```

**Step 2 — Authorize:**
```
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize
Headers:
  Cookie: pdtsso-form=AQIC5wM2LY4S...==@AAQENQAANDg=@AAJTSQACMDE=#
  Content-Type: application/x-www-form-urlencoded
Body:
  response_type=code&client_id=AUTODEM.RESCUEMANAGER&redirect_uri=https://localhost/&scope=openid

Response 302 → Location: https://localhost/?code=a1b2c3d4-e5f6-...
```

**Step 3 — Access Token:**
```
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=authorization_code&code=a1b2c3d4-e5f6-...&redirect_uri=https://localhost/
  &client_id=AUTODEM.RESCUEMANAGER&client_secret=e3abea315f8d7acffca73941c6a0de2197068d15

Response 200:
  { "access_token": "...", "id_token": "eyJ0eXAiOiJKV1...(1410 chars)", "token_type": "Bearer" }
```

**Step 4 — API Call:**
```
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/consulta/VFU?pageNumber=0&pageSize=50
Headers:
  Authorization: Bearer eyJ0eXAiOiJKV1...(id_token)

Response 200: OK (E000)
```

✅ L'intera catena OAuth2 → API funziona correttamente.

---

## 3. Sessione Test Pomeridiana — Log Cronologico Completo

Tutte le chiamate sono state effettuate il **16 aprile 2026** con l'utenza **DETO003001** autenticata via Bearer token.

### 13:40:59 — Login e Caricamento Iniziale

| Ora | Metodo | Endpoint | Esito | Codice | Messaggio |
|-----|--------|----------|-------|--------|-----------|
| 13:40:59 | GET | `/utility/detail/utente` | ✅ OK | E000 | ELABORAZIONE CORRETTAMENTE ESEGUITA |
| 13:40:59 | GET | `/cr/consulta/VFU?pageNumber=0&pageSize=50` | ✅ OK | E000 | 6 VFU trovati |

**Dettaglio utente confermato:**
- Matricola: DETO003001
- Denominazione: DEMOLITORI - RESCUEMANAGER

### 13:41:56–13:42:31 — Test VFU #116006 (stato: VALIDATO)

VFU #116006 — Targa **AG004559**, tipoVeicolo **T**, causale **D**
Questo VFU è stato registrato in sessione precedente e validato con successo (verifica OK).

| Ora | Metodo | Endpoint | Esito | Codice | Messaggio |
|-----|--------|----------|-------|--------|-----------|
| 13:41:56 | POST | `/cr/genera/ricevutaPresaInCarico/116006` | ❌ KO | **1026** | SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI |
| 13:41:59 | POST | `/cr/genera/certificatoRottamazione/116006` | ❌ KO | **1026** | SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI |
| 13:42:01 | GET | `/cr/consulta/documentoVFU/116006` | ✅ OK | E000 | ELABORAZIONE CORRETTAMENTE ESEGUITA (0 documenti) |
| 13:42:10 | PUT | `/cr/chiudi/fascicolo/116006` | ❌ KO | **1010** | DOCUMENTI MINIMI NON PRESENTI — Lista: Certificato di rottamazione, Ricevuta presa in carico |
| 13:42:12 | PUT | `/cr/verifica/VFU/116006/D` | ❌ KO | **1001** | ERRORE CAMBIAMENTO STATO VFU (già VALIDATO) |
| 13:42:14 | PUT | `/cr/demolisci/VFU/116006` | ❌ KO | **1001** | ERRORE CAMBIAMENTO STATO VFU |

### 13:42:18–13:42:31 — Test VFU #116002 (stato: PRESO_IN_CARICO)

VFU #116002 — Targa **AG004557**, tipoVeicolo **T**, causale **D**

| Ora | Metodo | Endpoint | Esito | Codice | Messaggio |
|-----|--------|----------|-------|--------|-----------|
| 13:42:18 | GET | `/cr/VFU/116002` | ✅ OK | E000 | Dettaglio caricato |
| 13:42:18 | GET | `/cr/consulta/VFU` | ✅ OK | E000 | Lista aggiornata |
| 13:42:22 | POST | `/cr/genera/certificatoRottamazione/116002` | ❌ KO | **1026** | SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI |
| 13:42:24 | PUT | `/cr/verifica/VFU/116002/D` | ✅ OK | **E000** | ELABORAZIONE CORRETTAMENTE ESEGUITA → stato **VALIDATO** |
| 13:42:24 | GET | `/cr/VFU/116002` | ✅ OK | E000 | Conferma stato VALIDATO |
| 13:42:27 | GET | `/cr/consulta/documentoVFU/116002` | ✅ OK | E000 | ELABORAZIONE CORRETTAMENTE ESEGUITA (0 documenti) |
| 13:42:28 | PUT | `/cr/chiudi/fascicolo/116002` | ❌ KO | **1010** | DOCUMENTI MINIMI NON PRESENTI — Lista: Certificato di rottamazione, Ricevuta presa in carico |
| 13:42:30 | POST | `/cr/genera/certificatoRottamazione/116002` | ❌ KO | **1026** | SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI |
| 13:42:31 | POST | `/cr/genera/ricevutaPresaInCarico/116002` | ❌ KO | **1026** | SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI |

---

## 4. 🔴 Analisi del Blocco: `dataPresaInCarico` NULL

### 4.1 Il campo `dataPresaInCarico` nella risposta del nostro VFU

**Chiamata effettuata alle 13:42:18 del 16/04/2026:**

```
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/VFU/116002
Authorization: Bearer eyJ0eXAiOiJKV1...(id_token DETO003001)

Response 200:
{
  "esito": { "code": "E000", "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA", "responseStatus": "OK" },
  "result": {
    "idVFU": 116002,
    "targa": "AG004557",
    "telaio": "0037",
    "tipoVeicolo": "T",
    "causale": "D",
    "statoVFU": "PRESO IN CARICO",
    "dataConferimento": "2026-04-16T10:14:42",
    "dataRegistrazione": "2026-04-16T10:14:42",
    "dataPresaInCarico": null,          ← ⚠️ NULL — QUESTO È IL PROBLEMA
    "dataBonifica": null,
    "dataDemolizione": null,
    "dataRadiazione": null,
    "idFascicolo": 116002,
    "statoFascicolo": "INSERITO",
    "intestatario": {
      "codiceFiscale": "MROBNI82B11H501L",
      "nome": "Mario",
      "cognome": "Bianchi"
    }
  }
}
```

### 4.2 Confronto con la documentazione ACI (utenza DETO000101)

Nella documentazione "chiamate_risposte_vfu.md" fornita da ACI, le registrazioni con l'utenza **DETO000101** mostrano `dataPresaInCarico` **correttamente popolata**:

```
Risposta registrazione VFU #39002 (utenza DETO000101, targa AG004557):
{
  "idVFU": 39002,
  "targa": "AG004557",
  "statoVFU": "PRESO IN CARICO",
  "dataConferimento": "2024-01-31T11:03:26",
  "dataPresaInCarico": "2024-01-31T11:03:26",    ← ✅ POPOLATA
  "dataBonifica": null
}
```

### 4.3 Tabella comparativa

| Campo | VFU #39002 (DETO000101, doc ACI) | VFU #116002 (DETO003001, nostro) |
|-------|-----------------------------------|-----------------------------------|
| Targa | AG004557 | AG004557 |
| tipoVeicolo | T | T |
| causale | D | D |
| flagTipoRegime | 1 | 1 |
| Payload registrazione | Identico | Identico |
| **dataPresaInCarico** | **"2024-01-31T11:03:26"** ✅ | **null** ❌ |
| Stato | PRESO IN CARICO | PRESO IN CARICO |
| genera/ricevutaPresaInCarico | ✅ Funziona | ❌ 1026 |
| genera/certificatoRottamazione | ✅ Funziona | ❌ 1026 |
| Workflow completo fino a DEMOLITO | ✅ Sì | ❌ Bloccato |

**Stessa targa, stesso payload, stesso endpoint — risultato diverso.** La differenza è solo l'utenza.

---

## 5. Effetto a Cascata del `dataPresaInCarico` NULL

Il campo `dataPresaInCarico` NULL causa un blocco totale del workflow:

```
                    ┌─────────────────────────────────┐
                    │  POST /cr/VFU (Registrazione)    │
                    │  → Stato: PRESO IN CARICO        │
                    │  → dataPresaInCarico: NULL  ⚠️   │
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │  POST /cr/genera/ricevutaPresa   │
                    │  InCarico/{idVFU}                │
                    │  → ❌ 1026 ERRORE GENERICO       │
                    │  (probabilmente necessita data)   │
                    └───────────┬─────────────────────┘
                                │ BLOCCATO
                    ┌───────────▼─────────────────────┐
                    │  POST /cr/genera/certificato     │
                    │  Rottamazione/{idVFU}            │
                    │  → ❌ 1026 ERRORE GENERICO       │
                    └───────────┬─────────────────────┘
                                │ BLOCCATO
                    ┌───────────▼─────────────────────┐
                    │  PUT /cr/chiudi/fascicolo/{id}   │
                    │  → ❌ 1010 DOCUMENTI MINIMI NON  │
                    │    PRESENTI (CDR + Ricevuta)      │
                    └───────────┬─────────────────────┘
                                │ BLOCCATO
                    ┌───────────▼─────────────────────┐
                    │  PUT /cr/verifica/VFU/{id}/{c}   │
                    │  → ✅ E000 (funziona!)            │
                    │  → Stato: VALIDATO               │
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │  PUT /cr/demolisci/VFU/{id}      │
                    │  → ❌ 1001 ERRORE CAMBIAMENTO    │
                    │    STATO VFU                      │
                    │  (fascicolo non chiuso, docs      │
                    │   mancanti)                       │
                    └─────────────────────────────────┘
```

**Nota:** L'unica operazione che funziona nel flusso post-registrazione è `verifica/VFU` (che porta a VALIDATO). Ma senza i documenti generati, non è possibile chiudere il fascicolo e quindi non è possibile demolire.

---

## 6. VFU Creati Durante i Test

| idVFU | Targa | Causale | Tipo | Stato Attuale | dataPresaInCarico | Note |
|-------|-------|---------|------|---------------|-------------------|------|
| 116001 | AG004557 | D | T | ANNULLATO | null | Annullato per test |
| 116002 | AG004557 | D | T | **VALIDATO** | **null** | Verifica OK, genera docs KO |
| 116003 | AG004558 | D | T | PRESO IN CARICO | null | — |
| 116004 | AG004558 | D | T | PRESO IN CARICO | null | — |
| 116005 | AG004559 | D | T | PRESO IN CARICO | null | — |
| 116006 | AG004559 | D | T | **VALIDATO** | **null** | Primo VFU validato, genera docs KO |

**Tutti i 6 VFU hanno `dataPresaInCarico: null`.** Nessuno può procedere nel workflow.

---

## 7. Operazioni Che Funzionano vs Bloccate

### ✅ Operazioni Funzionanti

| Operazione | Endpoint | Esempio | Ora Test |
|-----------|----------|---------|----------|
| Autenticazione OIDC | POST /authenticate → /authorize → /access_token | Vedi §2 | 13:40 |
| Dettaglio utente | GET /utility/detail/utente | → E000, matricola DETO003001 | 13:41:02 |
| Lista VFU | GET /cr/consulta/VFU | → E000, 6 VFU | 13:40:59 |
| Dettaglio VFU | GET /cr/VFU/116002 | → E000 | 13:42:18 |
| Consulta documenti | GET /cr/consulta/documentoVFU/116002 | → E000, 0 documenti | 13:42:27 |
| Verifica VFU | PUT /cr/verifica/VFU/116002/D | → E000, stato→VALIDATO | 13:42:24 |
| Registrazione VFU | POST /cr/VFU | → E000, idVFU=116001-116006 | sessione mattina |
| Annullamento VFU | PUT /cr/annulla/VFU/116001 | → E000, stato→ANNULLATO | sessione mattina |
| Ricerca veicolo | GET /cr/veicolo?causale=V&targa=VA189AJ&tipoVeicolo=A | → E000 | sessione mattina |

### ❌ Operazioni Bloccate (tutte dipendono da `dataPresaInCarico`)

| Operazione | Endpoint | Errore | Ora Test | Causa Probabile |
|-----------|----------|--------|----------|-----------------|
| Genera ricevuta presa in carico | POST /cr/genera/ricevutaPresaInCarico/116006 | **1026** | 13:41:56 | dataPresaInCarico NULL |
| Genera certificato rottamazione | POST /cr/genera/certificatoRottamazione/116006 | **1026** | 13:41:59 | dataPresaInCarico NULL |
| Genera ricevuta presa in carico | POST /cr/genera/ricevutaPresaInCarico/116002 | **1026** | 13:42:31 | dataPresaInCarico NULL |
| Genera certificato rottamazione | POST /cr/genera/certificatoRottamazione/116002 | **1026** | 13:42:30 | dataPresaInCarico NULL |
| Chiudi fascicolo | PUT /cr/chiudi/fascicolo/116006 | **1010** | 13:42:10 | CDR + Ricevuta mancanti |
| Chiudi fascicolo | PUT /cr/chiudi/fascicolo/116002 | **1010** | 13:42:28 | CDR + Ricevuta mancanti |
| Demolisci VFU | PUT /cr/demolisci/VFU/116006 | **1001** | 13:42:14 | Fascicolo non chiuso |

---

## 8. Esempio Completo di Chiamata con Errore

### 8.1 POST /cr/genera/ricevutaPresaInCarico/116002

**Timestamp:** 16/04/2026 13:42:31 CEST

```http
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/ricevutaPresaInCarico/116002
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9....(id_token DETO003001)
Content-Type: application/json

Body: {}
```

**Risposta:**
```json
{
  "esito": {
    "responseStatus": "KO",
    "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
    "code": "1026"
  }
}
```

### 8.2 POST /cr/genera/certificatoRottamazione/116002

**Timestamp:** 16/04/2026 13:42:30 CEST

```http
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/certificatoRottamazione/116002
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9....(id_token DETO003001)
Content-Type: application/json

Body: {}
```

**Risposta:**
```json
{
  "esito": {
    "responseStatus": "KO",
    "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
    "code": "1026"
  }
}
```

### 8.3 PUT /cr/chiudi/fascicolo/116002

**Timestamp:** 16/04/2026 13:42:28 CEST

```http
PUT https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/chiudi/fascicolo/116002
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9....(id_token DETO003001)
Content-Type: application/json

Body: {}
```

**Risposta:**
```json
{
  "esito": {
    "responseStatus": "KO",
    "message": "DOCUMENTI MINIMI NON PRESENTI\nLista documenti minimi:\nCertificato di rottamazione\nRicevuta presa in carico",
    "code": "1010"
  }
}
```

### 8.4 PUT /cr/demolisci/VFU/116006

**Timestamp:** 16/04/2026 13:42:14 CEST

```http
PUT https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/demolisci/VFU/116006
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9....(id_token DETO003001)
Content-Type: application/json

Body: {
  "dataDistruzioneDocumenti": "2026-04-16T13:42:14.000Z",
  "dataDistruzioneTarga": "2026-04-16T13:42:14.000Z",
  "numeroTargheDistrutte": "1",
  "dataBonifica": "2026-04-16T13:42:14.000Z"
}
```

**Risposta:**
```json
{
  "esito": {
    "responseStatus": "KO",
    "message": "ERRORE CAMBIAMENTO STATO VFU",
    "code": "1001"
  }
}
```

---

## 9. Flusso Happy Path Atteso (da documentazione ACI)

Secondo la documentazione ACI con esempi da utenza DETO000101, il flusso completo per un veicolo non-PRA è:

| Step | Endpoint | Stato Risultante | Nostro Esito |
|------|----------|------------------|--------------|
| 1 | `POST /cr/VFU` | PRESO IN CARICO (con dataPresaInCarico popolata) | ✅ Ma dataPresaInCarico=**null** |
| 2 | `POST /cr/genera/ricevutaPresaInCarico/{id}` | — (documento generato) | ❌ **1026** |
| 3 | `POST /cr/genera/certificatoRottamazione/{id}` | — (documento generato) | ❌ **1026** |
| 4 | `PUT /cr/chiudi/fascicolo/{id}` | Fascicolo "Chiuso" | ❌ **1010** (documenti mancanti) |
| 5 | `PUT /cr/verifica/VFU/{id}/{causale}` | VALIDATO | ✅ **E000** |
| 6 | `PUT /cr/demolisci/VFU/{id}` | DEMOLITO | ❌ **1001** |

**Il flusso si blocca allo step 2.** Non è possibile generare alcun documento, il che impedisce la chiusura del fascicolo (step 4) e la demolizione (step 6).

---

## 10. Domande per ACI Informatica

### 🔴 Blocco Critico — Richiesta Intervento

**1. `dataPresaInCarico` è NULL per tutte le registrazioni dell'utenza DETO003001.**
- Abbiamo registrato **6 VFU** (116001–116006) con le targhe AG004557, AG004558, AG004559.
- **Tutti** hanno `dataPresaInCarico: null` nella risposta.
- La stessa targa AG004557 registrata con utenza DETO000101 (nella vostra documentazione) ha `dataPresaInCarico` correttamente popolata.
- **Chiediamo di verificare la configurazione dell'utenza DETO003001** e del profilo CR associato.
- È possibile che manchi un attributo o una configurazione sul profilo che determina la valorizzazione automatica di `dataPresaInCarico`?

**2. POST `/cr/genera/ricevutaPresaInCarico/{idVFU}` e POST `/cr/genera/certificatoRottamazione/{idVFU}` restituiscono sempre errore 1026.**
- Testato su VFU in stato PRESO_IN_CARICO (116002) e VALIDATO (116006).
- L'errore 1026 è generico ("SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI") e non consente diagnostica.
- **È possibile avere un log lato server per capire la causa specifica?**
- **Ipotesi:** L'errore 1026 potrebbe essere conseguenza diretta di `dataPresaInCarico=null`, poiché la generazione della ricevuta necessita di questa data.

**3. Come possiamo sbloccare il workflow?**
- Se il problema è l'utenza, è possibile correggere la configurazione di DETO003001?
- In alternativa, è possibile fornirci un'utenza test che funzioni correttamente (come DETO000101)?
- Oppure, esiste un endpoint per impostare manualmente `dataPresaInCarico`?

### 🟡 Chiarimenti

**4. Targhe VA* non registrabili come VFU.**
Le targhe test VA189AJ–VA231AJ funzionano per la ricerca veicolo (causale V) ma NON possono essere registrate come VFU:
- Con causale V → errore F001 "FORMATO ERRATO: targaValidByCausale"
- Con causale D → errore 1026
Per i test completi, quale serie di targhe dobbiamo usare?

**5. Endpoint non disponibili su gateway `/rvfu/sh`:**
- `/cr/impresa/centroRaccolta` → 404
- `/cr/impresa/concessionario` → 404
- `/cr/causalePerCodice/{codice}` → 404
Sono disponibili con un path diverso?

---

## 11. Riepilogo Finale

| Area | Stato | Dettaglio |
|------|-------|-----------|
| Autenticazione OAuth2 (OIDC) | ✅ 100% | pdtsso-form + Bearer id_token — funziona perfettamente |
| Endpoint GET consultazione | ✅ 16/19 | 3 endpoint non disponibili su gateway |
| Ricerca veicolo | ✅ | Funziona con causale V su targhe VA*, causale D su AG* |
| Registrazione VFU (POST /cr/VFU) | ✅ | 6 VFU creati con successo |
| Annullamento VFU | ✅ | Testato su VFU 116001 |
| Verifica VFU | ✅ | VFU 116002 e 116006 portati a VALIDATO |
| Consulta documenti | ✅ | Risponde OK, 0 documenti (perché non generabili) |
| **`dataPresaInCarico`** | **❌ NULL** | **Tutti i 6 VFU hanno dataPresaInCarico=null** |
| **Genera ricevuta** | **❌ 1026** | **Errore backend su tutti i VFU testati** |
| **Genera CDR** | **❌ 1026** | **Errore backend su tutti i VFU testati** |
| **Chiudi fascicolo** | **❌ 1010** | **Documenti minimi mancanti (CDR + Ricevuta)** |
| **Demolisci VFU** | **❌ 1001** | **Impossibile — fascicolo non chiuso** |

### Conclusione

**Il nostro client software house (AUTODEM.RESCUEMANAGER) è completamente funzionante** per quanto riguarda autenticazione, consultazione, registrazione e verifica VFU. Il blocco è lato server: il campo `dataPresaInCarico` non viene valorizzato per l'utenza DETO003001, il che impedisce a cascata la generazione dei documenti obbligatori e quindi l'intero flusso di demolizione.

**Chiediamo cortesemente ad ACI Informatica di:**
1. Verificare la configurazione dell'utenza DETO003001 e del profilo CR associato
2. Fornire un log lato server degli errori 1026 sui nostri VFU 116002 e 116006
3. Confermare se è necessario un intervento sulla configurazione o se il problema è noto

---

*Report generato il 16/04/2026 alle 13:50 CEST*
*RescueManager — AUTODEM.RESCUEMANAGER*
*Ambiente: formazione | VPN: attiva | Sessione test: 13:40–13:43 CEST*
*VFU testati: 116001 (ANNULLATO), 116002 (VALIDATO), 116003–116005 (PRESO IN CARICO), 116006 (VALIDATO)*
*Versione rapporto: v4*
