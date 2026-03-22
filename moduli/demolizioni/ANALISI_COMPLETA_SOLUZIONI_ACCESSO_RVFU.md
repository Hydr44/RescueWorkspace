# 🔍 Analisi Completa: Soluzioni Accesso RVFU al 100%

**Data:** 22 gennaio 2026  
**Obiettivo:** Implementare un sistema di accesso RVFU che funziona al 100% senza problemi CDSSO

---

## 📋 Indice

1. [Problema Attuale](#problema-attuale)
2. [Analisi Manuali RVFU](#analisi-manuali-rvfu)
3. [Soluzioni Possibili](#soluzioni-possibili)
4. [Raccomandazione Finale](#raccomandazione-finale)

---

## 🔴 Problema Attuale

### Situazione
- ✅ Login OAuth funziona correttamente
- ✅ Token vengono salvati e caricati
- ❌ Cookie `iPlanetDirectoryPro` non disponibile nella finestra persistente
- ❌ CDSSO richiesto ad ogni chiamata API
- ❌ Re-login automatico crea loop infiniti

### Cause Identificate
1. **Cookie Cross-Domain**: Il cookie `iPlanetDirectoryPro` è impostato per `ssoformazione.ilportaledeltrasporto.it`, ma la finestra persistente è su `formazione.ilportaledeltrasporto.it`
2. **Cookie HttpOnly**: I cookie `httpOnly` non sono visibili in `document.cookie`, ma dovrebbero essere inviati automaticamente con `credentials: 'include'`
3. **Sessione Separata**: La finestra di login e quella persistente potrebbero non condividere correttamente i cookie

---

## 📚 Analisi Manuali RVFU

### Flusso Autenticazione Secondo Manuale

#### Step 1: `/json/authenticate`
- **Metodo**: POST
- **Headers**: 
  - `X-OpenAM-Username`: UserID Agenzia
  - `X-OpenAM-Password`: Password Agenzia
  - `Accept-API-Version`: `resource=2.0, protocol=1.0`
- **Risposta**: `tokenId` (cookie `iPlanetDirectoryPro`)

#### Step 2: `/oauth2/authorize`
- **Metodo**: POST (form HTML)
- **Cookie**: `iPlanetDirectoryPro=<tokenId>`
- **Body**: 
  - `scope=openid profile`
  - `response_type=code`
  - `client_id=<ClientID>`
  - `csrf=<tokenId>` (stesso valore del cookie)
  - `redirect_uri=http://localhost/`
  - `decision=allow`
- **Risposta**: Redirect URL con `code`

#### Step 3: `/oauth2/access_token`
- **Metodo**: POST
- **Body**: 
  - `grant_type=authorization_code`
  - `code=<authorization_code>`
  - `client_id=<ClientID>`
  - `client_secret=<ClientSecret>`
  - `redirect_uri=http://localhost/`
- **Risposta**: `access_token`, `refresh_token`, `id_token`

### Requisiti Cookie

Secondo il manuale:
- Il cookie `iPlanetDirectoryPro` deve essere presente per le chiamate API
- Il cookie viene impostato durante `/authenticate`
- Il cookie deve essere condiviso tra tutte le finestre BrowserWindow che usano la stessa sessione

---

## 💡 Soluzioni Possibili

### Soluzione 1: Finestra Unica per Login e API Calls ⭐ **RACCOMANDATA**

**Concetto**: Usare la stessa finestra BrowserWindow per login e API calls.

**Vantaggi**:
- ✅ Cookie sempre disponibili (stessa finestra = stessa sessione)
- ✅ Nessun problema di condivisione cookie
- ✅ CDSSO funziona automaticamente (sessione browser attiva)
- ✅ Più semplice da gestire

**Svantaggi**:
- ⚠️ Finestra sempre aperta (ma può essere nascosta)
- ⚠️ Potrebbe essere più lento se la finestra viene ricaricata

**Implementazione**:
```javascript
// 1. Crea una finestra unica all'avvio
const rvfuWindow = new BrowserWindow({
  show: false, // Nascosta
  webPreferences: {
    session: defaultSession, // Sessione condivisa
  }
});

// 2. Durante login, carica la pagina SSO nella stessa finestra
rvfuWindow.loadURL('https://ssoformazione.ilportaledeltrasporto.it/sso/');

// 3. Dopo login, usa la stessa finestra per API calls
// I cookie sono già presenti perché è la stessa finestra
```

**Status**: ⭐ **RACCOMANDATA** - Soluzione più semplice e affidabile

---

### Soluzione 2: Sessione Condivisa con Cookie Espliciti

**Concetto**: Usare `defaultSession` condivisa e impostare cookie esplicitamente per tutti i domini.

**Vantaggi**:
- ✅ Cookie condivisi tra tutte le finestre
- ✅ Funziona anche con finestre separate

**Svantaggi**:
- ⚠️ Richiede impostazione cookie per ogni dominio (SSO, API)
- ⚠️ Potrebbe non funzionare se i cookie hanno restrizioni di dominio

**Implementazione** (già parzialmente implementata):
```javascript
// Imposta cookie per dominio SSO
await defaultSession.cookies.set({
  url: `https://${ssoDomain}/sso/`,
  name: 'iPlanetDirectoryPro',
  value: tokenId,
  domain: ssoDomain,
  path: '/',
  secure: true,
  httpOnly: true,
});

// Imposta cookie per dominio API
await defaultSession.cookies.set({
  url: `https://formazione.ilportaledeltrasporto.it/`,
  name: 'iPlanetDirectoryPro',
  value: tokenId,
  domain: 'formazione.ilportaledeltrasporto.it',
  path: '/',
  secure: true,
  httpOnly: true,
});

// Imposta cookie per dominio parent
await defaultSession.cookies.set({
  url: `https://ilportaledeltrasporto.it/`,
  name: 'iPlanetDirectoryPro',
  value: tokenId,
  domain: '.ilportaledeltrasporto.it', // Punto iniziale per cross-subdomain
  path: '/',
  secure: true,
  httpOnly: true,
});
```

**Status**: ⚠️ **PARZIALMENTE IMPLEMENTATA** - Non risolve completamente il problema

---

### Soluzione 3: VPS Proxy con VPN ⭐ **ALTERNATIVA ROBUSTA**

**Concetto**: Usare un proxy VPS che ha accesso VPN diretto a RVFU.

**Vantaggi**:
- ✅ Proxy mantiene sessione SSO attiva
- ✅ Cookie gestiti dal proxy (Puppeteer/Playwright)
- ✅ Nessun problema CDSSO
- ✅ Funziona anche senza VPN sul client

**Svantaggi**:
- ⚠️ Richiede VPS con VPN configurata
- ⚠️ Overhead di rete (tutte le chiamate passano per VPS)
- ⚠️ Costo VPS e manutenzione

**Implementazione** (già configurata):
```javascript
// Configurazione proxy VPS
const proxyUrl = 'https://rvfu.rescuemanager.eu'; // Nginx reverse proxy su VPS

// Le chiamate API passano attraverso il proxy
const response = await fetch(`${proxyUrl}/api/rvfu${endpoint}`, {
  method,
  headers: {
    'Authorization': `Bearer ${idToken}`,
  },
  credentials: 'include',
});
```

**Status**: ⭐ **ALTERNATIVA ROBUSTA** - Funziona ma richiede infrastruttura

---

### Soluzione 4: Navigazione Reale al CDSSO

**Concetto**: Quando rileviamo CDSSO, navigare effettivamente alla pagina CDSSO nella finestra persistente.

**Vantaggi**:
- ✅ Completa il CDSSO automaticamente
- ✅ Cookie vengono aggiornati nella finestra

**Svantaggi**:
- ⚠️ Interrompe l'esecuzione dello script (navigazione cambia pagina)
- ⚠️ Richiede gestione asincrona complessa
- ⚠️ Potrebbe non funzionare se il CDSSO richiede interazione utente

**Implementazione**:
```javascript
// Quando rileviamo CDSSO, naviga alla pagina CDSSO
if (isCDSSO) {
  // Estrai id_token dal form
  const idToken = extractIdTokenFromForm(html);
  
  // Naviga alla pagina CDSSO
  persistentApiWindow.loadURL(`https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2`, {
    postData: [{
      type: 'application/x-www-form-urlencoded',
      bytes: Buffer.from(`id_token=${idToken}`)
    }],
    extraHeaders: 'Content-Type: application/x-www-form-urlencoded\r\n'
  });
  
  // Aspetta che la navigazione completi
  await new Promise((resolve) => {
    persistentApiWindow.webContents.once('did-finish-load', resolve);
  });
  
  // Riprova la richiesta originale
  return await retryOriginalRequest();
}
```

**Status**: ⚠️ **COMPLESSA** - Richiede gestione asincrona avanzata

---

### Soluzione 5: Re-Login Automatico con Ricaricamento Finestra

**Concetto**: Quando rileviamo CDSSO, fare re-login e poi ricaricare la finestra persistente.

**Vantaggi**:
- ✅ Re-login automatico
- ✅ Finestra viene ricaricata con nuovi cookie

**Svantaggi**:
- ⚠️ Richiede chiusura e riapertura finestra
- ⚠️ Potrebbe essere lento
- ⚠️ Perde stato della finestra

**Implementazione**:
```javascript
// Quando rileviamo CDSSO
if (isCDSSO && !reauthAttempted) {
  // 1. Re-login automatico
  const newTokens = await authService.reAuthenticate();
  
  if (newTokens) {
    // 2. Chiudi finestra persistente
    await window.api.rvfu.closeApiWindow();
    
    // 3. Ricarica finestra persistente (con nuovi cookie)
    await window.api.rvfu.initApiWindow();
    
    // 4. Riprova richiesta originale
    return await retryOriginalRequest();
  }
}
```

**Status**: ⚠️ **FATTIBILE** - Richiede implementazione nel frontend

---

## 🎯 Raccomandazione Finale

### Soluzione Raccomandata: **Finestra Unica per Login e API Calls**

**Perché**:
1. ✅ **Più semplice**: Una sola finestra da gestire
2. ✅ **Più affidabile**: Cookie sempre disponibili (stessa finestra = stessa sessione)
3. ✅ **CDSSO funziona**: Sessione browser attiva = CDSSO automatico
4. ✅ **Nessun problema cross-domain**: Stessa finestra = stesso dominio

**Implementazione**:

1. **Crea finestra unica all'avvio**:
```javascript
let rvfuWindow = null;

const initRVFUWindow = () => {
  if (rvfuWindow && !rvfuWindow.isDestroyed()) {
    return rvfuWindow;
  }
  
  rvfuWindow = new BrowserWindow({
    show: false, // Nascosta
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      session: session.defaultSession, // Sessione condivisa
    },
  });
  
  return rvfuWindow;
};
```

2. **Usa la stessa finestra per login**:
```javascript
handleSafe('rvfu:open-auth-window', async ({ tokenId, authorizeEndpoint }) => {
  const window = initRVFUWindow();
  
  // Imposta cookie nella finestra
  await window.webContents.session.cookies.set({
    url: 'https://ssoformazione.ilportaledeltrasporto.it/sso/',
    name: 'iPlanetDirectoryPro',
    value: tokenId,
    domain: 'ssoformazione.ilportaledeltrasporto.it',
    path: '/',
    secure: true,
    httpOnly: true,
  });
  
  // Carica pagina authorize nella stessa finestra
  window.loadURL(authorizeEndpoint);
  
  // ... gestisci callback OAuth ...
});
```

3. **Usa la stessa finestra per API calls**:
```javascript
handleSafe('rvfu:api-call', async ({ method, url, headers, body }) => {
  const window = initRVFUWindow();
  
  // La finestra ha già i cookie dal login
  // Inietta script per fare API calls
  return await window.webContents.executeJavaScript(`
    fetch('${url}', {
      method: '${method}',
      headers: ${JSON.stringify(headers)},
      body: ${body ? JSON.stringify(body) : 'null'},
      credentials: 'include'
    }).then(r => r.json())
  `);
});
```

**Vantaggi**:
- ✅ Cookie sempre disponibili (stessa finestra)
- ✅ CDSSO funziona automaticamente
- ✅ Nessun problema cross-domain
- ✅ Più semplice da gestire

---

## 📊 Confronto Soluzioni

| Soluzione | Complessità | Affidabilità | Performance | Costo |
|-----------|-------------|--------------|-------------|-------|
| **1. Finestra Unica** | ⭐ Bassa | ⭐⭐⭐ Alta | ⭐⭐ Media | ⭐ Gratis |
| **2. Sessione Condivisa** | ⭐⭐ Media | ⭐⭐ Media | ⭐⭐⭐ Alta | ⭐ Gratis |
| **3. VPS Proxy** | ⭐⭐⭐ Alta | ⭐⭐⭐ Alta | ⭐⭐ Media | ⭐⭐ VPS |
| **4. Navigazione CDSSO** | ⭐⭐⭐ Alta | ⭐⭐ Media | ⭐ Bassa | ⭐ Gratis |
| **5. Re-Login + Ricarica** | ⭐⭐ Media | ⭐⭐ Media | ⭐ Bassa | ⭐ Gratis |

---

## 🔧 Implementazione Consigliata

### Step 1: Unificare Finestre

1. Modificare `rvfu:open-auth-window` per usare la finestra persistente se esiste
2. Se la finestra non esiste, crearla
3. Dopo login, mantenere la finestra aperta per API calls

### Step 2: Gestione Cookie

1. Impostare cookie nella finestra unica durante login
2. Verificare che i cookie siano disponibili prima di fare API calls
3. Se i cookie mancano, rifare login nella stessa finestra

### Step 3: Gestione CDSSO

1. Se CDSSO viene rilevato, navigare alla pagina CDSSO nella stessa finestra
2. Dopo CDSSO, riprovare la richiesta originale
3. Se CDSSO persiste, rifare login nella stessa finestra

---

## 📝 Note Importanti

### Cookie e Reload

**Domanda**: I cookie si perdono quando si aggiorna la pagina?

**Risposta**: 
- ✅ **NO** se i cookie sono impostati nella sessione Electron (`defaultSession`)
- ✅ I cookie `httpOnly` persistono anche dopo reload della pagina
- ✅ I cookie nella sessione Electron sono condivisi tra tutte le finestre che usano quella sessione
- ⚠️ I cookie si perdono solo se:
  - La sessione viene distrutta
  - Il cookie scade
  - Il cookie viene cancellato esplicitamente

### Finestra Unica vs Finestre Separate

**Finestra Unica**:
- ✅ Cookie sempre disponibili
- ✅ Nessun problema di condivisione
- ✅ CDSSO funziona automaticamente
- ⚠️ Finestra sempre aperta (ma nascosta)

**Finestre Separate**:
- ⚠️ Richiede condivisione cookie esplicita
- ⚠️ Potrebbe non funzionare con cookie cross-domain
- ⚠️ CDSSO potrebbe non funzionare

---

## ✅ Conclusione

**Raccomandazione**: Implementare **Soluzione 1 (Finestra Unica)** per avere un sistema di accesso RVFU al 100% affidabile.

**Prossimi Step**:
1. Modificare `rvfu:open-auth-window` per usare la finestra persistente
2. Modificare `rvfu:api-call` per usare la stessa finestra
3. Testare che i cookie siano sempre disponibili
4. Verificare che CDSSO funzioni automaticamente

---

**Status**: 📋 Documento completo - Pronto per implementazione
