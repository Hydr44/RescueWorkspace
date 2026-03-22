# 💡 Soluzione: Usare BrowserWindow per le API REST

## Idea

Invece di fare le chiamate API REST direttamente dal processo renderer di Electron, possiamo:
1. Aprire un `BrowserWindow` invisibile (o visibile per debug)
2. Caricare una pagina HTML che fa le chiamate API REST
3. I cookie di sessione SSO verranno inviati automaticamente dal browser
4. Usare `postMessage` o IPC per comunicare i risultati all'app principale

## Perché Potrebbe Funzionare

- Il `BrowserWindow` di Electron ha accesso ai cookie di sessione SSO
- I cookie vengono inviati automaticamente con `fetch` quando c'è una sessione browser attiva
- Il CDSSO funziona quando c'è una sessione browser con cookie

## Implementazione

### 1. Creare un HTML per le API calls

```html
<!DOCTYPE html>
<html>
<head>
  <title>RVFU API Proxy</title>
</head>
<body>
  <script>
    // Riceve comandi dal processo principale
    window.addEventListener('message', async (event) => {
      const { id, method, url, headers, body } = event.data;
      
      try {
        const response = await fetch(url, {
          method,
          headers,
          body,
          credentials: 'include' // IMPORTANTE: Invia cookie automaticamente
        });
        
        const contentType = response.headers.get('content-type') || '';
        const isJSON = contentType.includes('application/json');
        
        const data = isJSON ? await response.json() : await response.text();
        
        // Invia risultato al processo principale
        window.postMessage({
          id,
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data
        }, '*');
      } catch (error) {
        window.postMessage({
          id,
          success: false,
          error: error.message
        }, '*');
      }
    });
    
    // Notifica che è pronto
    window.postMessage({ ready: true }, '*');
  </script>
</body>
</html>
```

### 2. Aggiungere IPC handler in electron/ipc.js

```javascript
handleSafe('rvfu:api-call', async (event, { method, url, headers, body }) => {
  return new Promise((resolve, reject) => {
    const apiWindow = new BrowserWindow({
      show: false, // Nascosto per default, true per debug
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true // IMPORTANTE: Mantieni webSecurity per i cookie
      }
    });

    // Carica la pagina HTML
    const htmlPath = path.join(__dirname, 'rvfu-api-proxy.html');
    apiWindow.loadFile(htmlPath);

    const requestId = Date.now().toString();

    apiWindow.webContents.on('did-finish-load', () => {
      // Invia la richiesta alla pagina
      apiWindow.webContents.send('api-request', {
        id: requestId,
        method,
        url,
        headers,
        body
      });
    });

    // Ricevi la risposta
    apiWindow.webContents.on('console-message', (event, level, message) => {
      // Gestisci messaggi console se necessario
    });

    // Usa window.postMessage per ricevere la risposta
    apiWindow.webContents.executeJavaScript(`
      window.addEventListener('message', (event) => {
        if (event.data.id === '${requestId}') {
          console.log('API Response:', JSON.stringify(event.data));
        }
      });
    `);

    // Timeout
    setTimeout(() => {
      apiWindow.close();
      reject(new Error('API call timeout'));
    }, 30000);
  });
});
```

### 3. Modificare rvfu-client.ts per usare BrowserWindow

```typescript
private async makeRequestWithBrowserWindow(
  endpoint: string, 
  options: RequestInit & { params?: Record<string, string> }
): Promise<any> {
  const url = new URL(`${this.baseUrl}${endpoint}`);
  
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  // Chiama IPC per aprire BrowserWindow e fare la richiesta
  const response = await window.api.invoke('rvfu:api-call', {
    method: options.method || 'GET',
    url: url.toString(),
    headers: {
      'Authorization': this.authService.getAuthHeader(),
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {})
    },
    body: options.body
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return response.data;
}
```

## Vantaggi

1. ✅ Cookie di sessione inviati automaticamente
2. ✅ CDSSO funziona perché c'è una sessione browser
3. ✅ Stessa origine per SSO e API Gateway
4. ✅ Funziona come se fosse un browser normale

## Svantaggi

1. ⚠️ Più complesso (BrowserWindow per ogni chiamata)
2. ⚠️ Più lento (overhead di BrowserWindow)
3. ⚠️ Potrebbe non scalare bene per molte chiamate

## Alternativa: BrowserWindow Persistente

Invece di aprire un BrowserWindow per ogni chiamata, possiamo:
- Aprire un BrowserWindow una volta dopo il login
- Mantenerlo aperto (nascosto)
- Riutilizzarlo per tutte le chiamate API
- Chiuderlo solo al logout

Questo ridurrebbe l'overhead.

## Test

Proviamo questa soluzione per vedere se risolve il problema CDSSO!

