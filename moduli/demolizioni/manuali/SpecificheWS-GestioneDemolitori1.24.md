# Specifiche Web Services - Gestione Demolitori v1.24

**Versione**: 1.24  
**Data**: 03.02.2025  
**Fonte**: SpecificheWS-GestioneDemolitori1.24.pdf

---

## STORIA DEL DOCUMENTO

| Versione | Data | Note |
|----------|------|------|
| 1.0 | 29/05/2023 | Prima emissione |
| 1.1 | 04/08/2023 | Revisione API |
| 1.2 | 08/02/2024 | Aggiornati html e json paragrafi 4.1, 4.2, Casi di Test al paragrafo 4.3 |
| 1.3 | 09/02/2024 | Modifica dei puntamenti ambienti negli esempi |
| 1.4 | 22/02/2024 | Aggiornamento pacchetto JSON e HTML, aggiornamento documentazione WS |
| 1.5 | 23/02/2024 | Aggiornamento allegati HTML e JSON |
| 1.6 | 29/02/2024 | Aggiornamento documentazione WS casi di test |
| 1.7 | 07/03/2024 | Aggiornamento file HTML, aggiornamento documentazione WS casi di test |
| 1.8 | 11/03/2024 | Aggiornamento pacchetto JSON con ultima versione rilasciata in esercizio |
| 1.9 | 15/03/2024 | Aggiornamento file HTML |
| 1.10 | 12/04/2024 | Aggiornamento documentazione WS casi di test per servizio download |
| 1.11 | 16.04.2024 | Modifica POST e PUT /cr/documentoVFU |
| 1.12 | 15.05.2024 | Aggiornamento documentazione casi di test |
| 1.13 | 23.05.2024 | Aggiornamento pacchetti JSON e HTML, documentazione casi di test |
| 1.14 | 26.06.2024 | Aggiornamento file HTML e JSON, aggiunti campi StatoVfuEnum e statoFascicoloEnum |
| 1.15 | 04.07.2024 | Aggiornamento file HTML e JSON, nuovo endpoint DELETE /rest/cr/cartellaFirma/{idCartella} |
| 1.16 | 19.07.2024 | Aggiornamento file HTML e JSON, nuova gestione indirizzi + refactoring |
| 1.17 | 06.09.2024 | Aggiornamento file HTML e JSON con varie modifiche |
| 1.18 | 25.09.2024 | Aggiornamento file HTML e JSON, nuova logica integrazione fascicolo |
| 1.19 | 05.11.2024 | Aggiornamento file HTML e JSON, implementazione specifica distinta vfu |
| 1.20 | - | Aggiornamento dimensioni campi anagrafica, modifica codice errore |
| 1.21 | - | Rivisitazione template CDR, introduzione distinta |
| 1.22 | - | Fix gestione dati geografici soggetti in update VFU |
| 1.23 | 23.01.2025 | Export massivo risultati ricerche VFU in formato pdf e xlsx |
| 1.24 | 03.02.2025 | Fix codice istat località, nuovi vincoli detentore persona giuridica |

---

## INDICE DEL DOCUMENTO

1. INTRODUZIONE
   - 1.1 SCOPO E CAMPO DI APPLICAZIONE
   - 1.2 APPLICABILITÀ
   - 1.3 STANDARD

2. URL DEI SERVIZI
   - 2.1 AMBIENTE DI ESERCIZIO
   - 2.2 AMBIENTE DI FORMAZIONE

3. DIAGRAMMA DI PROCESSO
   - 3.1 DESCRIZIONE
   - 3.2 ELENCO STATI RICHIESTA
   - 3.3 DIAGRAMMA DEI CASI D'USO

4. DEFINIZIONE DEI SERVIZI
   - 4.1 HTML
   - 4.2 JSON
   - 4.3 ESEMPI DI CHIAMATE AI SERVIZI
   - 4.4 TIPOLOGICHE
     - 4.4.1 ELENCO STATI VFU
     - 4.4.2 ELENCO STATI FASCICOLO

