# ANALISI FINALE OIDC vs CDSSO — 10 Marzo 2026

## 1. FLUSSO DOCUMENTATO NEI MANUALI ACI

### Fonte: `SpecificheWS-GestioneDemolitori1.25.md` (Sezione 5)

**Flusso ufficiale: OIDC Authorization Code Flow**

```
Step 1: POST /sso/json/authenticate
  → Input: X-OpenAM-Username, X-OpenAM-Password
  → Output: tokenId (iPlanetDirectoryPro cookie)

Step 2: POST /sso/oauth2/authorize
  → Input: iPlanetDirectoryPro cookie, client_id, scope=openid profile
  → Output: authorization code

Step 3: POST /sso/oauth2/access_token
  → Input: code, client_id, client_secret, grant_type=authorization_code
  → Output: id_token, access_token, refresh_token

Step 4: API call con Bearer id_token
  → Header: Authorization: Bearer <id_token>
```

**Endpoint documentati:**
- Authenticate: `https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate`
- Authorize: `{{baseUrl}}/oauth2/authorize` → `/sso/oauth2/authorize`
- AccessToken: `{{baseUrl}}/oauth2/access_token` → `/sso/oauth2/access_token`

**NON documentati:**
- `/fed/oauth2/*` — **MAI menzionati** nei manuali
- CDSSO flow — **MAI menzionato** come metodo per software house

---

## 2. ENDPOINT `/fed/oauth2/` — ANALISI

### Test eseguiti:
```
GET  https://formazione.ilportaledeltrasporto.it/fed/oauth2/authorize  → 503
POST https://formazione.ilportaledeltrasporto.it/fed/oauth2/access_token → 503
```

### Conclusione:
- **NON documentati** nelle specifiche ufficiali
- **503 Service Unavailable** dopo riavvio pod
- Probabilmente endpoint interni o per altri flussi (non software house)
- **NON dobbiamo segnalarli** — non sono parte del nostro flusso

---

## 3. CDSSO FLOW — ANALISI

### Cosa abbiamo testato:
```
1. GET /rvfu/ con iPlanetDirectoryPro
   → 302 redirect a ssoformazione/authorize con client_id=formazioneAgent
   → agent-authn-tx cookie creato

2. GET ssoformazione/authorize (segue redirect)
   → 200 OK con form HTML contenente id_token (aud=formazioneAgent)

3. POST /agent/cdsso-oauth2 con id_token
   → 302 + Set-Cookie: am-auth-jwt

4. API /rvfu/sh/* con am-auth-jwt
   → 401 + HTTP_SESSION_ATTR_TOKEN=DETO003001 (primo successo!)
   → HTTP_SESSIONITIPOACCESSO= (vuoto → causa 401)
```

### Conclusione:
- CDSSO è un flusso **browser-based** (Cross-Domain Single Sign-On)
- Usato da `/rvfu/` (portale web) per autenticare utenti via browser
- **NON documentato** per software house API
- `client_id=formazioneAgent` ≠ `AUTODEM.RESCUEMANAGER`
- Il nostro flusso è **OIDC programmatico**, non CDSSO browser

---

## 4. HTTP_SESSIONITIPOACCESSO — RICERCA NEI MANUALI

### Risultati grep:
- **0 occorrenze** in `SpecificheWS-GestioneDemolitori1.25.md`
- **0 occorrenze** in tutti i manuali RVFU
- **Solo nei nostri test** (EVIDENZE_TECNICHE_401_RVFU.md, TEST_VERIFICABILE_ACI.md)

### Comportamento osservato:
```
Con CDSSO (am-auth-jwt):
  Set-Cookie: HTTP_SESSION_ATTR_TOKEN=DETO003001;Max-Age=300  ✓ utente riconosciuto
  Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0             ✗ mai valorizzato

Con OIDC (Bearer id_token):
  Set-Cookie: HTTP_SESSION_ATTR_TOKEN=;Max-Age=0              ✗ utente non riconosciuto
  Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0             ✗ mai valorizzato
```

### Conclusione:
- Cookie **lato server** gestito da ForgeRock/Apache agent
- **NON configurabile** da client
- Probabilmente attributo mancante nel profilo utente `DETO003001`
- **ACI deve configurarlo** nel loro IAM

---

## 5. FLUSSO CORRETTO DA USARE

### Secondo i manuali ufficiali:

✅ **OIDC Authorization Code Flow** (quello che stiamo usando)

```bash
# Step 1: Authenticate
POST https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate
Headers:
  Content-Type: application/json
  X-OpenAM-Username: DETO003001
  X-OpenAM-Password: TEST.030
Response:
  { "tokenId": "..." }

# Step 2: Authorize
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize
Data:
  scope=openid profile
  response_type=code
  client_id=AUTODEM.RESCUEMANAGER
  redirect_uri=https://localhost
  state=abc123
  nonce=123abc
  decision=allow
Cookie:
  iPlanetDirectoryPro=<tokenId>
Response:
  Location: https://localhost?code=<authorization_code>

# Step 3: Access Token
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token
Data:
  grant_type=authorization_code
  code=<authorization_code>
  client_id=AUTODEM.RESCUEMANAGER
  client_secret=e3abea315f8d7acffca73941c6a0de2197068d15
  redirect_uri=https://localhost
Response:
  { "id_token": "...", "access_token": "...", "refresh_token": "..." }

# Step 4: API Call
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?...
Headers:
  Authorization: Bearer <id_token>
  Accept: application/json
```

---

## 6. PROBLEMA ATTUALE

### Flusso OIDC funziona al 75%:
- ✅ Step 1: authenticate → tokenId ottenuto
- ✅ Step 2: authorize → authorization code ottenuto
- ✅ Step 3: access_token → id_token ottenuto
- ❌ Step 4: API call → **401 Unauthorized**

### Causa root:
```
Il server Apache/ForgeRock agent su /rvfu/sh/ NON riconosce il Bearer token
perché:
1. Policy ForgeRock per client_id=AUTODEM.RESCUEMANAGER non configurata
2. Attributo HTTP_SESSIONITIPOACCESSO non popolato per utente DETO003001
```

---

## 7. COSA SEGNALARE AD ACI

### ❌ NON segnalare:
- `/fed/oauth2/` endpoints (non documentati, non nostri)
- CDSSO flow (non è il nostro flusso)

### ✅ SEGNALARE:

**Problema 1: Bearer token non accettato su /rvfu/sh/**
- Flusso OIDC completo eseguito secondo manuale ufficiale
- id_token ottenuto con successo (aud=AUTODEM.RESCUEMANAGER)
- API /rvfu/sh/* restituisce 401 con Bearer id_token
- Cookie HTTP_SESSIONITIPOACCESSO mai valorizzato

**Domanda specifica:**
- La policy ForgeRock per `client_id=AUTODEM.RESCUEMANAGER` è configurata su `/rvfu/sh/*`?
- L'attributo "tipo accesso" è configurato per l'utente `DETO003001`?
- Quale valore deve avere `HTTP_SESSIONITIPOACCESSO` per software house demolitori?

---

## 8. TEST FINALE DA ESEGUIRE

Prima di inviare email, eseguire test OIDC pulito secondo manuale:

```bash
# Test completo con endpoint documentati
1. POST ssoformazione.../sso/json/authenticate
2. POST ssoformazione.../sso/oauth2/authorize (con iPlanetDirectoryPro)
3. POST ssoformazione.../sso/oauth2/access_token
4. GET formazione.../rvfu/sh/cr/veicolo (con Bearer id_token)
```

Verificare se il problema persiste con endpoint esatti del manuale.
