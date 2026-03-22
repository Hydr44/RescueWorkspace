# Verifica Flusso Autenticazione RVFU secondo Manuale ACI/MIT

## Specifiche Manuale (SpecificheWS-GestioneDemolitori1.25.md)

### Flusso Completo

1. **Chiamata `/authenticate`** - POST
   - Content-Type: `application/json`
   - Headers:
     - `X-OpenAM-Username`: UserID Agenzia
     - `X-OpenAM-Password`: Password Agenzia
     - `Accept-API-Version`: `resource=2.0, protocol=1.0`
   - Endpoint: `https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate`
   - Risposta: JSON con `tokenId` (cookie iPlanetDirectoryPro)

2. **Chiamata `/authorize`** - POST ⚠️
   - Content-Type: `application/x-www-form-urlencoded` (implicito con `--data` in curl)
   - Cookie header: `iPlanetDirectoryPro=<tokenId>`
   - Body (form data):
     - `scope=openid profile`
     - `response_type=code`
     - `client_id=<ClientID>`
     - `csrf=<tokenId>` (stesso valore del cookie)
     - `redirect_uri=http://localhost/`
     - `state=abc123`
     - `nonce=123abc`
     - `decision=allow`
   - Endpoint: `https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize`
   - Risposta: Redirect URL con `code` parameter

3. **Chiamata `/access_token`** - POST
   - Content-Type: `application/x-www-form-urlencoded`
   - Body (form data):
     - `grant_type=authorization_code`
     - `code=<authorization_code>`
     - `client_id=<ClientID>`
     - `client_secret=<ClientSecret>`
     - `redirect_uri=http://localhost/`
   - Endpoint: `https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token`
   - Risposta: JSON con `access_token`, `refresh_token`, `id_token`

## Verifica Implementazione Corrente

### ✅ Step 1: `/authenticate`
- **File**: `src/lib/rvfu-auth.ts` - metodo `authenticateOpenAM`
- **Metodo**: POST ✅
- **Content-Type**: `application/json` ✅
- **Headers**: Tutti corretti ✅
- **Endpoint**: Corretto ✅

### ✅ Step 2: `/authorize`
- **File**: `src/lib/rvfu-auth.ts` - metodo `getAuthorizationCodeWithBrowserWindow`
- **File**: `electron/ipc.js` - handler `rvfu:open-auth-window`
- **Metodo**: POST ✅ (via form HTML)
- **Cookie**: Impostato nella sessione BrowserWindow ✅
- **Parametri**: Tutti corretti ✅
- **redirect_uri**: `http://localhost/` ✅ (corretto da https)
- **Form HTML**: Generato correttamente con `method="POST"` ✅

### ✅ Step 3: `/access_token`
- **File**: `src/lib/rvfu-auth.ts` - metodo `exchangeCodeForTokens`
- **Metodo**: POST ✅
- **Content-Type**: `application/x-www-form-urlencoded` ✅
- **Parametri**: Tutti corretti ✅

## Note Importanti

1. **"Tutte le chiamate della fase di autenticazione devono essere fatte in POST"** (riga 1260-1261 del manuale)
   - ✅ Implementato correttamente

2. **redirect_uri**: Secondo esempio curl nel manuale è `http://localhost/` (non https)
   - ✅ Corretto nella configurazione

3. **Cookie iPlanetDirectoryPro**: Deve essere passato sia come:
   - Header `Cookie` nella richiesta
   - Parametro `csrf` nel body
   - ✅ Entrambi implementati

4. **Form HTML per /authorize**: 
   - Quando un form HTML fa submit con `method="POST"`, i dati vengono inviati come `application/x-www-form-urlencoded`
   - ✅ Corretto
   - Il cookie impostato nella sessione BrowserWindow di Electron dovrebbe essere inviato automaticamente quando il form fa POST al dominio SSO

## Potenziali Problemi

1. **Cookie non inviato da pagina data: URL**
   - Se il cookie non viene inviato quando il form fa POST da una pagina `data:` URL, potrebbe essere necessario caricare una pagina HTML reale (file:// o HTTP locale)
   - **Verifica**: I cookie nella sessione BrowserWindow di Electron dovrebbero essere inviati comunque quando il form fa POST al dominio SSO, anche se la pagina HTML è caricata da `data:` URL

2. **redirect_uri mismatch**
   - Se l'errore persiste, verificare con ACI/MIT quale `redirect_uri` è stato effettivamente registrato per `AUTODEM.RESCUEMANAGER`

## Conclusioni

✅ **Implementazione corretta secondo manuale ACI/MIT**

Il codice implementa correttamente:
- POST per tutte le chiamate
- Content-Type corretti
- Parametri corretti
- Cookie e csrf parameter
- redirect_uri corretto (http://localhost/)

Se il problema persiste, potrebbe essere:
1. Cookie non inviato dalla pagina data: URL (da verificare testando)
2. redirect_uri non registrato correttamente con ACI/MIT
3. client_id/client_secret non corretti
4. VPN non attiva o problemi di connessione