5. MODALITÀ DI AUTENTICAZIONE DI UN UTENTE PER L'UTILIZZO DEI WEB SERVICE
   - 5.1 SPECIFICHE OPENID PROVIDER
     - 5.1.1 URL SERVIZI DI AUTENTICAZIONE
     - 5.1.2 OIDC TOKENS
   - 5.2 INFORMAZIONI DI INTEGRAZIONE
   - 5.3 FLUSSO DI AUTENTICAZIONE
     - 5.3.1 AUTHENTICATE
     - 5.3.2 AUTHORIZE
     - 5.3.3 ACCESS TOKEN
   - 5.4 AGGIORNAMENTO TOKEN
   - 5.5 LOGOUT

6. CHANGE LOG
   - 6.1 VERSIONE 1.0

7. APPENDICE B: TERMINI ED ACRONIMI

---

## 1. INTRODUZIONE

### 1.1 SCOPO E CAMPO DI APPLICAZIONE

Il presente documento intende fornire la specifica dei servizi esposti dal MIMS verso le Software House, realizzati con la tecnologia dei RESTful Web Services, per il Nuovo Sistema Gestione Pagamenti.

### 1.2 APPLICABILITÀ

N.a.

### 1.3 STANDARD

N.a.

---

## 2. URL DEI SERVIZI

### 2.1 AMBIENTE DI ESERCIZIO

L'indirizzo in ambiente di esercizio dei servizi è il seguente:

```
{{baseUrl}} = https://www.ilportaledeltrasporto.it/
```

### 2.2 AMBIENTE DI FORMAZIONE

L'indirizzo in ambiente di formazione dei servizi è il seguente:

```
{{baseUrl}} = https://formazione.ilportaledeltrasporto.it/
```

---

## 3. DIAGRAMMA DI PROCESSO

### 3.1 DESCRIZIONE

Il progetto ha come obiettivo quello di istituire e gestire il Registro Digitale dei Veicoli Fuori Uso.

In questo contesto si rende necessario:
- garantire un "unico punto di accesso" alle funzionalità per i soggetti abilitati alla gestione del registro
- definire un processo di business che gestisca l'iter procedurale dal ritiro del veicolo fino alla radiazione e rottamazione
- consentire la consultazione della situazione di uno specifico veicolo avviato alla demolizione, da parte degli interlocutori interessati, ivi comprese le forze di pubblica sicurezza deputate ai controlli.

**Gli attori coinvolti nel progetto sono:**

- **Concessionari, case costruttrici e automercati**: possono ritirare un veicolo da avviare alla rottamazione, per conto di un centro di raccolta, rilasciando il certificato di rottamazione digitale
- **Centri di raccolta**: devono
  - prendere in carico i veicoli da rottamare
  - svolgere gli accertamenti sulla documentazione
  - richiedere la radiazione del veicolo
  - procedere con la rottamazione
- **Studi di consulenza/agenzie**: ai quali si possono rivolgere i centri di raccolta per essere supportati nella fase di radiazione del veicolo, in particolare per quelli con obbligo di iscrizione al PRA
- **Uffici PRA/UMC**: che sovrintendono alle operazioni di radiazione ai quali deve essere consentita la consultazione del registro
- **Forze dell'ordine**: che devono poter consultare il registro ai fini di accertamento

**Macro-aree del progetto:**

1. **Censimento soggetti abilitati** alla gestione del registro
2. **Gestione della delega** che ciascun Centro di Raccolta può concedere ad uno o più concessionari
3. **Ritiro da parte dei concessionari** dei veicoli consegnati da intestatari/delegati
4. **Ritiro da parte dei centri di raccolta** dei veicoli consegnati da intestatari/delegati
5. **Presa in carico o trasferimento** di veicoli conferiti
6. **Rottamazione** di un veicolo fuori uso da parte di un centro di raccolta
7. **Radiazione** del veicolo fuori uso (per veicoli con obbligo di iscrizione al PRA)
8. **Registrazione della demolizione**
9. **Consultazione del Registro** da parte degli uffici territoriali del PRA
10. **Consultazione del Registro** da parte di utenti preposti all'assistenza
11. **Consultazione del Registro** da parte degli uffici territoriali della MCTC (UMC)
12. **Consultazione del Registro** da parte delle Forze di Polizia

