# RVFU 401 Unauthorized - Analisi Completa

**Data:** 26 Febbraio 2026 (aggiornato)
**Ambiente:** Formazione RVFU ACI  
**Client:** AUTODEM.RESCUEMANAGER

---

## 1. URL e Configurazione

### URL Confermato da ACI Informatica
```
Formazione CR: https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/consulta
SSO:           https://ssoformazione.ilportaledeltrasporto.it/sso
```

### Credenziali CORRETTE (confermate da ACI 26/02/2026)
```
client_id:      AUTODEM.RESCUEMANAGER
client_secret:  e3abea315f8d7acffca73941c6a0de2197068d15
Username:       DETO000301
Password:       TEST.003
redirect_uri:   https://localhost/
```

---

## 2. Flusso Autenticazione OAuth2 (FUNZIONANTE ✅)

### Step 1: Authenticate → 200 OK ✅
```http
POST https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate
Headers:
  Content-Type: application/json
  X-OpenAM-Username: DETO000301
  X-OpenAM-Password: TEST.003

Response: 200 OK
{
  "tokenId": "y6MBgffJs-5aw3xj6eTGKOZfjlY.*...",  // 114 char
  "successUrl": "/sso/console",
  "realm": "/"
}
```

### Step 2: Authorize → 302 Redirect ✅
```http
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize
Headers:
  Cookie: iPlanetDirectoryPro=y6MBgffJs-5aw3xj6eTGKOZfjlY.*...
Body (form):
  scope=openid profile
  response_type=code
  client_id=AUTODEM.RESCUEMANAGER
  redirect_uri=https://localhost/
  state=abc123
  nonce=123abc
  decision=allow

Response: 302 Redirect → https://localhost/?code=vry85tADHyyKUE-c1mg7X6Gw76k.AMMTlQNHGb3PpJdPorbm0YspgJg&...
```

### Step 3: Token Exchange → 200 OK ✅
```http
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=authorization_code
  code=vry85tADHyyKUE-c1mg7X6Gw76k.AMMTlQNHGb3PpJdPorbm0YspgJg
  client_id=AUTODEM.RESCUEMANAGER
  client_secret=e3abea315f8d7acffca73941c6a0de2197068d15
  redirect_uri=https://localhost/

Response: 200 OK
{
  "access_token": "vry85tADHyyKUE-c1mg7X6Gw76k.XqIUrAFQh5s2o8ghRAmqMwuciQo",  // 55 char (opaque)
  "refresh_token": "vry85tADHyyKUE-c1mg7X6Gw76k.jis-JZDZs-Ou0IDcCqbNrDqrRa4",
  "scope": "openid profile",
  "id_token": "eyJ0eXAiOiJKV1QiLCJraWQiOi...",  // 1210 char (JWT)
  "token_type": "Bearer",
  "expires_in": 1799
}
```

**Token JWT Decodificato (id_token):**
```json
{
  "sub": "DETO000301",
  "aud": "AUTODEM.RESCUEMANAGER",
  "iss": "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2",
  "name": "DEMOLITORI - OMICRON SISTEMI",
  "family_name": "DETO000301",
  "tokenName": "id_token",
  "tokenType": "JWTToken",
  "exp": 1772160063,
  "iat": 1772134863
}
```

---

## 3. Chiamata API RVFU → 401 ❌

### Matrice Test Completa (26/02/2026)

| # | Token tipo | Cookie | Risultato |
|---|-----------|--------|-----------|
| 1 | id_token (JWT, 1210 char) | iPlanetDirectoryPro | **401** |
| 2 | id_token (JWT, 1210 char) | NESSUNO | **401** |
| 3 | access_token (opaque, 55 char) | NESSUNO | **401** |

**Tutti i test con credenziali corrette (DETO000301, client_secret lungo).**

### Request (Test 2 - Solo Bearer, no cookie)
```http
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY
Headers:
  Authorization: Bearer eyJ0eXAiOiJKV1QiLCJraWQiOi...  (id_token JWT, 1210 char)
```

### Response (identica per tutti i test)
```http
HTTP/1.1 401 Unauthorized
Server: Apache
Content-Type: text/html; charset=UTF-8
Strict-Transport-Security: max-age=3600
X-Permitted-Cross-Domain-Policies: none
Set-Cookie: HTTP_SESSION_ATTR_TOKEN=;Max-Age=0;Path=/
Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0;Path=/

<html>
<head><title>401 Authorization Required</title></head>
<body>
<center><h1>401 Authorization Required</h1></center>
<hr><center>nginx</center>
</body>
</html>
```

**Note:**
- Nessun header `WWW-Authenticate`
- Server: Apache (con nginx dietro)
- La risposta è identica con/senza cookie, con id_token/access_token
- Il Web Agent cancella i cookie di sessione (`Max-Age=0`)

---

## 4. Analisi

Il 401 viene dal **Web Agent Apache/ForgeRock** PRIMA che la richiesta arrivi all'applicazione backend (nginx).

Il fatto che **nessuna combinazione** di token + cookie funzioni suggerisce che:
1. Il nostro IP non è nella whitelist del Web Agent per `/rvfu/sh`
2. ACI accede da una rete interna diversa (VPN ACI / rete DMZ)
3. Serve un header specifico aggiuntivo non documentato
4. L'endpoint `/cr/veicolo` non esiste su `/rvfu/sh` (ACI ha menzionato solo `/cr/consulta`)

---

## 5. Domande per ACI Informatica

1. **Network:** Da quale rete/IP avete testato il curl che funziona? Il nostro IP è nella whitelist per `/rvfu/sh`?
2. **Endpoint esatto:** Qual è l'URL completo della chiamata API che funziona nel vostro test? (`/rvfu/sh/cr/veicolo` o `/rvfu/sh/cr/consulta`?)
3. **Curl completo:** Potete condividere il curl completo (step 4: chiamata API) che usate dopo il token exchange? Inclusi tutti gli header.
4. **Bearer token:** Nella chiamata API, usate `id_token` (JWT lungo ~1210 char) o `access_token` (opaque ~55 char)?

---

## 6. Fix Applicati

### ✅ Credenziali corrette (26/02)
- `client_secret`: `e3abea315f8d7acffca73941c6a0de2197068d15` (era `R2Y2L9T2`)
- `username`: `DETO000301` (era `DETO003001`)
- `password`: `TEST.003` (era `TEST.030`)

### ✅ Token Exchange via IPC
- Il token exchange avviene nel main process Electron via `net.request` (ha accesso VPN)
- Il vero `id_token` JWT (1210 char) viene salvato correttamente

### ✅ URL Base
- Aggiornato a `https://formazione.ilportaledeltrasporto.it/rvfu/sh`

### ✅ Routing Bearer JWT
- `/rvfu/sh` usa `net.request` + Bearer token diretto (no CDSSO BrowserWindow)
