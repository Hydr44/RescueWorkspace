# 🔍 ANALISI COMPLETA PROBLEMI OAUTH SSO

**Data Analisi**: 16 Gennaio 2026  
**Problema**: SSO non funziona dopo implementazione sistema operatori  
**Stato**: 🔴 CRITICO

---

## 📋 SOMMARIO ESECUTIVO

Il flusso OAuth SSO per la desktop app è interrotto. Il server OAuth locale viene avviato correttamente, ma il callback dal browser non raggiunge il server. Questo impedisce il completamento dell'autenticazione.

---

## 🔴 PROBLEMI CRITICI TROVATI

### **PROBLEMA #1: REDIRECT_URI non utilizzato correttamente**

**File**: `desktop-app/greeting-friend-api-main/src/lib/oauth.ts`  
**Linea**: 35  
**Severità**: ⚠️ MEDIO (non causa il problema diretto, ma può creare confusione)

**Descrizione**:
```typescript
private static readonly REDIRECT_URI = 'http://localhost:3001/auth/callback';
```

Il `REDIRECT_URI` è definito ma **NON viene utilizzato** nel codice. Il codice usa invece `serverResult.callbackUrl` che viene restituito dal server OAuth locale (linea 69). Questo non è un problema diretto, ma crea inconsistenza.

**Soluzione**:
- Rimuovere `REDIRECT_URI` se non viene utilizzato, OPPURE
- Usarlo come fallback se il server non restituisce il callback URL

---

### **PROBLEMA #2: Server OAuth locale non riceve callback dal browser**

**File**: `desktop-app/greeting-friend-api-main/electron/oauth-server.js`  
**Severità**: 🔴 CRITICO

**Descrizione**:
Il server OAuth locale è configurato per ascoltare su `127.0.0.1:3001`, ma il browser potrebbe non riuscire a raggiungerlo per:
1. **Firewall locale** che blocca le connessioni in entrata su porta 3001
2. **Browser security** che impedisce redirect a `127.0.0.1` da pagine HTTPS
3. **DNS resolution** problemi con `127.0.0.1` vs `localhost`

**Evidenza**:
- I log mostrano che il server si avvia correttamente: `[OAuthServer] OAuth server started on http://127.0.0.1:3001`
- I log NON mostrano richieste ricevute: `[OAuthServer] Received request: ...` (manca)
- Il browser viene aperto con l'URL corretto, ma il redirect a `http://127.0.0.1:3001/auth/callback` non raggiunge il server

**Soluzione**:
1. **Test manuale**: Aprire `http://127.0.0.1:3001/auth/callback?code=test&state=test` nel browser per verificare se il server è raggiungibile
2. **Fallback a localhost**: Provare ad ascoltare su `localhost` invece di `127.0.0.1`
3. **Verifica firewall**: Controllare se il firewall blocca la porta 3001
4. **Logging migliorato**: Aggiungere log quando il server è in ascolto e quando riceve richieste

---

### **PROBLEMA #3: Gestione callback OAuth dopo successo**

**File**: `desktop-app/greeting-friend-api-main/src/pages/Login.jsx`  
**Linee**: 295-323  
**Severità**: ⚠️ MEDIO

**Descrizione**:
Dopo il successo OAuth, il codice mostra la selezione operatori anche se il callback non è stato ricevuto correttamente. Questo può creare confusione perché l'utente vede la selezione operatori ma l'autenticazione OAuth potrebbe non essere completata.

**Codice problematico**:
```javascript
if (isAuth) {
  setLoading(false);
  setOauthStep(-1);
  
  // Verifica se c'è una sessione operatore valida
  const operatorSession = localStorage.getItem('operator_session');
  if (operatorSession) {
    // ... naviga alla dashboard
  }
  
  // Non c'è sessione operatore valida, mostra selezione operatori
  setShowOperatorSelection(true);
}
```

**Problema**: Se `OAuthService.handleOAuthCallback()` fallisce silenziosamente (ritorna `null`), `isAuth` potrebbe essere `false`, ma il codice non gestisce questo caso correttamente.

**Soluzione**:
- Verificare esplicitamente se `tokens` è `null` prima di procedere
- Mostrare un errore chiaro se il callback OAuth fallisce
- Non mostrare la selezione operatori se l'autenticazione OAuth non è completata

---

### **PROBLEMA #4: Validazione redirect_uri nel backend**

**File**: `website/src/app/api/auth/oauth/desktop/route.ts`  
**Linea**: 39  
**Severità**: ✅ OK (già corretto)