### 3.2 ELENCO STATI RICHIESTA

*(Diagramma degli stati nel PDF originale - pagina 13)*

### 3.3 DIAGRAMMA DEI CASI D'USO

*(Diagramma nel PDF originale - pagine 14-16)*

---

## 4. DEFINIZIONE DEI SERVIZI

Nel presente capitolo viene fornita una descrizione completa delle operazioni (file HTML) disponibili e sono contenuti i json.

Ogni operazione ha come risposta due elementi:
- **un esito (obbligatorio)**: indica al chiamante se la chiamata è andata a buon fine (`CodiceEsito=OK`) oppure se è stato riscontrato un problema (`CodiceEsito=KO`)
- **un risultato (opzionale)**: contiene il dettaglio dei dati di risposta se ci sono

**Esempio di risposta con errore:**

```json
{
  "esito": {
    "codice": "KO",
    "descrizione": "Descrizione dell'errore"
  },
  "risultato": {}
}
```

### 4.1 HTML

La documentazione è specificata nel seguente documento html: `gestione-vfu.openapi.html`

### 4.2 JSON

Nel file json sono presenti degli endpoint che non saranno esposti alle swh, perché di uso interno. Nel file di documentazione sono presenti tutti gli endpoint utilizzabili.

### 4.3 ESEMPI DI CHIAMATE AI SERVIZI

Di seguito si riportano gli esempi sugli endpoint dei WS ACI comprensivi del dettaglio dei parametri nelle request, dei valori ammessi provenienti da tipologiche e la lunghezza dei campi string.

*(Riferimento: "Casi di test e dettaglio parametri WS ACI v 1.11.docx")*

### 4.4 TIPOLOGICHE

#### 4.4.1 ELENCO STATI VFU

| CODICE | DESCRIZIONE |
|--------|-------------|
| C | CONFERITO |
| T | TRASFERITO |
| P | PRESO IN CARICO |
| R | DA RADIARE |
| N | INVIATO A STA |
| S | RADIATO |
| D | DEMOLITO |
| A | ANNULLATO |
| I | INSERITO |

#### 4.4.2 ELENCO STATI FASCICOLO

| CODICE | DESCRIZIONE |
|--------|-------------|
| I | Inserito |
| C | Chiuso |
| N | Inviato a STA |

---

## 5. MODALITÀ DI AUTENTICAZIONE DI UN UTENTE PER L'UTILIZZO DEI WEB SERVICE

Vengono di seguito descritte delle linee guida di integrazione per permettere alle applicazioni di integrarsi con il sistema IAM mediante OpenID Connect.

Secondo il modello di autenticazione OIDC, l'infrastruttura IAM agirà da **OpenID Provider (OP)** e l'applicazione da integrare da **Relying Party (RP)** in accordo alle specifiche del protocollo OpenID Connect 1.0.

Per un livello di sicurezza adeguato, è necessario garantire un canale sicuro tra i client e l'OpenID Provider.

OpenID Connect 1.0 è l'identity layer costruito on top al protocollo OAuth 2.0. Permette al client di verificare l'identità dell'utente finale sulla base dell'autenticazione effettuata verso l'OpenID Provider ed ottenere allo stesso tempo informazioni aggiuntive relative all'utente.

**Il flusso utilizzato** per l'integrazione all'interno dell'infrastruttura IAM è **Authorization Code Flow**.

### 5.1 SPECIFICHE OPENID PROVIDER

#### 5.1.1 URL SERVIZI DI AUTENTICAZIONE

##### 5.1.1.1 AMBIENTE DI ESERCIZIO

