# 🔍 Verifica Completa Login e Richieste API RVFU/ForgeRock

**Data:** 22 gennaio 2026  
**Scopo:** Verifica approfondita del flusso di login e richieste API per identificare problemi

---

## 📋 INDICE

1. [Flusso Login](#1-flusso-login)
2. [Flusso Richieste API](#2-flusso-richieste-api)
3. [Gestione CDSSO](#3-gestione-cdsso)
4. [Problemi Identificati](#4-problemi-identificati)
5. [Checklist Verifica](#5-checklist-verifica)

---

## 1. FLUSSO LOGIN

### 1.1 Componenti Coinvolti

**File Principali:**
- `src/lib/rvfu-auth.ts` - Servizio autenticazione
- `src/hooks/useRVFUAuth.ts` - Hook React per autenticazione
- `src/components/rvfu/RVFULogin.jsx` - Componente UI login
- `electron/ipc.js` - Handler IPC per finestra OAuth
- `electron/rvfu-auth-server.js` - Server locale per callback OAuth

### 1.2 Flusso Completo

#### Step 1: Autenticazione OpenAM (`/authenticate`)
```typescript
// File: src/lib/rvfu-auth.ts:129-217
authenticateOpenAM(username, password)
  → POST /json/authenticate
  → Headers: X-OpenAM-Username, X-OpenAM-Password
  → Risposta: { tokenId: "..." }
```

**✅ Verificato:**
- Chiamata corretta a `/json/authenticate`
- Headers corretti
- Risposta contiene `tokenId`

#### Step 2: Authorization Code Flow (`/authorize`)
```typescript
// File: src/lib/rvfu-auth.ts:234-349
getAuthorizationCode(tokenId)
  → Apre finestra Electron BrowserWindow
  → Naviga a /oauth2/authorize
  → Cookie: iPlanetDirectoryPro=${tokenId}
  → POST con csrf=${tokenId}
  → Redirect a redirectUri con ?code=...
```

**✅ Verificato:**
- Finestra Electron aperta correttamente
- Cookie `iPlanetDirectoryPro` impostato con `tokenId`
- POST con `csrf` token
- Redirect intercettato correttamente

**⚠️ PROBLEMA POTENZIALE:**
- Il cookie viene impostato nella finestra OAuth, ma potrebbe non essere condiviso con la finestra persistente API

#### Step 3: Token Exchange (`/access_token`)
```typescript
// File: src/lib/rvfu-auth.ts:600-714
exchangeCodeForTokens(authCode)
  → POST /oauth2/access_token
  → Body: grant_type=authorization_code, code=..., redirect_uri=...
  → Risposta: { id_token, access_token, refresh_token, expires_in }
```

**✅ Verificato:**
- Chiamata corretta a `/oauth2/access_token`
- Token salvati in `sessionStorage` (Electron)
- Token caricati correttamente

### 1.3 Cookie Impostati Durante Login

**Cookie `iPlanetDirectoryPro`:**
- **Valore:** `tokenId` dalla risposta `/authenticate`
- **Dominio:** Impostato su `ssoformazione.ilportaledeltrasporto.it`
- **Path:** `/`
- **Secure:** `true`
- **HttpOnly:** `true`

**⚠️ PROBLEMA IDENTIFICATO:**
- Il cookie viene impostato solo su `ssoformazione.ilportaledeltrasporto.it`
- **NON** viene impostato sul dominio parent `.ilportaledeltrasporto.it`
- Questo significa che il cookie **NON è disponibile** per `formazione.ilportaledeltrasporto.it`

**✅ FIX APPLICATO:**
Nel file `electron/ipc.js:2572-2586`, il cookie viene ora impostato anche sul dominio parent:
```javascript
await defaultSession.cookies.set({
  url: 'https://ilportaledeltrasporto.it/',
  name: 'iPlanetDirectoryPro',
  value: iPlanetCookie.value,
  domain: '.ilportaledeltrasporto.it', // ✅ Dominio parent
  path: '/',
  secure: true,
  httpOnly: true,
});
```

### 1.4 Token Salvati

**Token Salvati in `sessionStorage`:**
```typescript
{
  idToken: "eyJ...",      // JWT ID Token
  accessToken: "eyJ...", // JWT Access Token
  refreshToken: "...",   // Refresh Token
  expiresAt: 1234567890  // Timestamp scadenza
}
```

**✅ Verificato:**
- Token salvati correttamente
- Token caricati all'avvio
- Token usati per header `Authorization`

---

## 2. FLUSSO RICHIESTE API

### 2.1 Componenti Coinvolti

**File Principali:**
- `src/lib/rvfu-client.ts` - Client API RVFU
- `electron/ipc.js` - Handler IPC `rvfu:api-call`
- `electron/ipc.js:initPersistentApiWindow()` - Finestra persistente per API

### 2.2 Flusso Completo

#### Step 1: Preparazione Richiesta
```typescript
// File: src/lib/rvfu-client.ts:173-255
makeRequestViaBrowserWindow(endpoint, options)
  → Costruisce URL completo
  → Ottiene header Authorization da authService.getAuthHeader()
  → Chiama window.api.rvfu.apiCall()
```

**✅ Verificato:**
- URL costruito correttamente
- Header `Authorization` ottenuto correttamente

#### Step 2: Header Authorization

**Token Usato:**
```typescript
// File: src/lib/rvfu-auth.ts:943-989
getAuthHeader()
  → Usa idToken (NON accessToken)
  → Ritorna: `Bearer ${idToken}`
```

**✅ Verificato:**
- Usa `idToken` come specificato nel manuale (sezione 5.3, punto 7)
- Header formato: `Bearer eyJ...`

**⚠️ VERIFICA NECESSARIA:**
- Il token `idToken` è ancora valido? (non scaduto?)
- Il token `idToken` è il token corretto per le API?

#### Step 3: Chiamata IPC `rvfu:api-call`
```javascript
// File: electron/ipc.js:2650-3502
handleSafe('rvfu:api-call', async (requestData) => {
  → Verifica cookie iPlanetDirectoryPro
  → Carica pagina SSO per stabilire sessione
  → Naviga finestra persistente all'URL API
  → Intercetta richieste per aggiungere header Authorization
  → Legge risposta dalla pagina
})
```

**✅ Verificato:**
- Cookie verificato prima della chiamata
- Pagina SSO caricata per stabilire sessione
- Header Authorization aggiunto correttamente

**⚠️ PROBLEMA POTENZIALE:**
- La finestra persistente potrebbe non avere il cookie `iPlanetDirectoryPro` se è stata creata prima del login

### 2.3 Gestione Risposta

**Se Risposta è HTML con CDSSO:**
```javascript
// File: electron/ipc.js:1469-2500
if (result.data._cdsso && result.data._cdssoNavigate) {
  → Estrae id_token e formAction
  → Naviga finestra persistente all'URL originale
  → Inietta form CDSSO e submit automatico
  → Attende completamento CDSSO
  → Riprova richiesta originale
}
```

**✅ Verificato:**
- CDSSO rilevato correttamente
- Form CDSSO iniettato e submit automatico
- Cookie `am-auth-jwt` verificato dopo CDSSO

**⚠️ PROBLEMA IDENTIFICATO:**
- Dopo CDSSO, la pagina mostra ancora **403 Forbidden**
- Il cookie `amFilterCDSSORequest` non viene trovato dopo navigazione

---

## 3. GESTIONE CDSSO

### 3.1 Rilevamento CDSSO

**Quando viene rilevato:**
- Risposta HTML contiene form con `action="/agent/cdsso-oauth2"`
- Form contiene campo `name="id_token"`
- Risposta contiene `_cdsso`, `_cdssoNavigate`, `_idToken`, `_formAction`

**✅ Verificato:**
- Rilevamento CDSSO funziona correttamente
- Dati estratti correttamente

### 3.2 Flusso CDSSO

#### Step 1: Navigazione all'URL Originale
```javascript
// File: electron/ipc.js:1507-1603
→ Naviga finestra persistente all'URL originale
→ Intercetta richieste per aggiungere header Authorization
→ Attende caricamento pagina
```

**✅ Verificato:**
- Navigazione funziona
- Header Authorization aggiunto

**⚠️ PROBLEMA:**
- Cookie `amFilterCDSSORequest` non viene trovato dopo navigazione
- Questo cookie dovrebbe essere impostato dal Java Agent quando si naviga all'URL

#### Step 2: Iniezione Form CDSSO
```javascript
// File: electron/ipc.js:1638-1750
→ Inietta HTML form nella pagina
→ Form contiene id_token e formAction
→ Submit automatico del form
```

**✅ Verificato:**
- Form iniettato correttamente
- Submit automatico funziona
- POST a `/agent/cdsso-oauth2` completato

#### Step 3: Verifica Cookie `am-auth-jwt`
```javascript
// File: electron/ipc.js:1417-1421
→ Verifica Set-Cookie header nella risposta POST CDSSO
→ Cerca cookie `am-auth-jwt`
```

**✅ Verificato:**
- Cookie `am-auth-jwt` trovato dopo POST CDSSO
- Cookie impostato correttamente

#### Step 4: Retry Richiesta Originale
```javascript
// File: electron/ipc.js:2050-2428
→ Naviga finestra persistente all'URL originale
→ Attende caricamento pagina
→ Legge risposta dalla pagina
```

**❌ PROBLEMA:**
- La pagina mostra ancora **403 Forbidden** dopo CDSSO
- Il cookie `amFilterCDSSORequest` non viene trovato

### 3.3 Cookie Richiesti per CDSSO

**Cookie Necessari:**
1. `iPlanetDirectoryPro` - Cookie SSO principale
2. `amFilterCDSSORequest` - Cookie temporaneo per CDSSO (impostato dal Java Agent)
3. `am-auth-jwt` - Cookie JWT dopo completamento CDSSO

**✅ Verificato:**
- `iPlanetDirectoryPro`: ✅ Presente
- `am-auth-jwt`: ✅ Presente dopo CDSSO
- `amFilterCDSSORequest`: ❌ **NON TROVATO**

**⚠️ PROBLEMA CRITICO:**
Il cookie `amFilterCDSSORequest` non viene trovato. Questo cookie dovrebbe essere impostato dal Java Agent quando si naviga all'URL originale che genera il form CDSSO.

**Possibili Cause:**
1. Il Java Agent non imposta il cookie se la richiesta non proviene da una navigazione browser "normale"
2. Il cookie viene impostato ma con dominio/path diversi
3. Il cookie viene impostato ma non è accessibile dalla finestra persistente

---

## 4. PROBLEMI IDENTIFICATI

### 4.1 Problema 1: Cookie `iPlanetDirectoryPro` Non Condiviso

**Descrizione:**
- Il cookie viene impostato solo su `ssoformazione.ilportaledeltrasporto.it`
- Non è disponibile per `formazione.ilportaledeltrasporto.it`

**✅ FIX APPLICATO:**
- Cookie ora impostato anche sul dominio parent `.ilportaledeltrasporto.it`
- File: `electron/ipc.js:2572-2586`

**Status:** ✅ RISOLTO

### 4.2 Problema 2: Cookie `amFilterCDSSORequest` Non Trovato

**Descrizione:**
- Dopo navigazione all'URL originale, il cookie `amFilterCDSSORequest` non viene trovato
- Questo cookie dovrebbe essere impostato dal Java Agent

**Possibili Cause:**
1. Il Java Agent non imposta il cookie se la richiesta non proviene da una navigazione browser "normale"
2. Il cookie viene impostato ma con dominio/path diversi
3. Il cookie viene impostato ma non è accessibile dalla finestra persistente

**Status:** ❌ DA RISOLVERE

### 4.3 Problema 3: 403 Forbidden Dopo CDSSO

**Descrizione:**
- Dopo completamento CDSSO, la pagina mostra ancora **403 Forbidden**
- Il cookie `am-auth-jwt` è presente
- Il cookie `iPlanetDirectoryPro` è presente
- Ma il cookie `amFilterCDSSORequest` non è presente

**Possibili Cause:**
1. Il server richiede il cookie `amFilterCDSSORequest` anche dopo CDSSO
2. L'URL usato per il retry è diverso dall'URL originale (ha `:443` nel redirect)
3. Il server richiede qualcos'altro oltre ai cookie

**Status:** ❌ DA RISOLVERE

### 4.4 Problema 4: URL Redirect CDSSO con `:443`

**Descrizione:**
- Il redirect del CDSSO include `:443` nell'URL:
  ```
  Location: https://formazione.ilportaledeltrasporto.it:443/concessionario/veicolo?...
  ```
- L'URL originale non ha `:443`:
  ```
  https://formazione.ilportaledeltrasporto.it/concessionario/veicolo?...
  ```

**Possibile Soluzione:**
- Usare l'URL esatto dal redirect del CDSSO (rimuovendo `:443` se presente)

**Status:** ⚠️ DA VERIFICARE

---

## 5. CHECKLIST VERIFICA

### 5.1 Login

- [x] **Step 1: `/authenticate`**
  - [x] Chiamata corretta
  - [x] Headers corretti
  - [x] Risposta contiene `tokenId`

- [x] **Step 2: `/authorize`**
  - [x] Finestra Electron aperta
  - [x] Cookie `iPlanetDirectoryPro` impostato
  - [x] POST con `csrf` token
  - [x] Redirect intercettato

- [x] **Step 3: `/access_token`**
  - [x] Chiamata corretta
  - [x] Token salvati
  - [x] Token caricati all'avvio

- [x] **Cookie Impostati**
  - [x] Cookie `iPlanetDirectoryPro` su dominio SSO
  - [x] Cookie `iPlanetDirectoryPro` su dominio parent (FIX applicato)

### 5.2 Richieste API

- [x] **Preparazione Richiesta**
  - [x] URL costruito correttamente
  - [x] Header `Authorization` ottenuto

- [x] **Header Authorization**
  - [x] Usa `idToken` (corretto secondo manuale)
  - [x] Formato: `Bearer ${idToken}`

- [x] **Chiamata IPC**
  - [x] Cookie verificato
  - [x] Pagina SSO caricata
  - [x] Header Authorization aggiunto

- [ ] **Risposta API**
  - [x] CDSSO rilevato correttamente
  - [x] Form CDSSO iniettato
  - [x] Cookie `am-auth-jwt` trovato
  - [ ] **Cookie `amFilterCDSSORequest` trovato** ❌
  - [ ] **Risposta 200 OK dopo CDSSO** ❌

### 5.3 CDSSO

- [x] **Rilevamento CDSSO**
  - [x] Form CDSSO rilevato
  - [x] Dati estratti correttamente

- [x] **Navigazione URL Originale**
  - [x] Navigazione funziona
  - [x] Header Authorization aggiunto
  - [ ] Cookie `amFilterCDSSORequest` trovato ❌

- [x] **Iniezione Form CDSSO**
  - [x] Form iniettato
  - [x] Submit automatico
  - [x] POST completato

- [x] **Verifica Cookie `am-auth-jwt`**
  - [x] Cookie trovato
  - [x] Cookie impostato correttamente

- [ ] **Retry Richiesta Originale**
  - [x] Navigazione all'URL originale
  - [x] Attesa caricamento pagina
  - [ ] **Risposta 200 OK** ❌
  - [ ] **Cookie `amFilterCDSSORequest` presente** ❌

---

## 6. RACCOMANDAZIONI

### 6.1 Problema Critico: Cookie `amFilterCDSSORequest`

**Azione Immediata:**
1. Verificare se il Java Agent imposta il cookie `amFilterCDSSORequest` quando si naviga all'URL originale
2. Verificare il dominio/path del cookie se viene impostato
3. Se il cookie non viene impostato, potrebbe essere necessario:
   - Navigare all'URL originale in modo diverso
   - Usare un approccio diverso per ottenere il cookie

### 6.2 Problema: 403 Forbidden Dopo CDSSO

**Azione Immediata:**
1. Verificare se l'URL usato per il retry è corretto (rimuovere `:443` se presente)
2. Verificare se il server richiede il cookie `amFilterCDSSORequest` anche dopo CDSSO
3. Verificare se ci sono altri header o cookie richiesti dal server

### 6.3 Verifica Token

**Azione Immediata:**
1. Verificare se il token `idToken` è ancora valido (non scaduto)
2. Verificare se il token `idToken` è il token corretto per le API
3. Verificare se il server accetta il token `idToken` nell'header `Authorization`

---

## 7. CONCLUSIONE

### ✅ Cosa Funziona

1. **Login OAuth:** Funziona correttamente, token salvati
2. **Cookie `iPlanetDirectoryPro`:** Impostato correttamente (anche su dominio parent)
3. **Rilevamento CDSSO:** Funziona correttamente
4. **Form CDSSO:** Iniettato e submit automatico funziona
5. **Cookie `am-auth-jwt`:** Trovato dopo CDSSO

### ❌ Cosa Non Funziona

1. **Cookie `amFilterCDSSORequest`:** Non trovato dopo navigazione
2. **403 Forbidden:** Dopo CDSSO, la pagina mostra ancora 403
3. **URL Redirect:** Include `:443` che potrebbe causare problemi

### 🎯 Prossimi Passi

1. **Verificare cookie `amFilterCDSSORequest`:**
   - Controllare se viene impostato dal Java Agent
   - Verificare dominio/path del cookie
   - Se necessario, usare approccio diverso per ottenere il cookie

2. **Verificare 403 Forbidden:**
   - Usare URL esatto dal redirect (rimuovere `:443`)
   - Verificare se server richiede altri cookie/header
   - Verificare se token `idToken` è valido

3. **Test Completo:**
   - Testare login completo
   - Testare richiesta API dopo login
   - Testare CDSSO completo
   - Verificare tutti i cookie presenti

---

**Status:** 📋 Verifica completa - Problemi identificati - Pronto per fix
