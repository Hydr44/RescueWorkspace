# 🎯 Piano di Risoluzione Problemi RVFU/ForgeRock

**Data:** 22 gennaio 2026  
**Scopo:** Piano metodico per risolvere tutti i problemi identificati nel flusso login e richieste API

---

## 📋 INDICE

1. [Problemi Identificati](#1-problemi-identificati)
2. [Priorità e Ordine di Risoluzione](#2-priorità-e-ordine-di-risoluzione)
3. [Soluzioni Dettagliate](#3-soluzioni-dettagliate)
4. [Piano di Implementazione](#4-piano-di-implementazione)
5. [Test e Verifica](#5-test-e-verifica)

---

## 1. PROBLEMI IDENTIFICATI

### 1.1 Problema P1: URL Redirect CDSSO con `:443` ⚠️ MEDIA PRIORITÀ

**Descrizione:**
- Il redirect del CDSSO include `:443` nell'URL:
  ```
  Location: https://formazione.ilportaledeltrasporto.it:443/concessionario/veicolo?...
  ```
- L'URL originale non ha `:443`:
  ```
  https://formazione.ilportaledeltrasporto.it/concessionario/veicolo?...
  ```

**Impatto:**
- Potrebbe causare problemi di matching URL
- Il browser potrebbe non riconoscere l'URL come identico all'originale

**Evidenza:**
- Log linea 900: `Location: https://formazione.ilportaledeltrasporto.it:443/...`

---

### 1.2 Problema P2: Cookie `amFilterCDSSORequest` Non Trovato ❌ ALTA PRIORITÀ

**Descrizione:**
- Dopo navigazione all'URL originale, il cookie `amFilterCDSSORequest` non viene trovato
- Questo cookie dovrebbe essere impostato dal Java Agent quando si naviga all'URL che genera il form CDSSO

**Impatto:**
- Il server potrebbe richiedere questo cookie per validare la richiesta CDSSO
- Senza questo cookie, il server potrebbe rifiutare la richiesta (403 Forbidden)

**Evidenza:**
- Log linea 934: `⚠️ Cookie amFilterCDSSORequest ancora non trovato dopo navigazione`
- Log linea 921: `hasAmFilter: false`

**Possibili Cause:**
1. Il Java Agent non imposta il cookie se la richiesta non proviene da una navigazione browser "normale"
2. Il cookie viene impostato ma con dominio/path diversi
3. Il cookie viene impostato ma non è accessibile dalla finestra persistente
4. Il cookie viene impostato solo durante la prima navigazione (prima del CDSSO)

---

### 1.3 Problema P3: 403 Forbidden Dopo CDSSO ❌ CRITICA PRIORITÀ

**Descrizione:**
- Dopo completamento CDSSO, la pagina mostra ancora **403 Forbidden**
- Il cookie `am-auth-jwt` è presente ✅
- Il cookie `iPlanetDirectoryPro` è presente ✅
- Ma il cookie `amFilterCDSSORequest` non è presente ❌

**Impatto:**
- Le richieste API falliscono anche dopo CDSSO completato
- L'applicazione non può accedere alle API RVFU

**Evidenza:**
- Log linea 958: `⚠️ Pagina contiene errore 403 Forbidden`
- Log linea 973: `❌ Nessun JSON trovato nella pagina dopo navigazione: Page contains 403 Forbidden error`

**Possibili Cause:**
1. Il server richiede il cookie `amFilterCDSSORequest` anche dopo CDSSO
2. L'URL usato per il retry è diverso dall'URL originale (ha `:443`)
3. Il server richiede altri cookie/header oltre a quelli già presenti
4. Il token `idToken` nell'header `Authorization` non è valido o scaduto
5. Il server richiede che la richiesta provenga dalla stessa sessione del redirect CDSSO

---

## 2. PRIORITÀ E ORDINE DI RISOLUZIONE

### Ordine di Implementazione (dal più semplice al più complesso)

1. **FASE 1: Fix URL Redirect (`:443`)** - ⚠️ MEDIA PRIORITÀ
   - **Tempo stimato:** 30 minuti
   - **Rischio:** Basso
   - **Impatto:** Medio

2. **FASE 2: Usare URL Esatto dal Redirect CDSSO** - ⚠️ MEDIA PRIORITÀ
   - **Tempo stimato:** 1 ora
   - **Rischio:** Basso
   - **Impatto:** Alto

3. **FASE 3: Verifica e Fix Cookie `amFilterCDSSORequest`** - ❌ ALTA PRIORITÀ
   - **Tempo stimato:** 2-3 ore
   - **Rischio:** Medio
   - **Impatto:** Critico

4. **FASE 4: Debug e Fix 403 Forbidden** - ❌ CRITICA PRIORITÀ
   - **Tempo stimato:** 3-4 ore
   - **Rischio:** Alto
   - **Impatto:** Critico

---

## 3. SOLUZIONI DETTAGLIATE

### 3.1 FASE 1: Fix URL Redirect (`:443`)

**Problema:** URL redirect include `:443` che potrebbe causare problemi

**Soluzione:**
Normalizzare l'URL rimuovendo `:443` se presente (porta HTTPS standard)

**Implementazione:**
```javascript
// File: electron/ipc.js:1402-1410
// Dopo aver estratto redirectUrl dal Location header
if (redirectUrl) {
  // Normalizza URL: rimuovi :443 se presente (porta HTTPS standard)
  const normalizedUrl = redirectUrl.replace(/:443\//g, '/').replace(/:443$/, '');
  console.log('[RVFU IPC API] ✅ Redirect rilevato! Location:', redirectUrl);
  console.log('[RVFU IPC API] 🔧 URL normalizzato:', normalizedUrl);
  
  // Salva URL normalizzato per uso successivo
  originalRequestData._redirectUrl = normalizedUrl;
}
```

**File da Modificare:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js` (linea ~1406)

**Test:**
- Verificare che l'URL normalizzato non contenga `:443`
- Verificare che l'URL normalizzato corrisponda all'URL originale (senza porta)

---

### 3.2 FASE 2: Usare URL Esatto dal Redirect CDSSO

**Problema:** Dopo CDSSO, usiamo l'URL originale invece dell'URL dal redirect

**Soluzione:**
Salvare l'URL dal redirect CDSSO e usarlo per il retry invece dell'URL originale

**Implementazione:**
```javascript
// File: electron/ipc.js:1397-1429
// Intercetta risposta POST CDSSO
ses.webRequest.onHeadersReceived(
  {
    urls: ['https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2*'],
  },
  (details, callback) => {
    // ... codice esistente ...
    
    // ✅ Se è un redirect 302, estrai e salva l'URL di destinazione
    if (details.statusCode === 302 || details.statusCode === 301) {
      const locationHeader = details.responseHeaders['Location'] || details.responseHeaders['location'] || [];
      const redirectUrl = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
      if (redirectUrl) {
        // Normalizza URL: rimuovi :443 se presente
        const normalizedRedirectUrl = redirectUrl.replace(/:443\//g, '/').replace(/:443$/, '');
        
        console.log('[RVFU IPC API] ✅ Redirect rilevato! Location:', redirectUrl);
        console.log('[RVFU IPC API] 🔧 URL normalizzato:', normalizedRedirectUrl);
        
        // ✅ Salva URL normalizzato nella richiesta pending
        // Cerca la richiesta pending associata a questa risposta
        // (potrebbe essere necessario passare un identificatore nella richiesta)
        // Per ora, salvalo in una variabile globale o in originalRequestData
        if (pendingRequests.size > 0) {
          // Prendi l'ultima richiesta pending (dovrebbe essere quella corrente)
          const lastPending = Array.from(pendingRequests.values())[pendingRequests.size - 1];
          if (lastPending) {
            lastPending._cdssoRedirectUrl = normalizedRedirectUrl;
            console.log('[RVFU IPC API] ✅ URL redirect salvato per retry:', normalizedRedirectUrl);
          }
        }
      }
    }
    
    // ... resto del codice ...
  }
);
```

**Poi, nel retry dopo CDSSO:**
```javascript
// File: electron/ipc.js:2050-2428
// Nel retry dopo CDSSO, usa l'URL dal redirect se disponibile
const retryUrl = originalRequestData._cdssoRedirectUrl || originalRequest.url;
console.log('[RVFU IPC API] 🔄 Retry URL:', retryUrl);
console.log('[RVFU IPC API] 🔍 URL originale:', originalRequest.url);
if (retryUrl !== originalRequest.url) {
  console.log('[RVFU IPC API] 🔧 Usando URL dal redirect CDSSO invece dell\'URL originale');
}

// Naviga all'URL dal redirect invece dell'URL originale
persistentApiWindow.loadURL(retryUrl);
```

**File da Modificare:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js` (linee ~1402-1410, ~2050-2428)

**Test:**
- Verificare che l'URL dal redirect venga salvato correttamente
- Verificare che il retry usi l'URL dal redirect invece dell'URL originale
- Verificare che la risposta sia 200 OK invece di 403 Forbidden

---

### 3.3 FASE 3: Verifica e Fix Cookie `amFilterCDSSORequest`

**Problema:** Cookie `amFilterCDSSORequest` non viene trovato dopo navigazione

**Analisi:**
Il cookie `amFilterCDSSORequest` dovrebbe essere impostato dal Java Agent quando si naviga all'URL originale che genera il form CDSSO. Se non viene trovato, potrebbe essere perché:

1. Il Java Agent non lo imposta se la richiesta non proviene da una navigazione browser "normale"
2. Il cookie viene impostato ma con dominio/path diversi
3. Il cookie viene impostato ma non è accessibile dalla finestra persistente
4. Il cookie viene impostato solo durante la prima navigazione (prima del CDSSO)

**Soluzione A: Verificare se Cookie Viene Impostato Durante Prima Navigazione**

**Implementazione:**
```javascript
// File: electron/ipc.js:1507-1603
// Durante la navigazione all'URL originale (prima del CDSSO)
// Intercetta le risposte per vedere se il cookie viene impostato

// Aggiungi listener per intercettare Set-Cookie headers
const cookieInterceptor = ses.webRequest.onHeadersReceived(
  {
    urls: [interceptUrlPattern],
  },
  (details, callback) => {
    console.log('[RVFU IPC API] 🔍 Intercettazione risposta navigazione all\'URL originale...');
    console.log('[RVFU IPC API] 🔍 URL:', details.url);
    console.log('[RVFU IPC API] 🔍 Status:', details.statusCode);
    
    // Cerca cookie Set-Cookie nella risposta
    const setCookieHeaders = details.responseHeaders['Set-Cookie'] || details.responseHeaders['set-cookie'] || [];
    if (setCookieHeaders.length > 0) {
      console.log('[RVFU IPC API] 🍪 Cookie impostati durante navigazione:', setCookieHeaders);
      
      // Verifica se è stato impostato il cookie amFilterCDSSORequest
      const hasAmFilter = setCookieHeaders.some((cookie) => cookie.includes('amFilterCDSSORequest'));
      if (hasAmFilter) {
        console.log('[RVFU IPC API] ✅ Cookie amFilterCDSSORequest trovato durante navigazione!');
      } else {
        console.warn('[RVFU IPC API] ⚠️ Cookie amFilterCDSSORequest NON trovato durante navigazione');
        console.warn('[RVFU IPC API] ⚠️ Questo potrebbe essere il problema!');
      }
    } else {
      console.warn('[RVFU IPC API] ⚠️ Nessun cookie impostato durante navigazione');
    }
    
    callback({ responseHeaders: details.responseHeaders });
  }
);

// ... resto del codice ...

// Rimuovi interceptor dopo navigazione
// (da fare nel cleanup)
```

**Soluzione B: Se Cookie Non Viene Impostato, Potrebbe Non Essere Necessario**

**Analisi:**
Secondo la documentazione ForgeRock, il cookie `amFilterCDSSORequest` viene usato per validare la richiesta CDSSO. Tuttavia, se il CDSSO è già completato (cookie `am-auth-jwt` presente), potrebbe non essere più necessario.

**Verifica:**
- Controllare se il server richiede ancora questo cookie dopo CDSSO
- Se non è necessario, rimuovere i controlli e i log relativi

**Soluzione C: Se Cookie È Necessario, Crearlo Manualmente**

**Implementazione:**
```javascript
// File: electron/ipc.js:2094-2100
// Dopo il caricamento completo, se il cookie non è presente, proviamo a crearlo
const cookiesAfterLoad = await session.defaultSession.cookies.get({ domain: 'formazione.ilportaledeltrasporto.it' });
const hasAmFilter = cookiesAfterLoad.some(c => c.name === 'amFilterCDSSORequest');

if (!hasAmFilter) {
  console.warn('[RVFU IPC API] ⚠️ Cookie amFilterCDSSORequest non trovato, provando a crearlo...');
  
  // Prova a creare il cookie manualmente
  // NOTA: Questo potrebbe non funzionare se il server richiede un valore specifico
  try {
    await session.defaultSession.cookies.set({
      url: 'https://formazione.ilportaledeltrasporto.it/',
      name: 'amFilterCDSSORequest',
      value: 'cdsso-request', // Valore placeholder - potrebbe non funzionare
      domain: 'formazione.ilportaledeltrasporto.it',
      path: '/',
      secure: true,
      httpOnly: true,
    });
    console.log('[RVFU IPC API] ✅ Cookie amFilterCDSSORequest creato manualmente');
  } catch (error) {
    console.error('[RVFU IPC API] ❌ Errore creazione cookie amFilterCDSSORequest:', error);
  }
}
```

**File da Modificare:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js` (linee ~1507-1603, ~2094-2100)

**Test:**
- Verificare se il cookie viene impostato durante la prima navigazione
- Verificare dominio/path del cookie se viene impostato
- Verificare se il cookie è necessario dopo CDSSO
- Se necessario, verificare se la creazione manuale funziona

---

### 3.4 FASE 4: Debug e Fix 403 Forbidden

**Problema:** 403 Forbidden dopo CDSSO completato

**Analisi:**
Il 403 Forbidden potrebbe essere causato da:
1. Cookie `amFilterCDSSORequest` mancante
2. URL retry diverso dall'URL originale
3. Token `idToken` non valido o scaduto
4. Altri cookie/header richiesti dal server

**Soluzione: Implementare Debug Completo**

**Implementazione:**
```javascript
// File: electron/ipc.js:2094-2150
// Dopo il caricamento completo, fai un debug completo della richiesta

// 1. Verifica tutti i cookie presenti
const allCookies = await session.defaultSession.cookies.get({ 
  domain: '.ilportaledeltrasporto.it' 
});
console.log('[RVFU IPC API] 🔍 DEBUG COMPLETO - Tutti i cookie:', {
  count: allCookies.length,
  cookies: allCookies.map(c => ({
    name: c.name,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    valueLength: c.value.length,
    valuePrefix: c.value.substring(0, 20) + '...'
  }))
});

// 2. Verifica token idToken
const authHeader = originalRequest.headers?.Authorization;
if (authHeader) {
  const token = authHeader.replace('Bearer ', '');
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      const exp = payload.exp ? new Date(payload.exp * 1000) : null;
      const now = new Date();
      const isExpired = exp ? exp < now : false;
      console.log('[RVFU IPC API] 🔍 DEBUG COMPLETO - Token idToken:', {
        exp: exp?.toISOString(),
        now: now.toISOString(),
        isExpired,
        expiresIn: exp ? Math.floor((exp.getTime() - now.getTime()) / 1000) : null,
        aud: payload.aud,
        iss: payload.iss,
        sub: payload.sub
      });
      
      if (isExpired) {
        console.error('[RVFU IPC API] ❌ Token idToken SCADUTO! Questo potrebbe causare 403 Forbidden');
      }
    }
  } catch (error) {
    console.error('[RVFU IPC API] ❌ Errore parsing token:', error);
  }
}

// 3. Verifica URL retry
console.log('[RVFU IPC API] 🔍 DEBUG COMPLETO - URL retry:', {
  originalUrl: originalRequest.url,
  redirectUrl: originalRequestData._cdssoRedirectUrl,
  currentUrl: persistentApiWindow.webContents.getURL(),
  urlsMatch: originalRequest.url === persistentApiWindow.webContents.getURL()
});

// 4. Intercetta la richiesta retry per vedere tutti gli header inviati
const retryInterceptor = ses.webRequest.onBeforeSendHeaders(
  {
    urls: [interceptUrlPattern],
  },
  (details, callback) => {
    console.log('[RVFU IPC API] 🔍 DEBUG COMPLETO - Richiesta retry:', {
      url: details.url,
      method: details.method,
      headers: {
        Authorization: details.requestHeaders['Authorization']?.substring(0, 50) + '...',
        Cookie: details.requestHeaders['Cookie']?.substring(0, 200) + '...',
        'User-Agent': details.requestHeaders['User-Agent'],
        'Accept': details.requestHeaders['Accept']
      }
    });
    callback({ requestHeaders: details.requestHeaders });
  }
);

// 5. Intercetta la risposta per vedere tutti gli header ricevuti
const responseInterceptor = ses.webRequest.onHeadersReceived(
  {
    urls: [interceptUrlPattern],
  },
  (details, callback) => {
    console.log('[RVFU IPC API] 🔍 DEBUG COMPLETO - Risposta retry:', {
      url: details.url,
      statusCode: details.statusCode,
      statusLine: details.statusLine,
      responseHeaders: Object.keys(details.responseHeaders || {}),
      setCookie: details.responseHeaders['Set-Cookie'] || details.responseHeaders['set-cookie'] || []
    });
    callback({ responseHeaders: details.responseHeaders });
  }
);
```

**File da Modificare:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js` (linee ~2094-2150)

**Test:**
- Verificare tutti i cookie presenti
- Verificare se il token è valido
- Verificare se l'URL retry è corretto
- Verificare tutti gli header inviati/ricevuti
- Identificare la causa del 403 Forbidden

---

## 4. PIANO DI IMPLEMENTAZIONE

### Step 1: FASE 1 - Fix URL Redirect (`:443`) ⏱️ 30 minuti

**Obiettivo:** Normalizzare URL rimuovendo `:443`

**Azioni:**
1. Modificare `electron/ipc.js:1406` per normalizzare URL
2. Testare che l'URL normalizzato sia corretto
3. Commit: `fix: normalizza URL redirect CDSSO rimuovendo :443`

**File:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js`

---

### Step 2: FASE 2 - Usare URL Esatto dal Redirect CDSSO ⏱️ 1 ora

**Obiettivo:** Usare URL dal redirect CDSSO per il retry

**Azioni:**
1. Salvare URL dal redirect CDSSO nella richiesta pending
2. Usare URL dal redirect per il retry invece dell'URL originale
3. Testare che il retry usi l'URL corretto
4. Commit: `fix: usa URL esatto dal redirect CDSSO per retry`

**File:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js`

---

### Step 3: FASE 3 - Verifica Cookie `amFilterCDSSORequest` ⏱️ 2-3 ore

**Obiettivo:** Capire perché il cookie non viene trovato

**Azioni:**
1. Aggiungere interceptor per vedere se cookie viene impostato durante navigazione
2. Verificare dominio/path del cookie se viene impostato
3. Verificare se cookie è necessario dopo CDSSO
4. Se necessario, implementare creazione manuale
5. Testare che il cookie sia presente quando necessario
6. Commit: `fix: verifica e fix cookie amFilterCDSSORequest`

**File:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js`

---

### Step 4: FASE 4 - Debug e Fix 403 Forbidden ⏱️ 3-4 ore

**Obiettivo:** Identificare e risolvere la causa del 403 Forbidden

**Azioni:**
1. Implementare debug completo (cookie, token, URL, header)
2. Analizzare log per identificare causa
3. Implementare fix basato su analisi
4. Testare che le richieste API funzionino dopo CDSSO
5. Commit: `fix: risolve 403 Forbidden dopo CDSSO`

**File:**
- `desktop-app/greeting-friend-api-main/electron/ipc.js`

---

## 5. TEST E VERIFICA

### 5.1 Test FASE 1: Fix URL Redirect

**Test Case 1.1: Normalizzazione URL con `:443`**
- **Input:** `https://formazione.ilportaledeltrasporto.it:443/concessionario/veicolo?...`
- **Output Atteso:** `https://formazione.ilportaledeltrasporto.it/concessionario/veicolo?...`
- **Verifica:** URL normalizzato non contiene `:443`

**Test Case 1.2: URL senza `:443` rimane invariato**
- **Input:** `https://formazione.ilportaledeltrasporto.it/concessionario/veicolo?...`
- **Output Atteso:** `https://formazione.ilportaledeltrasporto.it/concessionario/veicolo?...`
- **Verifica:** URL rimane invariato

---

### 5.2 Test FASE 2: URL Esatto dal Redirect

**Test Case 2.1: URL Redirect Salvato Correttamente**
- **Input:** Redirect CDSSO con Location header
- **Output Atteso:** URL salvato in `originalRequestData._cdssoRedirectUrl`
- **Verifica:** URL salvato correttamente

**Test Case 2.2: Retry Usa URL dal Redirect**
- **Input:** Retry dopo CDSSO
- **Output Atteso:** Retry usa `_cdssoRedirectUrl` invece di `originalRequest.url`
- **Verifica:** Retry naviga all'URL dal redirect

**Test Case 2.3: Risposta 200 OK invece di 403**
- **Input:** Retry dopo CDSSO con URL corretto
- **Output Atteso:** Risposta 200 OK con JSON
- **Verifica:** Nessun errore 403 Forbidden

---

### 5.3 Test FASE 3: Cookie `amFilterCDSSORequest`

**Test Case 3.1: Cookie Impostato Durante Navigazione**
- **Input:** Navigazione all'URL originale
- **Output Atteso:** Cookie `amFilterCDSSORequest` impostato dal Java Agent
- **Verifica:** Cookie presente nei Set-Cookie headers

**Test Case 3.2: Cookie Accessibile Dopo Navigazione**
- **Input:** Cookie impostato durante navigazione
- **Output Atteso:** Cookie accessibile da `session.defaultSession.cookies.get()`
- **Verifica:** Cookie presente nella lista cookie

**Test Case 3.3: Cookie Necessario Dopo CDSSO**
- **Input:** CDSSO completato, cookie `am-auth-jwt` presente
- **Output Atteso:** Verifica se server richiede ancora `amFilterCDSSORequest`
- **Verifica:** Se necessario, cookie presente o creato manualmente

---

### 5.4 Test FASE 4: Debug e Fix 403 Forbidden

**Test Case 4.1: Debug Completo Funziona**
- **Input:** Retry dopo CDSSO
- **Output Atteso:** Log completo con cookie, token, URL, header
- **Verifica:** Tutti i dati di debug presenti nei log

**Test Case 4.2: Identificazione Causa 403**
- **Input:** Log di debug
- **Output Atteso:** Causa del 403 identificata
- **Verifica:** Causa chiara e risolvibile

**Test Case 4.3: Fix Implementato**
- **Input:** Fix basato su causa identificata
- **Output Atteso:** Richieste API funzionano dopo CDSSO
- **Verifica:** Risposta 200 OK invece di 403 Forbidden

---

## 6. CRITERI DI SUCCESSO

### Successo Totale ✅

1. **Login OAuth:** Funziona correttamente
2. **Cookie `iPlanetDirectoryPro`:** Presente e condiviso
3. **CDSSO:** Completato automaticamente
4. **Cookie `am-auth-jwt`:** Presente dopo CDSSO
5. **Cookie `amFilterCDSSORequest`:** Presente quando necessario (o non necessario)
6. **Richieste API:** Funzionano dopo CDSSO (200 OK)
7. **URL Retry:** Usa URL corretto dal redirect CDSSO

### Successo Parziale ⚠️

1. **Login OAuth:** Funziona
2. **CDSSO:** Completato
3. **Richieste API:** Funzionano ma con workaround (es. creazione manuale cookie)

### Fallimento ❌

1. **403 Forbidden:** Ancora presente dopo tutti i fix
2. **Cookie mancanti:** Non risolti
3. **CDSSO:** Non completato automaticamente

---

## 7. RISCHI E MITIGAZIONI

### Rischio 1: Cookie `amFilterCDSSORequest` Non Può Essere Creato Manualmente

**Probabilità:** Media  
**Impatto:** Alto

**Mitigazione:**
- Verificare se cookie è necessario dopo CDSSO
- Se necessario, implementare approccio alternativo (es. navigazione diversa)

---

### Rischio 2: 403 Forbidden Causato da Altro (Non Cookie)

**Probabilità:** Media  
**Impatto:** Alto

**Mitigazione:**
- Implementare debug completo per identificare tutte le possibili cause
- Testare ogni possibile causa una alla volta

---

### Rischio 3: URL Redirect Non Risolve il Problema

**Probabilità:** Bassa  
**Impatto:** Medio

**Mitigazione:**
- Testare che URL normalizzato funzioni
- Se non funziona, investigare altre cause

---

## 8. PROSSIMI PASSI IMMEDIATI

1. **Implementare FASE 1** (30 minuti)
   - Fix URL redirect `:443`
   - Test rapido

2. **Implementare FASE 2** (1 ora)
   - Usare URL esatto dal redirect
   - Test completo

3. **Analizzare Risultati**
   - Se 403 risolto → ✅ Successo
   - Se 403 persiste → Procedere con FASE 3 e 4

4. **Implementare FASE 3** (2-3 ore)
   - Verifica cookie `amFilterCDSSORequest`
   - Fix se necessario

5. **Implementare FASE 4** (3-4 ore)
   - Debug completo
   - Fix basato su analisi

---

## 9. NOTE IMPORTANTI

1. **Test Incrementali:** Testare ogni fase prima di procedere alla successiva
2. **Log Dettagliati:** Mantenere log dettagliati per ogni fase
3. **Rollback:** Essere pronti a fare rollback se una fase causa problemi
4. **Documentazione:** Documentare ogni fix implementato

---

**Status:** 📋 Piano completo - Pronto per implementazione

**Prossimo Step:** Implementare FASE 1 (Fix URL Redirect `:443`)