L'indirizzo in ambiente di esercizio dei servizi di autenticazione è il seguente:

```
{{baseUrl}} = https://sso.ilportaledeltrasporto.it/sso
```

##### 5.1.1.2 AMBIENTE DI FORMAZIONE

L'indirizzo in ambiente di formazione dei servizi di autenticazione è il seguente:

```
{{baseUrl}} = https://ssoformazione.ilportaledeltrasporto.it/sso
```

**EndPoint utilizzati:**

| Nome Servizio | URL |
|---------------|-----|
| Authenticate | `{{baseUrl}}/json/authenticate` |
| Authorize | `{{baseUrl}}/oauth2/authorize` |
| AccessToken | `{{baseUrl}}/oauth2/access_token` |
| EndSession | `{{baseUrl}}/oauth2/connect/endSession` |

**Descrizione endpoint:**

- `/sso/oauth2/authorize`: definito in rfc6749 serve per raccogliere il consenso e l'autorizzazione per il proprietario della risorsa
- `/sso/oauth2/access_token`: definito in rfc6749 serve per ottenere i token richiesti dall'applicazione (access, refresh e Id token)
- `/sso/oauth2/connect/endSession`: definito in openid_spec termina la sessione dell'utente autenticato

#### 5.1.2 OIDC TOKENS

Nella risposta che l'OP fornisce al RP vi sono i seguenti token:

- **ID Token**: in formato JWT, specifico per il protocollo OpenID Connect, contiene tra gli altri i claims relativi all'informazione dell'utente
- **Access Token**: specifico per il protocollo OAuth2, è il token che può essere speso per essere autorizzati ad accedere direttamente ad una risorsa
- **Refresh Token**: specifico per il protocollo OAuth2, contiene informazioni necessarie a recuperare un nuovo access token, tipicamente quando l'access token è scaduto. Tale token viene rilasciato solo su richiesta del client qualora necessario per scopi applicativi

L'ID Token e l'Access Token, di solito, hanno una validità temporale molto limitata. Anche i Refresh Token scadono ma tipicamente hanno una lunga durata e sono soggetti a vincoli di memorizzazione stringenti per evitare che siano trafugati da un attaccante.

**Esempio di token rilasciati dall'infrastruttura IAM:**

```json
{
  "access_token": "fdhYNyTikmph8MCI2MgMq2MVdGE",
  "refresh_token": "jRo-4GUC8ImpgiJ6eNeYoVGjQsI",
  "scope": "openid profile",
  "id_token": "eyJ0eXAiOiJKV1QiLCJraWQiOiIxTi9xbkgrUnJSZVk5V29pN00zRW02eDZ1S0E9IiwiYWxnIjoiUlMyNTYifQ...",
  "token_type": "Bearer",
  "expires_in": 1799,
  "nonce": "123abc"
}
```

**L'ID token** è un JWT diviso in tre sezioni, separate da carattere punto (.), come da indicazioni openid_spec_idtoken:

1. **Header**: informazioni relative al tipo di token ed algoritmo utilizzato (RS256)
2. **Payload**: codificato in base64 con le claim relative all'utente autenticato, tra cui:
   - `sub`: subject per il quale è stato rilasciato il token
   - `iss`: URL dell'Authorization server issuer
   - `auth_time`: timestamp dell'autenticazione
   - `exp`: scadenza del token
3. **Signature**: per la verifica della stessa

**Esempio payload decodificato id_token (AMBIENTE FORMAZIONE):**