**Descrizione**:
La validazione del `redirect_uri` include già `http://127.0.0.1:`, quindi questo non è un problema.

---

### **PROBLEMA #5: OAuthRedirect component usa globalThis.location.href**

**File**: `website/src/components/OAuthRedirect.tsx`  
**Linee**: 28-38  
**Severità**: ⚠️ MEDIO

**Descrizione**:
Il componente `OAuthRedirect` usa `globalThis.location.href = redirectUrl` per reindirizzare. Se `redirectUrl` è `http://127.0.0.1:3001/auth/callback`, il browser potrebbe:
1. Bloccare il redirect per motivi di sicurezza (mixed content se la pagina è HTTPS)
2. Non riuscire a raggiungere `127.0.0.1` se ci sono problemi di rete

**Soluzione**:
- Aggiungere un fallback che mostra un link cliccabile se il redirect automatico fallisce
- Aggiungere logging per verificare se il redirect viene eseguito
- Considerare l'uso di `window.location.replace()` invece di `window.location.href`

---

## 🔧 SOLUZIONI PROPOSTE

### **SOLUZIONE 1: Fix immediato - Test server locale**

**Priorità**: 🔴 ALTA

1. Aggiungere un endpoint di test nel server OAuth locale:
```javascript
// electron/oauth-server.js
if (req.url === '/test') {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server OAuth is running!');
  return;
}
```

2. Testare manualmente aprendo `http://127.0.0.1:3001/test` nel browser

3. Se il test fallisce, provare `http://localhost:3001/test`

---

### **SOLUZIONE 2: Fallback a localhost**

**Priorità**: 🔴 ALTA

Modificare `oauth-server.js` per provare prima `127.0.0.1`, poi `localhost`:

```javascript
start(callback) {
  return new Promise((resolve, reject) => {
    // Prova prima 127.0.0.1
    this.tryStartOnHost('127.0.0.1', callback, resolve, reject);
  });
}

tryStartOnHost(host, callback, resolve, reject) {
  this.server = createServer((req, res) => {
    // ... handler esistente
  });

  this.server.listen(this.port, host, () => {
    console.log(`[OAuthServer] Server started on http://${host}:${this.port}`);
    resolve();
  });

  this.server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Prova porta successiva
      this.port++;
      this.tryStartOnHost(host, callback, resolve, reject);
    } else if (host === '127.0.0.1') {
      // Fallback a localhost
      console.log('[OAuthServer] Failed on 127.0.0.1, trying localhost...');
      this.tryStartOnHost('localhost', callback, resolve, reject);
    } else {
      reject(err);
    }
  });
}
```

---

### **SOLUZIONE 3: Migliorare gestione errori OAuth**

**Priorità**: ⚠️ MEDIA

Modificare `Login.jsx` per gestire meglio gli errori:

```javascript
const tokens = await OAuthService.handleOAuthCallback(url);
if (tokens) {
  // Successo
  setOauthStep(3);
  setInfo("Accesso completato! Preparazione ambiente...");
  
  const isAuth = OAuthService.isAuthenticated();
  
  if (isAuth) {
    // ... codice esistente
  } else {
    setErr("Errore: autenticazione OAuth non completata correttamente.");
    setOauthStep(-1);
    setLoading(false);
    return;
  }
} else {
  // ERRORE: tokens è null
  setErr("Errore durante l'autenticazione OAuth. Il callback non è stato ricevuto correttamente.");
  setOauthStep(-1);
  setLoading(false);
  return;
}
```

---

### **SOLUZIONE 4: Aggiungere timeout e retry**

**Priorità**: ⚠️ MEDIA

Aggiungere un timeout per il callback OAuth:

```javascript
// Login.jsx
useEffect(() => {
  const handleOAuthCallback = async (url) => {
    // ... codice esistente
    
    // Timeout di 30 secondi
    const timeoutId = setTimeout(() => {
      if (isProcessingRef.current) {
        setErr("Timeout: il callback OAuth non è stato ricevuto. Riprova.");
        setOauthStep(-1);
        setLoading(false);
        isProcessingRef.current = false;
      }
    }, 30000);
    
    try {
      const tokens = await OAuthService.handleOAuthCallback(url);
      clearTimeout(timeoutId);
      // ... resto del codice
    } catch (error) {
      clearTimeout(timeoutId);
      // ... gestione errori
    }
  };
  
  // ... resto del codice
}, []);
```

---

### **SOLUZIONE 5: Verifica firewall e rete**

**Priorità**: 🔴 ALTA

1. **Verifica firewall macOS**:
   ```bash
   # Controlla se la porta 3001 è bloccata
   lsof -i :3001
   
   # Se necessario, apri la porta
   sudo pfctl -f /etc/pf.conf
   ```

2. **Test connessione locale**:
   ```bash
   # Testa se il server è raggiungibile
   curl http://127.0.0.1:3001/test
   curl http://localhost:3001/test
   ```

3. **Verifica processi in ascolto**:
   ```bash
   # Verifica se qualcosa è già in ascolto sulla porta 3001
   netstat -an | grep 3001
   ```

---

## 📊 CHECKLIST DIAGNOSTICA

- [ ] **Server OAuth si avvia?** → Controllare log Electron main process
- [ ] **Server OAuth è raggiungibile?** → Testare `http://127.0.0.1:3001/test`
- [ ] **Browser apre URL corretto?** → Controllare log `[OAuthService] OAuth URL: ...`
- [ ] **Redirect URL è corretto?** → Controllare log `[DesktopOAuth] Setting redirect URL: ...`
- [ ] **Server riceve richiesta?** → Controllare log `[OAuthServer] Received request: ...`
- [ ] **Callback handler è registrato?** → Controllare log `[Login] OAuth callback handler registered`
- [ ] **IPC funziona?** → Controllare log `[IPC] OAuth callback URL: ...`
- [ ] **Firewall blocca porta?** → Testare connessione locale
- [ ] **Token OAuth salvati?** → Controllare `localStorage.getItem('rm-oauth-tokens')`

