# EMAIL FINALE AD ACI — 10 Marzo 2026

**Oggetto:** RE: Supporto RVFU - Nuovi test effettuati - Errore persiste invariato

---

Gentile Supporto SWHouse,

in seguito al riavvio dei pod effettuato il 10/03, abbiamo eseguito immediatamente nuovi test seguendo **esattamente** il flusso OIDC documentato nel manuale "SpecificheWS-GestioneDemolitori1.25.md" (Sezione 5). L'errore 401 persiste invariato.

---

## CONFRONTO TEST: 09/03/2026 vs 10/03/2026

| | Test del 09/03 | Test del 10/03 (post-riavvio) |
|---|---|---|
| Timestamp | 2026-03-09T08:56:05Z | 2026-03-10T11:01:13Z |
| Step 1 authenticate | ✅ HTTP 200 | ✅ HTTP 200 |
| Step 2 authorize | ✅ HTTP 302 | ✅ HTTP 302 |
| Step 3 access_token | ✅ HTTP 200, id_token ottenuto | ✅ HTTP 200, id_token ottenuto |
| Step 4 API call | ❌ HTTP 401 | ❌ HTTP 401 |
| Server risposta | Apache | Apache |
| HTTP_SESSION_ATTR_TOKEN | `` (vuoto, Max-Age=0) | `` (vuoto, Max-Age=0) |
| HTTP_SESSIONITIPOACCESSO | `` (vuoto, Max-Age=0) | `` (vuoto, Max-Age=0) |

Il comportamento è **identico** prima e dopo il riavvio dei pod.

---

## DETTAGLIO TEST DEL 10/03/2026

### ✅ Step 1: Authenticate
```
POST https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate
Headers: X-OpenAM-Username: DETO003001 / X-OpenAM-Password: TEST.030
→ HTTP 200, tokenId ottenuto
```

### ✅ Step 2: Authorize
```
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize
Data: scope=openid profile, response_type=code, client_id=AUTODEM.RESCUEMANAGER
      redirect_uri=https://localhost/, decision=allow
Cookie: iPlanetDirectoryPro=<tokenId>
→ HTTP 302, authorization code ottenuto
```

### ✅ Step 3: Access Token
```
POST https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token
Data: grant_type=authorization_code, client_id=AUTODEM.RESCUEMANAGER
      client_secret=e3abea315f8d7acffca73941c6a0de2197068d15
→ HTTP 200, id_token JWT ottenuto
  Payload: { "sub": "DETO003001", "aud": "AUTODEM.RESCUEMANAGER",
             "iss": "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2" }
```

### ❌ Step 4: API Call
```
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo
    ?tipoVeicolo=A&targa=VA076AJ&causale=D
Authorization: Bearer <id_token>

HTTP/1.1 401 Unauthorized
Server: Apache
Date: Tue, 10 Mar 2026 11:01:13 GMT
Set-Cookie: HTTP_SESSION_ATTR_TOKEN=;Max-Age=0;Expires=Thu, 01-Jan-1970 00:00:01 GMT
Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0;Expires=Thu, 01-Jan-1970 00:00:01 GMT
```

---

## ANALISI

Il flusso OIDC è implementato **correttamente secondo il manuale** (Sezione 5.3). Il problema si verifica esclusivamente allo step 4, dove il Bearer id_token non viene accettato da `/rvfu/sh/`.

Elementi significativi:
- **`HTTP_SESSION_ATTR_TOKEN` sempre vuoto** (Max-Age=0): il server non riconosce il token
- **`HTTP_SESSIONITIPOACCESSO` mai valorizzato**: attributo non trovato nel profilo utente
- Il problema è **identico su tutti i 28 endpoint** testati sotto `/rvfu/sh/*`

---

## DOMANDE SPECIFICHE

1. La policy ForgeRock per il client `AUTODEM.RESCUEMANAGER` è configurata per accedere a `/rvfu/sh/*`?

2. L'attributo `HTTP_SESSIONITIPOACCESSO` deve essere configurato nel profilo dell'utente `DETO003001`? Se sì, quale valore deve avere per una Software House demolitori?

3. Nei vostri log Apache del **10/03/2026 ore 11:01:13 UTC**, la richiesta con Bearer token per `DETO003001` risulta ricevuta? Se sì, quale errore viene registrato?

---

Restiamo a disposizione per qualsiasi ulteriore test o informazione.

Cordiali saluti,

Emmanuel Scozzarini
RescueManager – Software House
P.IVA 02166430856
info@rescuemanager.eu