```json
{
  "sub": "<UserIdAgenzia>",
  "auditTrackingId": "fa136667-9c9e-4154-ad37-05c3fa65bf92-139234",
  "iss": "http://ssoformazione.ilportaledeltrasporto.it/sso/oauth2",
  "tokenName": "id_token",
  "nonce": "123abc",
  "aud": "softwarehouse1",
  "c_hash": "7QZnkWwiQVZMsxLZfxIgNA",
  "acr": "0",
  "org.forgerock.openidconnect.ops": "E9l3hJoCe9GT0h-2NRjxFYXimUY",
  "s_hash": "bKE9UspwyIPg8LsQHkJaiQ",
  "azp": "softwarehouse1",
  "auth_time": 1623243153,
  "name": "<NomeAgenzia>",
  "realm": "/",
  "exp": 1623268788,
  "tokenType": "JWTToken",
  "family_name": "<Agenzia>",
  "iat": 1623243588
}
```

### 5.2 INFORMAZIONI DI INTEGRAZIONE

**Pagina**: 22 del PDF

Per procedere all'integrazione con la piattaforma IAM, la Software House dovrà condividere le seguenti informazioni:

| Nome | Descrizione | Note |
|------|-------------|------|
| **ClientID** | Nome del client | CodiceUtente di IdentificativoSoftwareHouse |
| **Client Secret** | Password del Client | PasswordUtente di IdentificativoSoftwareHouse |
| **Redirection URIs** | URL di redirect | **`https://localhost/`** ⚠️ *(vedi nota sotto)* |
| **Post Logout URIs** | URL di Post Logout | **`https://localhost/`** |
| **AuthorizationCode LifeTime** | Durata del Authorization Code | Il valore di default, se non specificato dal client è pari a **2 minuti** |
| **AccessToken LifeTime** | Durata del Access Token | Il valore di default, se non specificato dal client è pari a **30 minuti** |
| **IDToken LifeTime** | Durata del ID Token | Se non specificato dal client è pari a **4 ore** |
| **RefreshToken LifeTime** | Durata del Refresh Token | Il valore di default, se non diversamente richiesto è pari a **2 giorni** |

**Il metodo di autenticazione utilizzato è**: `client_secret_post`

**⚠️ NOTA IMPORTANTE SUL REDIRECT_URI:**

Nella tabella delle informazioni di integrazione viene indicato `https://localhost/`, ma negli esempi curl delle sezioni 5.3.2 e 5.3.3 viene utilizzato `http://localhost/` (HTTP, non HTTPS). **Gli esempi pratici sono più affidabili** perché mostrano il codice reale funzionante.

### 5.3 FLUSSO DI AUTENTICAZIONE

**IMPORTANTE**: Prima del flusso standard di Authorization Code Flow, dovrà essere implementata una chiamata all'endpoint `/authenticate` per evitare la richiesta della pagina di Login nella chiamata ai Web Services.

**⚠️ CRITICO**: Tutte le chiamate della fase di autenticazione devono essere fatte in POST.

**Flusso implementato:**

1. Il client effettua la chiamata all'endpoint `/authenticate` per avviare una sessione autenticata con le credenziali dell'agenzia
2. Il Provider verifica le credenziali passate e, se valide, restituisce il cookie `iPlanetDirectoryPro`
3. Il client chiama l'endpoint `/authorize` necessario per la prosecuzione del flusso passando il cookie `iPlanetDirectoryPro` e il `ClientId`
4. Il Provider verifica le informazioni e restituisce l'`AuthorizationCode`
5. Il Client chiama l'endpoint `/access_token` passando l'`AuthorizationCode` e le credenziali del Client (`ClientID`/`ClientSecret`)
6. Il Provider verifica le informazioni e restituisce l'`IDToken`, l'`AccessToken` e il `RefreshToken`
7. Il Client chiama l'API Gateway passando l'`IDToken` (Bearer) nel Header Authorization

#### 5.3.1 AUTHENTICATE

**Pagina**: 24 del PDF

Per avviare il flusso di autenticazione, necessario per accedere ad una risorsa protetta, il Client dovrà richiamare l'endpoint `/authenticate` passando le credenziali di accesso.

**Parametri necessari:**

- `user_id`: è l'identificativo dell'agenzia
- `password`: è la password dell'agenzia
- `Content-Type`: è un valore fisso impostato a `"application/json"`
- `Accept-API-Version`: è un valore fisso impostato a `"Accept-API-Version"`