---

## 🎯 PIANO DI AZIONE IMMEDIATO

### **STEP 1: Diagnostica (5 minuti)**
1. Aprire il terminale Electron main process
2. Avviare l'app desktop
3. Cliccare "Accedi" per avviare OAuth
4. Controllare i log nel terminale:
   - `[OAuthServer] OAuth server started on http://127.0.0.1:3001` ✅
   - `[OAuthServer] Received request: ...` ❌ (dovrebbe apparire ma non appare)
5. Testare manualmente: aprire `http://127.0.0.1:3001/test` nel browser

### **STEP 2: Fix server locale (10 minuti)**
1. Aggiungere endpoint `/test` al server OAuth
2. Implementare fallback a `localhost` se `127.0.0.1` non funziona
3. Aggiungere logging dettagliato per ogni richiesta ricevuta

### **STEP 3: Fix gestione errori (5 minuti)**
1. Migliorare gestione errori in `Login.jsx`
2. Aggiungere timeout per callback OAuth
3. Mostrare messaggi di errore chiari all'utente

### **STEP 4: Test completo (10 minuti)**
1. Riavviare l'app desktop
2. Testare il flusso OAuth completo
3. Verificare che il callback venga ricevuto
4. Verificare che la selezione operatori appaia dopo OAuth successo

---

## 📝 NOTE TECNICHE

### **Flusso OAuth atteso**:
1. Desktop app → `OAuthService.startOAuthFlow()`
2. Electron main → Avvia server HTTP locale su `127.0.0.1:3001`
3. Browser → Apre `https://rescuemanager.eu/api/auth/oauth/desktop?...`
4. Website → Mostra pagina login OAuth
5. Utente → Inserisce credenziali e fa login
6. Website → Genera OAuth code e salva nel database
7. Website → Redirect a `http://127.0.0.1:3001/auth/callback?code=...&state=...`
8. **PROBLEMA QUI**: Il browser non riesce a raggiungere `127.0.0.1:3001`
9. Server OAuth locale → Dovrebbe ricevere la richiesta e chiamare il callback handler
10. Electron IPC → Invia callback al renderer process
11. Renderer → Chiama `handleOAuthCallback` in `Login.jsx`
12. Login.jsx → Scambia code per token e mostra selezione operatori

### **Punto di rottura**:
Il flusso si interrompe al **STEP 8**. Il browser tenta di reindirizzare a `http://127.0.0.1:3001/auth/callback`, ma il server OAuth locale non riceve la richiesta.

---

## ✅ CONCLUSIONI

Il problema principale è che **il server OAuth locale non riceve il callback dal browser**. Questo può essere causato da:
1. Firewall che blocca la porta 3001
2. Problemi di DNS con `127.0.0.1` vs `localhost`
3. Browser security che impedisce redirect a `127.0.0.1` da pagine HTTPS

**Soluzione immediata**: Implementare fallback a `localhost` e aggiungere endpoint di test per diagnosticare il problema.

**Soluzione a lungo termine**: Considerare l'uso di un protocollo custom (`desktop://`) invece di HTTP locale, oppure usare un server WebSocket per la comunicazione browser-desktop app.
