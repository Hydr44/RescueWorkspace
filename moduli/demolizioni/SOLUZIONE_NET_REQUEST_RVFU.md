# 🔧 Soluzione: Usare net.request invece di fetch per API RVFU

## Problema Attuale

Il cookie `iPlanetDirectoryPro` è presente nella sessione Electron ma non viene inviato con le richieste `fetch` dalla pagina JavaScript, causando 403 Forbidden anche dopo il completamento del CDSSO.

## Soluzione Proposta

Fare le richieste API direttamente dal processo main Electron usando `net.request` invece di `fetch` dalla pagina JavaScript. Questo garantisce che:

1. ✅ I cookie della sessione Electron vengano sempre inviati automaticamente
2. ✅ Non ci siano problemi di CORS o di condivisione cookie
3. ✅ L'approccio sia più robusto e conforme ai manuali RVFU
4. ✅ Non dipendiamo dalla finestra persistente per inviare i cookie

## Implementazione

### Step 1: Aggiungere handler IPC che usa net.request

Creare un nuovo handler `rvfu:api-call-direct` che usa `net.request` direttamente dal processo main:

```javascript
const { net } = require('electron');

handleSafe('rvfu:api-call-direct', async (params) => {
  const { method, url, headers, body } = params || {};
  
  if (!method || !url) {
    throw new Error('method and url are required');
  }
  
  return new Promise((resolve, reject) => {
    // Recupera i cookie dalla sessione
    const defaultSession = session.defaultSession;
    
    // Costruisci l'URL
    const requestUrl = new URL(url);
    
    // Recupera i cookie per il dominio
    defaultSession.cookies.get({ domain: requestUrl.hostname })
      .then(async (cookies) => {
        // Costruisci il cookie header
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        // Crea la richiesta usando net.request
        const request = net.request({
          method: method,
          url: url,
          session: defaultSession // Usa la sessione condivisa per i cookie
        });
        
        // Aggiungi gli header
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            if (value) {
              request.setHeader(key, String(value));
            }
          });
        }
        
        // Aggiungi il cookie header se presente
        if (cookieHeader) {
          request.setHeader('Cookie', cookieHeader);
        }
        
        // Gestisci la risposta
        let responseData = '';
        request.on('response', (response) => {
          response.on('data', (chunk) => {
            responseData += chunk.toString();
          });
          
          response.on('end', () => {
            const contentType = response.headers['content-type'] || '';
            const isJSON = contentType.includes('application/json');
            
            try {
              const data = isJSON ? JSON.parse(responseData) : responseData;
              
              if (response.statusCode >= 200 && response.statusCode < 300) {
                resolve(data);
              } else {
                reject(new Error(`API call failed: ${response.statusCode} ${response.statusMessage}`));
              }
            } catch (error) {
              reject(error);
            }
          });
        });
        
        request.on('error', (error) => {
          reject(error);
        });
        
        // Invia il body se presente
        if (body) {
          request.write(body);
        }
        
        request.end();
      })
      .catch(reject);
  });
});
```

### Step 2: Modificare rvfu-client.ts per usare il nuovo handler

Modificare `makeRequestViaBrowserWindow` per usare `rvfu:api-call-direct` invece di `rvfu:api-call`:

```typescript
private async makeRequestViaBrowserWindow(endpoint: string, options: RequestInit & { params?: Record<string, string> } = {}): Promise<any> {
  if (typeof window === 'undefined' || !(window as any).api?.rvfu?.apiCallDirect) {
    throw new Error('BrowserWindow API non disponibile. Assicurati di essere in un contesto Electron.');
  }

  const url = new URL(endpoint, this.baseUrl);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const headers: Record<string, string> = {};
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (value) {
        headers[key] = String(value);
      }
    });
  }

  // Aggiungi header di autenticazione
  const authHeader = this.authService.getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined;

  console.log('[RVFU Client] Request via net.request:', {
    method: options.method || 'GET',
    url: url.toString(),
    hasAuth: !!authHeader,
  });

  try {
    const result = await (window as any).api.rvfu.apiCallDirect({
      method: options.method || 'GET',
      url: url.toString(),
      headers,
      body,
    });
    return result;
  } catch (error: any) {
    console.error('[RVFU Client] net.request API call failed:', error);
    throw error;
  }
}
```

### Step 3: Aggiungere apiCallDirect a preload.js

```javascript
rvfu: {
  openAuthWindow: (params) => ipcRenderer.invoke('rvfu:open-auth-window', params),
  apiCall: (params) => ipcRenderer.invoke('rvfu:api-call', params),
  apiCallDirect: (params) => ipcRenderer.invoke('rvfu:api-call-direct', params), // NUOVO
  initApiWindow: () => ipcRenderer.invoke('rvfu:init-api-window'),
  closeApiWindow: () => ipcRenderer.invoke('rvfu:close-api-window'),
},
```

## Vantaggi

1. ✅ **Cookie sempre inviati**: `net.request` usa automaticamente i cookie della sessione Electron
2. ✅ **Nessun problema CORS**: Le richieste vengono fatte dal processo main, non dal renderer
3. ✅ **Più robusto**: Non dipende dalla finestra persistente o dal JavaScript nella pagina
4. ✅ **Conforme ai manuali**: Le richieste vengono fatte direttamente dal client, come specificato nel manuale RVFU

## Svantaggi

1. ⚠️ **CDSSO più complesso**: Se il server richiede CDSSO, dobbiamo gestirlo diversamente (potrebbe essere necessario navigare la finestra persistente)
2. ⚠️ **Meno visibilità**: Non possiamo vedere le richieste nella finestra persistente

## Prossimi Passi

1. Implementare `rvfu:api-call-direct` usando `net.request`
2. Modificare `rvfu-client.ts` per usare il nuovo handler
3. Testare se risolve il problema del 403 Forbidden
4. Se il CDSSO è ancora richiesto, gestirlo navigando la finestra persistente quando necessario