**Tabella parametri di Input:**

| Param | Tipologia | Valore |
|-------|-----------|--------|
| Content-Type | header | `application/json` |
| X-OpenAM-Username | header | `<UserID Agenzia>` |
| X-OpenAM-Password | header | `<Passwd Agenzia>` |
| Accept-API-Version | header | `Accept-API-Version` |

**Esempio chiamata curl (AMBIENTE FORMAZIONE):**

```bash
curl --request POST \
  --header "Content-Type: application/json" \
  --header "X-OpenAM-Username: <UserIDAgenzia>" \
  --header "X-OpenAM-Password: <PasswdAgenzia>" \
  --header "Accept-API-Version: resource=2.0, protocol=1.0" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate
```

**Esempio di risposta in caso di successo:**

```json
{
  "tokenId": "k2tqmxhjYYfH4cYirncim0zHgxk.*AAJTSQACMDIAAlNLABxxemtTT3hYeGNvK1dsT3hOVVQrUERNMVpvTGM9AAR0eXBlAANDVFMAAlMxAAIwNA..*",
  "successUrl": "/sso/console",
  "realm": "/"
}
```

**Esempio di risposta in caso di autenticazione fallita:**

```json
{
  "code": 401,
  "reason": "Unauthorized",
  "message": "Authentication Failed"
}
```

**Nota**: Il `tokenId` corrisponde al valore del cookie `iPlanetDirectoryPro`.

#### 5.3.2 AUTHORIZE

**Pagina**: 25 del PDF

La chiamata all'endpoint `/authorize` serve per ottenere l'authorization code, necessario per la prosecuzione del flusso.

**Parametri necessari:**

- `iPlanetDirectoryPro`: è il valore del Cookie ritornato dal servizio `/authenticate`
- `scope`: è un valore fisso impostato a `"openid profile"`
- `response_type`: è un valore fisso impostato a `"code"`
- `client_id`: è l'identificativo univoco del client indicato nelle informazioni di integrazione
- `csrf`: è il valore del Cookie ritornato dal servizio `/authenticate` (stesso valore di `iPlanetDirectoryPro`)
- `redirect_uri`: è il valore di redirect indicato nelle informazioni di integrazione
- `state`: è un valore fisso impostato a `"abc123"`
- `nonce`: è un valore fisso impostato a `"123abc"`
- `decision`: è un valore fisso impostato a `"allow"`

**Tabella parametri di Input:**

| Param | Tipologia | Valore |
|-------|-----------|--------|
| iPlanetDirectoryPro | Cookie | `<Valore del cookie tornato dalla chiamata /authenticate>` |
| scope | data | `openid profile` |
| response_type | data | `code` |
| client_id | data | `<ClientID della SoftwareHouse>` |
| csrf | data | `<Valore del cookie tornato dalla chiamata /authenticate>` |
| **redirect_uri** | data | **`<Redirection URI SoftwareHouse>`** |
| state | data | `abc123` |
| nonce | data | `123abc` |
| decision | data | `allow` |

**Esempio chiamata curl (AMBIENTE FORMAZIONE):**

```bash
curl --dump-header - --request POST \
  --Cookie "iPlanetDirectoryPro=GcJUXdAjFcCFjYdnIVw8qM7clFU.*AAJTSQACMDIAAlNLABxNTFNZZGxRTUE4T2pETk5NWEp5SGRCTW5RV2M9AAR0eXBlAANDVFMAAlMxAAIwMQ..*" \
  --data "scope=openid profile" \
  --data "response_type=code" \
  --data "client_id=softwarehouse1" \
  --data "csrf=GcJUXdAjFcCFjYdnIVw8qM7clFU.*AAJTSQACMDIAAlNLABxNTFNZZGxRTUE4T2pETk5NWEp5SGRCTW5RV2M9AAR0eXBlAANDVFMAAlMxAAIwMQ..*" \
  --data "redirect_uri=http://localhost/" \
  --data "state=abc123" \
  --data "nonce=123abc" \
  --data "decision=allow" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize
```

