# 🧪 Test: BrowserWindow per API REST

## Implementazione Completata

Ho implementato una soluzione alternativa che usa un `BrowserWindow` invisibile per fare le chiamate API REST. Questo permette ai cookie di sessione SSO di essere inviati automaticamente.

## Come Funziona

1. **HTML Proxy** (`electron/rvfu-api-proxy.html`):
   - Pagina HTML che riceve richieste via `postMessage`
   - Fa le chiamate API con `fetch` e `credentials: 'include'`
   - Invia i risultati via `postMessage`

2. **IPC Handler** (`rvfu:api-call`):
   - Apre un `BrowserWindow` invisibile
   - Carica la pagina HTML proxy
   - Comunica con la pagina via `executeJavaScript` e `console-message`
   - Chiude la finestra dopo la risposta

3. **RVFU Client**:
   - Opzione `useBrowserWindow` in `RVFUConfig`
   - Se `true`, usa `makeRequestViaBrowserWindow` invece di `makeRequest`
   - Chiama `window.api.rvfu.apiCall` (esposto da preload.js)

## Come Usare

### Opzione 1: Abilitare Globalmente

```typescript
const rvfuClient = createRVFUClient(authService, 'formation', true); // useBrowserWindow = true
```

### Opzione 2: Abilitare Solo per Test

Modifica temporaneamente `DemolizioniRVFU.jsx` o `DemolizioneRVFUForm.jsx`:

```javascript
const rvfuClient = createRVFUClient(authService, 'formation', true); // true = usa BrowserWindow
```

## Vantaggi

1. ✅ Cookie di sessione inviati automaticamente
2. ✅ CDSSO funziona perché c'è una sessione browser
3. ✅ Stessa origine per SSO e API Gateway
4. ✅ Funziona come se fosse un browser normale

## Svantaggi

1. ⚠️ Più lento (overhead di BrowserWindow)
2. ⚠️ Più complesso (BrowserWindow per ogni chiamata)
3. ⚠️ Potrebbe non scalare bene per molte chiamate

## Testing

Per testare, modifica temporaneamente le chiamate a `createRVFUClient` per abilitare `useBrowserWindow`:

```javascript
// In DemolizioniRVFU.jsx o DemolizioneRVFUForm.jsx
const rvfuClient = createRVFUClient(authService, 'formation', true);
```

Poi prova a:
1. Fare login RVFU
2. Cercare un veicolo
3. Vedere se funziona senza errore CDSSO

## Note

- La finestra è invisibile (`show: false`) - cambia a `true` in `ipc.js` se vuoi vedere cosa succede
- C'è un timeout di 30 secondi
- La finestra viene chiusa automaticamente dopo la risposta

## Se Funziona

Se questa soluzione funziona, possiamo:
1. Mantenerla come opzione per casi CDSSO
2. O usarla sempre se il problema CDSSO persiste
3. O implementare un BrowserWindow persistente (riutilizzabile) per migliorare le performance

