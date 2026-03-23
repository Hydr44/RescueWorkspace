# Studio Completo Flusso OIDC RVFU

> Documento di studio per capire la logica e rispondere autonomamente

---

## PARTE 1 — Cos'è OIDC e perché lo usiamo

### OpenID Connect (OIDC) in 3 concetti

**1. È un protocollo di autenticazione** (chi sei?)
- Costruito sopra OAuth2 (che è per autorizzazione: cosa puoi fare?)
- Usato da Google, Microsoft, Facebook per "Login con..."
- Standard industriale per Single Sign-On (SSO)

**2. Usa JWT (JSON Web Token)**
- Token firmato digitalmente che contiene informazioni sull'utente
- Non serve chiamare il server ogni volta per verificare — il token è autosufficiente
- Ha una scadenza (`exp` claim)

**3. Flusso Authorization Code**
- Il più sicuro per applicazioni desktop/server
- Richiede `client_secret` (che l'utente non vede mai)
- In 3 step: authenticate → authorize → exchange token

---

## PARTE 2 — I 3 step del flusso (la logica)

### STEP 1: `/authenticate` — Ottenere il tokenId

**Cosa fa:**
```
Client → Server SSO: "Sono l'utente DETO003001 con password TEST.030"
Server SSO → Client: "OK, ecco il tuo tokenId (sessione SSO)"
```

**Perché serve:**
- Il tokenId è come un "biglietto d'ingresso" temporaneo
- Viene usato come cookie `iPlanetDirectoryPro` per il prossimo step
- Dimostra che l'utente ha fatto login con successo

**Dettagli tecnici:**
```bash
POST /sso/json/authenticate
Headers:
  X-OpenAM-Username: DETO003001
  X-OpenAM-Password: TEST.030
  Accept-API-Version: resource=2.0, protocol=1.0

Risposta:
{
  "tokenId": "AQIC5wM2LY4Sfcz...",  ← questo è il cookie SSO
  "successUrl": "/console",
  "realm": "/"
}
```

**Cosa può andare storto:**
- Credenziali sbagliate → HTTP 401
- Server SSO non raggiungibile → timeout/network error
- VPN non attiva → DNS resolution error

---

### STEP 2: `/authorize` — Ottenere l'authorization code

**Cosa fa:**
```
Client → Server OAuth2: "Sono autenticato (ecco tokenId), voglio accedere come AUTODEM.RESCUEMANAGER"
Server OAuth2 → Client: "OK, ecco un authorization code temporaneo"
```

**Perché serve:**
- L'authorization code è un "voucher" monouso
- Dura pochi minuti (tipicamente 5-10 minuti)
- Serve per ottenere i token veri (id_token, access_token) nel prossimo step

**Dettagli tecnici:**
```bash
POST /sso/oauth2/authorize
Cookie: iPlanetDirectoryPro=<tokenId>  ← dal step 1
Body:
  scope=openid profile
  response_type=code
  client_id=AUTODEM.RESCUEMANAGER
  redirect_uri=https://localhost/
  decision=allow  ← l'utente acconsente
  csrf=<tokenId>  ← protezione CSRF
  nonce=n1234567890  ← protezione replay attack

Risposta:
HTTP 302 Found
Location: https://localhost/?code=abc123xyz&state=...
                                  ↑
                            authorization code
```

**Cosa può andare storto:**
- Cookie iPlanetDirectoryPro mancante → redirect a pagina login
- client_id non registrato → error=invalid_client
- redirect_uri non registrato → error=invalid_request
- tokenId scaduto → redirect a pagina login

---

### STEP 3: `/access_token` — Scambiare il code con i token JWT

**Cosa fa:**
```
Client → Server OAuth2: "Ecco il code, sono AUTODEM.RESCUEMANAGER (prova: client_secret)"
Server OAuth2 → Client: "OK, ecco id_token (chi sei) e access_token (cosa puoi fare)"
```

**Perché serve:**
- I token JWT sono la "chiave" per chiamare le API
- `id_token` contiene informazioni sull'utente (sub, aud, iss, exp)
- `access_token` è per autorizzazione (scopes, permissions)
- `refresh_token` serve per rinnovare i token quando scadono

**Dettagli tecnici:**
```bash
POST /sso/oauth2/access_token
Body:
  grant_type=authorization_code
  code=<authorization_code>  ← dal step 2
  client_id=AUTODEM.RESCUEMANAGER
  client_secret=e3abea315f8d7acffca73941c6a0de2197068d15
  redirect_uri=https://localhost/

Risposta:
{
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "abc123...",
  "expires_in": 3600,  ← secondi (1 ora)
  "token_type": "Bearer"
}
```

**Cosa può andare storto:**
- Code già usato → error=invalid_grant
- Code scaduto → error=invalid_grant
- client_secret sbagliato → HTTP 401
- redirect_uri diverso da step 2 → error=invalid_grant

---

## PARTE 3 — Struttura del JWT (id_token)

### Come è fatto un JWT

Un JWT ha 3 parti separate da `.`:

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJERVRPMDAzMDAxIiwiYXVkIjoiQVVUT0RFTS5SRVNDVUVNQU5BR0VSIn0.firma_digitale
│                                      │                                                                  │
│                                      │                                                                  └─ SIGNATURE
│                                      └─ PAYLOAD (dati utente)
└─ HEADER (algoritmo)
```

### Decodifica del PAYLOAD (parte centrale)

```json
{
  "sub": "DETO003001",                    ← subject (chi è autenticato)
  "aud": "AUTODEM.RESCUEMANAGER",         ← audience (per chi è il token)
  "iss": "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2",  ← issuer (chi l'ha emesso)
  "exp": 1741600000,                      ← expiration (timestamp Unix)
  "iat": 1741596400,                      ← issued at (quando emesso)
  "at_hash": "abc123...",                 ← hash dell'access_token
  "nonce": "n1741596400"                  ← protezione replay
}
```

**Cosa significa:**
- `sub` = l'utente DETO003001 (agenzia demolitori test)
- `aud` = il token è valido SOLO per il client AUTODEM.RESCUEMANAGER
- `iss` = emesso dal server SSO di formazione ACI
- `exp` = scade il 07/03/2026 alle 10:00 UTC (esempio)

**Come verificare il token:**
1. Controlla la firma digitale (con chiave pubblica del server)
2. Controlla che `aud` corrisponda al tuo `client_id`
3. Controlla che `exp` sia nel futuro (non scaduto)
4. Controlla che `iss` sia il server SSO corretto

---

## PARTE 4 — Chiamata API con Bearer token

### Come si usa il token

```bash
GET /rvfu/sh/cr/veicolo?tipoVeicolo=A&targa=VA076AJ&causale=D
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
                      ↑
                   id_token dal step 3
Accept: application/json
```

**Cosa dovrebbe succedere:**
1. Il gateway API riceve la richiesta
2. Estrae il token dall'header `Authorization: Bearer ...`
3. Verifica la firma del JWT
4. Controlla che `aud` sia autorizzato per `/rvfu/sh/*`
5. Controlla che `exp` non sia scaduto
6. Se tutto OK → inoltra la richiesta al backend
7. Backend risponde con i dati del veicolo

**Cosa succede invece (il problema):**
1. Il gateway API riceve la richiesta
2. **NON riconosce il token** (policy mancante)
3. Risponde HTTP 401 Unauthorized
4. Imposta cookie vuoti: `HTTP_SESSION_ATTR_TOKEN=;Max-Age=0`

---

## PARTE 5 — Perché fallisce (analisi tecnica)

### Architettura server ACI

```
Internet
   │
   ▼
Reverse Proxy (nginx/Apache)
   │
   ├─ /rvfu/          → CDSSO (browser web, redirect)
   │                     Policy: "session-based authentication"
   │
   └─ /rvfu/sh/       → API Gateway (Bearer token)
                         Policy: "OAuth2 Resource Server"
                         ↓
                      ❌ MANCA QUESTA POLICY per AUTODEM.RESCUEMANAGER
```

### Cosa manca lato server

**1. Policy ForgeRock per Bearer token**
```
Resource: /rvfu/sh/*
Client: AUTODEM.RESCUEMANAGER
Token type: JWT Bearer
Validation: RS256 signature + aud claim
```

**2. Attributo HTTP_SESSIONITIPOACCESSO**
```
User: DETO003001
Attribute: tipo_accesso = "CR"  (Centro di Raccolta)
```
Questo attributo serve per sapere che tipo di operatore è (CR, Agenzia, Frantumatore, ecc.)

**3. JWT Bearer profile**
```
Client: AUTODEM.RESCUEMANAGER
Grant types: authorization_code, refresh_token
Token endpoint auth: client_secret_post
Resource server: /rvfu/sh/*
```

---

## PARTE 6 — Differenza tra OIDC e CDSSO

### OIDC (quello che usiamo)

**Per:** Applicazioni desktop/server (software house)
**Flusso:** 3 step programmatici (no browser)
**Token:** JWT Bearer (stateless)
**Vantaggio:** Scalabile, sicuro, standard

```
App Desktop → SSO API → Token JWT → API Gateway
```

### CDSSO (Cross-Domain SSO)

**Per:** Portali web (browser)
**Flusso:** Redirect browser + cookie di sessione
**Token:** Cookie `am-auth-jwt` (stateful)
**Vantaggio:** UX seamless per utenti browser

```
Browser → Portale Web → Redirect SSO → Cookie sessione → Portale Web
```

**Perché non usiamo CDSSO:**
- Richiede browser (noi siamo app desktop)
- Cookie di sessione hanno timeout brevi
- Non è documentato per software house nel manuale ACI

---

## PARTE 7 — Come rispondere alle domande comuni

### "Perché non usate il portale web?"
> Il portale web è per utenti umani che navigano con browser. Noi siamo un'applicazione desktop che deve automatizzare le operazioni (es. registrare 100 VFU al giorno). Il manuale ACI Sezione 5 descrive il flusso OIDC Authorization Code per software house.

### "Il token è valido?"
> Sì, l'introspection sul server SSO conferma `active: true`. Il problema non è il token, ma la policy del gateway API che non lo riconosce.

### "Avete provato con access_token invece di id_token?"
> Sì, stesso risultato HTTP 401. Il manuale ACI Sezione 5.3 punto 7 dice: "Il Client chiama l'API Gateway passando l'IDToken (Bearer)".

### "Funziona in produzione?"
> No, stesso problema. Abbiamo testato solo formazione perché le credenziali di produzione non ci sono ancora state fornite, ma l'architettura è identica.

### "Avete controllato i log?"
> Noi non abbiamo accesso ai log del server ACI. Possiamo fornire timestamp precisi delle nostre richieste per aiutarvi a trovarle nei vostri log.

### "Il cookie HTTP_SESSIONITIPOACCESSO è vuoto?"
> Sì, sempre `Max-Age=0` (azzerato). Con CDSSO il cookie `HTTP_SESSION_ATTR_TOKEN` viene valorizzato con "DETO003001", ma `HTTP_SESSIONITIPOACCESSO` resta vuoto anche lì. Questo suggerisce che l'attributo tipo-accesso non è configurato nel profilo LDAP dell'utente.

---

## PARTE 8 — Codice: dove avviene cosa

### File: `src/lib/rvfu-auth.ts`

**Classe:** `RVFUAuthService`

**Metodi principali:**
```typescript
authenticate(username, password)  // Esegue i 3 step OIDC
  ├─ step1_authenticate()         // POST /authenticate → tokenId
  ├─ step2_authorize()            // POST /authorize → code
  └─ step3_exchangeToken()        // POST /access_token → tokens

getAuthHeader()                   // Restituisce "Bearer <id_token>"
isAuthenticated()                 // Controlla se token è valido (non scaduto)
refreshTokens()                   // Rinnova token con refresh_token
logout()                          // Invalida sessione SSO
```

**Storage:**
- Token salvati in `sessionStorage` (chiave: `rvfu_tokens`)
- Credenziali salvate in `sessionStorage` (chiave: `rvfu_credentials`)
- Quando chiudi l'app, i token vengono persi (devi rifare login)

---

### File: `src/lib/rvfu-client.ts`

**Classe:** `RVFUClient`

**Metodi principali:**
```typescript
verificaVeicolo(params)           // GET /cr/veicolo
registraVFUConcessionario(payload) // POST /cr/VFU
consultaVFUConcessionario(filters) // GET /cr/consulta/VFU
dettaglioVFU(idVFU)               // GET /cr/VFU?idVFU=...
generaCDR(idVFU)                  // POST /cr/genera/certificatoRottamazione
```

**Metodo core:**
```typescript
makeRequest(endpoint, options)
  ├─ Costruisce URL completo
  ├─ Aggiunge header Authorization: Bearer <token>
  ├─ Prova IPC Electron (main process con VPN)
  │   └─ window.api.rvfu.apiCallDirect()
  └─ Fallback: fetch() diretto (renderer)
```

---

### File: `electron/ipc-modules/rvfu.js`

**Handler IPC:** `rvfu:open-auth-window`
- Apre BrowserWindow per step 2 (authorize)
- Gestisce cookie `iPlanetDirectoryPro`
- Cattura il redirect con `code` dall'URL

**Handler IPC:** `rvfu:api-call-direct`
- Usa `net.request` del main process
- Ha accesso alla VPN (renderer no)
- Gestisce cookie di sessione automaticamente

**Perché serve Electron:**
- Browser web ha CORS → non può chiamare `formazione.ilportaledeltrasporto.it`
- Browser web non ha VPN → DNS non risolve hostname interni
- Electron main process bypassa CORS e ha accesso VPN

---

## PARTE 9 — Troubleshooting rapido

| Sintomo | Causa probabile | Soluzione |
|---------|----------------|-----------|
| Step 1 → 401 | Credenziali sbagliate | Verifica username/password |
| Step 2 → redirect a login | Cookie mancante | Verifica che tokenId sia passato |
| Step 2 → error=invalid_client | client_id non registrato | Contatta ACI per registrazione |
| Step 3 → 401 | client_secret sbagliato | Verifica il secret (40 char hex) |
| Step 3 → invalid_grant | Code scaduto/usato | Riparti da step 2 |
| Step 4 → 401 | Policy mancante | **Il nostro problema attuale** |
| Step 4 → 403 | IP bloccato | Verifica VPN attiva |
| Step 4 → timeout | VPN non attiva | Attiva VPN ACI |

---

## PARTE 10 — Checklist per la chiamata

### Prima della chiamata
- [ ] VPN ACI attiva
- [ ] Script `/tmp/test-rvfu-chiamata-live.sh` pronto
- [ ] Terminale aperto e pronto
- [ ] Documento `PREPARAZIONE_CHIAMATA_ACI.md` aperto
- [ ] Credenziali test a portata di mano

### Durante la chiamata
- [ ] Esegui lo script step by step
- [ ] Leggi i timestamp ad alta voce
- [ ] Mostra i JWT decodificati
- [ ] Mostra gli header di risposta completi
- [ ] Fai le 4 domande chiave (vedi sotto)

### Domande da fare
1. **Policy ForgeRock:** È configurata una policy OAuth2 Resource Server per `AUTODEM.RESCUEMANAGER` sul path `/rvfu/sh/*`?
2. **Attributo profilo:** L'utente `DETO003001` ha l'attributo `HTTP_SESSIONITIPOACCESSO` valorizzato nel profilo LDAP?
3. **Log server:** Nei log Apache del timestamp `[fornisci timestamp preciso]`, vedete la nostra richiesta con Bearer token?
4. **JWT Bearer profile:** Il client `AUTODEM.RESCUEMANAGER` ha il JWT Bearer profile abilitato in ForgeRock?

### Dopo la chiamata
- [ ] Annota le risposte dei sistemisti
- [ ] Se danno fix → richiedi timeline
- [ ] Se serve test → chiedi accesso a ambiente di test
- [ ] Invia email di riepilogo con timestamp e domande

---

## RIEPILOGO CONCETTI CHIAVE

**OIDC = 3 step:**
1. Authenticate → tokenId (cookie SSO)
2. Authorize → code (voucher monouso)
3. Exchange → id_token + access_token (JWT)

**JWT = 3 parti:**
1. Header (algoritmo)
2. Payload (dati utente: sub, aud, iss, exp)
3. Signature (firma digitale)

**API call = 1 header:**
```
Authorization: Bearer <id_token>
```

**Problema = policy mancante:**
- Il gateway non valida Bearer token per `AUTODEM.RESCUEMANAGER`
- L'attributo `HTTP_SESSIONITIPOACCESSO` non è configurato
- Serve intervento sistemisti ACI lato ForgeRock

**Soluzione = configurazione server:**
1. Aggiungere policy OAuth2 Resource Server
2. Valorizzare attributo tipo-accesso nel profilo
3. Abilitare JWT Bearer profile per il client
