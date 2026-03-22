# 🔧 Correzioni Implementazione Autenticazione RVFU

## Problema Identificato

I test fallivano perché il codice utilizzava **URL e configurazioni errate** rispetto alle specifiche ufficiali.

## Correzioni Applicate

### 1. URL Base SSO (Autenticazione)

**Prima (ERRATO):**
- `https://gestione-veicolo-fuoriuso-tst.serviziaci.it`

**Dopo (CORRETTO):**
- **Formazione**: `https://ssoformazione.ilportaledeltrasporto.it/sso`
- **Produzione**: `https://sso.ilportaledeltrasporto.it/sso`

**Fonte**: SpecificheWS-GestioneDemolitori1.25.md, sezione 5.1.1.2

### 2. Header Accept-API-Version

**Aggiunto header obbligatorio** all'endpoint `/json/authenticate`:
```
Accept-API-Version: resource=2.0, protocol=1.0
```

### 3. Metodo /authorize

**Prima (ERRATO):**
- GET con parametri in query string

**Dopo (CORRETTO):**
- **POST** con parametri nel body (FormData)
- Parametri richiesti:
  - `scope=openid profile`
  - `response_type=code`
  - `client_id`
  - `csrf=tokenId` (tokenId dalla risposta /authenticate)
  - `redirect_uri`
  - `state=abc123`
  - `nonce=123abc`
  - `decision=allow`

### 4. Gestione Risposta /authenticate

**Prima (ERRATO):**
- Tentativo di estrarre cookie da `Set-Cookie` header

**Dopo (CORRETTO):**
- Estrazione di `tokenId` dalla risposta JSON
- Il `tokenId` corrisponde al valore del cookie `iPlanetDirectoryPro`

### 5. Credenziali da Usare

**IMPORTANTE**: Usare le credenziali di **AGENZIA**, non quelle VPN!

**Credenziali Agenzia (dal file Leggimi):**
- Matricola: `DETO003001`
- Password: `TEST.030`

**Credenziali Software House (per Client ID/Secret):**
- Codice Software House: `AUTODEM.RESCUEMANAGER`
- Codice di Sicurezza: `R2Y2L9T2`

### 6. URL API REST

**Corretto**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80` (HTTP, porta 80)

Gli endpoint REST sono sotto `/demolitori-aci-ws/rest/...`

## File Modificati

1. `desktop-app/greeting-friend-api-main/src/lib/rvfu-auth.ts`
   - Corretto `baseUrl` per SSO
   - Aggiunto header `Accept-API-Version`
   - Corretto metodo `/authorize` (POST invece di GET)
   - Corretto parsing risposta `/authenticate` (tokenId invece di cookie)

2. `desktop-app/greeting-friend-api-main/src/lib/rvfu-client.ts`
   - Corretto `baseUrl` per API REST (HTTP porta 80)

3. `moduli/demolizioni/test-rvfu-from-browser.html`
   - Aggiornato per usare URL corretti
   - Aggiunto esempio con credenziali agenzia

## Flusso Autenticazione Corretto

1. **POST** `/sso/json/authenticate`
   - Headers: `X-OpenAM-Username`, `X-OpenAM-Password`, `Accept-API-Version: resource=2.0, protocol=1.0`
   - Risposta: JSON con `tokenId`

2. **POST** `/sso/oauth2/authorize`
   - Cookie: `iPlanetDirectoryPro={tokenId}`
   - Body: FormData con parametri (scope, response_type, client_id, csrf=tokenId, ecc.)
   - Risposta: Redirect con `code` nella query string

3. **POST** `/sso/oauth2/access_token`
   - Body: FormData con `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, ecc.
   - Risposta: JSON con `id_token`, `access_token`, `refresh_token`

4. **Chiamate API REST**
   - Header: `Authorization: Bearer {id_token}`
   - Base URL: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80`

## Test Consigliati

1. Test endpoint SSO `/json/authenticate` con credenziali agenzia
2. Verifica che la risposta contenga `tokenId`
3. Test completo flusso OAuth2
4. Test chiamata API REST con `id_token` ottenuto

## Note Importanti

- **VPN**: Deve essere connessa a `ilportaledellautomobilista.it/utentiMCTC`
- **CORS**: Le chiamate possono fallire per CORS se testate dal browser. Usare l'app Electron.
- **Scope**: Usare `openid profile` (non `openid profile rvfu`)

## Riferimenti

- SpecificheWS-GestioneDemolitori1.25.md
- Sezione 5.3: Flusso di Autenticazione
- Sezione 5.3.1: AUTHENTICATE
- Sezione 5.3.2: AUTHORIZE