**Esempio di risposta (che contiene l'authorization code):**

```
<redirect url>?code=1AxzjSmuIkEG9MTF4wrff_5PpLs&iss=http%3A%2F%2Fssoformazione.ilportaledeltrasporto.it%2Fsso%2Foauth2&state=abc123&client_id=softwarehouse1
```

**⚠️ IMPORTANTE**: Nel parametro viene usato `redirect_uri=http://localhost/` (**HTTP, non HTTPS**).

#### 5.3.3 ACCESS TOKEN

**Pagina**: 26 del PDF

Nella chiamata all'endpoint `/access_token`, i parametri necessari sono:

- `grant_type`: valore fisso impostato a `"authorization_code"`
- `code`: è l'authorization code ottenuto in precedenza dall'endpoint `/authorize`
- `client_id`: è l'identificativo univoco del client della SoftwareHouse, definito nelle informazioni di integrazione
- `client_secret`: è la password del client della SoftwareHouse, definito nelle informazioni di integrazione
- `redirect_uri`: è il valore di redirect indicato nelle informazioni di integrazione

**Tabella parametri di Input:**

| Param | Tipologia | Valore |
|-------|-----------|--------|
| grant_type | data | `authorization_code` |
| code | data | `<Valore ritornato dalla chiamata /authorize>` |
| client_id | data | `<ClientID della SoftwareHouse>` |
| client_secret | data | `<ClientIPassword della SoftwareHouse>` |
| **redirect_uri** | data | **`<Redirection URI SoftwareHouse>`** |

**Esempio chiamata curl (AMBIENTE FORMAZIONE):**

```bash
curl --request POST \
  --data "grant_type=authorization_code" \
  --data "code=R_rdi4dn0dTtOgDzLzVV83pACYw" \
  --data "client_id=softwarehouse1" \
  --data "client_secret=<Password>" \
  --data "redirect_uri=http://localhost/" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token
```

**Esempio di risposta (che contiene i Token):**

```json
{
  "access_token": "4snJehFX6iIcJm4JS-bPHSUKf_U",
  "refresh_token": "J1KdkBSuM8VUWJfnZlBdgIvB4-0",
  "scope": "openid profile",
  "id_token": "eyJ0eXAiOiJKV1QiLCJraWQiOiIxTi9xbkgrUnJSZVk5V29pN00zRW02eDZ1S0E9IiwiYWxnIjoiUlMyNTYifQ...",
  "token_type": "Bearer",
  "expires_in": 1799,
  "nonce": "123abc"
}
```

**⚠️ CONFERMA**: Anche qui viene usato `redirect_uri=http://localhost/` (HTTP, non HTTPS).

### 5.4 AGGIORNAMENTO TOKEN

**Pagina**: 27 del PDF

La funzione di aggiornamento del Token serve per ottenere un nuovo token di accesso quando il token corrente non è più valido.

Per effettuare il refresh del token, viene utilizzato l'endpoint `/access_token`, e i parametri necessari sono:

- `grant_type`: valore fisso impostato a `"refresh_token"`
- `refresh_token`: è il token precedentemente memorizzato dalla chiamata ad `/access_token`
- `client_id`: è l'identificativo univoco del client della SoftwareHouse, definito nelle informazioni di integrazione
- `client_secret`: è la password del client, definito nelle informazioni di integrazione
- `scope`: è un valore fisso impostato a `"openid profile"`

**Tabella parametri di Input:**

| Param | Tipologia | Valore |
|-------|-----------|--------|
| grant_type | data | `refresh_token` |
| refresh_token | data | `<valore del token precedentemente memorizzato>` |
| client_id | data | `<ClientID della SoftwareHouse>` |
| client_secret | data | `<ClientIPassoword della SoftwareHouse>` |
| scope | data | `openid profile` |

**Esempio chiamata curl (AMBIENTE FORMAZIONE):**

```bash
curl --request POST \
  --data "grant_type=refresh_token" \
  --data "refresh_token=xTQx4lqw0VxzLxTl9XtvpiMjHAw" \
  --data "client_id=softwarehouse1" \
  --data "client_secret=<Password>" \
  --data "scope=openid%20profile" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token
```

**Esempio di risposta:**

```json
{
  "access_token": "OSoUB2kkHtbZ5a1vSxBLLw4qtJw",
  "refresh_token": "kd9hxvEx73sMkzNVuVWe84X5Xgo",
  "scope": "openid profile",
  "id_token": "eyJ0eXAiOiJKV1QiLCJraWQiOiIxTi9xbkgrUnJSZVk5V29pN00zRW02eDZ1S0E9IiwiYWxnIjoiUlMyNTYifQ...",
  "token_type": "Bearer",
  "expires_in": 1799,
  "nonce": "123abc"
}
```

### 5.5 LOGOUT

**Pagina**: 28 del PDF

Quando l'utente effettua la logout direttamente dal RP, quest'ultimo dovrà eseguire la chiamata verso l'endpoint `/endSession` per cancellare la sessione, l'access token e il refresh token.

È a carico del RP la cancellazione delle sessioni applicative dell'utente.

**Parametri necessari:**

- `client_id`: è l'identificativo univoco del client (RP)
- `id_token_hint`: è il valore dell'ID Token dell'utente che sta effettuando la logout
- `post_logout_redirect_uri`: è il valore di post-logout-redirect URL indicato nelle informazioni di integrazione

**⚠️ NOTA**: In questo caso, la chiamata viene fatta in **GET**.

**Esempio chiamata curl (AMBIENTE FORMAZIONE):**

```bash
curl --request GET \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/connect/endSession?id_token_hint=eyJ0eXAiOiJKV1QiLCJraWQ...&client_id=softwarehouse1&post_logout_redirect_uri=http://localhost/"
```

---

## 6. CHANGE LOG

### 6.1 VERSIONE 1.0

- Creazione del documento

---

## 7. APPENDICE B: TERMINI ED ACRONIMI

| Termine | Definizione |
|---------|-------------|
| JSON | JavaScript Object Notation |

---

## Riepilogo Discrepanza redirect_uri

### Nel manuale troviamo:

1. **Sezione 5.2 (Informazioni di Integrazione)** - Tabella:
   - **Redirection URIs**: `https://localhost/` (HTTPS)

2. **Sezione 5.3.2 (AUTHORIZE)** - Esempio curl:
   - **redirect_uri**: `http://localhost/` (HTTP)

3. **Sezione 5.3.3 (ACCESS TOKEN)** - Esempio curl:
   - **redirect_uri**: `http://localhost/` (HTTP)

4. **Sezione 5.5 (LOGOUT)** - Esempio curl:
   - **post_logout_redirect_uri**: `http://localhost/` (HTTP)

### Conclusione

Esiste una **discrepanza** nel manuale:
- La **tabella informativa** (5.2) indica `https://localhost/`
- Tutti gli **esempi pratici** (5.3.2, 5.3.3, 5.5) usano `http://localhost/`

**Gli esempi pratici sono più affidabili** perché mostrano il codice reale funzionante.

**Implementazione attuale**: `http://localhost/` ✅ (come negli esempi curl)

**Problema attuale**: Il server SSO restituisce `redirect_uri_mismatch`, il che significa che il `redirect_uri` `http://localhost/` **NON è registrato** per il `client_id` `AUTODEM.RESCUEMANAGER` nell'ambiente di formazione.

**Azione richiesta**: Contattare ACI/MIT per:
1. Verificare quale `redirect_uri` è stato effettivamente registrato per `AUTODEM.RESCUEMANAGER`
2. Registrare `http://localhost/` se non presente
3. Verificare se è necessario registrare anche `https://localhost/`

